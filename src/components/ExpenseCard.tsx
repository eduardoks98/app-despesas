import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Chip, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency, formatDate, getCategoryIcon, getCategoryColor, getPaymentStatusText, getPaymentStatusColor } from '../utils/formatters';
import { Expense } from '../context/FinanceContext';

interface ExpenseCardProps {
  expense: Expense;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onTogglePaid?: () => void;
  showActions?: boolean;
  showInstallmentInfo?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  canMarkAsPaid?: boolean;
  installmentWarning?: string | undefined;
}

const ExpenseCard: React.FC<ExpenseCardProps> = ({
  expense,
  onPress,
  onEdit,
  onDelete,
  onTogglePaid,
  showActions = true,
  showInstallmentInfo = true,
  variant = 'default',
  canMarkAsPaid = true,
  installmentWarning
}) => {
  const isInstallment = expense.installments && expense.installments > 1;
  const isRecurring = expense.isRecurring;
  
  const renderCompact = () => (
    <Card style={[styles.card, styles.compactCard]} onPress={onPress}>
      <Card.Content style={styles.compactContent}>
        <View style={styles.compactHeader}>
          <Ionicons 
            name={getCategoryIcon(expense.category) as any} 
            size={20} 
            color={getCategoryColor(expense.category)} 
          />
          <View style={styles.compactInfo}>
            <Title style={styles.compactTitle} numberOfLines={1}>
              {expense.title}
            </Title>
            <Paragraph style={styles.compactCategory}>
              {expense.category}
            </Paragraph>
          </View>
          <View style={styles.compactAmount}>
            <Title style={styles.amountText}>
              {formatCurrency(expense.amount)}
            </Title>
            <Chip 
              mode="outlined" 
              style={[styles.statusChip, { borderColor: getPaymentStatusColor(expense.isPaid || false) }]}
              textStyle={{ color: getPaymentStatusColor(expense.isPaid || false) }}
            >
              {getPaymentStatusText(expense.isPaid || false)}
            </Chip>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderDetailed = () => (
    <Card style={[styles.card, styles.detailedCard]} onPress={onPress}>
      <Card.Content>
        <View style={styles.detailedHeader}>
          <View style={styles.categorySection}>
            <Ionicons 
              name={getCategoryIcon(expense.category) as any} 
              size={24} 
              color={getCategoryColor(expense.category)} 
            />
            <View style={styles.categoryInfo}>
              <Title style={styles.title}>{expense.title}</Title>
              <Paragraph style={styles.category}>{expense.category}</Paragraph>
            </View>
          </View>
          <View style={styles.amountSection}>
            <Title style={styles.amountText}>
              {formatCurrency(expense.amount)}
            </Title>
            <Paragraph style={styles.dateText}>
              {formatDate(expense.date)}
            </Paragraph>
          </View>
        </View>

        {expense.description && (
          <Paragraph style={styles.description}>
            {expense.description}
          </Paragraph>
        )}

        <View style={styles.tagsContainer}>
          <Chip 
            mode="outlined" 
            style={[styles.statusChip, { borderColor: getPaymentStatusColor(expense.isPaid || false) }]}
            textStyle={{ color: getPaymentStatusColor(expense.isPaid || false) }}
          >
            {getPaymentStatusText(expense.isPaid || false)}
          </Chip>
          
          {isRecurring && (
            <Chip icon="refresh" style={styles.tag}>
              {expense.recurrenceType === 'monthly' ? 'Mensal' :
               expense.recurrenceType === 'weekly' ? 'Semanal' : 'Anual'}
            </Chip>
          )}
          
          {isInstallment && showInstallmentInfo && (
            <Chip icon="layers" style={styles.tag}>
              {expense.currentInstallment}/{expense.installments}
            </Chip>
          )}
          
          {expense.isFinancing && (
            <Chip icon="card" style={styles.tag}>
              Financiamento
            </Chip>
          )}
        </View>

        {showActions && (
          <View style={styles.actionsContainer}>
            {onTogglePaid && (
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={onTogglePaid}
              >
                <Ionicons 
                  name={expense.isPaid ? "checkmark-circle" : "ellipse-outline"} 
                  size={20} 
                  color={getPaymentStatusColor(expense.isPaid || false)} 
                />
                <Paragraph style={[styles.actionText, { color: getPaymentStatusColor(expense.isPaid || false) }]}>
                  {expense.isPaid ? 'Pago' : 'Marcar como pago'}
                </Paragraph>
              </TouchableOpacity>
            )}
            
            {onEdit && (
              <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
                <Ionicons name="pencil" size={20} color="#2196F3" />
                <Paragraph style={styles.actionText}>Editar</Paragraph>
              </TouchableOpacity>
            )}
            
            {onDelete && (
              <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
                <Ionicons name="trash" size={20} color="#d32f2f" />
                <Paragraph style={[styles.actionText, { color: '#d32f2f' }]}>
                  Excluir
                </Paragraph>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderDefault = () => (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.info}>
            <Ionicons 
              name={getCategoryIcon(expense.category) as any} 
              size={24} 
              color={getCategoryColor(expense.category)} 
            />
            <View style={styles.details}>
              <Title style={styles.title}>{expense.title}</Title>
              <Paragraph style={styles.category}>
                {expense.category}
              </Paragraph>
              <View style={styles.tags}>
                <Chip 
                  mode="outlined" 
                  style={[styles.statusChip, { borderColor: getPaymentStatusColor(expense.isPaid || false) }]}
                  textStyle={{ color: getPaymentStatusColor(expense.isPaid || false) }}
                >
                  {getPaymentStatusText(expense.isPaid || false)}
                </Chip>
                {isRecurring && (
                  <Chip icon="refresh" style={styles.tag}>
                    {expense.recurrenceType === 'monthly' ? 'Mensal' :
                     expense.recurrenceType === 'weekly' ? 'Semanal' : 'Anual'}
                  </Chip>
                )}
                {isInstallment && showInstallmentInfo && (
                  <Chip icon="layers" style={styles.tag}>
                    {expense.currentInstallment}/{expense.installments}
                  </Chip>
                )}
              </View>
            </View>
          </View>
          <View style={styles.amount}>
            <Title style={styles.amountText}>
              {formatCurrency(expense.amount)}
            </Title>
            <Paragraph style={styles.dateText}>
              {formatDate(expense.date)}
            </Paragraph>
          </View>
        </View>

        {showActions && (
          <View style={styles.actions}>
            {onTogglePaid && (
              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  !canMarkAsPaid && styles.disabledActionButton
                ]} 
                onPress={canMarkAsPaid ? onTogglePaid : undefined}
                disabled={!canMarkAsPaid}
              >
                <Ionicons 
                  name={expense.isPaid ? "checkmark-circle" : "ellipse-outline"} 
                  size={20} 
                  color={canMarkAsPaid ? getPaymentStatusColor(expense.isPaid || false) : '#ccc'} 
                />
                <Paragraph style={[
                  styles.actionText, 
                  { 
                    color: canMarkAsPaid ? getPaymentStatusColor(expense.isPaid || false) : '#ccc' 
                  }
                ]}>
                  {expense.isPaid ? 'Pago' : 'Pagar'}
                </Paragraph>
              </TouchableOpacity>
            )}
            
            {installmentWarning && !canMarkAsPaid && (
              <View style={styles.warningContainer}>
                <Ionicons name="warning" size={16} color="#FF9800" />
                <Paragraph style={styles.warningText}>{installmentWarning}</Paragraph>
              </View>
            )}
            
            {onEdit && (
              <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
                <Ionicons name="pencil" size={20} color="#2196F3" />
                <Paragraph style={styles.actionText}>Editar</Paragraph>
              </TouchableOpacity>
            )}
            
            {onDelete && (
              <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
                <Ionicons name="trash" size={20} color="#d32f2f" />
                <Paragraph style={[styles.actionText, { color: '#d32f2f' }]}>
                  Excluir
                </Paragraph>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );

  switch (variant) {
    case 'compact':
      return renderCompact();
    case 'detailed':
      return renderDetailed();
    default:
      return renderDefault();
  }
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    marginHorizontal: 16,
    elevation: 2,
  },
  compactCard: {
    marginVertical: 2,
  },
  detailedCard: {
    marginVertical: 8,
  },
  compactContent: {
    paddingVertical: 8,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  compactTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  compactCategory: {
    fontSize: 11,
    color: '#666',
  },
  compactAmount: {
    alignItems: 'flex-end',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  info: {
    flexDirection: 'row',
    flex: 1,
  },
  categorySection: {
    flexDirection: 'row',
    flex: 1,
  },
  details: {
    marginLeft: 12,
    flex: 1,
  },
  categoryInfo: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 16,
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  amount: {
    alignItems: 'flex-end',
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    marginRight: 8,
    marginBottom: 4,
  },
  statusChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 12,
  },
  disabledActionButton: {
    opacity: 0.6,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
  },
  warningText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#FF9800',
  },
});

export default ExpenseCard; 