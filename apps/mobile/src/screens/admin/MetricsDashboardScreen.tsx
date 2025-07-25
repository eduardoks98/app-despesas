import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
  Share,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  List,
  Surface,
  ProgressBar,
  IconButton,
  Badge,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnalyticsService } from '../../services/core/AnalyticsService';
import { AlertingService, Alert, AlertSeverity } from '../../services/core/AlertingService';
import { AdvancedSyncService } from '../../services/core/AdvancedSyncService';
import { NetworkRetryService } from '../../services/core/NetworkRetryService';

interface MetricsDashboardProps {
  navigation: any;
}

export const MetricsDashboardScreen: React.FC<MetricsDashboardProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [syncMetrics, setSyncMetrics] = useState<any>(null);
  const [networkStats, setNetworkStats] = useState<any>(null);

  const analyticsService = AnalyticsService.getInstance();
  const alertingService = AlertingService.getInstance();
  const syncService = AdvancedSyncService.getInstance();
  const networkService = NetworkRetryService.getInstance();

  const loadMetrics = useCallback(async () => {
    try {
      // Load analytics summary
      const analyticsSummary = analyticsService.getAnalyticsSummary();
      setAnalytics(analyticsSummary);

      // Load active alerts
      const activeAlerts = alertingService.getActiveAlerts();
      setAlerts(activeAlerts);

      // Load sync metrics
      const syncData = syncService.getMetrics();
      setSyncMetrics(syncData);

      // Load network stats
      const networkData = networkService.getStats();
      setNetworkStats(networkData);

    } catch (error) {
      Alert.alert('Erro', 'Falha ao carregar métricas');
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMetrics();
    setRefreshing(false);
  }, [loadMetrics]);

  useEffect(() => {
    loadMetrics();

    // Setup alert listener
    const unsubscribe = alertingService.addListener((alert) => {
      setAlerts(prev => [alert, ...prev]);
    });

    return unsubscribe;
  }, [loadMetrics]);

  const handleExportData = async () => {
    try {
      const data = await analyticsService.exportAnalyticsData();
      const alertData = alertingService.exportAlerts();
      
      const fullExport = {
        timestamp: new Date().toISOString(),
        analytics: JSON.parse(data),
        alerts: JSON.parse(alertData),
        sync: syncMetrics,
        network: networkStats
      };

      await Share.share({
        message: 'Dados de métricas do App Despesas',
        title: 'Export de Métricas',
        url: `data:application/json;base64,${btoa(JSON.stringify(fullExport, null, 2))}`
      });
    } catch (error) {
      Alert.alert('Erro', 'Falha ao exportar dados');
    }
  };

  const getSeverityColor = (severity: AlertSeverity): string => {
    switch (severity) {
      case 'critical': return '#D32F2F';
      case 'high': return '#F57C00';
      case 'medium': return '#FBC02D';
      case 'low': return '#388E3C';
      default: return '#757575';
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Title style={styles.title}>Dashboard de Métricas</Title>
          <IconButton
            icon="download"
            onPress={handleExportData}
            iconColor="#8B5CF6"
          />
        </View>

        {/* Active Alerts */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title style={styles.cardTitle}>Alertas Ativos</Title>
              <Badge
                visible={alerts.length > 0}
                style={[styles.badge, { backgroundColor: getSeverityColor('high') }]}
              >
                {alerts.length}
              </Badge>
            </View>
            
            {alerts.length === 0 ? (
              <Paragraph style={styles.noData}>Nenhum alerta ativo</Paragraph>
            ) : (
              alerts.slice(0, 5).map((alert) => (
                <Surface key={alert.id} style={styles.alertItem}>
                  <View style={styles.alertHeader}>
                    <Chip
                      mode="outlined"
                      style={{ borderColor: getSeverityColor(alert.severity) }}
                      textStyle={{ color: getSeverityColor(alert.severity) }}
                    >
                      {alert.severity.toUpperCase()}
                    </Chip>
                    <Paragraph style={styles.alertTime}>
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </Paragraph>
                  </View>
                  <Paragraph style={styles.alertTitle}>{alert.title}</Paragraph>
                  <Paragraph style={styles.alertMessage}>{alert.message}</Paragraph>
                </Surface>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Session Analytics */}
        {analytics && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Analytics da Sessão</Title>
              
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Paragraph style={styles.metricLabel}>Duração</Paragraph>
                  <Title style={styles.metricValue}>
                    {formatDuration(analytics.session.duration)}
                  </Title>
                </View>
                
                <View style={styles.metricItem}>
                  <Paragraph style={styles.metricLabel}>Eventos</Paragraph>
                  <Title style={styles.metricValue}>
                    {analytics.session.eventsTracked}
                  </Title>
                </View>
                
                <View style={styles.metricItem}>
                  <Paragraph style={styles.metricLabel}>Erros</Paragraph>
                  <Title style={[styles.metricValue, { color: '#D32F2F' }]}>
                    {analytics.userBehavior.errorEncounters}
                  </Title>
                </View>
                
                <View style={styles.metricItem}>
                  <Paragraph style={styles.metricLabel}>Telas Vistas</Paragraph>
                  <Title style={styles.metricValue}>
                    {Object.keys(analytics.userBehavior.screenViews).length}
                  </Title>
                </View>
              </View>

              {/* Screen Views */}
              <Title style={styles.subTitle}>Telas Mais Acessadas</Title>
              {Object.entries(analytics.userBehavior.screenViews)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 5)
                .map(([screen, count]) => (
                  <View key={screen} style={styles.progressItem}>
                    <View style={styles.progressLabel}>
                      <Paragraph>{screen}</Paragraph>
                      <Paragraph style={styles.progressValue}>{count}</Paragraph>
                    </View>
                    <ProgressBar 
                      progress={(count as number) / Math.max(...Object.values(analytics.userBehavior.screenViews))}
                      color="#8B5CF6"
                      style={styles.progressBar}
                    />
                  </View>
                ))}
            </Card.Content>
          </Card>
        )}

        {/* Performance Metrics */}
        {analytics?.performance && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Performance</Title>
              
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Paragraph style={styles.metricLabel}>App Start</Paragraph>
                  <Title style={styles.metricValue}>
                    {analytics.performance.appStartTime}ms
                  </Title>
                </View>
                
                <View style={styles.metricItem}>
                  <Paragraph style={styles.metricLabel}>Sync Médio</Paragraph>
                  <Title style={styles.metricValue}>
                    {formatDuration(analytics.performance.syncPerformance.averageTime)}
                  </Title>
                </View>
                
                <View style={styles.metricItem}>
                  <Paragraph style={styles.metricLabel}>Taxa Sucesso</Paragraph>
                  <Title style={styles.metricValue}>
                    {(analytics.performance.syncPerformance.successRate * 100).toFixed(1)}%
                  </Title>
                </View>
                
                <View style={styles.metricItem}>
                  <Paragraph style={styles.metricLabel}>Dados Sync</Paragraph>
                  <Title style={styles.metricValue}>
                    {formatBytes(analytics.performance.syncPerformance.dataTransferred)}
                  </Title>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Sync Metrics */}
        {syncMetrics && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Métricas de Sincronização</Title>
              
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Paragraph style={styles.metricLabel}>Total Syncs</Paragraph>
                  <Title style={styles.metricValue}>{syncMetrics.totalSyncs}</Title>
                </View>
                
                <View style={styles.metricItem}>
                  <Paragraph style={styles.metricLabel}>Sucessos</Paragraph>
                  <Title style={[styles.metricValue, { color: '#388E3C' }]}>
                    {syncMetrics.successfulSyncs}
                  </Title>
                </View>
                
                <View style={styles.metricItem}>
                  <Paragraph style={styles.metricLabel}>Falhas</Paragraph>
                  <Title style={[styles.metricValue, { color: '#D32F2F' }]}>
                    {syncMetrics.failedSyncs}
                  </Title>
                </View>
                
                <View style={styles.metricItem}>
                  <Paragraph style={styles.metricLabel}>Conflitos</Paragraph>
                  <Title style={[styles.metricValue, { color: '#F57C00' }]}>
                    {syncMetrics.totalConflictsResolved}
                  </Title>
                </View>
              </View>

              <View style={styles.progressItem}>
                <View style={styles.progressLabel}>
                  <Paragraph>Taxa de Sucesso</Paragraph>
                  <Paragraph style={styles.progressValue}>
                    {syncMetrics.totalSyncs > 0 
                      ? ((syncMetrics.successfulSyncs / syncMetrics.totalSyncs) * 100).toFixed(1)
                      : 0}%
                  </Paragraph>
                </View>
                <ProgressBar 
                  progress={syncMetrics.totalSyncs > 0 ? syncMetrics.successfulSyncs / syncMetrics.totalSyncs : 0}
                  color="#388E3C"
                  style={styles.progressBar}
                />
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Network Stats */}
        {networkStats && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Estatísticas de Rede</Title>
              
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Paragraph style={styles.metricLabel}>Circuit Breakers</Paragraph>
                  <Title style={styles.metricValue}>
                    {networkStats.activeCircuitBreakers}
                  </Title>
                </View>
                
                <View style={styles.metricItem}>
                  <Paragraph style={styles.metricLabel}>Total Falhas</Paragraph>
                  <Title style={styles.metricValue}>
                    {networkStats.totalFailures}
                  </Title>
                </View>
              </View>

              {networkStats.circuitBreakerKeys.length > 0 && (
                <>
                  <Title style={styles.subTitle}>Circuit Breakers Ativos</Title>
                  {networkStats.circuitBreakerKeys.map((key: string) => (
                    <Chip key={key} mode="outlined" style={styles.chip}>
                      {key}
                    </Chip>
                  ))}
                </>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Ações</Title>
            
            <View style={styles.actionsGrid}>
              <Button 
                mode="outlined" 
                onPress={() => alertingService.clearAllAlerts()}
                style={styles.actionButton}
              >
                Limpar Alertas
              </Button>
              
              <Button 
                mode="outlined" 
                onPress={() => analyticsService.clearAnalyticsData()}
                style={styles.actionButton}
              >
                Reset Analytics
              </Button>
              
              <Button 
                mode="outlined" 
                onPress={() => syncService.resetMetrics()}
                style={styles.actionButton}
              >
                Reset Sync
              </Button>
              
              <Button 
                mode="outlined" 
                onPress={() => networkService.reset()}
                style={styles.actionButton}
              >
                Reset Network
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    margin: 16,
    marginTop: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#D32F2F',
  },
  noData: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 16,
  },
  alertItem: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTime: {
    fontSize: 12,
    color: '#666',
  },
  alertTitle: {
    fontWeight: '500',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#666',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    marginBottom: 16,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  progressItem: {
    marginBottom: 12,
  },
  progressLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 12,
    color: '#666',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    marginBottom: 8,
  },
});