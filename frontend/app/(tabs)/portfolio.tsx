import { PnLChart } from '@/components/pnl-chart';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { PaperTradingService, PnLSnapshot } from '@/services/paper-trading';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type TimePeriod = 'day' | 'week' | 'month' | 'all';

export default function PortfolioScreen() {
    const { portfolio, balance, loading, initialized, refreshing, refreshPortfolio, clearPortfolio } = usePortfolio();
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
    const [filteredPnlHistory, setFilteredPnlHistory] = useState<PnLSnapshot[]>([]);

    useEffect(() => {
        const loadHistory = async () => {
            const history = await PaperTradingService.getFilteredPnLHistory(timePeriod);
            setFilteredPnlHistory(history);
        };
        loadHistory();
    }, [timePeriod]);

    const onRefresh = async () => {
        await refreshPortfolio();
    };


    const resetPortfolio = () => {
        const isWeb = typeof window !== 'undefined' && window.confirm;

        if (isWeb) {
            console.log('🌐 Using web confirm dialog for reset');
            const confirmed = window.confirm(
                'This will delete all trades and reset your balance to $10,000. Are you sure?'
            );

            if (!confirmed) {
                console.log('❌ User cancelled reset');
                return;
            }

            (async () => {
                console.log('🔄 Starting portfolio reset...');
                try {
                    console.log('🗑️ Clearing all trades...');
                    await clearPortfolio();
                    console.log('✅ Portfolio reset complete');
                    window.alert('Success: Portfolio reset successfully');
                } catch (error) {
                    console.error('❌ Error resetting portfolio:', error);
                    console.error('Error details:', JSON.stringify(error, null, 2));
                    window.alert(`Error: Failed to reset portfolio: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            })();
        } else {
            Alert.alert(
                'Reset Portfolio',
                'This will delete all trades and reset your balance to $10,000. Are you sure?',
                [
                    { text: 'Cancel', style: 'cancel', onPress: () => console.log('❌ User cancelled reset') },
                    {
                        text: 'Reset',
                        style: 'destructive',
                        onPress: async () => {
                            console.log('🔄 Starting portfolio reset...');
                            try {
                                console.log('🗑️ Clearing all trades...');
                                await clearPortfolio();
                                console.log('✅ Portfolio reset complete');
                                Alert.alert('Success', 'Portfolio reset successfully');
                            } catch (error) {
                                console.error('❌ Error resetting portfolio:', error);
                                console.error('Error details:', JSON.stringify(error, null, 2));
                                Alert.alert('Error', `Failed to reset portfolio: ${error instanceof Error ? error.message : 'Unknown error'}`);
                            }
                        },
                    },
                ]
            );
        }
    };


    if (!initialized && loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0066FF" />
                <Text style={styles.loadingText}>Loading portfolio...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Portfolio</Text>
                <TouchableOpacity onPress={resetPortfolio}>
                    <Text style={styles.resetButton}>Reset</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Cash Balance</Text>
                    <Text style={styles.statValue}>${balance.toFixed(2)}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Total Value</Text>
                    <Text style={styles.statValue}>${portfolio?.totalValue.toFixed(2)}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Total P&L</Text>
                    <Text
                        style={[
                            styles.statValue,
                            (portfolio?.totalPnL || 0) >= 0 ? styles.profit : styles.loss,
                        ]}
                    >
                        ${(portfolio?.totalPnL || 0) >= 0 ? '+' : ''}
                        {portfolio?.totalPnL.toFixed(2)}
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

            <PnLChart data={filteredPnlHistory} period={timePeriod} />

            <View style={styles.performanceContainer}>
                <Text style={styles.sectionTitle}>Performance Metrics</Text>

                <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Return on Investment</Text>
                    <Text style={[styles.metricValue, (portfolio?.totalPnL || 0) >= 0 ? styles.profit : styles.loss]}>
                        {((portfolio?.totalPnL || 0) / 10000 * 100).toFixed(2)}%
                    </Text>
                </View>

                <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Portfolio Growth</Text>
                    <Text style={[styles.metricValue, (portfolio?.totalValue || 0) >= 10000 ? styles.profit : styles.loss]}>
                        {(((portfolio?.totalValue || 0) / 10000 - 1) * 100).toFixed(2)}%
                    </Text>
                </View>

                <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Cash vs Invested</Text>
                    <Text style={styles.metricValue}>
                        {((balance / (portfolio?.totalValue || 1)) * 100).toFixed(1)}% Cash
                    </Text>
                </View>
            </View>

            <View style={styles.summaryContainer}>
                <Text style={styles.sectionTitle}>Portfolio Summary</Text>

                <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Open Positions</Text>
                        <Text style={styles.summaryValue}>{portfolio?.openPositions.length || 0}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Closed Positions</Text>
                        <Text style={styles.summaryValue}>{portfolio?.closedPositions.length || 0}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Trades</Text>
                        <Text style={styles.summaryValue}>
                            {(portfolio?.openPositions.length || 0) + (portfolio?.closedPositions.length || 0)}
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Win Rate</Text>
                        <Text style={styles.summaryValue}>
                            {portfolio?.closedPositions.length
                                ? `${((portfolio.closedPositions.filter(t => (t.shares * (t.closePrice || 0)) - t.totalCost > 0).length / portfolio.closedPositions.length) * 100).toFixed(0)}%`
                                : 'N/A'
                            }
                        </Text>
                    </View>
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
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    resetButton: {
        color: '#F44336',
        fontSize: 16,
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 16,
        gap: 6,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        minWidth: 0, // Allow flex shrinking
    },
    statLabel: {
        fontSize: 11,
        color: '#666',
        marginBottom: 3,
        textAlign: 'center',
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 12,
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
        paddingHorizontal: 12,
        paddingVertical: 16,
    },
    metricCard: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metricLabel: {
        fontSize: 13,
        color: '#666',
    },
    metricValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    summaryContainer: {
        paddingHorizontal: 12,
        paddingVertical: 16,
    },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    summaryLabel: {
        fontSize: 13,
        color: '#666',
        flex: 1,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'right',
    },
    profit: {
        color: '#4CAF50',
    },
    loss: {
        color: '#F44336',
    },
});

