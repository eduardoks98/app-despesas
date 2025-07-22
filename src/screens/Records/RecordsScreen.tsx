import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  FlatList,
  TextInput,
  Animated
} from 'react-native';
import { Container } from '../../components/common/Container';
import { Card } from '../../components/common/Card';
import { MoneyText } from '../../components/common/MoneyText';
import { FAB } from '../../components/common/FAB';
import { StorageService } from '../../services/storage/StorageService';
import { Installment, Subscription } from '../../types';
import { colors } from '../../styles/colors';
import { Ionicons } from '@expo/vector-icons';
import { LoadingWrapper, useLoadingState } from '../../components/common/LoadingWrapper';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecordsScreenProps {
  navigation: any;
}

type RecordType = 'installments' | 'subscriptions';

interface RecordTypeConfig {
  key: RecordType;
  label: string;
  icon: string;
  color: string;
  description: string;
  addScreen: string;
}

const RECORD_TYPES: RecordTypeConfig[] = [
  {
    key: 'installments',
    label: 'Parcelamentos',
    icon: 'card-outline',
    color: colors.warning,
    description: 'Compras em várias parcelas',
    addScreen: 'AddInstallment'
  },
  {
    key: 'subscriptions',
    label: 'Assinaturas',
    icon: 'repeat',
    color: colors.info,
    description: 'Pagamentos recorrentes mensais',
    addScreen: 'AddSubscription'
  }
];

export const RecordsScreen: React.FC<RecordsScreenProps> = ({ navigation }) => {
  const [selectedType, setSelectedType] = useState<RecordType>('installments');
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [subscriptionFilter, setSubscriptionFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [installmentFilter, setInstallmentFilter] = useState<'all' | 'active' | 'completed'>('all');
  const filterAnimation = useRef(new Animated.Value(0)).current;
  const { loading, error, startLoading, stopLoading, setErrorState } = useLoadingState(true);

  useEffect(() => {
    loadData();
  }, []);

  // Recarregar dados quando a tela receber foco
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async (isRefresh = false) => {
    if (!isRefresh) {
      startLoading();
    } else {
      setRefreshing(true);
    }

    try {
      const [installmentsData, subscriptionsData] = await Promise.all([
        StorageService.getInstallments(),
        StorageService.getSubscriptions()
      ]);

      console.log('RecordsScreen - Dados carregados:', {
        installments: installmentsData.length,
        subscriptions: subscriptionsData.length
      });

      setInstallments(installmentsData);
      setSubscriptions(subscriptionsData);

      if (!isRefresh) {
        stopLoading();
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      if (!isRefresh) {
        setErrorState('Erro ao carregar dados');
      }
    }

    if (isRefresh) {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadData(true);
  };

  const getCurrentData = () => {
    let data: any[] = [];
    
    switch (selectedType) {
      case 'installments':
        data = installments;
        break;
      case 'subscriptions':
        data = subscriptions;
        break;
      default:
        data = [];
    }
    
    // Aplicar filtro de busca
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      data = data.filter(item => {
        switch (selectedType) {
          case 'installments':
            return item.description?.toLowerCase().includes(searchLower) ||
                   item.store?.toLowerCase().includes(searchLower);
          case 'subscriptions':
            return item.name?.toLowerCase().includes(searchLower) ||
                   item.description?.toLowerCase().includes(searchLower);
          default:
            return false;
        }
      });
    }
    
    return data;
  };

  const getCurrentConfig = () => {
    return RECORD_TYPES.find(type => type.key === selectedType)!;
  };


  const renderInstallments = () => {
    const activeInstallments = installments.filter(i => i.status === 'active');
    const completedInstallments = installments.filter(i => i.status === 'completed');
    
    let filteredInstallments = installments;
    if (installmentFilter === 'active') {
      filteredInstallments = activeInstallments;
    } else if (installmentFilter === 'completed') {
      filteredInstallments = completedInstallments;
    }
    
    const totalInstallments = activeInstallments.reduce((sum, i) => sum + i.installmentValue, 0);
    
    return (
      <FlatList
        data={filteredInstallments}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            {filteredInstallments.length > 0 && (
              <View style={styles.installmentStats}>
                <View style={styles.totalHeader}>
                  <Text style={styles.totalLabel}>
                    {activeInstallments.length} ativo{activeInstallments.length !== 1 ? 's' : ''} • {completedInstallments.length} concluído{completedInstallments.length !== 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.totalExpense}>
                    -R$ {totalInstallments.toFixed(2).replace('.', ',')}
                  </Text>
                </View>
              </View>
            )}
          </>
        }
        renderItem={({ item: installment }) => (
          <Card style={styles.installmentCard}>
            <TouchableOpacity
              onPress={() => navigation.navigate('InstallmentDetail', { installmentId: installment.id })}
            >
              <View style={styles.installmentHeader}>
                <Text style={styles.installmentTitle}>{installment.description}</Text>
                <View style={[
                  styles.installmentStatus,
                  installment.status === 'completed' && styles.installmentStatusCompleted
                ]}>
                  <Text style={[
                    styles.installmentStatusText,
                    installment.status === 'completed' && styles.installmentStatusTextCompleted
                  ]}>
                    {installment.status === 'completed' ? 'Concluído' : `${installment.currentInstallment}/${installment.totalInstallments}`}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.installmentStore}>{installment.store}</Text>
              
              <View style={styles.installmentDetails}>
                <View style={styles.installmentValues}>
                  <MoneyText 
                    value={installment.installmentValue} 
                    size="medium"
                    showSign={false}
                    style={styles.installmentValue}
                  />
                  <Text style={styles.installmentTotal}>
                    Total: R$ {installment.totalAmount.toFixed(2).replace('.', ',')}
                  </Text>
                </View>
                <View style={styles.installmentProgressInfo}>
                  <Text style={styles.installmentProgress}>
                    {installment.status === 'completed' ? '100% pago' : `${Math.round((installment.paidInstallments.length / installment.totalInstallments) * 100)}% pago`}
                  </Text>
                  <Text style={styles.installmentRemaining}>
                    {installment.status === 'completed' 
                      ? 'Finalizado' 
                      : `${installment.totalInstallments - installment.paidInstallments.length} parcelas restantes`
                    }
                  </Text>
                </View>
              </View>
              
              {/* Progress Bar */}
              {installment.status !== 'completed' && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${(installment.paidInstallments.length / installment.totalInstallments) * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {installment.paidInstallments.length} de {installment.totalInstallments} parcelas pagas
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="card-outline" size={64} color={colors.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>Nenhum parcelamento</Text>
            <Text style={styles.emptyMessage}>
              Adicione seus parcelamentos para acompanhar as parcelas!
            </Text>
            <TouchableOpacity 
              style={styles.emptyAction}
              onPress={() => navigation.navigate('AddInstallment')}
            >
              <Ionicons name="add" size={20} color={colors.white} />
              <Text style={styles.emptyActionText}>Adicionar Parcelamento</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.listContentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    );
  };

  const renderSubscriptions = () => {
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
    const inactiveSubscriptions = subscriptions.filter(s => s.status !== 'active');
    
    let filteredSubscriptions = subscriptions;
    if (subscriptionFilter === 'active') {
      filteredSubscriptions = activeSubscriptions;
    } else if (subscriptionFilter === 'inactive') {
      filteredSubscriptions = inactiveSubscriptions;
    }
    
    const totalSubscriptions = activeSubscriptions.reduce((sum, s) => sum + s.amount, 0);
    
    return (
      <FlatList
        data={filteredSubscriptions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            {filteredSubscriptions.length > 0 && (
              <View style={styles.subscriptionStats}>
                <View style={styles.totalHeader}>
                  <Text style={styles.totalLabel}>
                    {activeSubscriptions.length} ativa{activeSubscriptions.length !== 1 ? 's' : ''} • {inactiveSubscriptions.length} inativa{inactiveSubscriptions.length !== 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.totalExpense}>
                    -R$ {totalSubscriptions.toFixed(2).replace('.', ',')}
                  </Text>
                </View>
              </View>
            )}
          </>
        }
        renderItem={({ item: subscription }) => (
          <Card style={styles.subscriptionCard}>
            <TouchableOpacity
              onPress={() => navigation.navigate('SubscriptionDetail', { subscriptionId: subscription.id })}
            >
              <View style={styles.subscriptionHeader}>
                <Text style={styles.subscriptionTitle}>{subscription.name}</Text>
                <View style={[
                  styles.subscriptionStatus,
                  subscription.status !== 'active' && styles.subscriptionStatusInactive
                ]}>
                  <Ionicons 
                    name={subscription.status === 'active' ? "checkmark-circle" : "close-circle"} 
                    size={16} 
                    color={subscription.status === 'active' ? colors.success : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.subscriptionStatusText,
                    subscription.status !== 'active' && styles.subscriptionStatusTextInactive
                  ]}>
                    {subscription.status === 'active' ? 'Ativa' : 'Inativa'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.subscriptionDescription}>
                {subscription.description || 'Sem descrição'}
              </Text>
              
              <View style={styles.subscriptionDetails}>
                <MoneyText 
                  value={subscription.amount} 
                  size="medium"
                  showSign={false}
                />
                <Text style={styles.subscriptionBilling}>
                  Dia {subscription.billingDay}
                </Text>
              </View>
            </TouchableOpacity>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="repeat" size={64} color={colors.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>Nenhuma assinatura</Text>
            <Text style={styles.emptyMessage}>
              Adicione suas assinaturas mensais para controlar gastos recorrentes!
            </Text>
            <TouchableOpacity 
              style={styles.emptyAction}
              onPress={() => navigation.navigate('AddSubscription')}
            >
              <Ionicons name="add" size={20} color={colors.white} />
              <Text style={styles.emptyActionText}>Adicionar Assinatura</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.listContentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    );
  };

  const renderContent = () => {
    switch (selectedType) {
      case 'installments':
        return renderInstallments();
      case 'subscriptions':
        return renderSubscriptions();
      default:
        return null;
    }
  };

  const currentConfig = getCurrentConfig();

  return (
    <Container>
      <LoadingWrapper
        loading={loading}
        error={error}
        retry={loadData}
        empty={!loading && !error && getCurrentData().length === 0}
        emptyTitle={`Nenhum ${currentConfig.label.toLowerCase()}`}
        emptyMessage={`Adicione seus ${currentConfig.label.toLowerCase()} para começar!`}
        emptyIcon={currentConfig.icon}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Registros</Text>
              <View style={styles.headerButtons}>
                <TouchableOpacity 
                  style={styles.filterToggleButton}
                  onPress={() => {
                    const toValue = showFilters ? 0 : 1;
                    Animated.timing(filterAnimation, {
                      toValue,
                      duration: 300,
                      useNativeDriver: false,
                    }).start(() => {
                      setShowFilters(!showFilters);
                    });
                  }}
                >
                  <Ionicons 
                    name={showFilters ? "filter" : "filter-outline"} 
                    size={20} 
                    color={colors.primary} 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.exportButton}
                  onPress={() => navigation.navigate('Export')}
                >
                  <Ionicons name="download" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Filtros */}
            {showFilters && (
              <Animated.View style={[
                styles.filtersContainer,
                {
                  opacity: filterAnimation,
                  transform: [{
                    translateY: filterAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  }],
                },
              ]}>
                <Text style={styles.filterLabel}>Selecione o tipo de registro</Text>
                <View style={styles.typeSelector}>
                  {RECORD_TYPES.map(type => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.typeButton,
                        selectedType === type.key && styles.typeButtonActive
                      ]}
                      onPress={() => {
                        setSelectedType(type.key);
                        setSearchText('');
                      }}
                    >
                      <Ionicons 
                        name={type.icon as any} 
                        size={16} 
                        color={selectedType === type.key ? colors.white : type.color} 
                      />
                      <Text style={[
                        styles.typeButtonText,
                        selectedType === type.key && styles.typeButtonTextActive
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* Filtro de Status */}
                <Text style={styles.filterLabel}>
                  {selectedType === 'installments' ? 'Filtrar parcelamentos' : 'Filtrar assinaturas'}
                </Text>
                <View style={styles.statusFilterContainer}>
                  {selectedType === 'installments' ? (
                    <>
                      <TouchableOpacity
                        style={[styles.statusFilterButton, installmentFilter === 'all' && styles.statusFilterButtonActive]}
                        onPress={() => setInstallmentFilter('all')}
                      >
                        <Text style={[styles.statusFilterText, installmentFilter === 'all' && styles.statusFilterTextActive]}>
                          Todos
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.statusFilterButton, installmentFilter === 'active' && styles.statusFilterButtonActive]}
                        onPress={() => setInstallmentFilter('active')}
                      >
                        <Text style={[styles.statusFilterText, installmentFilter === 'active' && styles.statusFilterTextActive]}>
                          Ativos
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.statusFilterButton, installmentFilter === 'completed' && styles.statusFilterButtonActive]}
                        onPress={() => setInstallmentFilter('completed')}
                      >
                        <Text style={[styles.statusFilterText, installmentFilter === 'completed' && styles.statusFilterTextActive]}>
                          Concluídos
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={[styles.statusFilterButton, subscriptionFilter === 'all' && styles.statusFilterButtonActive]}
                        onPress={() => setSubscriptionFilter('all')}
                      >
                        <Text style={[styles.statusFilterText, subscriptionFilter === 'all' && styles.statusFilterTextActive]}>
                          Todas
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.statusFilterButton, subscriptionFilter === 'active' && styles.statusFilterButtonActive]}
                        onPress={() => setSubscriptionFilter('active')}
                      >
                        <Text style={[styles.statusFilterText, subscriptionFilter === 'active' && styles.statusFilterTextActive]}>
                          Ativas
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.statusFilterButton, subscriptionFilter === 'inactive' && styles.statusFilterButtonActive]}
                        onPress={() => setSubscriptionFilter('inactive')}
                      >
                        <Text style={[styles.statusFilterText, subscriptionFilter === 'inactive' && styles.statusFilterTextActive]}>
                          Inativas
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                <Text style={styles.filterLabel}>Buscar registros</Text>
                <View style={styles.searchInputContainer}>
                  <Ionicons name="search" size={18} color={colors.textSecondary} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder={`Buscar ${selectedType === 'installments' ? 'parcelamentos' : 'assinaturas'}...`}
                    placeholderTextColor={colors.textSecondary}
                    value={searchText}
                    onChangeText={setSearchText}
                  />
                  {searchText.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchText('')}>
                      <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>
            )}
          </View>


          {/* Lista de Conteúdo */}
          <View style={styles.contentSection}>
            {renderContent()}
          </View>
        </View>

        {/* FAB para adicionar */}
        <FAB
          icon="add"
          onPress={() => navigation.navigate(currentConfig.addScreen)}
          style={styles.fab}
        />
      </LoadingWrapper>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: colors.white,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary + '20',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterToggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    paddingTop: 12,
    paddingBottom: 8,
    marginTop: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    marginTop: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  typeButtonTextActive: {
    color: colors.white,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  typeButtonDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  typeButtonDescriptionActive: {
    color: colors.white + '90',
  },
  typeButtonTextActive: {
    color: colors.white,
  },
  // Estilos do card de resumo removidos (summaryCard, summaryHeader, etc.)
  contentSection: {
    marginTop: 16,
    flex: 1,
  },
  totalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  totalExpense: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.danger,
  },
  listContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    flexGrow: 1,
  },
  installmentCard: {
    marginBottom: 12,
    marginHorizontal: 0,
  },
  installmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  installmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  installmentStatus: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  installmentStatusText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  installmentStore: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  installmentDetails: {
    marginTop: 12,
  },
  installmentValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  installmentValue: {
    fontWeight: '700',
  },
  installmentTotal: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  installmentProgressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  installmentProgress: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  installmentRemaining: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  installmentStats: {
    marginBottom: 8,
  },
  installmentStatusCompleted: {
    backgroundColor: colors.success + '20',
  },
  installmentStatusTextCompleted: {
    color: colors.success,
  },
  subscriptionCard: {
    marginBottom: 12,
    marginHorizontal: 0,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  subscriptionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subscriptionStatusText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  subscriptionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  subscriptionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionBilling: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  subscriptionStats: {
    marginBottom: 8,
  },
  subscriptionStatusInactive: {
    backgroundColor: colors.background,
  },
  subscriptionStatusTextInactive: {
    color: colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  emptyActionText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  statusFilterContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  statusFilterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  statusFilterButtonActive: {
    backgroundColor: colors.primary,
  },
  statusFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusFilterTextActive: {
    color: colors.white,
  },
}); 