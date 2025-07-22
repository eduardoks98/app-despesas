import React, { useState, useEffect, useLayoutEffect } from 'react';
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
import { MoneyText } from '../../components/common/MoneyText';
import { DatePicker } from '../../components/common/DatePicker';
import { StorageService } from '../../services/storage/StorageService';
import { ValidationService } from '../../services/validation/ValidationService';
import { ErrorHandler } from '../../services/error/ErrorHandler';
import { Transaction, Category } from '../../types';
import { colors } from '../../styles/colors';
import { SPACING, FONT_SIZES } from '../../styles/responsive';
import { HapticService } from '../../services/haptic/HapticService';
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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          style={{ marginRight: 15 }}
          onPress={async () => {
            await HapticService.buttonPress();
            handleDelete();
          }}
        >
          <Ionicons name="trash" size={24} color="white" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

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
          date: new Date(found.date || new Date()),
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

  const formatAmount = (value: string) => {
    // Remove tudo exceto números e vírgula
    const cleaned = value.replace(/[^0-9,]/g, '');
    // Garante apenas uma vírgula
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
      <FlatList
        data={[{ key: 'content' }]}
        renderItem={() => (
          <>
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
          </>
        )}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
      />

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
  flatListContent: {
    paddingBottom: 100,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: SPACING.sm,
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
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
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