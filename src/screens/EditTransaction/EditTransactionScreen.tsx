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
import { Transaction, Category } from '../../types';
import { colors } from '../../styles/colors';
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
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
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
        setTransaction(found);
        setFormData({
          type: found.type,
          amount: found.amount.toString(),
          description: found.description,
          category: found.category,
          paymentMethod: found.paymentMethod,
          date: new Date(found.date),
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
    const data = await ErrorHandler.withErrorHandling(
      'carregar categorias',
      async () => {
        const categories = await StorageService.getCategories();
        setCategories(categories);
        return categories;
      }
    );
    
    if (!data) {
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

  const validateForm = () => {
    setValidationErrors([]);

    const amount = formData.amount ? parseFloat(formData.amount.replace(',', '.')) : 0;

    const transactionData = {
      description: formData.description,
      amount: amount,
      type: formData.type,
      category: formData.category,
      date: formData.date.toISOString(),
      paymentMethod: formData.paymentMethod,
    };

    const errors = ValidationService.validateTransaction(transactionData);
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const updateTransaction = async (transactionData: any) => {
    if (!transaction) return;

    const updatedTransaction: Transaction = {
      ...transaction,
      ...transactionData,
      amount: transactionData.amount,
    };

    const allTransactions = await StorageService.getTransactions();
    const index = allTransactions.findIndex(t => t.id === transactionId);
    
    if (index !== -1) {
      allTransactions[index] = updatedTransaction;
      await StorageService.setTransactions(allTransactions);
      return true;
    }
    return false;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const amount = parseFloat(formData.amount.replace(',', '.'));
      
      const transactionData = {
        description: formData.description,
        amount: amount,
        type: formData.type,
        category: formData.category,
        date: formData.date.toISOString(),
        paymentMethod: formData.paymentMethod,
      };

      const success = await updateTransaction(transactionData);
      
      if (success) {
        Alert.alert('Sucesso', 'Transação atualizada com sucesso!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
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

  const formatAmount = (value: string) => {
    return value.replace(/[^0-9,]/g, '').replace(/,/g, '.');
  };

  const handleAmountChange = (value: string) => {
    const formatted = formatAmount(value);
    setFormData(prev => ({ ...prev, amount: formatted }));
  };

  const getTypeButtonStyle = (type: 'income' | 'expense') => [
    styles.typeButton,
    formData.type === type && styles.typeButtonActive,
    formData.type === type && (type === 'income' ? styles.incomeButton : styles.expenseButton)
  ];

  const getTypeTextStyle = (type: 'income' | 'expense') => [
    styles.typeButtonText,
    formData.type === type && styles.typeButtonTextActive
  ];

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return 'cash';
      case 'debit': return 'card';
      case 'credit': return 'card';
      case 'pix': return 'phone-portrait';
      default: return 'card';
    }
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
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Editar Transação</Text>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Ionicons name="trash" size={24} color={colors.danger} />
          </TouchableOpacity>
        </View>

        {/* Tipo de Transação */}
        <Card style={styles.card}>
          <Text style={styles.label}>Tipo de Transação</Text>
          <View style={styles.typeButtons}>
            <TouchableOpacity
              style={getTypeButtonStyle('expense')}
              onPress={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
            >
              <Ionicons name="arrow-down" size={20} color={formData.type === 'expense' ? colors.white : colors.textSecondary} />
              <Text style={getTypeTextStyle('expense')}>Despesa</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={getTypeButtonStyle('income')}
              onPress={() => setFormData(prev => ({ ...prev, type: 'income' }))}
            >
              <Ionicons name="arrow-up" size={20} color={formData.type === 'income' ? colors.white : colors.textSecondary} />
              <Text style={getTypeTextStyle('income')}>Receita</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Valor */}
        <Card style={styles.card}>
          <Text style={styles.label}>Valor</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>R$</Text>
            <TextInput
              style={styles.amountInput}
              value={formData.amount}
              onChangeText={handleAmountChange}
              placeholder="0,00"
              keyboardType="numeric"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </Card>

        {/* Descrição */}
        <Card style={styles.card}>
          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={styles.input}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="Ex: Compras no mercado"
            placeholderTextColor={colors.textTertiary}
          />
        </Card>

        {/* Categoria */}
        <Card style={styles.card}>
          <Text style={styles.label}>Categoria</Text>
          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => setShowCategoryModal(true)}
          >
            {getSelectedCategory() ? (
              <View style={styles.selectedCategory}>
                <Text style={styles.categoryIcon}>{getSelectedCategory()?.icon}</Text>
                <Text style={styles.categoryText}>{getSelectedCategory()?.name}</Text>
              </View>
            ) : (
              <Text style={styles.categoryPlaceholder}>Selecione uma categoria</Text>
            )}
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </Card>

        {/* Data */}
        <Card style={styles.card}>
          <Text style={styles.label}>Data</Text>
          <DatePicker
            value={formData.date}
            onChange={(date) => setFormData(prev => ({ ...prev, date }))}
          />
        </Card>

        {/* Forma de Pagamento */}
        <Card style={styles.card}>
          <Text style={styles.label}>Forma de Pagamento</Text>
          <View style={styles.paymentMethods}>
            {['cash', 'debit', 'credit', 'pix'].map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.paymentMethodButton,
                  formData.paymentMethod === method && styles.paymentMethodButtonActive
                ]}
                onPress={() => setFormData(prev => ({ ...prev, paymentMethod: method as any }))}
              >
                <Ionicons 
                  name={getPaymentMethodIcon(method) as any} 
                  size={20} 
                  color={formData.paymentMethod === method ? colors.white : colors.textSecondary} 
                />
                <Text style={[
                  styles.paymentMethodText,
                  formData.paymentMethod === method && styles.paymentMethodTextActive
                ]}>
                  {method === 'cash' ? 'Dinheiro' : 
                   method === 'debit' ? 'Débito' : 
                   method === 'credit' ? 'Crédito' : 'PIX'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Erros de Validação */}
        {validationErrors.length > 0 && (
          <Card style={styles.errorCard}>
            {validationErrors.map((error, index) => (
              <Text key={index} style={styles.errorText}>• {error}</Text>
            ))}
          </Card>
        )}

        {/* Botões */}
        <View style={styles.buttons}>
          <Button
            title="Cancelar"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.button}
          />
          <Button
            title="Salvar Alterações"
            onPress={handleSave}
            loading={isLoading}
            style={styles.button}
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modal de Categorias */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Categoria</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.categoriesList}>
              {getFilteredCategories().map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryItem}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, category: category.name }));
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.categoryItemIcon}>{category.icon}</Text>
                  <Text style={styles.categoryItemText}>{category.name}</Text>
                  {formData.category === category.name && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  deleteButton: {
    padding: 8,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  typeButtonActive: {
    borderColor: colors.primary,
  },
  incomeButton: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  expenseButton: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  typeButtonTextActive: {
    color: colors.white,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    color: colors.text,
    paddingVertical: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.background,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryText: {
    fontSize: 16,
    color: colors.text,
  },
  categoryPlaceholder: {
    fontSize: 16,
    color: colors.textTertiary,
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  paymentMethodButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  paymentMethodTextActive: {
    color: colors.white,
  },
  errorCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: colors.dangerLight,
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
    marginBottom: 4,
  },
  buttons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
  },
  bottomSpacer: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  categoriesList: {
    padding: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryItemIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  categoryItemText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
}); 