import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  StyleSheet,
  Alert,
  TouchableOpacity
} from 'react-native';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { StorageService } from '../../services/storage/StorageService';
import { Installment, Transaction } from '../../types';
import { colors } from '../../styles/colors';
import { Ionicons } from '@expo/vector-icons';

interface AddInstallmentScreenProps {
  navigation: any;
}

export const AddInstallmentScreen: React.FC<AddInstallmentScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    description: '',
    store: '',
    totalAmount: '',
    totalInstallments: '',
    category: 'Compras',
    startDate: new Date(),
  });

  const [isLoading, setIsLoading] = useState(false);

  const calculateInstallmentValue = () => {
    const total = parseFloat(formData.totalAmount.replace(',', '.')) || 0;
    const installments = parseInt(formData.totalInstallments) || 1;
    return total / installments;
  };

  const handleSave = async () => {
    if (!formData.description.trim()) {
      Alert.alert('Erro', 'Por favor, informe a descrição');
      return;
    }

    if (!formData.store.trim()) {
      Alert.alert('Erro', 'Por favor, informe a loja');
      return;
    }

    if (!formData.totalAmount || parseFloat(formData.totalAmount.replace(',', '.')) <= 0) {
      Alert.alert('Erro', 'Por favor, informe um valor válido');
      return;
    }

    if (!formData.totalInstallments || parseInt(formData.totalInstallments) <= 0) {
      Alert.alert('Erro', 'Por favor, informe o número de parcelas');
      return;
    }

    setIsLoading(true);

    try {
      const totalAmount = parseFloat(formData.totalAmount.replace(',', '.'));
      const totalInstallments = parseInt(formData.totalInstallments);
      const installmentValue = totalAmount / totalInstallments;
      
      const endDate = new Date(formData.startDate);
      endDate.setMonth(endDate.getMonth() + totalInstallments - 1);

      const newInstallment: Installment = {
        id: `installment_${Date.now()}`,
        description: formData.description,
        store: formData.store,
        totalAmount: totalAmount,
        totalInstallments: totalInstallments,
        currentInstallment: 1,
        installmentValue: installmentValue,
        startDate: formData.startDate.toISOString(),
        endDate: endDate.toISOString(),
        category: formData.category,
        status: 'active',
        paidInstallments: [],
        paymentMethod: 'credit',
      };

      await StorageService.saveInstallment(newInstallment);
      
      // Criar a primeira transação do parcelamento (opcional - pode ser criada quando pagar)
      const firstTransaction: Transaction = {
        id: `transaction_${Date.now()}`,
        type: 'expense',
        amount: installmentValue,
        description: `${formData.description} (1/${formData.totalInstallments})`,
        category: formData.category,
        date: formData.startDate.toISOString(),
        installmentId: newInstallment.id,
        installmentNumber: 1,
        paymentMethod: 'credit',
      };

      await StorageService.saveTransaction(firstTransaction);

      // Marcar primeira parcela como paga
      newInstallment.paidInstallments = [1];
      await StorageService.setInstallments([
        ...await StorageService.getInstallments().then(installments => 
          installments.filter(i => i.id !== newInstallment.id)
        ),
        newInstallment
      ]);

      Alert.alert(
        'Sucesso',
        'Parcelamento adicionado com sucesso!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Erro ao salvar parcelamento:', error);
      Alert.alert('Erro', 'Erro ao salvar parcelamento');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Novo Parcelamento</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={styles.input}
              value={formData.description}
              onChangeText={(text) => setFormData({...formData, description: text})}
              placeholder="Ex: iPhone 15"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Loja</Text>
            <TextInput
              style={styles.input}
              value={formData.store}
              onChangeText={(text) => setFormData({...formData, store: text})}
              placeholder="Ex: Apple Store"
              placeholderTextColor={colors.textSecondary}
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
                  onChangeText={(text) => setFormData({...formData, totalAmount: text})}
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
                onChangeText={(text) => setFormData({...formData, totalInstallments: text})}
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
                  R$ {calculateInstallmentValue().toFixed(2).replace('.', ',')}
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

          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={20} color={colors.info} />
              <Text style={styles.infoTitle}>Informação</Text>
            </View>
            <Text style={styles.infoText}>
              A primeira parcela será registrada automaticamente como paga na data de hoje.
            </Text>
          </View>

          <Button 
            title={isLoading ? "Salvando..." : "Salvar Parcelamento"}
            onPress={handleSave}
            style={styles.button}
            disabled={isLoading}
          />
        </View>
      </ScrollView>
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
  button: {
    marginBottom: 100,
  },
});