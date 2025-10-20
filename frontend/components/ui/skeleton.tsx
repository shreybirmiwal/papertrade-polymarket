import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 4, style }: SkeletonProps) {
  const shimmerAnimation = new Animated.Value(0);

  React.useEffect(() => {
    const shimmer = () => {
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => shimmer());
    };
    shimmer();
  }, []);

  const opacity = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

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
}

export function PortfolioSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Skeleton width={120} height={24} borderRadius={8} />
        <Skeleton width={200} height={40} borderRadius={12} style={{ marginTop: 8 }} />
      </View>
      
      <View style={styles.card}>
        <Skeleton width="100%" height={150} borderRadius={12} />
      </View>
      
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Skeleton width={80} height={16} borderRadius={4} />
          <Skeleton width={60} height={20} borderRadius={6} style={{ marginTop: 4 }} />
        </View>
        <View style={styles.statItem}>
          <Skeleton width={80} height={16} borderRadius={4} />
          <Skeleton width={60} height={20} borderRadius={6} style={{ marginTop: 4 }} />
        </View>
      </View>
    </View>
  );
}

export function MarketsSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Skeleton width="100%" height={40} borderRadius={8} />
      </View>
      
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={index} style={styles.marketCard}>
          <View style={styles.marketHeader}>
            <Skeleton width="70%" height={18} borderRadius={4} />
            <Skeleton width={40} height={24} borderRadius={6} />
          </View>
          <Skeleton width="100%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
          <View style={styles.marketStats}>
            <Skeleton width={60} height={16} borderRadius={4} />
            <Skeleton width={60} height={16} borderRadius={4} />
            <Skeleton width={60} height={16} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function PositionsSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <Skeleton width="45%" height={40} borderRadius={8} />
        <Skeleton width="45%" height={40} borderRadius={8} />
      </View>
      
      {Array.from({ length: 2 }).map((_, index) => (
        <View key={index} style={styles.positionCard}>
          <View style={styles.positionHeader}>
            <View style={styles.positionInfo}>
              <Skeleton width="80%" height={16} borderRadius={4} />
              <Skeleton width="60%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
            </View>
            <Skeleton width={40} height={24} borderRadius={6} />
          </View>
          
          <View style={styles.positionDetails}>
            <Skeleton width="100%" height={1} borderRadius={1} />
            <View style={styles.detailRow}>
              <Skeleton width={50} height={12} borderRadius={3} />
              <Skeleton width={40} height={12} borderRadius={3} />
            </View>
            <View style={styles.detailRow}>
              <Skeleton width={50} height={12} borderRadius={3} />
              <Skeleton width={40} height={12} borderRadius={3} />
            </View>
          </View>
          
          <View style={styles.pnlContainer}>
            <View>
              <Skeleton width={30} height={10} borderRadius={3} />
              <Skeleton width={50} height={16} borderRadius={4} style={{ marginTop: 2 }} />
            </View>
            <View>
              <Skeleton width={40} height={10} borderRadius={3} />
              <Skeleton width={50} height={16} borderRadius={4} style={{ marginTop: 2 }} />
            </View>
            <Skeleton width={60} height={32} borderRadius={6} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E0E0E0',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  card: {
    marginBottom: 24,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  searchContainer: {
    marginBottom: 16,
  },
  marketCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  marketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  marketStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  positionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  positionInfo: {
    flex: 1,
    marginRight: 12,
  },
  positionDetails: {
    paddingVertical: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pnlContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
