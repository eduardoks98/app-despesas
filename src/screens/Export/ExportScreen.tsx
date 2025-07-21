import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert
} from 'react-native';
import { Container } from '../../components/common/Container';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ExportService, ExportOptions } from '../../services/export/ExportService';
import { ErrorHandler } from '../../services/error/ErrorHandler';
import { HapticService } from '../../services/haptic/HapticService';
import { useColors } from '../../hooks/useColors';
import { Ionicons } from '@expo/vector-icons';

interface ExportScreenProps {
  navigation: any;
}

type ExportFormat = 'csv' | 'pdf' | 'json';

export const ExportScreen: React.FC<ExportScreenProps> = ({ navigation }) => {
  const colors = useColors();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [isLoading, setIsLoading] = useState(false);
  
  const [options, setOptions] = useState({
    includeTransactions: true,
    includeInstallments: true,
    includeReports: true,
    useDateRange: false,
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
    endDate: new Date() // Today
  });

  const formats = [
    {
      id: 'pdf' as ExportFormat,
      title: 'PDF',
      subtitle: 'Relatório formatado e profissional',
      icon: 'document-text',
      recommended: true
    },
    {
      id: 'csv' as ExportFormat,
      title: 'CSV',
      subtitle: 'Dados estruturados para Excel/Planilhas',
      icon: 'grid',
      recommended: false
    },
    {
      id: 'json' as ExportFormat,
      title: 'JSON',
      subtitle: 'Backup completo dos dados',
      icon: 'code',
      recommended: false
    }
  ];

  const handleExport = async () => {
    await HapticService.buttonPress();
    setIsLoading(true);

    const exportOptions: ExportOptions = {
      format: selectedFormat,
      includeTransactions: options.includeTransactions,
      includeInstallments: options.includeInstallments,
      includeReports: options.includeReports,
      ...(options.useDateRange && {
        dateRange: {
          start: options.startDate,
          end: options.endDate
        }
      })
    };

    const result = await ErrorHandler.withErrorHandling(
      `exportar dados em formato ${selectedFormat.toUpperCase()}`,
      async () => {
        return await ExportService.exportData(exportOptions);
      }
    );

    setIsLoading(false);

    if (result) {
      await HapticService.success();
      Alert.alert(
        'Exportação Concluída',
        `Seus dados foram exportados com sucesso em formato ${selectedFormat.toUpperCase()}!`
      );
    } else {
      await HapticService.error();
    }
  };

  const handleFormatSelect = async (format: ExportFormat) => {
    await HapticService.selection();
    setSelectedFormat(format);
  };

  const handleToggle = async (key: string, value: boolean) => {
    await HapticService.toggle();
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const styles = createStyles(colors);

  return (
    <Container>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={async () => {
              await HapticService.buttonPress();
              navigation.goBack();
            }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Exportar Dados</Text>
        </View>

        {/* Format Selection */}
        <Card>
          <Text style={styles.sectionTitle}>Formato de Exportação</Text>
          
          {formats.map(format => (
            <TouchableOpacity
              key={format.id}
              style={[
                styles.formatItem,
                selectedFormat === format.id && styles.formatItemSelected
              ]}
              onPress={() => handleFormatSelect(format.id)}
            >
              <View style={styles.formatIcon}>
                <Ionicons 
                  name={format.icon as any} 
                  size={24} 
                  color={selectedFormat === format.id ? colors.primary : colors.textSecondary} 
                />
              </View>
              
              <View style={styles.formatInfo}>
                <View style={styles.formatHeader}>
                  <Text style={[
                    styles.formatTitle,
                    selectedFormat === format.id && styles.formatTitleSelected
                  ]}>
                    {format.title}
                  </Text>
                  {format.recommended && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>Recomendado</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.formatSubtitle}>{format.subtitle}</Text>
              </View>
              
              <View style={[
                styles.radioButton,
                selectedFormat === format.id && styles.radioButtonSelected
              ]}>
                {selectedFormat === format.id && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Export Options */}
        <Card>
          <Text style={styles.sectionTitle}>Opções de Exportação</Text>
          
          <View style={styles.optionItem}>
            <View style={styles.optionInfo}>
              <Ionicons name="list" size={20} color={colors.textSecondary} />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Incluir Transações</Text>
                <Text style={styles.optionSubtitle}>Histórico completo de receitas e despesas</Text>
              </View>
            </View>
            <Switch
              value={options.includeTransactions}
              onValueChange={(value) => handleToggle('includeTransactions', value)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={options.includeTransactions ? colors.primary : colors.white}
            />
          </View>

          <View style={styles.optionItem}>
            <View style={styles.optionInfo}>
              <Ionicons name="card" size={20} color={colors.textSecondary} />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Incluir Parcelamentos</Text>
                <Text style={styles.optionSubtitle}>Dados de todos os parcelamentos</Text>
              </View>
            </View>
            <Switch
              value={options.includeInstallments}
              onValueChange={(value) => handleToggle('includeInstallments', value)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={options.includeInstallments ? colors.primary : colors.white}
            />
          </View>

          <View style={styles.optionItem}>
            <View style={styles.optionInfo}>
              <Ionicons name="bar-chart" size={20} color={colors.textSecondary} />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Incluir Relatórios</Text>
                <Text style={styles.optionSubtitle}>Resumos e estatísticas financeiras</Text>
              </View>
            </View>
            <Switch
              value={options.includeReports}
              onValueChange={(value) => handleToggle('includeReports', value)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={options.includeReports ? colors.primary : colors.white}
            />
          </View>

          <View style={styles.optionItem}>
            <View style={styles.optionInfo}>
              <Ionicons name="calendar" size={20} color={colors.textSecondary} />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Filtrar por Período</Text>
                <Text style={styles.optionSubtitle}>
                  {options.useDateRange 
                    ? `${options.startDate.toLocaleDateString('pt-BR')} até ${options.endDate.toLocaleDateString('pt-BR')}`
                    : 'Exportar todos os dados'
                  }
                </Text>
              </View>
            </View>
            <Switch
              value={options.useDateRange}
              onValueChange={(value) => handleToggle('useDateRange', value)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={options.useDateRange ? colors.primary : colors.white}
            />
          </View>
        </Card>

        {/* Format-specific info */}
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={20} color={colors.info} />
            <Text style={styles.infoTitle}>Sobre o formato {selectedFormat.toUpperCase()}</Text>
          </View>
          
          {selectedFormat === 'pdf' && (
            <Text style={styles.infoText}>
              O PDF gera um relatório visual completo com gráficos e tabelas, ideal para apresentações e arquivamento oficial.
            </Text>
          )}
          
          {selectedFormat === 'csv' && (
            <Text style={styles.infoText}>
              O CSV exporta dados em formato de planilha, compatível com Excel, Google Sheets e outras ferramentas de análise.
            </Text>
          )}
          
          {selectedFormat === 'json' && (
            <Text style={styles.infoText}>
              O JSON cria um backup completo dos dados em formato técnico, útil para importação e desenvolvimento.
            </Text>
          )}
        </Card>

        {/* Export Button */}
        <View style={styles.exportButtonContainer}>
          <Button
            title={isLoading ? 'Exportando...' : `Exportar em ${selectedFormat.toUpperCase()}`}
            onPress={handleExport}
            disabled={isLoading || (!options.includeTransactions && !options.includeInstallments)}
            style={styles.exportButton}
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Container>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  formatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formatItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  formatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  formatInfo: {
    flex: 1,
  },
  formatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  formatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  formatTitleSelected: {
    color: colors.primary,
  },
  formatSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  recommendedBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  recommendedText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: '600',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    marginLeft: 12,
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  infoCard: {
    backgroundColor: colors.infoLight,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.info,
    marginLeft: 8,
  },
  infoText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  exportButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  exportButton: {
    paddingVertical: 16,
  },
  bottomSpacer: {
    height: 100,
  },
});