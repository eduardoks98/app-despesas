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
import { StorageService } from '../services/core';
import { ValidationService } from '../services/utils';
import { ErrorHandler } from '../services/utils';
import { HapticService } from '../services/platform';
import { Subscription, Category } from '../../types';
import { colors } from '../../styles/colors';
import { SPACING, FONT_SIZES } from '../../styles/responsive';
import { addMonths, setDate } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

interface AddSubscriptionScreenProps {
  navigation: any;
}

export const AddSubscriptionScreen: React.FC<AddSubscriptionScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    category: '',
    billingDay: '1',
    paymentMethod: 'credit' as 'cash' | 'credit' | 'debit' | 'pix' | 'boleto',
    nextPaymentDate: new Date(),
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

  const formatAmount = (value: string) => {
    const cleaned = value.replace(/[^0-9,]/g, '');
    return cleaned;
  };

  const validateForm = () => {
    console.log('=== VALIDANDO FORMULARIO ===');
    setValidationErrors([]);

    const amount = formData.amount ? parseFloat(formData.amount.replace(',', '.')) : 0;
    const billingDay = formData.billingDay ? parseInt(formData.billingDay) : 0;
    console.log('Amount parsed:', amount);
    console.log('BillingDay parsed:', billingDay);

    const subscriptionData = {
      name: formData.name,
      description: formData.description,
      amount: amount,
      category: formData.category,
      billingDay: billingDay,
      paymentMethod: formData.paymentMethod,
      nextPaymentDate: formData.nextPaymentDate.toISOString(),
    };

    console.log('Subscription data para validação:', subscriptionData);
    const validationResult = ValidationService.validateSubscription(subscriptionData);
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
      console.log('Salvando assinatura:', formData);
      
      const today = new Date();
      const billingDay = parseInt(formData.billingDay);
      
      // Calcular próxima data de pagamento
      let nextPaymentDate = setDate(formData.nextPaymentDate, billingDay);
      if (nextPaymentDate <= today) {
        nextPaymentDate = addMonths(nextPaymentDate, 1);
      }

      const newSubscription: Subscription = {
        id: `subscription_${Date.now()}`,
        name: formData.name,
        description: formData.description,
        amount: parseFloat(formData.amount.replace(',', '.')),
        category: formData.category,
        billingDay,
        status: 'active',
        startDate: today.toISOString(),
        nextPaymentDate: nextPaymentDate.toISOString(),
        paymentMethod: formData.paymentMethod,
        reminder: true,
        reminderDays: 3,
      };

      console.log('Nova assinatura criada:', newSubscription);

      await StorageService.saveSubscription(newSubscription);
      console.log('Assinatura salva com sucesso no storage');

      HapticService.success();
      Alert.alert(
        'Sucesso',
        'Assinatura adicionada com sucesso!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Erro ao salvar assinatura:', error);
      const errorMessage = ErrorHandler.handle(error, 'Erro ao salvar assinatura');
      HapticService.error();
      Alert.alert('Erro', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = () => {
    Alert.alert(
      'Cancelar Assinatura',
      'Tem certeza que deseja cancelar? Os dados não salvos serão perdidos.',
      [
        { text: 'Não', style: 'cancel' },
        { 
          text: 'Sim', 
          style: 'destructive',
          onPress: () => {
            HapticService.buttonPress();
            navigation.goBack();
          }
        }
      ]
    );
  };

  const paymentMethods = [
    { label: 'Dinheiro', value: 'cash', icon: 'cash-outline' },
    { label: 'Cartão de Crédito', value: 'credit', icon: 'card-outline' },
    { label: 'Débito Automático', value: 'debit', icon: 'card-outline' },
    { label: 'PIX', value: 'pix', icon: 'phone-portrait-outline' },
    { label: 'Boleto', value: 'boleto', icon: 'barcode-outline' },
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
          <Text style={styles.headerTitle}>Nova Assinatura</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome da Assinatura</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text})}
              placeholder="Ex: Netflix, Spotify..."
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição (opcional)</Text>
            <TextInput
              style={styles.input}
              value={formData.description}
              onChangeText={(text) => setFormData({...formData, description: text})}
              placeholder="Detalhes sobre a assinatura..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Valor Mensal</Text>
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

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Dia da Cobrança</Text>
              <TextInput
                style={styles.input}
                value={formData.billingDay}
                onChangeText={(text) => setFormData({...formData, billingDay: text})}
                placeholder="1"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
              />
            </View>

            <View style={[styles.inputGroup, styles.flex2]}>
              <Text style={styles.label}>Próximo Pagamento</Text>
              <DatePicker
                date={formData.nextPaymentDate}
                onDateChange={(date) => setFormData({...formData, nextPaymentDate: date})}
              />
            </View>
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

          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={20} color={colors.info} />
              <Text style={styles.infoTitle}>Informação</Text>
            </View>
            <Text style={styles.infoText}>
              A assinatura será registrada e você receberá lembretes antes do vencimento.
            </Text>
          </View>

        </View>
      </ScrollView>

      {/* Fixed Bottom Button Container */}
      <View style={styles.fixedBottomContainer}>
        <View style={styles.buttonRow}>
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
  flex2: {
    flex: 2,
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

export default AddSubscriptionScreen;