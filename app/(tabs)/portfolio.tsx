import { PaperTradingService } from '@/services/paper-trading';
import { PaperTrade, Portfolio } from '@/types/polymarket';
import React, { useEffect, useState } from 'react';
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

export default function PortfolioScreen() {
    const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showClosed, setShowClosed] = useState(false);
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        loadPortfolio();
    }, []);

    const loadPortfolio = async () => {
        try {
            setLoading(true);
            const data = await PaperTradingService.getPortfolio();
            const bal = await PaperTradingService.getBalance();
            setPortfolio(data);
            setBalance(bal);
        } catch (error) {
            console.error('Error loading portfolio:', error);
            Alert.alert('Error', 'Failed to load portfolio');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadPortfolio();
        setRefreshing(false);
    };

    const closePosition = async (trade: PaperTrade) => {
        if (!trade.currentPrice) {
            Alert.alert('Error', 'Unable to get current price');
            return;
        }

        Alert.alert(
            'Close Position',
            `Close ${trade.side} position on "${trade.marketQuestion}"?\n\nCurrent Price: ${(trade.currentPrice * 100).toFixed(1)}¢\nP&L: $${((trade.shares * trade.currentPrice) - trade.totalCost).toFixed(2)}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Close',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await PaperTradingService.closePosition(
                            trade.id,
                            trade.currentPrice!
                        );
                        if (result.success) {
                            Alert.alert('Success', result.message);
                            await loadPortfolio();
                        } else {
                            Alert.alert('Error', result.message);
                        }
                    },
                },
            ]
        );
    };

    const resetPortfolio = () => {
        Alert.alert(
            'Reset Portfolio',
            'This will delete all trades and reset your balance to $10,000. Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        await PaperTradingService.clearAllTrades();
                        await loadPortfolio();
                        Alert.alert('Success', 'Portfolio reset successfully');
                    },
                },
            ]
        );
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

    if (loading && !portfolio) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0066FF" />
            </View>
        );
    }

    const displayTrades = showClosed
        ? portfolio?.closedPositions || []
        : portfolio?.openPositions || [];

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
});

