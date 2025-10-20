import { PnLChart } from '@/components/pnl-chart';
import { PaperTradingService, PnLSnapshot } from '@/services/paper-trading';
import { PortfolioSkeleton } from '@/components/ui/skeleton';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type TimePeriod = 'day' | 'week' | 'month' | 'all';

export default function AnalyticsScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [balance, setBalance] = useState(0);
    const [totalValue, setTotalValue] = useState(0);
    const [totalPnL, setTotalPnL] = useState(0);
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
    const [pnlHistory, setPnlHistory] = useState<PnLSnapshot[]>([]);

    const loadAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            const portfolio = await PaperTradingService.getPortfolio();
            const bal = await PaperTradingService.getBalance();
            const history = await PaperTradingService.getFilteredPnLHistory(timePeriod);

            setBalance(bal);
            setTotalValue(portfolio.totalValue);
            setTotalPnL(portfolio.totalPnL);
            setPnlHistory(history);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    }, [timePeriod]);

    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    useEffect(() => {
        const loadHistory = async () => {
            const history = await PaperTradingService.getFilteredPnLHistory(timePeriod);
            setPnlHistory(history);
        };
        loadHistory();
    }, [timePeriod]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAnalytics();
        setRefreshing(false);
    };

    if (loading) {
        return <PortfolioSkeleton />;
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Analytics</Text>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Cash Balance</Text>
                    <Text style={styles.statValue}>${balance.toFixed(2)}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Total Value</Text>
                    <Text style={styles.statValue}>${totalValue.toFixed(2)}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Total P&L</Text>
                    <Text
                        style={[
                            styles.statValue,
                            totalPnL >= 0 ? styles.profit : styles.loss,
                        ]}
                    >
                        ${totalPnL >= 0 ? '+' : ''}
                        {totalPnL.toFixed(2)}
                    </Text>
                </View>
            </View>

            <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>P&L Chart</Text>
                <View style={styles.timePeriodButtons}>
                    <TouchableOpacity
                        style={[styles.periodButton, timePeriod === 'day' && styles.periodButtonActive]}
                        onPress={() => setTimePeriod('day')}
                    >
                        <Text style={[styles.periodButtonText, timePeriod === 'day' && styles.periodButtonTextActive]}>
                            1D
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.periodButton, timePeriod === 'week' && styles.periodButtonActive]}
                        onPress={() => setTimePeriod('week')}
                    >
                        <Text style={[styles.periodButtonText, timePeriod === 'week' && styles.periodButtonTextActive]}>
                            1W
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.periodButton, timePeriod === 'month' && styles.periodButtonActive]}
                        onPress={() => setTimePeriod('month')}
                    >
                        <Text style={[styles.periodButtonText, timePeriod === 'month' && styles.periodButtonTextActive]}>
                            1M
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.periodButton, timePeriod === 'all' && styles.periodButtonActive]}
                        onPress={() => setTimePeriod('all')}
                    >
                        <Text style={[styles.periodButtonText, timePeriod === 'all' && styles.periodButtonTextActive]}>
                            All
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <PnLChart data={pnlHistory} period={timePeriod} />

            <View style={styles.performanceContainer}>
                <Text style={styles.sectionTitle}>Performance Metrics</Text>

                <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Return on Investment</Text>
                    <Text style={[styles.metricValue, totalPnL >= 0 ? styles.profit : styles.loss]}>
                        {((totalPnL / 10000) * 100).toFixed(2)}%
                    </Text>
                </View>

                <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Portfolio Growth</Text>
                    <Text style={[styles.metricValue, totalValue >= 10000 ? styles.profit : styles.loss]}>
                        {((totalValue / 10000 - 1) * 100).toFixed(2)}%
                    </Text>
                </View>

                <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Cash vs Invested</Text>
                    <Text style={styles.metricValue}>
                        {((balance / totalValue) * 100).toFixed(1)}% Cash
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#fff',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 8,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    profit: {
        color: '#4CAF50',
    },
    loss: {
        color: '#F44336',
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 12,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    timePeriodButtons: {
        flexDirection: 'row',
        gap: 4,
    },
    periodButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        backgroundColor: '#f5f5f5',
    },
    periodButtonActive: {
        backgroundColor: '#0066FF',
    },
    periodButtonText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
    },
    periodButtonTextActive: {
        color: '#fff',
    },
    performanceContainer: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    metricCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metricLabel: {
        fontSize: 14,
        color: '#666',
    },
    metricValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
