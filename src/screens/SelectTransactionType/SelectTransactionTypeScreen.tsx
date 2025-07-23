import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { Container } from '../../components/common/Container';
import { Card } from '../../components/common/Card';
import { HapticService } from '../../services/haptic/HapticService';
import { colors } from '../../styles/colors';
import { SPACING, FONT_SIZES } from '../../styles/responsive';
import { Ionicons } from '@expo/vector-icons';

interface SelectTransactionTypeScreenProps {
  navigation: any;
}

export const SelectTransactionTypeScreen: React.FC<SelectTransactionTypeScreenProps> = ({ 
  navigation 
}) => {
  const transactionTypes = [
    {
      id: 'transaction',
      title: 'Transação Direta',
      subtitle: 'Gasto ou receita única',
      description: 'Compras, pagamentos, receitas pontuais',
      icon: 'add-circle',
      color: colors.primary,
      examples: ['Compras no mercado', 'Pagamento de conta', 'Recebimento de salário', 'Presente']
    },
    {
      id: 'installment',
      title: 'Parcelamento',
      subtitle: 'Compra em várias parcelas',
      description: 'Compras que serão pagas ao longo do tempo',
      icon: 'card',
      color: colors.warning,
      examples: ['Compra de celular', 'Móveis', 'Eletrodomésticos', 'Cursos']
    },
    {
      id: 'subscription',
      title: 'Assinatura',
      subtitle: 'Pagamento recorrente mensal',
      description: 'Serviços que cobram mensalmente',
      icon: 'repeat',
      color: colors.info,
      examples: ['Netflix, Spotify', 'Academia', 'Software', 'Revistas']
    }
  ];

  const handleSelectType = async (typeId: string) => {
    await HapticService.buttonPress();
    
    switch (typeId) {
      case 'transaction':
        navigation.navigate('AddTransaction');
        break;
      case 'installment':
        navigation.navigate('AddInstallment');
        break;
      case 'subscription':
        navigation.navigate('AddSubscription');
        break;
    }
  };

  const renderTransactionType = ({ item }: { item: typeof transactionTypes[0] }) => (
    <TouchableOpacity 
      style={styles.typeCard}
      onPress={() => handleSelectType(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.typeContent}>
        <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
          <Ionicons name={item.icon as any} size={28} color={item.color} />
        </View>
        
        <View style={styles.typeInfo}>
          <Text style={styles.typeTitle}>{item.title}</Text>
          <Text style={styles.typeSubtitle}>{item.subtitle}</Text>
          <Text style={styles.typeDescription}>{item.description}</Text>
          
          <View style={styles.examplesContainer}>
            <Text style={styles.examplesTitle}>Exemplos:</Text>
            {item.examples.slice(0, 2).map((example, index) => (
              <Text key={index} style={styles.exampleText}>• {example}</Text>
            ))}
            {item.examples.length > 2 && (
              <Text style={styles.moreExamples}>+{item.examples.length - 2} mais</Text>
            )}
          </View>
        </View>
        
        <View style={styles.arrowContainer}>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>
      </View>
    </TouchableOpacity>
  );

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
          <Text style={styles.title}>Selecione o Tipo de Transação</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tipos de Transação */}
        <View style={styles.typesSection}>
          {transactionTypes.map((type) => (
            <React.Fragment key={type.id}>
              {renderTransactionType({ item: type })}
            </React.Fragment>
          ))}
        </View>

        {/* Informação adicional */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={20} color={colors.info} />
            <Text style={styles.infoTitle}>Não tem certeza?</Text>
          </View>
          <Text style={styles.infoText}>
            Use "Transação Direta" para a maioria dos casos. Você pode sempre converter para parcelamento ou assinatura depois.
          </Text>
        </View>
      </ScrollView>
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
  title: {
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
  typesSection: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
  },
  typeCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: SPACING.xs,
    overflow: 'hidden',
  },
  typeContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  typeInfo: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  typeTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: SPACING.xs / 2,
  },
  typeSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: colors.textSecondary,
    marginBottom: SPACING.xs,
  },
  typeDescription: {
    fontSize: FONT_SIZES.sm,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  examplesContainer: {
    marginTop: SPACING.xs,
  },
  examplesTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: colors.text,
    marginBottom: SPACING.xs / 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exampleText: {
    fontSize: FONT_SIZES.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  moreExamples: {
    fontSize: FONT_SIZES.xs,
    color: colors.primary,
    fontWeight: '500',
    marginTop: SPACING.xs / 2,
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
  },
  infoCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
    backgroundColor: colors.infoLight,
    borderRadius: 12,
    padding: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  infoTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: colors.info,
    marginLeft: SPACING.xs,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});