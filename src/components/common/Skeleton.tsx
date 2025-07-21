import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
  Easing
} from 'react-native';
import { colors } from '../../styles/colors';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  animated?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  animated = true
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1000,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1000,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();

      return () => animation.stop();
    }
  }, [animated, animatedValue]);

  const opacity = animated
    ? animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
      })
    : 0.3;

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Skeleton específico para transações
export const TransactionSkeleton: React.FC = () => (
  <View style={styles.transactionSkeleton}>
    <View style={styles.transactionLeft}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <View style={styles.transactionContent}>
        <Skeleton width="70%" height={16} style={styles.transactionTitle} />
        <Skeleton width="50%" height={12} />
      </View>
    </View>
    <View style={styles.transactionRight}>
      <Skeleton width={80} height={16} style={styles.transactionAmount} />
      <Skeleton width={60} height={12} />
    </View>
  </View>
);

// Skeleton para cards de estatísticas
export const StatCardSkeleton: React.FC = () => (
  <View style={styles.statCard}>
    <Skeleton width="60%" height={12} style={styles.statLabel} />
    <Skeleton width="80%" height={20} style={styles.statValue} />
  </View>
);

// Skeleton para gráficos
export const ChartSkeleton: React.FC = () => (
  <View style={styles.chartSkeleton}>
    <View style={styles.chartBars}>
      {[1, 2, 3, 4, 5, 6].map((_, index) => (
        <View key={index} style={styles.chartBar}>
          <Skeleton
            width={20}
            height={Math.random() * 80 + 20}
            borderRadius={2}
            style={styles.bar}
          />
          <Skeleton width={24} height={8} style={styles.barLabel} />
        </View>
      ))}
    </View>
    <View style={styles.chartLegend}>
      <Skeleton width={80} height={12} />
      <Skeleton width={60} height={12} />
    </View>
  </View>
);

// Skeleton para lista de categorias
export const CategorySkeleton: React.FC = () => (
  <View style={styles.categorySkeleton}>
    <View style={styles.categoryLeft}>
      <Skeleton width={24} height={24} borderRadius={12} />
      <View style={styles.categoryContent}>
        <Skeleton width="60%" height={14} style={styles.categoryName} />
        <Skeleton width="40%" height={10} />
      </View>
    </View>
    <View style={styles.categoryRight}>
      <Skeleton width={60} height={14} style={styles.categoryValue} />
      <Skeleton width={30} height={10} />
    </View>
    <View style={styles.categoryBar}>
      <Skeleton width="100%" height={4} borderRadius={2} />
    </View>
  </View>
);

// Skeleton para parcelamentos
export const InstallmentSkeleton: React.FC = () => (
  <View style={styles.installmentSkeleton}>
    <View style={styles.installmentHeader}>
      <Skeleton width="70%" height={16} style={styles.installmentTitle} />
      <Skeleton width={80} height={14} />
    </View>
    <View style={styles.installmentContent}>
      <View style={styles.installmentInfo}>
        <Skeleton width="50%" height={12} style={styles.installmentDetail} />
        <Skeleton width="40%" height={12} style={styles.installmentDetail} />
      </View>
      <View style={styles.installmentProgress}>
        <Skeleton width="100%" height={8} borderRadius={4} />
        <Skeleton width="30%" height={10} style={styles.installmentPercentage} />
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.border,
  },
  
  // Transaction Skeleton
  transactionSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 8,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionContent: {
    marginLeft: 12,
    flex: 1,
  },
  transactionTitle: {
    marginBottom: 4,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    marginBottom: 4,
  },

  // Stat Card Skeleton
  statCard: {
    alignItems: 'center',
    padding: 16,
  },
  statLabel: {
    marginBottom: 8,
  },
  statValue: {
    marginBottom: 4,
  },

  // Chart Skeleton
  chartSkeleton: {
    padding: 16,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 120,
    marginBottom: 16,
  },
  chartBar: {
    alignItems: 'center',
  },
  bar: {
    marginBottom: 8,
  },
  barLabel: {
    marginTop: 4,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },

  // Category Skeleton
  categorySkeleton: {
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryContent: {
    marginLeft: 12,
    flex: 1,
  },
  categoryName: {
    marginBottom: 4,
  },
  categoryRight: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  categoryValue: {
    marginBottom: 4,
  },
  categoryBar: {
    marginTop: 8,
  },

  // Installment Skeleton
  installmentSkeleton: {
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 8,
  },
  installmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  installmentTitle: {
    flex: 1,
    marginRight: 12,
  },
  installmentContent: {
    gap: 8,
  },
  installmentInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  installmentDetail: {
    marginBottom: 4,
  },
  installmentProgress: {
    gap: 4,
  },
  installmentPercentage: {
    alignSelf: 'flex-end',
  },
});