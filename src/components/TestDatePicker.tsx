import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { Container } from './common/Container';
import { Card } from './common/Card';
import { DatePicker } from './common/DatePicker';
import { colors } from '../styles/colors';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const TestDatePicker: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [testDate1, setTestDate1] = useState(new Date(2023, 5, 15)); // 15 de junho de 2023
  const [testDate2, setTestDate2] = useState(new Date(2024, 11, 25)); // 25 de dezembro de 2024
  const [testDate3, setTestDate3] = useState(new Date(2022, 0, 1)); // 1 de janeiro de 2022

  const testDates = [
    { label: 'Data Atual', date: selectedDate, setDate: setSelectedDate },
    { label: 'Junho 2023', date: testDate1, setDate: setTestDate1 },
    { label: 'Dezembro 2024', date: testDate2, setDate: setTestDate2 },
    { label: 'Janeiro 2022', date: testDate3, setDate: setTestDate3 },
  ];

  return (
    <Container>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>📅 Teste do Novo DatePicker</Text>
        
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>🎉 Melhorias Implementadas:</Text>
          <Text style={styles.infoText}>
            • 📅 Calendário visual completo
          </Text>
          <Text style={styles.infoText}>
            • ⬅️➡️ Navegação por mês/ano
          </Text>
          <Text style={styles.infoText}>
            • 🎯 Seleção direta de qualquer data
          </Text>
          <Text style={styles.infoText}>
            • 📱 Interface moderna e intuitiva
          </Text>
          <Text style={styles.infoText}>
            • 🔄 Navegação livre entre anos
          </Text>
        </Card>

        <Text style={styles.sectionTitle}>🧪 Teste as Funcionalidades:</Text>

        {testDates.map((test, index) => (
          <Card key={index} style={styles.testCard}>
            <Text style={styles.testLabel}>{test.label}</Text>
            <DatePicker
              label="Selecione uma data"
              value={test.date}
              onChange={test.setDate}
            />
            <Text style={styles.currentDate}>
              Data atual: {format(test.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </Text>
          </Card>
        ))}

        <Card style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>📋 Como Usar:</Text>
          <Text style={styles.instruction}>
            1. Toque no campo de data
          </Text>
          <Text style={styles.instruction}>
            2. Use as setas para navegar entre meses
          </Text>
          <Text style={styles.instruction}>
            3. Toque em qualquer dia para selecionar
          </Text>
          <Text style={styles.instruction}>
            4. Confirme a seleção
          </Text>
          <Text style={styles.instruction}>
            5. Teste navegar para anos diferentes!
          </Text>
        </Card>

        <Card style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>✨ Funcionalidades:</Text>
          <View style={styles.featureItem}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
            <Text style={styles.featureText}>Calendário visual completo</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="navigate" size={20} color={colors.primary} />
            <Text style={styles.featureText}>Navegação livre entre meses/anos</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            <Text style={styles.featureText}>Seleção direta de qualquer data</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="today" size={20} color={colors.primary} />
            <Text style={styles.featureText}>Destaque para o dia atual</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="color-palette" size={20} color={colors.primary} />
            <Text style={styles.featureText}>Interface moderna e responsiva</Text>
          </View>
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  infoCard: {
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  testCard: {
    marginBottom: 16,
  },
  testLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  currentDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  instructionsCard: {
    marginBottom: 16,
    backgroundColor: colors.primaryLight,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  instruction: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  featuresCard: {
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  bottomSpacer: {
    height: 100,
  },
}); 