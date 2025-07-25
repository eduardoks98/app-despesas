import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions
} from 'react-native';
import { Button } from '../common/Button';
import { colors } from '../../styles/colors';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface QuickTourProps {
  visible: boolean;
  onClose: () => void;
}

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export const QuickTour: React.FC<QuickTourProps> = ({ visible, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const tourSteps: TourStep[] = [
    {
      id: 'transactions',
      title: 'Transações',
      description: 'Adicione suas receitas e despesas. Use a busca e filtros para encontrar rapidamente o que procura.',
      icon: 'list',
      color: colors.primary,
    },
    {
      id: 'installments',
      title: 'Parcelamentos',
      description: 'Gerencie suas compras parceladas. Marque as parcelas pagas e acompanhe o progresso.',
      icon: 'card',
      color: colors.info,
    },
    {
      id: 'reports',
      title: 'Relatórios',
      description: 'Visualize gráficos e estatísticas dos seus gastos por categoria e período.',
      icon: 'bar-chart',
      color: colors.success,
    },
    {
      id: 'profile',
      title: 'Perfil',
      description: 'Configure notificações, exporte seus dados e personalize o app conforme suas necessidades.',
      icon: 'person',
      color: colors.warning,
    },
  ];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  const renderStep = (step: TourStep) => (
    <View style={styles.stepContainer}>
      <View style={[styles.iconContainer, { backgroundColor: step.color + '20' }]}>
        <Ionicons name={step.icon as any} size={48} color={step.color} />
      </View>
      <Text style={styles.stepTitle}>{step.title}</Text>
      <Text style={styles.stepDescription}>{step.description}</Text>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.pagination}>
      {tourSteps.map((_, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => setCurrentStep(index)}
          style={[
            styles.paginationDot,
            index === currentStep && styles.paginationDotActive
          ]}
        />
      ))}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Tour Rápido</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Conteúdo */}
          <View style={styles.content}>
            {renderStep(tourSteps[currentStep])}
          </View>

          {/* Paginação */}
          {renderPagination()}

          {/* Navegação */}
          <View style={styles.navigation}>
            <TouchableOpacity
              onPress={handlePrevious}
              style={[
                styles.navButton,
                currentStep === 0 && styles.navButtonDisabled
              ]}
              disabled={currentStep === 0}
            >
              <Ionicons 
                name="chevron-back" 
                size={20} 
                color={currentStep === 0 ? colors.textSecondary : colors.primary} 
              />
              <Text style={[
                styles.navButtonText,
                currentStep === 0 && styles.navButtonTextDisabled
              ]}>
                Anterior
              </Text>
            </TouchableOpacity>

            <Button
              title={currentStep === tourSteps.length - 1 ? 'Concluir' : 'Próximo'}
              onPress={handleNext}
              style={styles.nextButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  stepContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    fontSize: 16,
    color: colors.primary,
    marginLeft: 4,
  },
  navButtonTextDisabled: {
    color: colors.textSecondary,
  },
  nextButton: {
    minWidth: 100,
  },
});