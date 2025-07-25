import React from 'react';
import { 
  FlatList, 
  View, 
  Text, 
  StyleSheet, 
  SectionList,
  RefreshControl
} from 'react-native';
import { Transaction } from '../../types';
import { TransactionItem } from './TransactionItem';
import { colors } from '../../styles/colors';

interface TransactionListProps {
  transactions: Transaction[];
  onTransactionPress: (transaction: Transaction) => void;
  onTransactionLongPress?: (transaction: Transaction) => void;
  grouped?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  emptyMessage?: string;
}

interface TransactionSection {
  title: string;
  data: Transaction[];
  totalIncome: number;
  totalExpenses: number;
}

export const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, 
  onTransactionPress,
  onTransactionLongPress,
  grouped = true,
  refreshing = false,
  onRefresh,
  emptyMessage = "Nenhuma transação encontrada"
}) => {

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Verificar se é hoje
    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    }
    
    // Verificar se é ontem
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }

    // Caso contrário, mostrar data formatada
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>📊</Text>
      <Text style={styles.emptySubtitle}>{emptyMessage}</Text>
    </View>
  );

  if (!grouped) {
    return (
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionItem 
            transaction={item}
            onPress={() => onTransactionPress(item)}
            onLongPress={() => onTransactionLongPress?.(item)}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          transactions.length === 0 && styles.emptyContainer
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      />
    );
  }

  // Agrupar transações por data
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = new Date(transaction.date).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  // Converter para formato de seções e calcular totais
  const sections: TransactionSection[] = Object.entries(groupedTransactions)
    .map(([date, items]) => {
      const totalIncome = items
        .filter(item => item.type === 'income')
        .reduce((sum, item) => sum + item.amount, 0);
      
      const totalExpenses = items
        .filter(item => item.type === 'expense')
        .reduce((sum, item) => sum + item.amount, 0);

      return {
        title: formatDate(date),
        data: items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        totalIncome,
        totalExpenses,
      };
    })
    .sort((a, b) => {
      // Ordenar seções por data (mais recente primeiro)
      const dateA = new Date(a.data[0]?.date).getTime();
      const dateB = new Date(b.data[0]?.date).getTime();
      return dateB - dateA;
    });

  const renderSectionHeader = ({ section }: { section: TransactionSection }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={styles.sectionCount}>
          {section.data.length} {section.data.length === 1 ? 'transação' : 'transações'}
        </Text>
      </View>
      {(section.totalIncome > 0 || section.totalExpenses > 0) && (
        <View style={styles.sectionTotals}>
          {section.totalIncome > 0 && (
            <Text style={styles.sectionIncome}>
              +R$ {section.totalIncome.toFixed(2).replace('.', ',')}
            </Text>
          )}
          {section.totalExpenses > 0 && (
            <Text style={styles.sectionExpense}>
              -R$ {section.totalExpenses.toFixed(2).replace('.', ',')}
            </Text>
          )}
        </View>
      )}
    </View>
  );

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TransactionItem 
          transaction={item}
          onPress={() => onTransactionPress(item)}
          onLongPress={() => onTransactionLongPress?.(item)}
        />
      )}
      renderSectionHeader={renderSectionHeader}
      contentContainerStyle={[
        styles.listContent,
        sections.length === 0 && styles.emptyContainer
      ]}
      ListEmptyComponent={renderEmptyState}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionHeader: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  sectionCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sectionTotals: {
    flexDirection: 'row',
    gap: 16,
  },
  sectionIncome: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  sectionExpense: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});