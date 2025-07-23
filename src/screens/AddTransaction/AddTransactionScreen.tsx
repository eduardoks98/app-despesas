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
import { DatePicker } from '../../components/common/DatePicker';
import { StorageService } from '../../services/storage/StorageService';
import { ValidationService } from '../../services/validation/ValidationService';
import { ErrorHandler } from '../../services/error/ErrorHandler';
import { HapticService } from '../../services/haptic/HapticService';
import { Transaction, Category } from '../../types';
import { colors } from '../../styles/colors';
import { SPACING, FONT_SIZES } from '../../styles/responsive';
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
    isPaid: true,
    paidDate: new Date(),
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

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
    HapticService.light();
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
      isPaid: formData.isPaid,
      paidDate: formData.paidDate.toISOString(),
    };

    console.log('Transaction data para validação:', transactionData);
    const validationResult = ValidationService.validateTransaction(transactionData);
    console.log('Resultado da validação:', validationResult);
    
    const errors = validationResult.errors || [];
    setValidationErrors(errors);
    const isValid = validationResult.isValid || errors.length === 0;
    console.log('Formulário válido:', isValid);
    return isValid;
  };

  const handleSave = async () => {
    console.log('=== HANDLE SAVE INICIADO ===');
    console.log('FormData atual:', formData);
    
    if (!validateForm()) {
      console.log('Validação falhou, parando execução');
      HapticService.error();
      return;
    }

    console.log('Validação passou, continuando...');
    setIsLoading(true);
    HapticService.light();

    try {
      const amount = parseFloat(formData.amount.replace(',', '.'));
      console.log('Amount final:', amount);
      
      const newTransaction: Transaction = {
        id: `transaction_${Date.now()}`,
        description: formData.description,
        amount: amount,
        type: formData.type,
        category: formData.category,
        date: formData.date.toISOString(),
        paymentMethod: formData.paymentMethod,
        isPaid: formData.isPaid,
        paidDate: formData.paidDate.toISOString(),
      };

      console.log('Nova transação criada:', newTransaction);
      await StorageService.saveTransaction(newTransaction);
      console.log('Transação salva com sucesso!');

      HapticService.success();
      Alert.alert(
        'Sucesso',
        'Transação adicionada com sucesso!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      const errorMessage = ErrorHandler.handle(error, 'Erro ao salvar transação');
      HapticService.error();
      Alert.alert('Erro', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = () => {
    Alert.alert(
      'Cancelar Transação',
      'Tem certeza que deseja cancelar? Os dados não salvos serão perdidos.',
      [
        { text: 'Não', style: 'cancel' },
        { 
          text: 'Sim', 
          style: 'destructive',
          onPress: () => {
            HapticService.light();
            navigation.goBack();
          }
        }
      ]
    );
  };

  const paymentMethods = [
    { label: 'Dinheiro', value: 'cash', icon: '💵' },
    { label: 'Cartão de Débito', value: 'debit', icon: '💳' },
    { label: 'Cartão de Crédito', value: 'credit', icon: '💳' },
    { label: 'PIX', value: 'pix', icon: '📱' },
  ];

  const getSelectedPaymentMethod = () => {
    return paymentMethods.find(method => method.value === formData.paymentMethod);
  };

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
          <Text style={styles.headerTitle}>Nova Transação</Text>
          <View style={styles.placeholder} />
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
                    <Text style={styles.categoryEmoji}>{getSelectedCategory()?.icon}</Text>
                    <Text style={styles.categoryText}>{getSelectedCategory()?.name}</Text>
                  </>
                ) : (
                  <Text style={styles.categoryPlaceholder}>Selecionar categoria</Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Payment Method Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Método de Pagamento</Text>
            <TouchableOpacity 
              style={styles.categoryButton}
              onPress={() => setShowPaymentMethodModal(true)}
            >
              <View style={styles.categoryContent}>
                {getSelectedPaymentMethod() ? (
                  <>
                    <Text style={styles.categoryEmoji}>{getSelectedPaymentMethod()?.icon}</Text>
                    <Text style={styles.categoryText}>{getSelectedPaymentMethod()?.label}</Text>
                  </>
                ) : (
                  <Text style={styles.categoryPlaceholder}>Selecionar método</Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Date Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Data</Text>
            <DatePicker
              date={formData.date}
              onDateChange={(date) => setFormData({...formData, date: date})}
            />
          </View>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Card style={styles.errorCard}>
              <View style={styles.errorHeader}>
                <Ionicons name="alert-circle" size={20} color={colors.error} />
                <Text style={styles.errorTitle}>Erros encontrados:</Text>
              </View>
              {validationErrors.map((error, index) => (
                <Text key={index} style={styles.errorText}>• {error}</Text>
              ))}
            </Card>
          )}

          <View style={styles.buttonContainer}>
            <Button 
              title="Cancelar"
              onPress={handleDeleteConfirm}
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
      </ScrollView>

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
                  HapticService.light();
                }}
              >
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryItemEmoji}>{item.icon}</Text>
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
                  HapticService.light();
                }}
              >
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryItemEmoji}>{item.icon}</Text>
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 100,
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
  categoryEmoji: {
    fontSize: 20,
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
    color: colors.error,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginBottom: 4,
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
  categoryItemEmoji: {
    fontSize: 24,
  },
  categoryItemName: {
    fontSize: 16,
    color: colors.text,
  },
});