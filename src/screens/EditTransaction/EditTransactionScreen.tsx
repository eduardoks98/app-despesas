import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal
} from 'react-native';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { TabSelector } from '../../components/common/TabSelector';
import { MoneyText } from '../../components/common/MoneyText';
import { DatePicker } from '../../components/common/DatePicker';
import { StorageService } from '../../services/storage/StorageService';
import { ValidationService } from '../../services/validation/ValidationService';
import { ErrorHandler } from '../../services/error/ErrorHandler';
import { Transaction, Category } from '../../types';
import { colors } from '../../styles/colors';
import { SPACING, FONT_SIZES } from '../../styles/responsive';
import { HapticService } from '../../services/haptic/HapticService';
import { safeParseDate } from '../../utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';

interface EditTransactionScreenProps {
  route: {
    params: {
      transactionId: string;
    };
  };
  navigation: any;
}

export const EditTransactionScreen: React.FC<EditTransactionScreenProps> = ({ 
  route, 
  navigation 
}) => {
  const { transactionId } = route.params;
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    category: '',
    paymentMethod: 'cash' as 'cash' | 'debit' | 'credit' | 'pix',
    date: new Date(),
    isPaid: false,
    paidDate: new Date(),
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    loadTransaction();
    loadCategories();
  }, []);



  const loadTransaction = async () => {
    try {
      const transactions = await StorageService.getTransactions();
      const found = transactions.find(t => t.id === transactionId);
      
      if (found) {
        console.log('Transação encontrada:', found);
        setTransaction(found);
        setFormData({
          type: found.type || 'expense',
          amount: (found.amount || 0).toFixed(2).replace('.', ','),
          description: found.description || '',
          category: found.category || '',
          paymentMethod: found.paymentMethod || 'cash',
          date: safeParseDate(found.date),
          isPaid: found.isPaid ?? false,
          paidDate: safeParseDate(found.paidDate),
        });
      } else {
        Alert.alert('Erro', 'Transação não encontrada');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Erro ao carregar transação:', error);
      Alert.alert('Erro', 'Erro ao carregar transação');
      navigation.goBack();
    }
  };

  const loadCategories = async () => {
    try {
      console.log('Carregando categorias...');
      const categories = await StorageService.getCategories();
      console.log('Categorias carregadas:', categories);
      setCategories(categories || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      // Se falhou, usar categorias padrão
      const defaultCategories: Category[] = [
        { id: '1', name: 'Alimentação', icon: '🍔', type: 'expense', color: '#FF6B6B', isCustom: false },
        { id: '2', name: 'Transporte', icon: '🚗', type: 'expense', color: '#4ECDC4', isCustom: false },
        { id: '3', name: 'Salário', icon: '💰', type: 'income', color: '#45B7D1', isCustom: false },
        { id: '4', name: 'Outros', icon: '📂', type: 'both', color: '#96CEB4', isCustom: false },
      ];
      setCategories(defaultCategories);
    }
  };

  const getFilteredCategories = () => {
    return categories.filter(cat => 
      cat.type === formData.type || cat.type === 'both'
    );
  };

  const getSelectedCategory = () => {
    return categories.find(cat => cat.name === formData.category);
  };

  const formatAmount = (value: string) => {
    const cleaned = value.replace(/[^0-9,]/g, '');
    return cleaned;
  };

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setFormData(prev => ({
      ...prev,
      type: newType,
      category: '' // Limpar categoria ao trocar tipo
    }));
    HapticService.buttonPress();
  };

  const paymentMethods = [
    { label: 'Dinheiro', value: 'cash', icon: 'cash-outline' },
    { label: 'Cartão de Débito', value: 'debit', icon: 'card-outline' },
    { label: 'Cartão de Crédito', value: 'credit', icon: 'card-outline' },
    { label: 'PIX', value: 'pix', icon: 'phone-portrait-outline' },
  ];

  const getSelectedPaymentMethod = () => {
    return paymentMethods.find(method => method.value === formData.paymentMethod);
  };

  const validateForm = () => {
    console.log('=== VALIDANDO FORMULARIO ===');
    setValidationErrors([]);

    const amount = formData.amount ? parseFloat(formData.amount.replace(',', '.')) : 0;
    console.log('Amount parsed:', amount);

    const transactionData = {
      description: formData.description,
      amount: amount,
      type: formData.type,
      category: formData.category,
      date: formData.date.toISOString(),
      paymentMethod: formData.paymentMethod,
    };

    console.log('Transaction data para validação:', transactionData);
    const validationResult = ValidationService.validateTransaction(transactionData);
    console.log('Resultado da validação:', validationResult);
    
    // A validação retorna um objeto com { errors, isValid, warnings }
    const errors = validationResult.errors || [];
    setValidationErrors(errors);
    const isValid = validationResult.isValid || errors.length === 0;
    console.log('Formulário válido:', isValid);
    return isValid;
  };

  const updateTransaction = async (transactionData: any) => {
    console.log('=== ATUALIZANDO TRANSACAO ===');
    if (!transaction) {
      console.log('Transaction não encontrada!');
      return false;
    }

    console.log('Transaction original:', transaction);
    console.log('Dados novos:', transactionData);

    const updatedTransaction: Transaction = {
      ...transaction,
      ...transactionData,
      amount: transactionData.amount,
    };

    console.log('Transaction atualizada:', updatedTransaction);

    const allTransactions = await StorageService.getTransactions();
    console.log('Total de transactions:', allTransactions.length);
    const index = allTransactions.findIndex(t => t.id === transactionId);
    console.log('Index encontrado:', index);
    
    if (index !== -1) {
      allTransactions[index] = updatedTransaction;
      console.log('Salvando transactions...');
      await StorageService.setTransactions(allTransactions);
      console.log('Transactions salvas com sucesso!');
      return true;
    }
    console.log('Transaction não encontrada na lista!');
    return false;
  };

  const handleSave = async () => {
    console.log('=== HANDLE SAVE INICIADO ===');
    console.log('FormData atual:', formData);
    
    if (!validateForm()) {
      console.log('Validação falhou, parando execução');
      return;
    }

    console.log('Validação passou, continuando...');
    setIsLoading(true);

    try {
      const amount = parseFloat(formData.amount.replace(',', '.'));
      console.log('Amount final:', amount);
      
      const transactionData = {
        description: formData.description,
        amount: amount,
        type: formData.type,
        category: formData.category,
        date: formData.date.toISOString(),
        paymentMethod: formData.paymentMethod,
        isPaid: formData.isPaid,
        paidDate: formData.paidDate.toISOString(),
      };

      console.log('Transaction data final:', transactionData);
      const success = await updateTransaction(transactionData);
      console.log('Resultado updateTransaction:', success);
      
      if (success) {
        console.log('Sucesso! Mostrando alert...');
        Alert.alert('Sucesso', 'Transação atualizada com sucesso!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        console.log('Falha na atualização');
        Alert.alert('Erro', 'Erro ao atualizar transação');
      }
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      Alert.alert('Erro', 'Erro ao salvar transação');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Excluir Transação',
      'Tem certeza que deseja excluir esta transação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const allTransactions = await StorageService.getTransactions();
              const filtered = allTransactions.filter(t => t.id !== transactionId);
              await StorageService.setTransactions(filtered);
              
              Alert.alert('Sucesso', 'Transação excluída com sucesso!', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Erro ao excluir transação:', error);
              Alert.alert('Erro', 'Erro ao excluir transação');
            }
          }
        }
      ]
    );
  };


  if (!transaction) {
    return (
      <Container>
        <View style={styles.loading}>
          <Text>Carregando...</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Transação</Text>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={async () => {
              await HapticService.buttonPress();
              handleDelete();
            }}
          >
            <Ionicons name="trash" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {/* Type Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo</Text>
            <TabSelector
              options={[
                { 
                  key: 'expense', 
                  label: 'Despesa', 
                  icon: 'trending-down',
                  color: colors.danger
                },
                { 
                  key: 'income', 
                  label: 'Receita', 
                  icon: 'trending-up',
                  color: colors.success
                }
              ]}
              selectedValue={formData.type}
              onValueChange={handleTypeChange}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={styles.input}
              value={formData.description}
              onChangeText={(text) => setFormData({...formData, description: text})}
              placeholder="Ex: Almoço no restaurante"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Valor</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.currency}>R$</Text>
              <TextInput
                style={[styles.input, styles.currencyInput]}
                value={formData.amount}
                onChangeText={(text) => setFormData({...formData, amount: formatAmount(text)})}
                placeholder="0,00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Category Selection */}
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

          {/* Payment Method Selection - só aparece se já foi pago */}
          {formData.isPaid && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Método de Pagamento</Text>
              <TouchableOpacity 
                style={styles.categoryButton}
                onPress={() => setShowPaymentMethodModal(true)}
              >
                <View style={styles.categoryContent}>
                  {getSelectedPaymentMethod() ? (
                    <>
                      <Ionicons name={getSelectedPaymentMethod()?.icon as any} size={20} color={colors.primary} />
                      <Text style={styles.categoryText}>{getSelectedPaymentMethod()?.label}</Text>
                    </>
                  ) : (
                    <Text style={styles.categoryPlaceholder}>Selecionar método</Text>
                  )}
                </View>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Date Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Data</Text>
            <DatePicker
              value={formData.date}
              onChange={(date) => setFormData({...formData, date: date})}
            />
          </View>

          {/* Status de Pagamento */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusButtons}>
              <TouchableOpacity 
                style={[
                  styles.statusButton,
                  formData.isPaid && styles.statusButtonActive
                ]}
                onPress={() => {
                  setFormData(prev => ({ 
                    ...prev, 
                    isPaid: true,
                    paidDate: prev.date
                  }));
                  HapticService.buttonPress();
                }}
              >
                <Ionicons 
                  name="checkmark-circle" 
                  size={20} 
                  color={formData.isPaid ? colors.white : colors.success} 
                />
                <Text style={[
                  styles.statusButtonText,
                  formData.isPaid && styles.statusButtonTextActive
                ]}>
                  Já {formData.type === 'income' ? 'Recebido' : 'Pago'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.statusButton,
                  !formData.isPaid && styles.statusButtonPendingActive
                ]}
                onPress={() => {
                  setFormData(prev => ({ 
                    ...prev, 
                    isPaid: false 
                  }));
                  HapticService.buttonPress();
                }}
              >
                <Ionicons 
                  name="time" 
                  size={20} 
                  color={!formData.isPaid ? colors.white : colors.warning} 
                />
                <Text style={[
                  styles.statusButtonText,
                  !formData.isPaid && styles.statusButtonTextActive
                ]}>
                  {formData.type === 'income' ? 'A Receber' : 'A Pagar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

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
                  setFormData({...formData, category: item.name});
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
            data={paymentMethods}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryItem,
                  formData.paymentMethod === item.value && styles.categoryItemSelected
                ]}
                onPress={() => {
                  setFormData({...formData, paymentMethod: item.value as any});
                  setShowPaymentMethodModal(false);
                  HapticService.buttonPress();
                }}
              >
                <View style={styles.categoryInfo}>
                  <Ionicons name={item.icon as any} size={24} color={colors.primary} />
                  <Text style={styles.categoryItemName}>{item.label}</Text>
                </View>
                {formData.paymentMethod === item.value && (
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
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  form: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabSelector: {
    marginHorizontal: 0,
    marginVertical: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  currency: {
    paddingLeft: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  currencyInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: colors.surface,
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
  errorCard: {
    backgroundColor: colors.dangerLight,
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
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginBottom: 4,
  },
  fixedBottomContainer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 34, // Safe area padding
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
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  statusButtonActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  statusButtonPendingActive: {
    backgroundColor: colors.warning,
    borderColor: colors.warning,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginLeft: 8,
  },
  statusButtonTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
}); 