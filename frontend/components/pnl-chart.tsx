import { PnLSnapshot } from '@/services/paper-trading';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

interface PnLChartProps {
    data: PnLSnapshot[];
    period: 'day' | 'week' | 'month' | 'all';
}

export function PnLChart({ data, period }: PnLChartProps) {
    if (data.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No data yet</Text>
                <Text style={styles.emptySubtext}>
                    Open some positions to see your P&L over time
                </Text>
            </View>
        );
    }

    const screenWidth = Dimensions.get('window').width - 64; // Padding
    const chartHeight = 150;
    const maxDataPoints = 30;

    // Limit data points for display
    const displayData = data.slice(-maxDataPoints);

    // Find min and max for scaling
    const pnlValues = displayData.map((d) => d.totalPnL);
    const maxPnL = Math.max(...pnlValues, 0);
    const minPnL = Math.min(...pnlValues, 0);
    const range = maxPnL - minPnL || 100;

    const barWidth = screenWidth / displayData.length - 4;
    const maxBarWidth = 30;
    const actualBarWidth = Math.min(barWidth, maxBarWidth);
    const spacing = 2;

    const getBarHeight = (pnl: number) => {
        if (range === 0) return 0;
        const normalized = Math.abs(pnl) / range;
        return normalized * (chartHeight / 2);
    };

    const getBarColor = (pnl: number) => {
        return pnl >= 0 ? '#4CAF50' : '#F44336';
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        if (period === 'day') {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (period === 'week' || period === 'month') {
            return `${date.getMonth() + 1}/${date.getDate()}`;
        }
        return `${date.getMonth() + 1}/${date.getDate()}`;
    };

    const latestPnL = displayData[displayData.length - 1]?.totalPnL || 0;
    const latestValue = displayData[displayData.length - 1]?.totalValue || 10000;

    return (
        <View style={styles.container}>
            <View style={styles.statsRow}>
                <View style={styles.stat}>
                    <Text style={styles.statLabel}>Current P&L</Text>
                    <Text style={[styles.statValue, latestPnL >= 0 ? styles.profit : styles.loss]}>
                        ${latestPnL >= 0 ? '+' : ''}
                        {latestPnL.toFixed(2)}
                    </Text>
                </View>
                <View style={styles.stat}>
                    <Text style={styles.statLabel}>Total Value</Text>
                    <Text style={styles.statValue}>${latestValue.toFixed(2)}</Text>
                </View>
            </View>

            <View style={styles.chartContainer}>
                <View style={styles.zeroLine} />
                <View style={styles.barsContainer}>
                    {displayData.map((snapshot, index) => {
                        const height = getBarHeight(snapshot.totalPnL);
                        const isPositive = snapshot.totalPnL >= 0;

                        return (
                            <View key={snapshot.date} style={styles.barWrapper}>
                                <View
                                    style={[
                                        styles.bar,
                                        {
                                            height: height || 2,
                                            width: actualBarWidth,
                                            backgroundColor: getBarColor(snapshot.totalPnL),
                                            [isPositive ? 'bottom' : 'top']: chartHeight / 2,
                                        },
                                    ]}
                                />
                            </View>
                        );
                    })}
                </View>
            </View>

            <View style={styles.labelsContainer}>
                {displayData.length > 0 && (
                    <>
                        <Text style={styles.label}>{formatDate(displayData[0].date)}</Text>
                        <Text style={styles.label}>
                            {formatDate(displayData[displayData.length - 1].date)}
                        </Text>
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    stat: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    profit: {
        color: '#4CAF50',
    },
    loss: {
        color: '#F44336',
    },
    chartContainer: {
        height: 150,
        position: 'relative',
        marginBottom: 8,
    },
    zeroLine: {
        position: 'absolute',
        top: 75,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: '#ddd',
    },
    barsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: '100%',
    },
    barWrapper: {
        height: '100%',
        justifyContent: 'center',
        position: 'relative',
    },
    bar: {
        position: 'absolute',
        borderRadius: 2,
    },
    labelsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    label: {
        fontSize: 10,
        color: '#999',
    },
    emptyContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 32,
        marginHorizontal: 16,
        marginBottom: 16,
        alignItems: 'center',
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
        textAlign: 'center',
    },
});

