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
import { Installment, Category } from '../../types';
import { colors } from '../../styles/colors';
import { Ionicons } from '@expo/vector-icons';

interface EditInstallmentScreenProps {
  route: {
    params: {
      installmentId: string;
    };
  };
  navigation: any;
}

export const EditInstallmentScreen: React.FC<EditInstallmentScreenProps> = ({ 
  route, 
  navigation 
}) => {
  const { installmentId } = route.params;
  const [installment, setInstallment] = useState<Installment | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    store: '',
    totalAmount: '',
    totalInstallments: '',
    installmentValue: '',
    startDate: new Date(),
    endDate: new Date(),
    category: '',
    paymentMethod: 'credit' as 'credit' | 'debit' | 'pix',
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    loadInstallment();
    loadCategories();
  }, []);

  const loadInstallment = async () => {
    try {
      const installments = await StorageService.getInstallments();
      const found = installments.find(i => i.id === installmentId);
      
      if (found) {
        setInstallment(found);
        setFormData({
          description: found.description,
          store: found.store,
          totalAmount: found.totalAmount.toString(),
          totalInstallments: found.totalInstallments.toString(),
          installmentValue: found.installmentValue.toString(),
          startDate: new Date(found.startDate),
          endDate: new Date(found.endDate),
          category: found.category,
          paymentMethod: found.paymentMethod,
        });
      } else {
        Alert.alert('Erro', 'Parcelamento não encontrado');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Erro ao carregar parcelamento:', error);
      Alert.alert('Erro', 'Erro ao carregar parcelamento');
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
      const defaultCategories: Category[] = [
        { id: '1', name: 'Compras', icon: '🛒', type: 'expense', color: '#FF6B6B', isCustom: false },
        { id: '2', name: 'Eletrônicos', icon: '📱', type: 'expense', color: '#4ECDC4', isCustom: false },
        { id: '3', name: 'Móveis', icon: '🪑', type: 'expense', color: '#45B7D1', isCustom: false },
        { id: '4', name: 'Outros', icon: '📂', type: 'both', color: '#96CEB4', isCustom: false },
      ];
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

    const totalAmount = formData.totalAmount ? parseFloat(formData.totalAmount.replace(',', '.')) : 0;
    const totalInstallments = parseInt(formData.totalInstallments) || 0;
    const installmentValue = formData.installmentValue ? parseFloat(formData.installmentValue.replace(',', '.')) : 0;

    const installmentData = {
      description: formData.description,
      store: formData.store,
      totalAmount: totalAmount,
      totalInstallments: totalInstallments,
      installmentValue: installmentValue,
      startDate: formData.startDate.toISOString(),
      endDate: formData.endDate.toISOString(),
      category: formData.category,
      paymentMethod: formData.paymentMethod,
    };

    const errors = ValidationService.validateInstallment(installmentData);
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const updateInstallment = async (installmentData: any) => {
    if (!installment) return;

    const updatedInstallment: Installment = {
      ...installment,
      ...installmentData,
      totalAmount: installmentData.totalAmount,
      totalInstallments: installmentData.totalInstallments,
      installmentValue: installmentData.installmentValue,
    };

    const allInstallments = await StorageService.getInstallments();
    const index = allInstallments.findIndex(i => i.id === installmentId);
    
    if (index !== -1) {
      allInstallments[index] = updatedInstallment;
      await StorageService.setInstallments(allInstallments);
      return true;
    }
    return false;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const totalAmount = parseFloat(formData.totalAmount.replace(',', '.'));
      const totalInstallments = parseInt(formData.totalInstallments);
      const installmentValue = parseFloat(formData.installmentValue.replace(',', '.'));
      
      const installmentData = {
        description: formData.description,
        store: formData.store,
        totalAmount: totalAmount,
        totalInstallments: totalInstallments,
        installmentValue: installmentValue,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
        category: formData.category,
        paymentMethod: formData.paymentMethod,
      };

      const success = await updateInstallment(installmentData);
      
      if (success) {
        Alert.alert('Sucesso', 'Parcelamento atualizado com sucesso!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Erro', 'Erro ao atualizar parcelamento');
      }
    } catch (error) {
      console.error('Erro ao salvar parcelamento:', error);
      Alert.alert('Erro', 'Erro ao salvar parcelamento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Excluir Parcelamento',
      'Tem certeza que deseja excluir este parcelamento? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const allInstallments = await StorageService.getInstallments();
              const filtered = allInstallments.filter(i => i.id !== installmentId);
              await StorageService.setInstallments(filtered);
              
              Alert.alert('Sucesso', 'Parcelamento excluído com sucesso!', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Erro ao excluir parcelamento:', error);
              Alert.alert('Erro', 'Erro ao excluir parcelamento');
            }
          }
        }
      ]
    );
  };

  const formatAmount = (value: string) => {
    return value.replace(/[^0-9,]/g, '').replace(/,/g, '.');
  };

  const handleAmountChange = (field: string, value: string) => {
    const formatted = formatAmount(value);
    setFormData(prev => ({ ...prev, [field]: formatted }));
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'debit': return 'card';
      case 'credit': return 'card';
      case 'pix': return 'phone-portrait';
      default: return 'card';
    }
  };

  if (!installment) {
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
          <Text style={styles.headerTitle}>Editar Parcelamento</Text>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Ionicons name="trash" size={24} color={colors.danger} />
          </TouchableOpacity>
        </View>

        {/* Descrição */}
        <Card style={styles.card}>
          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={styles.input}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="Ex: Compra de iPhone"
            placeholderTextColor={colors.textTertiary}
          />
        </Card>

        {/* Loja */}
        <Card style={styles.card}>
          <Text style={styles.label}>Loja/Estabelecimento</Text>
          <TextInput
            style={styles.input}
            value={formData.store}
            onChangeText={(text) => setFormData(prev => ({ ...prev, store: text }))}
            placeholder="Ex: Apple Store"
            placeholderTextColor={colors.textTertiary}
          />
        </Card>

        {/* Valor Total */}
        <Card style={styles.card}>
          <Text style={styles.label}>Valor Total</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>R$</Text>
            <TextInput
              style={styles.amountInput}
              value={formData.totalAmount}
              onChangeText={(value) => handleAmountChange('totalAmount', value)}
              placeholder="0,00"
              keyboardType="numeric"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </Card>

        {/* Número de Parcelas */}
        <Card style={styles.card}>
          <Text style={styles.label}>Número de Parcelas</Text>
          <TextInput
            style={styles.input}
            value={formData.totalInstallments}
            onChangeText={(text) => setFormData(prev => ({ ...prev, totalInstallments: text.replace(/[^0-9]/g, '') }))}
            placeholder="Ex: 12"
            keyboardType="numeric"
            placeholderTextColor={colors.textTertiary}
          />
        </Card>

        {/* Valor da Parcela */}
        <Card style={styles.card}>
          <Text style={styles.label}>Valor da Parcela</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>R$</Text>
            <TextInput
              style={styles.amountInput}
              value={formData.installmentValue}
              onChangeText={(value) => handleAmountChange('installmentValue', value)}
              placeholder="0,00"
              keyboardType="numeric"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
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

        {/* Data de Início */}
        <Card style={styles.card}>
          <Text style={styles.label}>Data de Início</Text>
          <DatePicker
            value={formData.startDate}
            onChange={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
          />
        </Card>

        {/* Data de Término */}
        <Card style={styles.card}>
          <Text style={styles.label}>Data de Término</Text>
          <DatePicker
            value={formData.endDate}
            onChange={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
          />
        </Card>

        {/* Forma de Pagamento */}
        <Card style={styles.card}>
          <Text style={styles.label}>Forma de Pagamento</Text>
          <View style={styles.paymentMethods}>
            {['debit', 'credit', 'pix'].map((method) => (
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
                  {method === 'debit' ? 'Débito' : 
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