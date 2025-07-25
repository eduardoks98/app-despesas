import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  ScrollView,
  FlatList, 
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal
} from 'react-native';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { MoneyText } from '../../components/common/MoneyText';
import { DatePicker } from '../../components/common/DatePicker';
import { StorageService } from '../services/core';
import { ValidationService } from '../services/utils';
import { ErrorHandler } from '../services/utils';
import { HapticService } from '../services/platform';
import { Subscription, Category } from '../../types';
import { colors } from '../../styles/colors';
import { SPACING, FONT_SIZES } from '../../styles/responsive';
import { safeParseDate } from '../../utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';

interface EditSubscriptionScreenProps {
  navigation: any;
  route: {
    params: {
      subscriptionId: string;
    };
  };
}

export const EditSubscriptionScreen: React.FC<EditSubscriptionScreenProps> = ({ navigation, route }) => {
  const { subscriptionId } = route.params;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    category: '',
    billingDay: 1,
    paymentMethod: 'credit' as 'credit' | 'debit' | 'pix' | 'boleto',
    status: 'active' as 'active' | 'paused' | 'cancelled',
    startDate: new Date(),
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [originalSubscription, setOriginalSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    loadSubscription();
    loadCategories();
  }, []);

  const loadSubscription = async () => {
    try {
      const subscriptions = await StorageService.getSubscriptions();
      const subscription = subscriptions.find(s => s.id === subscriptionId);
      
      if (subscription) {
        setOriginalSubscription(subscription);
        setFormData({
          name: subscription.name,
          description: subscription.description || '',
          amount: subscription.amount.toString().replace('.', ','),
          category: subscription.category,
          billingDay: subscription.billingDay,
          paymentMethod: subscription.paymentMethod,
          status: subscription.status,
          startDate: safeParseDate(subscription.startDate),
        });
      } else {
        Alert.alert('Erro', 'Assinatura não encontrada');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Erro ao carregar assinatura:', error);
      Alert.alert('Erro', 'Não foi possível carregar a assinatura');
      navigation.goBack();
    }
  };

  const loadCategories = async () => {
    const data = await ErrorHandler.withErrorHandling(
      'carregar categorias',
      async () => {
        const categories = await StorageService.getCategories();
        setCategories(categories);
        return categories;
      }
    );
    
    if (!data) {
      // Se falhou, usar categorias padrão do StorageService
      const defaultCategories = StorageService.getDefaultCategories();
      setCategories(defaultCategories);
    }
  };

  const getFilteredCategories = () => {
    return categories.filter(cat => 
      cat.type === 'expense' || cat.type === 'both'
    );
  };

  const getSelectedCategory = () => {
    return categories.find(cat => cat.name === formData.category);
  };

  const validateForm = () => {
    setValidationErrors([]);

    const amount = formData.amount ? parseFloat(formData.amount.replace(',', '.')) : 0;

    const subscriptionData = {
      name: formData.name,
      description: formData.description,
      amount: amount,
      category: formData.category,
      billingDay: formData.billingDay,
      paymentMethod: formData.paymentMethod,
      status: formData.status,
      startDate: formData.startDate.toISOString(),
    };

    // Validações básicas
    const errors: string[] = [];
    
    if (!subscriptionData.name.trim()) {
      errors.push('Nome da assinatura é obrigatório');
    }
    
    if (amount <= 0) {
      errors.push('Valor deve ser maior que zero');
    }
    
    if (!subscriptionData.category) {
      errors.push('Categoria é obrigatória');
    }
    
    if (subscriptionData.billingDay < 1 || subscriptionData.billingDay > 31) {
      errors.push('Dia de cobrança deve estar entre 1 e 31');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      ErrorHandler.handleValidationError(errors, 'Editar Assinatura');
      return null;
    }

    return subscriptionData;
  };

  const saveSubscription = async (subscriptionData: any) => {
    setIsLoading(true);

    const result = await ErrorHandler.withErrorHandling(
      'salvar assinatura',
      async () => {
        if (!originalSubscription) throw new Error('Assinatura original não encontrada');
        
        const updatedSubscription: Subscription = {
          ...originalSubscription,
          ...subscriptionData,
          nextPaymentDate: calculateNextPaymentDate(subscriptionData.billingDay, subscriptionData.startDate),
        };

        await StorageService.updateSubscription(updatedSubscription);
        return updatedSubscription;
      }
    );

    setIsLoading(false);

    if (result) {
      Alert.alert(
        'Sucesso',
        'Assinatura atualizada com sucesso!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  const calculateNextPaymentDate = (billingDay: number, startDate: string) => {
    const today = new Date();
    const nextPayment = new Date(today.getFullYear(), today.getMonth(), billingDay);
    
    if (nextPayment <= today) {
      nextPayment.setMonth(nextPayment.getMonth() + 1);
    }
    
    return nextPayment.toISOString();
  };

  const handleSave = async () => {
    const validatedData = validateForm();
    
    if (validatedData) {
      await saveSubscription(validatedData);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta assinatura? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            
            const result = await ErrorHandler.withErrorHandling(
              'excluir assinatura',
              async () => {
                await StorageService.deleteSubscription(subscriptionId);
                return true;
              }
            );
            
            setIsLoading(false);
            
            if (result) {
              Alert.alert(
                'Sucesso',
                'Assinatura excluída com sucesso!',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            }
          }
        }
      ]
    );
  };

  const formatAmount = (value: string) => {
    const cleaned = value.replace(/[^0-9,]/g, '');
    const parts = cleaned.split(',');
    if (parts.length > 2) {
      return parts[0] + ',' + parts.slice(1).join('');
    }
    return cleaned;
  };

  const handleAmountChange = (value: string) => {
    const formatted = formatAmount(value);
    setFormData(prev => ({ ...prev, amount: formatted }));
  };

  const getPaymentMethodIcon = (method: string) => {
    const iconMap: { [key: string]: string } = {
      'credit': 'card',
      'debit': 'card',
      'pix': 'flash',
      'boleto': 'document-text',
    };
    return iconMap[method] || 'card';
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'active': colors.success,
      'paused': colors.warning,
      'cancelled': colors.danger,
    };
    return colorMap[status] || colors.textSecondary;
  };

  const getStatusIcon = (status: string) => {
    const iconMap: { [key: string]: string } = {
      'active': 'checkmark-circle',
      'paused': 'pause-circle',
      'cancelled': 'close-circle',
    };
    return iconMap[status] || 'help-circle';
  };

  return (
    <Container>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Assinatura</Text>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={async () => {
            await HapticService.buttonPress();
            handleDelete();
          }}
        >
          <Ionicons name="trash" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Card style={styles.errorCard}>
              <View style={styles.errorHeader}>
                <Ionicons name="alert-circle" size={20} color={colors.danger} />
                <Text style={styles.errorTitle}>Erros encontrados:</Text>
              </View>
              {validationErrors.map((error, index) => (
                <Text key={index} style={styles.errorText}>• {error}</Text>
              ))}
            </Card>
          )}

          {/* Nome */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome da Assinatura</Text>
            <TextInput
              style={[
                styles.input,
                validationErrors.some(e => e.includes('Nome')) && styles.inputError
              ]}
              value={formData.name}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, name: text }));
                if (validationErrors.some(e => e.includes('Nome'))) {
                  setValidationErrors(prev => prev.filter(e => !e.includes('Nome')));
                }
              }}
              placeholder="Ex: Netflix, Spotify"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Descrição */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição (Opcional)</Text>
            <TextInput
              style={styles.input}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Ex: Plano Premium"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Valor */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Valor Mensal</Text>
            <View style={[
              styles.amountContainer,
              validationErrors.some(e => e.includes('Valor')) && styles.inputError
            ]}>
              <Text style={styles.currency}>R$</Text>
              <TextInput
                style={styles.amountInput}
                value={formData.amount}
                onChangeText={(value) => {
                  handleAmountChange(value);
                  if (validationErrors.some(e => e.includes('Valor'))) {
                    setValidationErrors(prev => prev.filter(e => !e.includes('Valor')));
                  }
                }}
                placeholder="0,00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>
            {formData.amount && (
              <View style={styles.amountPreview}>
                <MoneyText 
                  value={parseFloat(formData.amount.replace(',', '.')) || 0}
                  size="large"
                  showSign={false}
                  style={styles.expensePreview}
                />
              </View>
            )}
          </View>

          {/* Categoria */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoria</Text>
            <TouchableOpacity 
              style={styles.categoryButton}
              onPress={() => setShowCategoryModal(true)}
            >
              <View style={styles.categoryContent}>
                {getSelectedCategory() ? (
                  <>
                    <Ionicons name={getSelectedCategory()?.icon as any} size={20} color={getSelectedCategory()?.color || colors.primary} />
                    <Text style={styles.categoryText}>{getSelectedCategory()?.name}</Text>
                  </>
                ) : (
                  <Text style={styles.categoryPlaceholder}>Selecionar categoria</Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Dia de Cobrança */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dia de Cobrança (1-31)</Text>
            <TextInput
              style={[
                styles.input,
                validationErrors.some(e => e.includes('Dia')) && styles.inputError
              ]}
              value={formData.billingDay.toString()}
              onChangeText={(text) => {
                const day = parseInt(text) || 1;
                setFormData(prev => ({ ...prev, billingDay: Math.max(1, Math.min(31, day)) }));
                if (validationErrors.some(e => e.includes('Dia'))) {
                  setValidationErrors(prev => prev.filter(e => !e.includes('Dia')));
                }
              }}
              placeholder="15"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          {/* Status */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status</Text>
            <TouchableOpacity 
              style={styles.categoryButton}
              onPress={() => setShowStatusModal(true)}
            >
              <View style={styles.categoryContent}>
                <Ionicons 
                  name={getStatusIcon(formData.status) as any} 
                  size={20} 
                  color={getStatusColor(formData.status)} 
                />
                <Text style={styles.categoryText}>
                  {formData.status === 'active' ? 'Ativa' : 
                   formData.status === 'paused' ? 'Pausada' : 'Cancelada'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Método de pagamento */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Método de Pagamento</Text>
            <TouchableOpacity 
              style={styles.categoryButton}
              onPress={() => setShowPaymentMethodModal(true)}
            >
              <View style={styles.categoryContent}>
                <Ionicons 
                  name={getPaymentMethodIcon(formData.paymentMethod) as any} 
                  size={20} 
                  color={colors.primary} 
                />
                <Text style={styles.categoryText}>
                  {formData.paymentMethod === 'credit' ? 'Cartão de Crédito' :
                   formData.paymentMethod === 'debit' ? 'Cartão de Débito' :
                   formData.paymentMethod === 'pix' ? 'PIX' : 'Boleto'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Data de início */}
          <View style={styles.inputGroup}>
            <DatePicker
              label="Data de Início"
              value={formData.startDate}
              onChange={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
            />
          </View>

        </View>
      </ScrollView>

      {/* Fixed Bottom Button Container */}
      <View style={styles.fixedBottomContainer}>
        <View style={styles.buttonRow}>
          <Button 
            title="Cancelar"
            onPress={() => navigation.goBack()}
            style={[styles.button, styles.cancelButton]}
            textStyle={styles.cancelButtonText}
          />
          <Button 
            title={isLoading ? "Salvando..." : "Salvar"}
            onPress={handleSave}
            style={[styles.button, styles.saveButton]}
            disabled={isLoading}
          />
        </View>
      </View>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
              <Text style={styles.modalCancel}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Selecionar Categoria</Text>
            <View style={styles.modalSpacer} />
          </View>

          <FlatList
            data={getFilteredCategories()}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryItem,
                  formData.category === item.name && styles.categoryItemSelected
                ]}
                onPress={() => {
                  setFormData(prev => ({ ...prev, category: item.name }));
                  setShowCategoryModal(false);
                  HapticService.buttonPress();
                }}
              >
                <View style={styles.categoryInfo}>
                  <Ionicons name={item.icon as any} size={24} color={item.color || colors.primary} />
                  <Text style={styles.categoryItemName}>{item.name}</Text>
                </View>
                {formData.category === item.name && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Payment Method Selection Modal */}
      <Modal
        visible={showPaymentMethodModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPaymentMethodModal(false)}>
              <Text style={styles.modalCancel}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Método de Pagamento</Text>
            <View style={styles.modalSpacer} />
          </View>

          <FlatList
            data={[
              { key: 'credit', label: 'Cartão de Crédito', icon: 'card' },
              { key: 'debit', label: 'Cartão de Débito', icon: 'card' },
              { key: 'pix', label: 'PIX', icon: 'flash' },
              { key: 'boleto', label: 'Boleto', icon: 'document-text' },
            ]}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryItem,
                  formData.paymentMethod === item.key && styles.categoryItemSelected
                ]}
                onPress={() => {
                  setFormData(prev => ({ ...prev, paymentMethod: item.key as any }));
                  setShowPaymentMethodModal(false);
                  HapticService.buttonPress();
                }}
              >
                <View style={styles.categoryInfo}>
                  <Ionicons name={item.icon as any} size={24} color={colors.primary} />
                  <Text style={styles.categoryItemName}>{item.label}</Text>
                </View>
                {formData.paymentMethod === item.key && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Status Selection Modal */}
      <Modal
        visible={showStatusModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowStatusModal(false)}>
              <Text style={styles.modalCancel}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Status da Assinatura</Text>
            <View style={styles.modalSpacer} />
          </View>

          <FlatList
            data={[
              { key: 'active', label: 'Ativa', icon: 'checkmark-circle' },
              { key: 'paused', label: 'Pausada', icon: 'pause-circle' },
              { key: 'cancelled', label: 'Cancelada', icon: 'close-circle' },
            ]}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryItem,
                  formData.status === item.key && styles.categoryItemSelected
                ]}
                onPress={() => {
                  setFormData(prev => ({ ...prev, status: item.key as any }));
                  setShowStatusModal(false);
                  HapticService.buttonPress();
                }}
              >
                <View style={styles.categoryInfo}>
                  <Ionicons name={item.icon as any} size={24} color={getStatusColor(item.key)} />
                  <Text style={styles.categoryItemName}>{item.label}</Text>
                </View>
                {formData.status === item.key && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  container: {
    flex: 1,
  },
  form: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.text,
    textAlignVertical: 'top',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  currency: {
    paddingLeft: 16,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  amountInput: {
    flex: 1,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  amountPreview: {
    alignItems: 'center',
    marginTop: 8,
  },
  expensePreview: {
    color: colors.text,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.surface,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryText: {
    fontSize: 16,
    color: colors.text,
  },
  categoryPlaceholder: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  buttonGroup: {
    marginBottom: 100,
    gap: 16,
  },
  saveButton: {
    // Usar estilos padrão do Button
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalCancel: {
    fontSize: 16,
    color: colors.primary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalSpacer: {
    width: 60,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryItemName: {
    fontSize: 16,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.danger,
    borderWidth: 2,
  },
  fixedBottomContainer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 34,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
    marginLeft: 4,
  },
  errorCard: {
    backgroundColor: colors.errorLight,
    marginBottom: 16,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.danger,
  },
});

export default EditSubscriptionScreen;