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
import { StorageService } from '../../services/storage/StorageService';
import { Subscription } from '../../types';
import { colors } from '../../styles/colors';
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
    paymentMethod: 'credit' as const,
  });

  const handleSave = async () => {
    try {
      console.log('Salvando assinatura:', formData);
      
      const today = new Date();
      const billingDay = parseInt(formData.billingDay);
      
      // Calcular próxima data de pagamento
      let nextPaymentDate = setDate(today, billingDay);
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

      Alert.alert(
        'Sucesso',
        'Assinatura adicionada com sucesso!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Erro ao salvar assinatura:', error);
      Alert.alert('Erro', 'Erro ao salvar assinatura: ' + (error as Error).message);
    }
  };

  const paymentMethods = [
    { label: 'Cartão de Crédito', value: 'credit' },
    { label: 'Débito Automático', value: 'debit' },
    { label: 'PIX', value: 'pix' },
    { label: 'Boleto', value: 'boleto' },
  ];

  const categories = [
    'Streaming', 'Academia', 'Software', 'Música', 'Jogos', 'Outros'
  ];

  return (
    <Container>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Nova Assinatura</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome da Assinatura*</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text})}
              placeholder="Ex: Netflix, Spotify, Academia"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição (opcional)</Text>
            <TextInput
              style={styles.input}
              value={formData.description}
              onChangeText={(text) => setFormData({...formData, description: text})}
              placeholder="Ex: Plano Família, Premium"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex2]}>
              <Text style={styles.label}>Valor Mensal*</Text>
              <TextInput
                style={styles.input}
                value={formData.amount}
                onChangeText={(text) => setFormData({...formData, amount: text})}
                placeholder="0,00"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Dia do Vencimento*</Text>
              <TextInput
                style={styles.input}
                value={formData.billingDay}
                onChangeText={(text) => {
                  const day = parseInt(text) || 1;
                  if (day >= 1 && day <= 31) {
                    setFormData({...formData, billingDay: text});
                  }
                }}
                placeholder="1-31"
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoria</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesScroll}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    formData.category === cat && styles.categoryButtonActive
                  ]}
                  onPress={() => setFormData({...formData, category: cat})}
                >
                  <Text style={[
                    styles.categoryText,
                    formData.category === cat && styles.categoryTextActive
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Forma de Pagamento*</Text>
            <View style={styles.paymentMethods}>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.value}
                  style={[
                    styles.paymentMethod,
                    formData.paymentMethod === method.value && styles.paymentMethodActive
                  ]}
                  onPress={() => setFormData({...formData, paymentMethod: method.value as any})}
                >
                  <Text style={[
                    styles.paymentMethodText,
                    formData.paymentMethod === method.value && styles.paymentMethodTextActive
                  ]}>
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.info}>
            <Ionicons name="information-circle" size={20} color={colors.info} />
            <Text style={styles.infoText}>
              A assinatura será cobrada todo dia {formData.billingDay || '?'} de cada mês
            </Text>
          </View>

          <Button
            title="Salvar Assinatura"
            onPress={handleSave}
            style={styles.button}
            disabled={!formData.name || !formData.amount}
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
    color: colors.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: colors.surface,
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
  categoriesScroll: {
    flexGrow: 0,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    backgroundColor: colors.surface,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: colors.text,
  },
  categoryTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentMethod: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  paymentMethodActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  paymentMethodText: {
    fontSize: 14,
    color: colors.text,
  },
  paymentMethodTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.infoLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: colors.info,
    flex: 1,
  },
  button: {
    marginBottom: 32,
  },
}); 