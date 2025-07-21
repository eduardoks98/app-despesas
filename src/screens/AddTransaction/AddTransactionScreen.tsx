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
import { StorageService } from '../../services/storage/StorageService';
import { ValidationService } from '../../services/validation/ValidationService';
import { ErrorHandler } from '../../services/error/ErrorHandler';
import { Transaction, Category } from '../../types';
import { colors } from '../../styles/colors';
import { Ionicons } from '@expo/vector-icons';

interface AddTransactionScreenProps {
  navigation: any;
}

export const AddTransactionScreen: React.FC<AddTransactionScreenProps> = ({ navigation }) => {
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
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const data = await ErrorHandler.withErrorHandling(
      'carregar categorias',
      async () => {
        const categories = await StorageService.getCategories();
        setCategories(categories);
        
        // Definir categoria padrão baseada no tipo
        const defaultCategory = categories.find(cat => 
          cat.type === formData.type || cat.type === 'both'
        );
        if (defaultCategory && !formData.category) {
          setFormData(prev => ({ ...prev, category: defaultCategory.name }));
        }
        
        return categories;
      }
    );
    
    if (!data) {
      // Se falhou, usar categorias padrão
      const defaultCategories: Category[] = [
        { id: '1', name: 'Alimentação', icon: '🍔', type: 'expense', color: '#FF6B6B' },
        { id: '2', name: 'Transporte', icon: '🚗', type: 'expense', color: '#4ECDC4' },
        { id: '3', name: 'Salário', icon: '💰', type: 'income', color: '#45B7D1' },
        { id: '4', name: 'Outros', icon: '📂', type: 'both', color: '#96CEB4' },
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
    // Limpar erros anteriores
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

    // Sanitizar dados
    const sanitizedData = ValidationService.sanitizeTransaction(transactionData);
    
    // Validar transação
    const validation = ValidationService.validateTransaction(sanitizedData);

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      ErrorHandler.handleValidationError(validation.errors, 'Nova Transação');
      return null;
    }

    // Mostrar avisos se existirem
    if (validation.warnings && validation.warnings.length > 0) {
      Alert.alert(
        'Atenção',
        validation.warnings.join('\n'),
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar Mesmo Assim', onPress: () => saveTransaction(sanitizedData) }
        ]
      );
      return 'warnings';
    }

    return sanitizedData;
  };

  const saveTransaction = async (transactionData: any) => {
    setIsLoading(true);

    const result = await ErrorHandler.withErrorHandling(
      'salvar transação',
      async () => {
        const newTransaction: Transaction = {
          id: `transaction_${Date.now()}`,
          ...transactionData,
        };

        await StorageService.saveTransaction(newTransaction);
        return newTransaction;
      }
    );

    setIsLoading(false);

    if (result) {
      Alert.alert(
        'Sucesso',
        'Transação adicionada com sucesso!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  const handleSave = async () => {
    const validatedData = validateForm();
    
    if (validatedData && validatedData !== 'warnings') {
      await saveTransaction(validatedData);
    }
  };

  const formatAmount = (value: string) => {
    // Remove tudo exceto números e vírgula
    const cleaned = value.replace(/[^0-9,]/g, '');
    
    // Garantir apenas uma vírgula
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
    type === 'income' && formData.type === type && styles.typeButtonIncomeActive,
  ];

  const getTypeTextStyle = (type: 'income' | 'expense') => [
    styles.typeButtonText,
    formData.type === type && styles.typeButtonTextActive,
  ];

  const getPaymentMethodIcon = (method: string) => {
    const iconMap: { [key: string]: string } = {
      'cash': 'cash',
      'debit': 'card',
      'credit': 'card',
      'pix': 'flash',
    };
    return iconMap[method] || 'card';
  };

  return (
    <Container>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Nova Transação</Text>

        <View style={styles.form}>
          {/* Tipo de transação */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo</Text>
            <View style={styles.typeButtons}>
              <TouchableOpacity 
                style={getTypeButtonStyle('expense')}
                onPress={() => {
                  setFormData(prev => ({ ...prev, type: 'expense', category: '' }));
                  setTimeout(loadCategories, 100);
                }}
              >
                <Ionicons name="remove-circle" size={20} color={
                  formData.type === 'expense' ? colors.white : colors.danger
                } />
                <Text style={getTypeTextStyle('expense')}>Despesa</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={getTypeButtonStyle('income')}
                onPress={() => {
                  setFormData(prev => ({ ...prev, type: 'income', category: '' }));
                  setTimeout(loadCategories, 100);
                }}
              >
                <Ionicons name="add-circle" size={20} color={
                  formData.type === 'income' ? colors.white : colors.success
                } />
                <Text style={getTypeTextStyle('income')}>Receita</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Valor */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Valor</Text>
            <View style={[
              styles.amountContainer,
              validationErrors.some(e => e.includes('Valor') || e.includes('valor')) && styles.inputError
            ]}>
              <Text style={styles.currency}>R$</Text>
              <TextInput
                style={styles.amountInput}
                value={formData.amount}
                onChangeText={(value) => {
                  handleAmountChange(value);
                  // Limpar erros de valor ao digitar
                  if (validationErrors.some(e => e.includes('Valor') || e.includes('valor'))) {
                    setValidationErrors(prev => prev.filter(e => !e.includes('Valor') && !e.includes('valor')));
                  }
                }}
                placeholder="0,00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>
            {validationErrors.filter(e => e.includes('Valor') || e.includes('valor')).map((error, index) => (
              <Text key={index} style={styles.errorText}>{error}</Text>
            ))}
            {formData.amount && (
              <View style={styles.amountPreview}>
                <MoneyText 
                  value={parseFloat(formData.amount.replace(',', '.')) || 0}
                  size="large"
                  showSign={false}
                  style={formData.type === 'income' ? styles.incomePreview : styles.expensePreview}
                />
              </View>
            )}
          </View>

          {/* Descrição */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[
                styles.input,
                validationErrors.some(e => e.includes('Descrição')) && styles.inputError
              ]}
              value={formData.description}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, description: text }));
                // Limpar erros de descrição ao digitar
                if (validationErrors.some(e => e.includes('Descrição'))) {
                  setValidationErrors(prev => prev.filter(e => !e.includes('Descrição')));
                }
              }}
              placeholder="Ex: Almoço no restaurante"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={2}
            />
            {validationErrors.filter(e => e.includes('Descrição')).map((error, index) => (
              <Text key={index} style={styles.errorText}>{error}</Text>
            ))}
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
                  <Text style={styles.categoryIcon}>
                    {getSelectedCategory()?.icon || '📂'}
                  </Text>
                  <Text style={styles.categoryName}>{formData.category}</Text>
                </View>
              ) : (
                <Text style={styles.placeholderText}>Selecione uma categoria</Text>
              )}
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Método de pagamento */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Método de Pagamento</Text>
            <View style={styles.paymentMethods}>
              {[
                { key: 'cash', label: 'Dinheiro' },
                { key: 'debit', label: 'Débito' },
                { key: 'credit', label: 'Crédito' },
                { key: 'pix', label: 'PIX' },
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

          {/* Data */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Data</Text>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar" size={20} color={colors.textSecondary} />
              <Text style={styles.dateText}>
                {formData.date.toLocaleDateString('pt-BR')}
              </Text>
            </View>
          </View>

          <Button 
            title={isLoading ? "Salvando..." : "Salvar Transação"}
            onPress={handleSave}
            style={styles.button}
            disabled={isLoading}
          />
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
                  <Text style={styles.categoryItemIcon}>{category.icon}</Text>
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
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  typeButtonIncomeActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  incomePreview: {
    color: colors.success,
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
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.surface,
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    color: colors.text,
  },
  button: {
    marginBottom: 100,
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