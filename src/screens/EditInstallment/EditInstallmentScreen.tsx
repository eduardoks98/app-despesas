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
import { DatePicker } from '../../components/common/DatePicker';
import { StorageService } from '../../services/storage/StorageService';
import { ValidationService } from '../../services/validation/ValidationService';
import { ErrorHandler } from '../../services/error/ErrorHandler';
import { Installment, Category } from '../../types';
import { colors } from '../../styles/colors';
import { SPACING, FONT_SIZES } from '../../styles/responsive';
import { HapticService } from '../../services/haptic/HapticService';
import { safeParseDate } from '../../utils/dateUtils';
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
    startDate: new Date(),
    category: '',
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
          totalAmount: found.totalAmount.toString().replace('.', ','),
          totalInstallments: found.totalInstallments.toString(),
          startDate: safeParseDate(found.startDate),
          category: found.category,
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
    console.log('=== VALIDANDO FORMULARIO ===');
    setValidationErrors([]);

    const amount = formData.totalAmount ? parseFloat(formData.totalAmount.replace(',', '.')) : 0;
    const installments = formData.totalInstallments ? parseInt(formData.totalInstallments) : 0;
    console.log('Amount parsed:', amount);
    console.log('Installments parsed:', installments);

    // Calcular data de término
    const endDate = new Date(formData.startDate);
    endDate.setMonth(endDate.getMonth() + installments - 1);

    const installmentData = {
      description: formData.description,
      store: formData.store,
      totalAmount: amount,
      totalInstallments: installments,
      category: formData.category,
      startDate: formData.startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    console.log('Installment data para validação:', installmentData);
    const validationResult = ValidationService.validateInstallment(installmentData);
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
    HapticService.buttonPress();

    try {
      const totalAmount = parseFloat(formData.totalAmount.replace(',', '.'));
      const totalInstallments = parseInt(formData.totalInstallments);
      const installmentValue = totalAmount / totalInstallments;
      
      const endDate = new Date(formData.startDate);
      endDate.setMonth(endDate.getMonth() + totalInstallments - 1);

      const updatedInstallment: Installment = {
        ...installment!,
        description: formData.description,
        store: formData.store,
        totalAmount: totalAmount,
        totalInstallments: totalInstallments,
        installmentValue: installmentValue,
        startDate: formData.startDate.toISOString(),
        endDate: endDate.toISOString(),
        category: formData.category,
        paymentMethod: 'credit',
      };

      // Atualizar diretamente sem criar transações duplicadas
      const allInstallments = await StorageService.getInstallments();
      const index = allInstallments.findIndex(i => i.id === installmentId);
      
      if (index !== -1) {
        allInstallments[index] = updatedInstallment;
        await StorageService.setInstallments(allInstallments);
      } else {
        throw new Error('Parcelamento não encontrado');
      }
      
      HapticService.success();
      Alert.alert(
        'Sucesso',
        'Parcelamento atualizado com sucesso!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Erro ao salvar parcelamento:', error);
      const errorMessage = ErrorHandler.handle(error, 'Erro ao salvar parcelamento');
      HapticService.error();
      Alert.alert('Erro', errorMessage);
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
    const cleaned = value.replace(/[^0-9,]/g, '');
    return cleaned;
  };

  const handleAmountChange = (field: string, value: string) => {
    const formatted = formatAmount(value);
    setFormData(prev => ({ ...prev, [field]: formatted }));
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Parcelamento</Text>
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
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={styles.input}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Ex: iPhone 15"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Loja</Text>
            <TextInput
              style={styles.input}
              value={formData.store}
              onChangeText={(text) => setFormData(prev => ({ ...prev, store: text }))}
              placeholder="Ex: Apple Store"
              placeholderTextColor={colors.textSecondary}
            />
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

          {/* Date Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Data de Início</Text>
            <DatePicker
              date={formData.startDate}
              onDateChange={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Valor Total</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currency}>R$</Text>
                <TextInput
                  style={[styles.input, styles.currencyInput]}
                  value={formData.totalAmount}
                  onChangeText={(value) => handleAmountChange('totalAmount', value)}
                  placeholder="0,00"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Nº Parcelas</Text>
              <TextInput
                style={styles.input}
                value={formData.totalInstallments}
                onChangeText={(text) => setFormData(prev => ({ ...prev, totalInstallments: text.replace(/[^0-9]/g, '') }))}
                placeholder="12"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {formData.totalAmount && formData.totalInstallments && (
            <Card style={styles.calculation}>
              <View style={styles.calculationHeader}>
                <Ionicons name="calculator" size={24} color={colors.primary} />
                <Text style={styles.calculationTitle}>Cálculo</Text>
              </View>
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>Valor da parcela:</Text>
                <Text style={styles.calculationValue}>
                  R$ {(parseFloat(formData.totalAmount.replace(',', '.')) / parseInt(formData.totalInstallments)).toFixed(2).replace('.', ',')}
                </Text>
              </View>
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>Total de parcelas:</Text>
                <Text style={styles.calculationValue}>
                  {formData.totalInstallments}x
                </Text>
              </View>
            </Card>
          )}

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

          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={20} color={colors.info} />
              <Text style={styles.infoTitle}>Informação</Text>
            </View>
            <Text style={styles.infoText}>
              Alterações nos valores serão refletidas apenas nas parcelas futuras não pagas.
            </Text>
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
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  flex1: {
    flex: 1,
  },
  calculation: {
    backgroundColor: colors.primaryLight,
    marginBottom: 24,
  },
  calculationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  calculationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calculationLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  calculationValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  infoCard: {
    backgroundColor: colors.infoLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.info,
  },
  infoText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
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
  categoryItemName: {
    fontSize: 16,
    color: colors.text,
  },
}); 