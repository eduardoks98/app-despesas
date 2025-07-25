import React from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { Transaction } from '@app-despesas/core';

interface TransactionItemProps {
  transaction: Transaction;
  categoryName: string;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, categoryName }) => {
  const isIncome = transaction.type === 'income';
  
  return (
    <View style={styles.transactionItem}>
      <View style={styles.transactionInfo}>
        <Text style={styles.description}>{transaction.description}</Text>
        <Text style={styles.category}>{categoryName}</Text>
        <Text style={styles.date}>
          {transaction.date.toLocaleDateString('pt-BR')}
        </Text>
      </View>
      <Text style={[
        styles.amount,
        { color: isIncome ? '#4CAF50' : '#F44336' }
      ]}>
        {isIncome ? '+' : '-'} R$ {transaction.amount.toFixed(2)}
      </Text>
    </View>
  );
};

export const TransactionListScreen: React.FC = () => {
  const { 
    transactions, 
    totalIncome, 
    totalExpense, 
    balance, 
    loading, 
    error, 
    refresh 
  } = useTransactions();
  
  const { categories } = useCategories();

  const getCategoryName = (categoryId: string): string => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Categoria Desconhecida';
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TransactionItem 
      transaction={item} 
      categoryName={getCategoryName(item.categoryId)}
    />
  );

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Erro: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Summary Header */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Receitas</Text>
          <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
            R$ {totalIncome.toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Despesas</Text>
          <Text style={[styles.summaryValue, { color: '#F44336' }]}>
            R$ {totalExpense.toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Saldo</Text>
          <Text style={[
            styles.summaryValue, 
            { color: balance >= 0 ? '#4CAF50' : '#F44336' }
          ]}>
            R$ {balance.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Transaction List */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: '#F44336',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
  summary: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  transactionItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  transactionInfo: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    alignSelf: 'center',
  },
});

export default TransactionListScreen;