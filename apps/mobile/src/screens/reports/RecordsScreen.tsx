import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ScrollView
} from 'react-native';
import { Container } from '../../components/common/Container';
import { Card } from '../../components/common/Card';
import { CardHeader } from '../../components/common/CardHeader';
import { TabSelector } from '../../components/common/TabSelector';
import { MoneyText } from '../../components/common/MoneyText';
import { FAB } from '../../components/common/FAB';
import { StorageService } from '../services/core';
import { Installment, Subscription } from '../../types';
import { colors } from '../../styles/colors';
import { Ionicons } from '@expo/vector-icons';
import { LoadingWrapper, useLoadingState } from '../../components/common/LoadingWrapper';
import { useRefresh } from '../../hooks/useRefresh';
import { HapticService } from '../services/platform';
import { SPACING, FONT_SIZES } from '../../styles/responsive';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecordsScreenProps {
  navigation: any;
  route?: any;
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

export const RecordsScreen: React.FC<RecordsScreenProps> = ({ navigation, route }) => {
  // Obter parâmetros da navegação
  const params = route?.params as { selectedType?: RecordType; showFilters?: boolean } | undefined;
  
  const [selectedType, setSelectedType] = useState<RecordType>(params?.selectedType || 'installments');
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [searchText, setSearchText] = useState('');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [subscriptionFilter, setSubscriptionFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [installmentFilter, setInstallmentFilter] = useState<'all' | 'active' | 'completed'>('all');
  const { loading, error, startLoading, stopLoading, setErrorState } = useLoadingState(true);
  const { refreshing, onRefresh } = useRefresh({ onRefresh: () => loadData(true) });

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    loadData();
    return unsubscribe;
  }, [navigation]);

  const loadData = async (isRefresh = false) => {
    if (!isRefresh) {
      startLoading();
    }

    try {
      const [installmentsData, subscriptionsData] = await Promise.all([
        StorageService.getInstallments(),
        StorageService.getSubscriptions()
      ]);

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
  };

  const getFilteredData = () => {
    let data: any[] = [];
    
    switch (selectedType) {
      case 'installments':
        data = installments;
        // Aplicar filtro de status
        if (installmentFilter === 'active') {
          data = data.filter(i => i.status === 'active');
        } else if (installmentFilter === 'completed') {
          data = data.filter(i => i.status === 'completed');
        }
        break;
      case 'subscriptions':
        data = subscriptions;
        // Aplicar filtro de status
        if (subscriptionFilter === 'active') {
          data = data.filter(s => s.status === 'active');
        } else if (subscriptionFilter === 'inactive') {
          data = data.filter(s => s.status !== 'active');
        }
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

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchText.length > 0) count++;
    if (selectedType === 'installments' && installmentFilter !== 'all') count++;
    if (selectedType === 'subscriptions' && subscriptionFilter !== 'all') count++;
    return count;
  };

  const clearFilters = async () => {
    await HapticService.buttonPress();
    setSearchText('');
    setInstallmentFilter('all');
    setSubscriptionFilter('all');
  };


  const renderInstallmentCard = (installment: Installment, index: number, data: Installment[]) => (
    <TouchableOpacity 
      key={installment.id} 
      style={[
        styles.timelineItemCompact,
        index !== data.length - 1 && styles.timelineItemBorder
      ]}
      onPress={() => navigation.navigate('InstallmentDetail', { installmentId: installment.id })}
    >
      <View style={[
        styles.timelineIcon,
        { backgroundColor: colors.warning + '20' }
      ]}>
        <Ionicons name="card" size={16} color={colors.warning} />
      </View>
      
      <View style={styles.timelineContent}>
        <Text style={styles.timelineTitle}>{installment.description}</Text>
        <Text style={styles.timelineDate}>
          {installment.store} • {installment.paidInstallments.length}/{installment.totalInstallments} parcelas
        </Text>
        {installment.status === 'completed' && (
          <Text style={[styles.timelineCategory, { color: colors.success }]}>✓ Concluído</Text>
        )}
      </View>
      
      <MoneyText 
        value={-installment.installmentValue} 
        size="small" 
        style={[styles.timelineAmount, { color: colors.warning }]}
      />
    </TouchableOpacity>
  );

  const renderInstallments = () => {
    const filteredData = getFilteredData();
    const activeInstallments = filteredData.filter(i => i.status === 'active');
    const completedInstallments = filteredData.filter(i => i.status === 'completed');
    const totalInstallments = installments.filter(i => i.status === 'active').reduce((sum, i) => sum + i.installmentValue, 0);
    
    return (
      <>
        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Ativos</Text>
            <Text style={styles.summaryValue}>{installments.filter(i => i.status === 'active').length}</Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Mensal</Text>
            <MoneyText 
              value={totalInstallments} 
              size="small" 
              showSign={false}
              style={styles.summaryAmount}
            />
          </Card>
        </View>

        {/* Lista de Parcelamentos */}
        <View>
          {activeInstallments.length > 0 && (
            <View style={styles.sectionGroup}>
              <View style={styles.cardContainer}>
                <CardHeader 
                  title="Em Andamento" 
                  subtitle={`${activeInstallments.length} parcelamentos`}
                  icon="play-circle"
                />
                <View style={styles.cardBody}>
                  {activeInstallments.map((item, index) => renderInstallmentCard(item, index, activeInstallments))}
                </View>
              </View>
            </View>
          )}
          
          {completedInstallments.length > 0 && (
            <View style={styles.sectionGroup}>
              <View style={styles.cardContainer}>
                <CardHeader 
                  title="Concluídos" 
                  subtitle={`${completedInstallments.length} parcelamentos`}
                  icon="checkmark-circle"
                />
                <View style={styles.cardBody}>
                  {completedInstallments.map((item, index) => renderInstallmentCard(item, index, completedInstallments))}
                </View>
              </View>
            </View>
          )}
        </View>
      </>
    );
  };

  const renderSubscriptionCard = (subscription: Subscription, index: number, data: Subscription[]) => (
    <TouchableOpacity 
      key={subscription.id}
      style={[
        styles.timelineItemCompact,
        index !== data.length - 1 && styles.timelineItemBorder
      ]}
      onPress={() => navigation.navigate('SubscriptionDetail', { subscriptionId: subscription.id })}
    >
      <View style={[
        styles.timelineIcon,
        { backgroundColor: subscription.status === 'active' ? colors.info + '20' : colors.textSecondary + '20' }
      ]}>
        <Ionicons name="repeat" size={16} color={subscription.status === 'active' ? colors.info : colors.textSecondary} />
      </View>
      
      <View style={styles.timelineContent}>
        <Text style={styles.timelineTitle}>{subscription.name}</Text>
        <Text style={styles.timelineDate}>
          Dia {subscription.billingDay} • {subscription.status === 'active' ? 'Ativa' : 'Inativa'}
        </Text>
        {subscription.category && (
          <Text style={styles.timelineCategory}>{subscription.category}</Text>
        )}
      </View>
      
      <MoneyText 
        value={-subscription.amount} 
        size="small" 
        style={[styles.timelineAmount, { color: subscription.status === 'active' ? colors.info : colors.textSecondary }]}
      />
    </TouchableOpacity>
  );

  const renderSubscriptions = () => {
    const filteredData = getFilteredData();
    const activeSubscriptions = filteredData.filter(s => s.status === 'active');
    const inactiveSubscriptions = filteredData.filter(s => s.status !== 'active');
    const totalSubscriptions = subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + s.amount, 0);
    
    return (
      <>
        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Ativas</Text>
            <Text style={styles.summaryValue}>{subscriptions.filter(s => s.status === 'active').length}</Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Mensal</Text>
            <MoneyText 
              value={totalSubscriptions} 
              size="small" 
              showSign={false}
              style={styles.summaryAmount}
            />
          </Card>
        </View>

        {/* Lista de Assinaturas */}
        <View>
          {activeSubscriptions.length > 0 && (
            <View style={styles.sectionGroup}>
              <View style={styles.cardContainer}>
                <CardHeader 
                  title="Ativas" 
                  subtitle={`${activeSubscriptions.length} assinaturas`}
                  icon="checkmark-circle"
                />
                <View style={styles.cardBody}>
                  {activeSubscriptions.map((item, index) => renderSubscriptionCard(item, index, activeSubscriptions))}
                </View>
              </View>
            </View>
          )}
          
          {inactiveSubscriptions.length > 0 && (
            <View style={styles.sectionGroup}>
              <View style={styles.cardContainer}>
                <CardHeader 
                  title="Inativas" 
                  subtitle={`${inactiveSubscriptions.length} assinaturas`}
                  icon="pause-circle"
                />
                <View style={styles.cardBody}>
                  {inactiveSubscriptions.map((item, index) => renderSubscriptionCard(item, index, inactiveSubscriptions))}
                </View>
              </View>
            </View>
          )}
        </View>
      </>
    );
  };

  const renderContent = () => {
    const filteredData = getFilteredData();
    
    if (filteredData.length === 0) {
      const config = getCurrentConfig();
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name={config.icon as any} size={64} color={colors.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>Nenhum {config.label.toLowerCase()}</Text>
          <Text style={styles.emptyMessage}>
            {config.description}
          </Text>
          <TouchableOpacity 
            style={styles.emptyAction}
            onPress={() => navigation.navigate(config.addScreen)}
          >
            <Ionicons name="add" size={20} color={colors.white} />
            <Text style={styles.emptyActionText}>Adicionar {config.label.slice(0, -1)}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    switch (selectedType) {
      case 'installments':
        return renderInstallments();
      case 'subscriptions':
        return renderSubscriptions();
      default:
        return null;
    }
  };

  return (
    <Container>
      <LoadingWrapper
        loading={loading}
        error={error}
        retry={loadData}
        empty={!loading && !error && installments.length === 0 && subscriptions.length === 0}
        emptyTitle="Nenhum registro encontrado"
        emptyMessage="Adicione seus parcelamentos e assinaturas para começar!"
        emptyIcon="folder-outline"
      >
        <FlatList
          data={[{ key: 'content' }]}
          renderItem={() => (
            <>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTop}>
                  <View style={styles.headerTitleContainer}>
                    <Text style={styles.title}>Registros</Text>
                    <Text style={styles.subtitle}>
                      {selectedType === 'installments' ? 'Parcelamentos' : 'Assinaturas'}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.filterButton}
                    onPress={async () => {
                      await HapticService.buttonPress();
                      setShowFiltersModal(true);
                    }}
                  >
                    <Ionicons 
                      name="options" 
                      size={20} 
                      color={colors.white} 
                    />
                    {getActiveFiltersCount() > 0 && (
                      <View style={styles.filterBadge}>
                        <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Type Selector */}
              <TabSelector
                options={RECORD_TYPES.map(type => ({
                  key: type.key,
                  label: type.label,
                  icon: type.icon,
                  color: type.color
                }))}
                selectedValue={selectedType}
                onValueChange={async (value) => {
                  await HapticService.buttonPress();
                  setSelectedType(value as RecordType);
                }}
              />

              {/* Content */}
              <View style={styles.section}>
                {renderContent()}
              </View>
            </>
          )}
          keyExtractor={(item) => item.key}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />

        {/* FAB */}
        <FAB
          icon="add"
          onPress={() => navigation.navigate(getCurrentConfig().addScreen)}
        />

        {/* Modal de Filtros */}
        <Modal
          visible={showFiltersModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowFiltersModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filtros e Busca</Text>
                <TouchableOpacity 
                  onPress={() => setShowFiltersModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Busca */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Buscar:</Text>
                  <View style={styles.searchInputContainer}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder={`${selectedType === 'installments' ? 'Parcelamentos' : 'Assinaturas'}...`}
                      placeholderTextColor={colors.textSecondary}
                      value={searchText}
                      onChangeText={setSearchText}
                    />
                    {searchText.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchText('')}>
                        <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Filtro de Status */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>
                    {selectedType === 'installments' ? 'Status dos Parcelamentos:' : 'Status das Assinaturas:'}
                  </Text>
                  <View style={styles.filterButtons}>
                    {selectedType === 'installments' ? (
                      <>
                        <TouchableOpacity 
                          style={[styles.statusButton, installmentFilter === 'all' && styles.statusButtonActive]}
                          onPress={() => setInstallmentFilter('all')}
                        >
                          <Text style={[styles.statusButtonText, installmentFilter === 'all' && styles.statusButtonTextActive]}>
                            Todos
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.statusButton, installmentFilter === 'active' && styles.statusButtonActive]}
                          onPress={() => setInstallmentFilter('active')}
                        >
                          <Text style={[styles.statusButtonText, installmentFilter === 'active' && styles.statusButtonTextActive]}>
                            Ativos
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.statusButton, installmentFilter === 'completed' && styles.statusButtonActive]}
                          onPress={() => setInstallmentFilter('completed')}
                        >
                          <Text style={[styles.statusButtonText, installmentFilter === 'completed' && styles.statusButtonTextActive]}>
                            Concluídos
                          </Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <TouchableOpacity 
                          style={[styles.statusButton, subscriptionFilter === 'all' && styles.statusButtonActive]}
                          onPress={() => setSubscriptionFilter('all')}
                        >
                          <Text style={[styles.statusButtonText, subscriptionFilter === 'all' && styles.statusButtonTextActive]}>
                            Todas
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.statusButton, subscriptionFilter === 'active' && styles.statusButtonActive]}
                          onPress={() => setSubscriptionFilter('active')}
                        >
                          <Text style={[styles.statusButtonText, subscriptionFilter === 'active' && styles.statusButtonTextActive]}>
                            Ativas
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.statusButton, subscriptionFilter === 'inactive' && styles.statusButtonActive]}
                          onPress={() => setSubscriptionFilter('inactive')}
                        >
                          <Text style={[styles.statusButtonText, subscriptionFilter === 'inactive' && styles.statusButtonTextActive]}>
                            Inativas
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.clearFiltersButton}
                  onPress={clearFilters}
                >
                  <Text style={styles.clearFiltersText}>Limpar Filtros</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.applyFiltersButton}
                  onPress={() => setShowFiltersModal(false)}
                >
                  <Text style={styles.applyFiltersText}>Aplicar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </LoadingWrapper>
    </Container>
  );
};

const styles = StyleSheet.create({
  flatListContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: colors.primary,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitleContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.danger,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: 'bold',
  },
  summaryCards: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.xs,
    color: colors.textSecondary,
    marginBottom: SPACING.xs / 2,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  summaryAmount: {
    color: colors.primary,
    textAlign: 'center',
    flexShrink: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
    flexWrap: 'wrap',
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: SPACING.md,
  },
  cardContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardBody: {
    backgroundColor: colors.white,
    padding: 0,
  },
  timelineContainer: {
    backgroundColor: colors.white,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineItemCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  timelineItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 1,
  },
  timelineDate: {
    fontSize: FONT_SIZES.xs,
    color: colors.textSecondary,
    marginBottom: 1,
  },
  timelineCategory: {
    fontSize: FONT_SIZES.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  timelineAmount: {
    fontWeight: '700',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
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
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    minWidth: '30%',
  },
  statusButtonActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  statusButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statusButtonTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  applyFiltersButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
  },
  applyFiltersText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
  },
  sectionGroup: {
    marginBottom: 12,
  },
  sectionGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
  },
  sectionGroupTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: colors.text,
  },
  sectionGroupCount: {
    fontSize: FONT_SIZES.sm,
    color: colors.textSecondary,
  },
}); 

export default RecordsScreen;