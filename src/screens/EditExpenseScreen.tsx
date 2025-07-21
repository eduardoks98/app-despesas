import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  Switch,
  Divider,
  HelperText,
  Chip,
  RadioButton,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFinance } from '../context/FinanceContext';
import { Expense } from '../context/FinanceContext';
import { Portal, Modal, List } from 'react-native-paper';

const CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Educação',
  'Lazer',
  'Vestuário',
  'Financiamento',
  'Outros',
];

const RECURRENCE_TYPES = [
  { label: 'Mensal', value: 'monthly' },
  { label: 'Semanal', value: 'weekly' },
  { label: 'Anual', value: 'yearly' },
];

const EditExpenseScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { updateExpense, updateRelatedExpenses } = useFinance();
  
  const expense = (route.params as any)?.expense as Expense;
  const editMode = (route.params as any)?.editMode as 'single' | 'future' | 'all' | 'all_including_past' | undefined;
  
  // Estados básicos
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [dateText, setDateText] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  
  // Estados de recorrência
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [installments, setInstallments] = useState('');
  const [currentInstallment, setCurrentInstallment] = useState('1');
  const [isInstallmentExpense, setIsInstallmentExpense] = useState(false);
  
  // Estados de financiamento
  const [isFinancing, setIsFinancing] = useState(false);
  const [interestRate, setInterestRate] = useState('');
  const [monthlyAdjustment, setMonthlyAdjustment] = useState('');
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  const [showFinancingModal, setShowFinancingModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  useEffect(() => {
    if (expense) {
      setTitle(expense.title);
      // Converter de centavos para reais para exibição
      const amountInReais = expense.amount / 100;
      setAmount(amountInReais.toString());
      setDate(new Date(expense.date));
      setDateText(formatDate(new Date(expense.date)));
      setCategory(expense.category);
      setDescription(expense.description || '');
      setIsPaid(expense.isPaid || false);
      setIsRecurring(expense.isRecurring);
      setRecurrenceType(expense.recurrenceType || 'monthly');
      setInstallments(expense.installments?.toString() || '');
      setCurrentInstallment(expense.currentInstallment?.toString() || '1');
      setIsInstallmentExpense(!!expense.installments);
      setIsFinancing(expense.isFinancing || false);
      setInterestRate(expense.interestRate?.toString() || '');
      setMonthlyAdjustment(expense.monthlyAdjustment?.toString() || '');
    }
  }, [expense]);

  const formatCurrency = (value: string) => {
    if (!value || value === '') return '';
    
    const numericValue = value.replace(/[^\d]/g, '');
    if (numericValue === '') return '';
    
    // Tratar como centavos (dividir por 100)
    const floatValue = parseFloat(numericValue) / 100;
    
    // Verificar se o valor é válido
    if (isNaN(floatValue)) return '';
    
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(floatValue);
  };

  const formatCurrencyDisplay = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    if (numericValue === '') return '';
    
    // Tratar como centavos (dividir por 100)
    const floatValue = parseFloat(numericValue) / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(floatValue);
  };

  const formatCurrencyFromReais = (value: string) => {
    const numericValue = value.replace(/[^\d,.]/g, '').replace(',', '.');
    if (numericValue === '') return '';
    
    // Tratar como reais (não dividir por 100)
    const floatValue = parseFloat(numericValue);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(floatValue);
  };

  const parseCurrency = (value: string) => {
    // Remove tudo exceto números e vírgula/ponto
    const cleanValue = value.replace(/[^\d,.]/g, '').replace(',', '.');
    
    // Converte para número (está em reais, precisa converter para centavos)
    const number = parseFloat(cleanValue);
    
    return isNaN(number) ? 0 : Math.round(number * 100);
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      setDateText(formatDate(selectedDate));
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const handleDateInput = (text: string) => {
    setDateText(text);
    
    // Validar formato da data
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = text.match(dateRegex);
    
    if (match) {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]) - 1;
      const year = parseInt(match[3]);
      
      if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900 && year <= 2100) {
        const newDate = new Date(year, month, day);
        setDate(newDate);
      }
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !amount.trim() || !category.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const amountValue = parseCurrency(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Erro', 'Por favor, insira um valor válido.');
      return;
    }

    setLoading(true);

    try {
      if (isRecurring && isInstallmentExpense && installments && parseInt(installments) > 1) {
        // Remover todas as parcelas antigas
        const baseTitle = title.replace(/\s*\(\d+\/\d+\)$/, '');
        const { state, deleteExpense, addInstallmentExpenses, markAsPaid } = useFinance();
        const oldInstallments = state.expenses.filter(e => e.title.replace(/\s*\(\d+\/\d+\)$/, '') === baseTitle);
        // Mapear status de pagamento das antigas
        const oldStatusMap = new Map();
        oldInstallments.forEach(e => {
          const match = e.title.match(/\((\d+)\/(\d+)\)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            oldStatusMap.set(num, { isPaid: e.isPaid, paidAt: e.paidAt });
          }
        });
        for (const old of oldInstallments) {
          await deleteExpense(old.id!);
        }
        // Criar novas parcelas
        await addInstallmentExpenses({
          title: baseTitle,
          amount: amountValue,
          date: date.toISOString(),
          category,
          description: description.trim(),
          isRecurring,
          recurrenceType: isRecurring ? recurrenceType : 'monthly',
          installments: parseInt(installments),
          currentInstallment: parseInt(currentInstallment),
          isFinancing,
          isPaid,
          ...(interestRate && { interestRate: parseFloat(interestRate) }),
          ...(monthlyAdjustment && { monthlyAdjustment: parseFloat(monthlyAdjustment) }),
        });
        // Buscar as novas parcelas criadas
        const { state: stateAfter } = useFinance();
        const newInstallments = stateAfter.expenses.filter(e => e.title.replace(/\s*\(\d+\/\d+\)$/, '') === baseTitle);
        // Marcar como pagas as parcelas que estavam pagas
        for (const newParc of newInstallments) {
          const match = newParc.title.match(/\((\d+)\/(\d+)\)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            const oldStatus = oldStatusMap.get(num);
            if (oldStatus?.isPaid) {
              await markAsPaid(newParc.id!, true, oldStatus.paidAt);
            }
          }
        }
        Alert.alert('Sucesso', 'Parcelas atualizadas com sucesso!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        // Despesa normal ou recorrente (não parcelada)
        const updatedExpense: Expense = {
          ...expense,
          title: title.trim(),
          amount: amountValue,
          date: date.toISOString(),
          category,
          description: description.trim(),
          isPaid,
          isRecurring,
          ...(isRecurring && { recurrenceType }),
          ...(isInstallmentExpense && { installments: parseInt(installments) }),
          ...(isInstallmentExpense && { currentInstallment: parseInt(currentInstallment) }),
          isFinancing: isFinancing || false,
          ...(interestRate && { interestRate: parseFloat(interestRate) }),
          ...(monthlyAdjustment && { monthlyAdjustment: parseFloat(monthlyAdjustment) }),
          updatedAt: new Date().toISOString(),
        };
        await updateExpense(updatedExpense);
        Alert.alert('Sucesso', 'Despesa atualizada com sucesso!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      Alert.alert('Erro', 'Erro ao atualizar despesa. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalWithInterest = () => {
    if (!isFinancing || !interestRate || !installments) return parseCurrency(amount);
    
    const principal = parseCurrency(amount);
    const rate = parseFloat(interestRate) / 100;
    const periods = parseInt(installments);
    
    if (rate === 0) return principal;
    
    // Fórmula do montante com juros compostos
    return principal * Math.pow(1 + rate, periods);
  };

  const calculateMonthlyPayment = () => {
    if (!isFinancing || !interestRate || !installments) return parseCurrency(amount) / (parseInt(installments) || 1);
    
    const principal = parseCurrency(amount);
    const rate = parseFloat(interestRate) / 100;
    const periods = parseInt(installments);
    
    if (rate === 0) return principal / periods;
    
    // Fórmula da prestação
    return principal * (rate * Math.pow(1 + rate, periods)) / (Math.pow(1 + rate, periods) - 1);
  };

  const calculateAdjustedAmount = () => {
    if (!isFinancing || !monthlyAdjustment || !currentInstallment) return parseCurrency(amount);
    
    const principal = parseCurrency(amount);
    const monthlyAdjustmentRate = parseFloat(monthlyAdjustment) / 100;
    const months = parseInt(currentInstallment);
    
    // Aplica a redução mensal dos juros
    let adjustedAmount = principal;
    for (let i = 0; i < months; i++) {
      adjustedAmount = adjustedAmount * (1 - monthlyAdjustmentRate);
    }
    
    return adjustedAmount;
  };

  const calculateCurrentPayment = () => {
    if (!isFinancing || !monthlyAdjustment || !currentInstallment) return parseCurrency(amount);
    
    const principal = parseCurrency(amount);
    const monthlyAdjustmentRate = parseFloat(monthlyAdjustment) / 100;
    const months = parseInt(currentInstallment);
    
    // Calcula o valor da prestação inicial
    const initialMonthlyPayment = calculateMonthlyPayment();
    
    // Aplica a redução mensal dos juros até o mês atual
    let currentPayment = initialMonthlyPayment;
    for (let i = 0; i < months; i++) {
      currentPayment = currentPayment * (1 - monthlyAdjustmentRate);
    }
    
    return currentPayment;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Customizado */}
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Editar Despesa</Title>
      </View>
      
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          {/* Informações Básicas */}
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Informações Básicas</Title>
              
              <TextInput
                label="Título da Despesa *"
                value={title}
                onChangeText={setTitle}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="pencil" />}
              />

              <TextInput
                label="Valor Total *"
                value={amount ? formatCurrencyFromReais(amount) : ''}
                onChangeText={(text) => {
                  // Remove formatação e mantém apenas números
                  const numericValue = text.replace(/[^\d]/g, '');
                  setAmount(numericValue);
                }}
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
                left={<TextInput.Icon icon="currency-brl" />}
                placeholder="1.500,00"
              />

              {isRecurring && isInstallmentExpense && installments && parseInt(installments) > 1 && (
                <View style={styles.valueInfoContainer}>
                  <Ionicons name="calculator" size={16} color="#2196F3" />
                  <Text style={styles.valueInfoText}>
                    Valor por parcela: R$ {formatCurrencyFromReais((parseFloat(amount || '0') / parseInt(installments)).toString())}
                  </Text>
                </View>
              )}

              <TouchableOpacity onPress={showDatePickerModal} style={styles.dateButton}>
                <TextInput
                  label="Data *"
                  value={dateText}
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="calendar" />}
                  right={<TextInput.Icon icon="calendar-edit" />}
                  editable={false}
                />
              </TouchableOpacity>

              <Title style={styles.sectionTitle}>Categoria *</Title>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowCategoryModal(true)}
              >
                <View style={styles.selectButtonContent}>
                  <Ionicons 
                    name="pricetag" 
                    size={20} 
                    color="#2196F3" 
                  />
                  <View style={styles.selectButtonText}>
                    <Text style={styles.selectButtonLabel}>
                      {category || "Selecionar Categoria"}
                    </Text>
                    <Text style={styles.selectButtonDescription}>
                      {category ? "Categoria selecionada" : "Escolha uma categoria"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </View>
              </TouchableOpacity>

              <TextInput
                label="Descrição (opcional)"
                value={description}
                onChangeText={setDescription}
                mode="outlined"
                style={styles.input}
                multiline
                numberOfLines={3}
                left={<TextInput.Icon icon="text" />}
              />
            </Card.Content>
          </Card>

          {/* Recorrência */}
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Configurações de Recorrência</Title>
              
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowRecurrenceModal(true)}
              >
                <View style={styles.selectButtonContent}>
                  <Ionicons 
                    name={isRecurring ? "refresh" : "calendar-outline"} 
                    size={20} 
                    color="#2196F3" 
                  />
                  <View style={styles.selectButtonText}>
                    <Text style={styles.selectButtonLabel}>
                      {isRecurring ? "Despesa Recorrente" : "Despesa Única"}
                    </Text>
                    <Text style={styles.selectButtonDescription}>
                      {isRecurring ? "Repete periodicamente" : "Acontece apenas uma vez"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </View>
              </TouchableOpacity>

              {isRecurring && (
                <>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => setShowTypeModal(true)}
                  >
                    <View style={styles.selectButtonContent}>
                      <Ionicons 
                        name={isInstallmentExpense ? "layers" : "refresh"} 
                        size={20} 
                        color="#2196F3" 
                      />
                      <View style={styles.selectButtonText}>
                        <Text style={styles.selectButtonLabel}>
                          {isInstallmentExpense ? "Parcelada" : "Mensalidade"}
                        </Text>
                        <Text style={styles.selectButtonDescription}>
                          {isInstallmentExpense ? "Tem data limite (ex: financiamento)" : "Sem data limite (ex: assinatura)"}
                        </Text>
                      </View>
                      <Ionicons name="chevron-down" size={20} color="#666" />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => setShowFrequencyModal(true)}
                  >
                    <View style={styles.selectButtonContent}>
                      <Ionicons 
                        name={recurrenceType === 'monthly' ? 'calendar-month' : 
                              recurrenceType === 'weekly' ? 'calendar-week' : 'calendar'} 
                        size={20} 
                        color="#2196F3" 
                      />
                      <View style={styles.selectButtonText}>
                        <Text style={styles.selectButtonLabel}>
                          {recurrenceType === 'monthly' ? 'Mensal' :
                           recurrenceType === 'weekly' ? 'Semanal' : 'Anual'}
                        </Text>
                        <Text style={styles.selectButtonDescription}>
                          Frequência de recorrência
                        </Text>
                      </View>
                      <Ionicons name="chevron-down" size={20} color="#666" />
                    </View>
                  </TouchableOpacity>

                  {isInstallmentExpense ? (
                    <>
                      <View style={styles.inputRow}>
                        <TextInput
                          label="Número de Parcelas"
                          value={installments}
                          onChangeText={setInstallments}
                          keyboardType="numeric"
                          style={styles.halfInput}
                          mode="outlined"
                          left={<TextInput.Icon icon="numeric" />}
                        />
                        <TextInput
                          label="Parcela Atual"
                          value={currentInstallment}
                          onChangeText={setCurrentInstallment}
                          keyboardType="numeric"
                          style={styles.halfInput}
                          mode="outlined"
                          left={<TextInput.Icon icon="counter" />}
                        />
                      </View>
                      
                      <View style={styles.helperTextContainer}>
                        <Ionicons name="information-circle" size={16} color="#2196F3" />
                        <Text style={styles.helperText}>
                          Se você está na parcela 2 de 12, o sistema criará automaticamente as parcelas 1 e 2 como pagas e as próximas como pendentes.
                        </Text>
                      </View>
                    </>
                  ) : (
                    <View style={styles.helperTextContainer}>
                      <Ionicons name="information-circle" size={16} color="#2196F3" />
                      <Text style={styles.helperText}>
                        Esta despesa será criada como uma mensalidade recorrente sem data limite.
                      </Text>
                    </View>
                  )}
                </>
              )}
            </Card.Content>
          </Card>

          {/* Financiamento */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.switchContainer}>
                <Title style={styles.cardTitle}>Financiamento</Title>
                <Switch
                  value={isFinancing}
                  onValueChange={setIsFinancing}
                  color="#4CAF50"
                />
              </View>

              {isFinancing && (
                <>
                  <Divider style={styles.divider} />
                  
                  <TextInput
                    label="Taxa de Juros Mensal (%)"
                    value={interestRate}
                    onChangeText={setInterestRate}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="numeric"
                    left={<TextInput.Icon icon="percent" />}
                  />

                  <TextInput
                    label="Reajuste Mensal (%)"
                    value={monthlyAdjustment}
                    onChangeText={setMonthlyAdjustment}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="numeric"
                    left={<TextInput.Icon icon="trending-down" />}
                    placeholder="Ex: 0.5 para redução de 0.5% ao mês"
                  />

                  {/* Cálculos do financiamento */}
                  {interestRate && installments && (
                    <View style={styles.calculationContainer}>
                      <Title style={styles.calculationTitle}>Cálculos do Financiamento</Title>
                      
                      <View style={styles.calculationItem}>
                        <Paragraph>Total com Juros:</Paragraph>
                        <Paragraph style={styles.calculationValue}>
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(calculateTotalWithInterest())}
                        </Paragraph>
                      </View>

                      <View style={styles.calculationItem}>
                        <Paragraph>Prestação Mensal:</Paragraph>
                        <Paragraph style={styles.calculationValue}>
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(calculateMonthlyPayment())}
                        </Paragraph>
                      </View>

                      {monthlyAdjustment && currentInstallment && (
                        <>
                          <View style={styles.calculationItem}>
                            <Paragraph>Prestação Atual (Mês {currentInstallment}):</Paragraph>
                            <Paragraph style={styles.calculationValue}>
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(calculateCurrentPayment())}
                            </Paragraph>
                          </View>
                          
                          <View style={styles.calculationItem}>
                            <Paragraph>Redução Total:</Paragraph>
                            <Paragraph style={styles.calculationValue}>
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(calculateMonthlyPayment() - calculateCurrentPayment())}
                            </Paragraph>
                          </View>
                        </>
                      )}
                    </View>
                  )}
                </>
              )}
            </Card.Content>
          </Card>

          {/* Status de Pagamento */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.switchContainer}>
                <View style={styles.switchInfo}>
                  <Ionicons name="checkmark-circle" size={24} color={isPaid ? "#4CAF50" : "#999"} />
                  <View style={styles.switchText}>
                    <Title style={styles.switchTitle}>Marcar como Pago</Title>
                    <Paragraph style={styles.switchDescription}>
                      {isPaid ? 'Esta despesa será marcada como já paga' : 'Esta despesa será marcada como pendente'}
                    </Paragraph>
                  </View>
                </View>
                <Switch
                  value={isPaid}
                  onValueChange={setIsPaid}
                  color="#4CAF50"
                />
              </View>
            </Card.Content>
          </Card>

          {/* Botões */}
          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={[styles.button, styles.cancelButton]}
              disabled={loading}
            >
              Cancelar
            </Button>
            
            <Button
              mode="contained"
              onPress={handleSave}
              style={[styles.button, styles.saveButton]}
              loading={loading}
              disabled={loading}
              icon={loading ? undefined : "content-save"}
            >
              {loading ? 'Salvando...' : 'Atualizar Despesa'}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* Modal de Recorrência */}
      <Portal>
        <Modal
          visible={showRecurrenceModal}
          onDismiss={() => setShowRecurrenceModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title style={styles.modalTitle}>Tipo de Despesa</Title>
          
          <List.Item
            title="Despesa Única"
            description="Acontece apenas uma vez"
            left={(props) => <List.Icon {...props} icon="calendar-outline" />}
            onPress={() => {
              setIsRecurring(false);
              setShowRecurrenceModal(false);
            }}
            style={styles.modalItem}
          />

          <List.Item
            title="Despesa Recorrente"
            description="Repete periodicamente"
            left={(props) => <List.Icon {...props} icon="refresh" />}
            onPress={() => {
              setIsRecurring(true);
              setShowRecurrenceModal(false);
            }}
            style={styles.modalItem}
          />

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowRecurrenceModal(false)}
              style={styles.modalButton}
            >
              Cancelar
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Modal de Tipo */}
      <Portal>
        <Modal
          visible={showTypeModal}
          onDismiss={() => setShowTypeModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title style={styles.modalTitle}>Tipo de Recorrência</Title>
          
          <List.Item
            title="Parcelada"
            description="Tem data limite (ex: financiamento)"
            left={(props) => <List.Icon {...props} icon="layers" />}
            onPress={() => {
              setIsInstallmentExpense(true);
              setShowTypeModal(false);
            }}
            style={styles.modalItem}
          />

          <List.Item
            title="Mensalidade"
            description="Sem data limite (ex: assinatura)"
            left={(props) => <List.Icon {...props} icon="refresh" />}
            onPress={() => {
              setIsInstallmentExpense(false);
              setShowTypeModal(false);
            }}
            style={styles.modalItem}
          />

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowTypeModal(false)}
              style={styles.modalButton}
            >
              Cancelar
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Modal de Frequência */}
      <Portal>
        <Modal
          visible={showFrequencyModal}
          onDismiss={() => setShowFrequencyModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title style={styles.modalTitle}>Frequência</Title>
          
          {RECURRENCE_TYPES.map((type) => (
            <List.Item
              key={type.value}
              title={type.label}
              left={(props) => (
                <List.Icon 
                  {...props} 
                  icon={type.value === 'monthly' ? 'calendar-month' : 
                        type.value === 'weekly' ? 'calendar-week' : 'calendar'} 
                />
              )}
              onPress={() => {
                setRecurrenceType(type.value as any);
                setShowFrequencyModal(false);
              }}
              style={styles.modalItem}
            />
          ))}

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowFrequencyModal(false)}
              style={styles.modalButton}
            >
              Cancelar
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Modal de Categoria */}
      <Portal>
        <Modal
          visible={showCategoryModal}
          onDismiss={() => setShowCategoryModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title style={styles.modalTitle}>Selecionar Categoria</Title>
          {CATEGORIES.map((cat) => (
            <List.Item
              key={cat}
              title={cat}
              left={(props) => <List.Icon {...props} icon="pricetag" />}
              onPress={() => {
                setCategory(cat);
                setShowCategoryModal(false);
              }}
              style={styles.modalItem}
            />
          ))}
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowCategoryModal(false)}
              style={styles.modalButton}
            >
              Cancelar
            </Button>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingBottom: 90,
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 16,
    paddingTop: 8,
    elevation: 4,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginTop: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  dateButton: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
    marginTop: 8,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    marginBottom: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    marginVertical: 16,
  },
  calculationContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  calculationTitle: {
    fontSize: 16,
    marginBottom: 12,
    color: '#2196F3',
  },
  calculationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calculationValue: {
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
  },
  cancelButton: {
    borderColor: '#666',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  infoContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#e0f2f7',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  switchText: {
    marginLeft: 10,
  },
  switchTitle: {
    fontSize: 16,
  },
  switchDescription: {
    fontSize: 12,
    color: '#666',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  helperText: {
    marginTop: -10,
    marginBottom: 16,
  },
  valueInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#e0f2f7',
    padding: 12,
    borderRadius: 8,
  },
  valueInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectButtonText: {
    marginLeft: 12,
  },
  selectButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  selectButtonDescription: {
    fontSize: 12,
    color: '#666',
  },
  helperTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#e0f2f7',
    padding: 12,
    borderRadius: 8,
  },
  modalContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  modalButton: {
    width: '45%',
  },
});

export default EditExpenseScreen; 