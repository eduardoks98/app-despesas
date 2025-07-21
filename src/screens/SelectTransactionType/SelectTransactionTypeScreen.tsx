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
import { colors } from '../../styles/colors';
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

  const handleSelectType = (typeId: string) => {
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

  return (
    <Container>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Adicionar Nova Transação</Text>
          <Text style={styles.headerSubtitle}>
            Escolha o tipo de transação que deseja adicionar
          </Text>
        </View>

        {/* Tipos de Transação */}
        <View style={styles.typesContainer}>
          {transactionTypes.map((type) => (
            <Card 
              key={type.id}
              style={styles.typeCard}
              onPress={() => handleSelectType(type.id)}
            >
              <View style={styles.typeHeader}>
                <View style={[styles.iconContainer, { backgroundColor: type.color + '20' }]}>
                  <Ionicons name={type.icon as any} size={32} color={type.color} />
                </View>
                <View style={styles.typeInfo}>
                  <Text style={styles.typeTitle}>{type.title}</Text>
                  <Text style={styles.typeSubtitle}>{type.subtitle}</Text>
                </View>
              </View>
              
              <Text style={styles.typeDescription}>{type.description}</Text>
              
              <View style={styles.examplesContainer}>
                <Text style={styles.examplesTitle}>Exemplos:</Text>
                <View style={styles.examplesList}>
                  {type.examples.map((example, index) => (
                    <View key={index} style={styles.exampleItem}>
                      <Ionicons name="checkmark-circle" size={16} color={type.color} />
                      <Text style={styles.exampleText}>{example}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Dica */}
        <Card style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Ionicons name="bulb" size={24} color={colors.warning} />
            <Text style={styles.tipTitle}>Dica</Text>
          </View>
          <Text style={styles.tipText}>
            Escolha o tipo que melhor representa sua transação. Você pode sempre editar ou excluir depois.
          </Text>
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  typesContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  typeCard: {
    padding: 20,
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  typeInfo: {
    flex: 1,
  },
  typeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  typeSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  typeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  examplesContainer: {
    marginTop: 8,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  examplesList: {
    gap: 6,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exampleText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  tipCard: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.warningLight,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.warning,
    marginLeft: 8,
  },
  tipText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 100,
  },
}); 