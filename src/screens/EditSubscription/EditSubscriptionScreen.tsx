import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
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
import { StorageService } from '../../services/storage/StorageService';
import { ValidationService } from '../../services/validation/ValidationService';
import { ErrorHandler } from '../../services/error/ErrorHandler';
import { Subscription, Category } from '../../types';
import { colors } from '../../styles/colors';
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
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Editar Assinatura</Text>

        <View style={styles.form}>
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
            {validationErrors.filter(e => e.includes('Nome')).map((error, index) => (
              <Text key={index} style={styles.errorText}>{error}</Text>
            ))}
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
            {validationErrors.filter(e => e.includes('Valor')).map((error, index) => (
              <Text key={index} style={styles.errorText}>{error}</Text>
            ))}
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
              style={styles.categorySelector}
              onPress={() => setShowCategoryModal(true)}
            >
              {formData.category ? (
                <View style={styles.selectedCategory}>
                  <Ionicons 
                    name={getSelectedCategory()?.icon as any || 'folder-outline'} 
                    size={20} 
                    color={getSelectedCategory()?.color || colors.primary} 
                  />
                  <Text style={styles.categoryName}>{formData.category}</Text>
                </View>
              ) : (
                <Text style={styles.placeholderText}>Selecione uma categoria</Text>
              )}
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
            {validationErrors.filter(e => e.includes('Dia')).map((error, index) => (
              <Text key={index} style={styles.errorText}>{error}</Text>
            ))}
          </View>

          {/* Status */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusButtons}>
              {[
                { key: 'active', label: 'Ativa' },
                { key: 'paused', label: 'Pausada' },
                { key: 'cancelled', label: 'Cancelada' },
              ].map(status => (
                <TouchableOpacity
                  key={status.key}
                  style={[
                    styles.statusButton,
                    formData.status === status.key && styles.statusButtonActive,
                    formData.status === status.key && { backgroundColor: getStatusColor(status.key) }
                  ]}
                  onPress={() => setFormData(prev => ({ 
                    ...prev, 
                    status: status.key as any 
                  }))}
                >
                  <Ionicons 
                    name={getStatusIcon(status.key) as any} 
                    size={16} 
                    color={formData.status === status.key ? colors.white : getStatusColor(status.key)} 
                  />
                  <Text style={[
                    styles.statusButtonText,
                    formData.status === status.key && styles.statusButtonTextActive
                  ]}>
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Método de pagamento */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Método de Pagamento</Text>
            <View style={styles.paymentMethods}>
              {[
                { key: 'credit', label: 'Cartão de Crédito' },
                { key: 'debit', label: 'Cartão de Débito' },
                { key: 'pix', label: 'PIX' },
                { key: 'boleto', label: 'Boleto' },
              ].map(method => (
                <TouchableOpacity
                  key={method.key}
                  style={[
                    styles.paymentMethod,
                    formData.paymentMethod === method.key && styles.paymentMethodActive
                  ]}
                  onPress={() => setFormData(prev => ({ 
                    ...prev, 
                    paymentMethod: method.key as any 
                  }))}
                >
                  <Ionicons 
                    name={getPaymentMethodIcon(method.key) as any} 
                    size={16} 
                    color={formData.paymentMethod === method.key ? colors.white : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.paymentMethodText,
                    formData.paymentMethod === method.key && styles.paymentMethodTextActive
                  ]}>
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Data de início */}
          <View style={styles.inputGroup}>
            <DatePicker
              label="Data de Início"
              value={formData.startDate}
              onChange={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
            />
          </View>

          <View style={styles.buttonGroup}>
            <Button 
              title={isLoading ? "Salvando..." : "Salvar"}
              onPress={handleSave}
              style={styles.saveButton}
              disabled={isLoading}
            />
            
            <Button 
              title="Excluir Assinatura"
              onPress={handleDelete}
              variant="outline"
              style={[styles.deleteButton, { borderColor: colors.danger }]}
              textStyle={{ color: colors.danger }}
              disabled={isLoading}
            />
          </View>
        </View>
      </ScrollView>

      {/* Modal de categorias */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecionar Categoria</Text>
            
            <ScrollView style={styles.categoriesList}>
              {getFilteredCategories().map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    formData.category === category.name && styles.categoryItemSelected
                  ]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, category: category.name }));
                    setShowCategoryModal(false);
                  }}
                >
                  <Ionicons name={category.icon as any} size={24} color={category.color || colors.primary} />
                  <Text style={[
                    styles.categoryItemName,
                    formData.category === category.name && styles.categoryItemNameSelected
                  ]}>
                    {category.name}
                  </Text>
                  {formData.category === category.name && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Button
              title="Cancelar"
              onPress={() => setShowCategoryModal(false)}
              variant="outline"
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    color: colors.text,
  },
  form: {
    paddingHorizontal: 16,
  },
  inputGroup: {
    marginBottom: 24,
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
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.surface,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryName: {
    fontSize: 16,
    color: colors.text,
  },
  placeholderText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 8,
  },
  statusButtonActive: {
    borderColor: colors.primary,
  },
  statusButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusButtonTextActive: {
    color: colors.white,
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 8,
  },
  paymentMethodActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  paymentMethodText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  paymentMethodTextActive: {
    color: colors.white,
  },
  buttonGroup: {
    marginBottom: 100,
    gap: 16,
  },
  saveButton: {
    // Usar estilos padrão do Button
  },
  deleteButton: {
    // Usar estilos padrão do Button com variant outline
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  categoriesList: {
    maxHeight: 300,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.background,
  },
  categoryItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  categoryItemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  categoryItemName: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  categoryItemNameSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  modalButton: {
    marginTop: 16,
  },
  inputError: {
    borderColor: colors.danger,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
    marginLeft: 4,
  },
});