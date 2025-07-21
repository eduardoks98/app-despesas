import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useFinance } from '../context/FinanceContext';
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

const AddExpenseScreen: React.FC = () => {
  const navigation = useNavigation();
  const { addExpense, addInstallmentExpenses } = useFinance();

  // Estados básicos
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [dateText, setDateText] = useState(() => {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  });
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

  const parseCurrency = (value: string) => {
    // Remove tudo exceto números
    const cleanValue = value.replace(/[^\d]/g, '');
    
    // Converte para número (já está em centavos)
    const number = parseFloat(cleanValue);
    
    return isNaN(number) ? 0 : number;
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
    // Remove caracteres não numéricos
    const numbers = text.replace(/\D/g, '');
    
    // Formata automaticamente como DD/MM/YYYY
    let formatted = '';
    if (numbers.length >= 1) formatted += numbers.substring(0, 2);
    if (numbers.length >= 3) formatted += '/' + numbers.substring(2, 4);
    if (numbers.length >= 5) formatted += '/' + numbers.substring(4, 8);
    
    // Atualiza o texto do campo
    setDateText(formatted);
    
    // Se a data está completa, tenta criar um objeto Date
    if (formatted.length === 10) {
      const parts = formatted.split('/');
      if (parts.length === 3) {
        const dayStr = parts[0];
        const monthStr = parts[1];
        const yearStr = parts[2];
        
        if (dayStr && monthStr && yearStr) {
          const day = parseInt(dayStr);
          const month = parseInt(monthStr) - 1; // Mês começa em 0
          const year = parseInt(yearStr);
          
          // Criar data usando UTC para evitar problemas de fuso horário
          const newDate = new Date(Date.UTC(year, month, day));
          
          // Verifica se a data é válida
          if (newDate.getUTCDate() === day && 
              newDate.getUTCMonth() === month && 
              newDate.getUTCFullYear() === year) {
            setDate(newDate);
          }
        }
      }
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !amount || !category) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const numericAmount = parseCurrency(amount);
    if (numericAmount <= 0) {
      Alert.alert('Erro', 'O valor deve ser maior que zero.');
      return;
    }

    setLoading(true);

    try {
      // Se for despesa parcelada, usar a lógica de parcelas
      if (isRecurring && isInstallmentExpense && installments && parseInt(installments) > 1) {
        await addInstallmentExpenses({
          title: title.trim(),
          amount: numericAmount, // Valor total
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
      } else {
        // Despesa normal ou recorrente (não parcelada)
        await addExpense({
          title: title.trim(),
          amount: numericAmount, // Valor total
          date: date.toISOString(),
          category,
          description: description.trim(),
          isRecurring,
          recurrenceType: isRecurring ? recurrenceType : 'monthly',
          isFinancing,
          isPaid,
          ...(interestRate && { interestRate: parseFloat(interestRate) }),
          ...(monthlyAdjustment && { monthlyAdjustment: parseFloat(monthlyAdjustment) }),
        });
      }

      const installmentCount = installments ? parseInt(installments) : 1;
      const message = isRecurring && isInstallmentExpense && installmentCount > 1 
        ? `Despesa parcelada criada com sucesso! ${installmentCount} parcelas foram adicionadas.`
        : isRecurring && !isInstallmentExpense
        ? `Despesa recorrente criada com sucesso! 12 ${recurrenceType === 'monthly' ? 'meses' : recurrenceType === 'weekly' ? 'semanas' : 'anos'} foram adicionados.`
        : 'Despesa adicionada com sucesso!';

      Alert.alert(
        'Sucesso',
        message,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Erro ao salvar despesa. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalWithInterest = () => {
    if (!isFinancing || !interestRate || !installments) return parseCurrency(amount);
    
    const principal = parseCurrency(amount);
    const rate = parseFloat(interestRate) / 100;
    const periods = parseInt(installments);
    
    // Cálculo de juros compostos
    const totalWithInterest = principal * Math.pow(1 + rate, periods);
    return totalWithInterest;
  };

  const calculateMonthlyPayment = () => {
    if (!isFinancing || !interestRate || !installments) return parseCurrency(amount);
    
    const principal = parseCurrency(amount);
    const rate = parseFloat(interestRate) / 100;
    const periods = parseInt(installments);
    
    if (rate === 0) return principal / periods;
    
    // Fórmula da prestação
    const monthlyPayment = principal * (rate * Math.pow(1 + rate, periods)) / (Math.pow(1 + rate, periods) - 1);
    return monthlyPayment;
  };

  const calculateAdjustedAmount = () => {
    if (!isFinancing || !monthlyAdjustment || !currentInstallment) return parseCurrency(amount);
    
    const principal = parseCurrency(amount);
    const monthlyAdjustmentRate = parseFloat(monthlyAdjustment) / 100;
    const months = parseInt(currentInstallment);
    
    // Calcula o valor da prestação inicial
    const initialMonthlyPayment = calculateMonthlyPayment();
    
    // Aplica a redução mensal dos juros
    // A cada mês, o valor da prestação diminui pelo percentual de ajuste
    let adjustedAmount = initialMonthlyPayment;
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
        <Title style={styles.headerTitle}>Adicionar Despesa</Title>
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
                value={amount ? formatCurrency(amount) : ''}
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
                    Valor por parcela: R$ {formatCurrency((parseCurrency(amount) / parseInt(installments)).toString())}
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
              {loading ? 'Salvando...' : 'Salvar Despesa'}
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
          <ScrollView showsVerticalScrollIndicator={false}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryOption,
                  category === cat && styles.categoryOptionSelected,
                ]}
                onPress={() => {
                  setCategory(cat);
                  setShowCategoryModal(false);
                }}
              >
                <Text style={styles.categoryOptionText}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
  typeSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  typeOption: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    width: '45%', // Adjust as needed
  },
  typeOptionSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#e0f2f7',
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  typeOptionTextSelected: {
    color: '#2196F3',
  },
  typeOptionDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  frequencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  frequencyOption: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    width: '30%', // Adjust as needed
  },
  frequencyOptionSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#e0f2f7',
  },
  frequencyOptionText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  frequencyOptionTextSelected: {
    color: '#2196F3',
  },
  helperTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -10,
    marginBottom: 16,
  },
  valueInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -10,
    marginBottom: 16,
    backgroundColor: '#e0f2f7',
    padding: 12,
    borderRadius: 8,
  },
  valueInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  selectButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectButtonText: {
    marginLeft: 10,
  },
  selectButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectButtonDescription: {
    fontSize: 12,
    color: '#666',
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
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  modalButton: {
    width: '45%',
  },
  categoryOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryOptionSelected: {
    backgroundColor: '#e0f2f7',
    borderColor: '#2196F3',
  },
  categoryOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddExpenseScreen; 