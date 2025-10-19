import { PnLChart } from '@/components/pnl-chart';
import { PaperTradingService, PnLSnapshot } from '@/services/paper-trading';
import { PaperTrade, Portfolio } from '@/types/polymarket';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type SortOption = 'recent' | 'pnl_high' | 'pnl_low';
type TimePeriod = 'day' | 'week' | 'month' | 'all';

export default function PortfolioScreen() {
    const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showClosed, setShowClosed] = useState(false);
    const [balance, setBalance] = useState(0);
    const [sortBy, setSortBy] = useState<SortOption>('recent');
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
    const [pnlHistory, setPnlHistory] = useState<PnLSnapshot[]>([]);

    const loadPortfolio = useCallback(async () => {
        try {
            setLoading(true);
            const data = await PaperTradingService.getPortfolio();
            const bal = await PaperTradingService.getBalance();
            const history = await PaperTradingService.getFilteredPnLHistory(timePeriod);
            setPortfolio(data);
            setBalance(bal);
            setPnlHistory(history);
        } catch (error) {
            console.error('Error loading portfolio:', error);
            Alert.alert('Error', 'Failed to load portfolio');
        } finally {
            setLoading(false);
        }
    }, [timePeriod]);

    useEffect(() => {
        loadPortfolio();
    }, [loadPortfolio]);

    useEffect(() => {
        const loadHistory = async () => {
            const history = await PaperTradingService.getFilteredPnLHistory(timePeriod);
            setPnlHistory(history);
        };
        loadHistory();
    }, [timePeriod]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadPortfolio();
        setRefreshing(false);
    };

    const closePosition = async (trade: PaperTrade) => {
        console.log('🔵 closePosition called for trade:', {
            id: trade.id,
            marketQuestion: trade.marketQuestion,
            currentPrice: trade.currentPrice,
            entryPrice: trade.entryPrice,
            shares: trade.shares,
            status: trade.status,
        });

        if (!trade.currentPrice) {
            console.log('❌ No current price available');
            Alert.alert('Error', 'Unable to get current price. Try refreshing the portfolio.');
            return;
        }

        const pnl = ((trade.shares * trade.currentPrice) - trade.totalCost).toFixed(2);
        const exitValue = (trade.shares * trade.currentPrice).toFixed(2);

        console.log('💰 Position details:', {
            entryPrice: trade.entryPrice,
            currentPrice: trade.currentPrice,
            shares: trade.shares,
            totalCost: trade.totalCost,
            exitValue,
            pnl,
        });

        // For web, use confirm dialog as fallback
        const isWeb = typeof window !== 'undefined' && window.confirm;

        if (isWeb) {
            console.log('🌐 Using web confirm dialog');
            const confirmed = window.confirm(
                `Close ${trade.side} position on "${trade.marketQuestion}"?\n\n` +
                `Entry: ${(trade.entryPrice * 100).toFixed(1)}¢\n` +
                `Current: ${(trade.currentPrice * 100).toFixed(1)}¢\n` +
                `Shares: ${trade.shares}\n\n` +
                `Cost: $${trade.totalCost.toFixed(2)}\n` +
                `Value: $${exitValue}\n` +
                `P&L: $${pnl}`
            );

            if (!confirmed) {
                console.log('❌ User cancelled close');
                return;
            }

            console.log('🟡 User confirmed close, processing...');
            try {
                setRefreshing(true);
                console.log('📞 Calling PaperTradingService.closePosition with:', {
                    tradeId: trade.id,
                    closePrice: trade.currentPrice,
                });

                const result = await PaperTradingService.closePosition(
                    trade.id,
                    trade.currentPrice!
                );

                console.log('📥 closePosition result:', result);

                if (result.success) {
                    console.log('✅ Close successful, reloading portfolio...');
                    await loadPortfolio();
                    console.log('✅ Portfolio reloaded');
                    window.alert(`Success: ${result.message || `Position closed. P&L: $${result.pnl?.toFixed(2) || pnl}`}`);
                } else {
                    console.log('❌ Close failed:', result.message);
                    window.alert(`Error: ${result.message || 'Failed to close position'}`);
                }
            } catch (error) {
                console.error('❌ Error closing position:', error);
                console.error('Error details:', JSON.stringify(error, null, 2));
                window.alert(`Error: Failed to close position: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
                setRefreshing(false);
                console.log('🔵 closePosition complete');
            }
        } else {
            console.log('📱 Using native Alert dialog');
            Alert.alert(
                'Close Position',
                `Close ${trade.side} position on "${trade.marketQuestion}"?\n\nEntry: ${(trade.entryPrice * 100).toFixed(1)}¢\nCurrent: ${(trade.currentPrice * 100).toFixed(1)}¢\nShares: ${trade.shares}\n\nCost: $${trade.totalCost.toFixed(2)}\nValue: $${exitValue}\nP&L: $${pnl}`,
                [
                    { text: 'Cancel', style: 'cancel', onPress: () => console.log('❌ User cancelled close') },
                    {
                        text: 'Close',
                        style: 'destructive',
                        onPress: async () => {
                            console.log('🟡 User confirmed close, processing...');
                            try {
                                setRefreshing(true);
                                console.log('📞 Calling PaperTradingService.closePosition with:', {
                                    tradeId: trade.id,
                                    closePrice: trade.currentPrice,
                                });

                                const result = await PaperTradingService.closePosition(
                                    trade.id,
                                    trade.currentPrice!
                                );

                                console.log('📥 closePosition result:', result);

                                if (result.success) {
                                    console.log('✅ Close successful, reloading portfolio...');
                                    await loadPortfolio();
                                    console.log('✅ Portfolio reloaded');
                                    Alert.alert('Success', result.message || `Position closed. P&L: $${result.pnl?.toFixed(2) || pnl}`);
                                } else {
                                    console.log('❌ Close failed:', result.message);
                                    Alert.alert('Error', result.message || 'Failed to close position');
                                }
                            } catch (error) {
                                console.error('❌ Error closing position:', error);
                                console.error('Error details:', JSON.stringify(error, null, 2));
                                Alert.alert('Error', `Failed to close position: ${error instanceof Error ? error.message : 'Unknown error'}`);
                            } finally {
                                setRefreshing(false);
                                console.log('🔵 closePosition complete');
                            }
                        },
                    },
                ]
            );
        }
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
                    setRefreshing(true);
                    console.log('🗑️ Clearing all trades...');
                    await PaperTradingService.clearAllTrades();
                    console.log('✅ Trades cleared');
                    console.log('📊 Reloading portfolio...');
                    await loadPortfolio();
                    console.log('✅ Portfolio reloaded');
                    window.alert('Success: Portfolio reset successfully');
                } catch (error) {
                    console.error('❌ Error resetting portfolio:', error);
                    console.error('Error details:', JSON.stringify(error, null, 2));
                    window.alert(`Error: Failed to reset portfolio: ${error instanceof Error ? error.message : 'Unknown error'}`);
                } finally {
                    setRefreshing(false);
                    console.log('🔄 Reset complete');
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
                                setRefreshing(true);
                                console.log('🗑️ Clearing all trades...');
                                await PaperTradingService.clearAllTrades();
                                console.log('✅ Trades cleared');
                                console.log('📊 Reloading portfolio...');
                                await loadPortfolio();
                                console.log('✅ Portfolio reloaded');
                                Alert.alert('Success', 'Portfolio reset successfully');
                            } catch (error) {
                                console.error('❌ Error resetting portfolio:', error);
                                console.error('Error details:', JSON.stringify(error, null, 2));
                                Alert.alert('Error', `Failed to reset portfolio: ${error instanceof Error ? error.message : 'Unknown error'}`);
                            } finally {
                                setRefreshing(false);
                                console.log('🔄 Reset complete');
                            }
                        },
                    },
                ]
            );
        }
    };

    const renderTrade = ({ item }: { item: PaperTrade }) => {
        const isOpen = item.status === 'OPEN';
        const currentPrice = item.currentPrice || item.closePrice || item.entryPrice;
        const currentValue = item.shares * currentPrice;
        const pnl = currentValue - item.totalCost;
        const pnlPercent = (pnl / item.totalCost) * 100;

        return (
            <View style={styles.tradeCard}>
                <View style={styles.tradeHeader}>
                    <View style={styles.tradeInfo}>
                        <Text style={styles.eventTitle} numberOfLines={1}>
                            {item.eventTitle}
                        </Text>
                        <Text style={styles.question} numberOfLines={2}>
                            {item.marketQuestion}
                        </Text>
                    </View>
                    <View style={[styles.sideBadge, item.side === 'YES' ? styles.yesBadge : styles.noBadge]}>
                        <Text style={styles.sideText}>{item.side}</Text>
                    </View>
                </View>

                <View style={styles.tradeDetails}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Shares:</Text>
                        <Text style={styles.detailValue}>{item.shares}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Entry:</Text>
                        <Text style={styles.detailValue}>{(item.entryPrice * 100).toFixed(1)}¢</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Current:</Text>
                        <Text style={styles.detailValue}>{(currentPrice * 100).toFixed(1)}¢</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Cost:</Text>
                        <Text style={styles.detailValue}>${item.totalCost.toFixed(2)}</Text>
                    </View>
                </View>

                <View style={styles.pnlContainer}>
                    <View>
                        <Text style={styles.pnlLabel}>P&L</Text>
                        <Text style={[styles.pnlValue, pnl >= 0 ? styles.profit : styles.loss]}>
                            ${pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.pnlLabel}>Return</Text>
                        <Text style={[styles.pnlValue, pnl >= 0 ? styles.profit : styles.loss]}>
                            {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%
                        </Text>
                    </View>
                    {isOpen && (
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => closePosition(item)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <Text style={styles.dateText}>
                    {isOpen ? 'Opened' : 'Closed'}: {new Date(item.entryDate).toLocaleDateString()}
                </Text>
            </View>
        );
    };

    const sortTrades = (trades: PaperTrade[]): PaperTrade[] => {
        const sorted = [...trades];

        if (sortBy === 'recent') {
            sorted.sort((a, b) => {
                const dateA = showClosed && a.closeDate ? a.closeDate : a.entryDate;
                const dateB = showClosed && b.closeDate ? b.closeDate : b.entryDate;
                return new Date(dateB).getTime() - new Date(dateA).getTime();
            });
        } else if (sortBy === 'pnl_high' || sortBy === 'pnl_low') {
            sorted.sort((a, b) => {
                const currentPriceA = a.currentPrice || a.closePrice || a.entryPrice;
                const currentPriceB = b.currentPrice || b.closePrice || b.entryPrice;
                const pnlA = (a.shares * currentPriceA) - a.totalCost;
                const pnlB = (b.shares * currentPriceB) - b.totalCost;
                return sortBy === 'pnl_high' ? pnlB - pnlA : pnlA - pnlB;
            });
        }

        return sorted;
    };

    if (loading && !portfolio) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0066FF" />
            </View>
        );
    }

    const baseTrades = showClosed
        ? portfolio?.closedPositions || []
        : portfolio?.openPositions || [];

    const displayTrades = sortTrades(baseTrades);

    return (
        <View style={styles.container}>
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

            <PnLChart data={pnlHistory} period={timePeriod} />

            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, !showClosed && styles.activeTab]}
                    onPress={() => setShowClosed(false)}
                >
                    <Text style={[styles.tabText, !showClosed && styles.activeTabText]}>
                        Open ({portfolio?.openPositions.length || 0})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, showClosed && styles.activeTab]}
                    onPress={() => setShowClosed(true)}
                >
                    <Text style={[styles.tabText, showClosed && styles.activeTabText]}>
                        Closed ({portfolio?.closedPositions.length || 0})
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.sortContainer}>
                <Text style={styles.sortLabel}>Sort by:</Text>
                <View style={styles.sortButtons}>
                    <TouchableOpacity
                        style={[styles.sortButton, sortBy === 'recent' && styles.sortButtonActive]}
                        onPress={() => setSortBy('recent')}
                    >
                        <Text style={[styles.sortButtonText, sortBy === 'recent' && styles.sortButtonTextActive]}>
                            Recent
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.sortButton, sortBy === 'pnl_high' && styles.sortButtonActive]}
                        onPress={() => setSortBy('pnl_high')}
                    >
                        <Text style={[styles.sortButtonText, sortBy === 'pnl_high' && styles.sortButtonTextActive]}>
                            Biggest Wins
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.sortButton, sortBy === 'pnl_low' && styles.sortButtonActive]}
                        onPress={() => setSortBy('pnl_low')}
                    >
                        <Text style={[styles.sortButtonText, sortBy === 'pnl_low' && styles.sortButtonTextActive]}>
                            Biggest Losses
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={displayTrades}
                renderItem={renderTrade}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {showClosed ? 'No closed positions' : 'No open positions'}
                        </Text>
                        <Text style={styles.emptySubtext}>
                            {showClosed
                                ? 'Close some positions to see them here'
                                : 'Go to Markets to open your first position'}
                        </Text>
                    </View>
                }
            />
        </View>
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
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 8,
        padding: 4,
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        padding: 12,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeTab: {
        backgroundColor: '#0066FF',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    activeTabText: {
        color: '#fff',
    },
    list: {
        padding: 16,
        paddingTop: 0,
    },
    tradeCard: {
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
    tradeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    tradeInfo: {
        flex: 1,
        marginRight: 12,
    },
    eventTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#333',
    },
    question: {
        fontSize: 12,
        color: '#666',
    },
    sideBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    yesBadge: {
        backgroundColor: '#E8F5E9',
    },
    noBadge: {
        backgroundColor: '#FFEBEE',
    },
    sideText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    tradeDetails: {
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#f0f0f0',
        paddingVertical: 12,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    detailLabel: {
        fontSize: 13,
        color: '#666',
    },
    detailValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
    },
    pnlContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    pnlLabel: {
        fontSize: 11,
        color: '#666',
        marginBottom: 2,
    },
    pnlValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    profit: {
        color: '#4CAF50',
    },
    loss: {
        color: '#F44336',
    },
    closeButton: {
        backgroundColor: '#0066FF',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 6,
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    dateText: {
        fontSize: 11,
        color: '#999',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
    },
    sortContainer: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 12,
        borderRadius: 8,
    },
    sortLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
        fontWeight: '600',
    },
    sortButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    sortButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
    },
    sortButtonActive: {
        backgroundColor: '#0066FF',
    },
    sortButtonText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
    },
    sortButtonTextActive: {
        color: '#fff',
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
});

