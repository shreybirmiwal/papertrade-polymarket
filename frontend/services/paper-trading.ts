import { PaperTrade, Portfolio, PositionSide } from '@/types/polymarket';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PolymarketAPI } from './polymarket-api';

const TRADES_STORAGE_KEY = '@paper_trades';
const BALANCE_STORAGE_KEY = '@paper_balance';
const PNL_HISTORY_KEY = '@pnl_history';
const INITIAL_BALANCE = 10000; // $10,000 starting balance

export interface PnLSnapshot {
    date: string; // ISO date string
    totalPnL: number;
    totalValue: number;
    timestamp: number;
}

export class PaperTradingService {
    /**
     * Get current balance
     */
    static async getBalance(): Promise<number> {
        try {
            const balance = await AsyncStorage.getItem(BALANCE_STORAGE_KEY);
            return balance ? parseFloat(balance) : INITIAL_BALANCE;
        } catch (error) {
            console.error('Error getting balance:', error);
            return INITIAL_BALANCE;
        }
    }

    /**
     * Update balance
     */
    static async updateBalance(amount: number): Promise<void> {
        try {
            await AsyncStorage.setItem(BALANCE_STORAGE_KEY, amount.toString());
        } catch (error) {
            console.error('Error updating balance:', error);
        }
    }

    /**
     * Reset balance to initial amount
     */
    static async resetBalance(): Promise<void> {
        await this.updateBalance(INITIAL_BALANCE);
    }

    /**
     * Get all trades
     */
    static async getAllTrades(): Promise<PaperTrade[]> {
        try {
            const tradesJson = await AsyncStorage.getItem(TRADES_STORAGE_KEY);
            if (!tradesJson) return [];

            const trades = JSON.parse(tradesJson);
            // Convert date strings back to Date objects
            return trades.map((t: any) => ({
                ...t,
                entryDate: new Date(t.entryDate),
                closeDate: t.closeDate ? new Date(t.closeDate) : undefined,
            }));
        } catch (error) {
            console.error('Error getting trades:', error);
            return [];
        }
    }

    /**
     * Save trades
     */
    static async saveTrades(trades: PaperTrade[]): Promise<void> {
        try {
            await AsyncStorage.setItem(TRADES_STORAGE_KEY, JSON.stringify(trades));
        } catch (error) {
            console.error('Error saving trades:', error);
        }
    }

    /**
     * Open a new position
     */
    static async openPosition(
        marketId: string,
        eventTitle: string,
        marketQuestion: string,
        side: PositionSide,
        shares: number,
        entryPrice: number,
        slug: string
    ): Promise<{ success: boolean; message: string; trade?: PaperTrade }> {
        const totalCost = shares * entryPrice;
        const balance = await this.getBalance();

        if (totalCost > balance) {
            return {
                success: false,
                message: `Insufficient balance. Need $${totalCost.toFixed(2)}, have $${balance.toFixed(2)}`,
            };
        }

        const trade: PaperTrade = {
            id: Date.now().toString(),
            marketId,
            eventTitle,
            marketQuestion,
            side,
            shares,
            entryPrice,
            entryDate: new Date(),
            status: 'OPEN',
            totalCost,
            slug,
        };

        const trades = await this.getAllTrades();
        trades.push(trade);
        await this.saveTrades(trades);
        await this.updateBalance(balance - totalCost);

        return {
            success: true,
            message: 'Position opened successfully',
            trade,
        };
    }

    /**
     * Close a position
     */
    static async closePosition(
        tradeId: string,
        closePrice: number
    ): Promise<{ success: boolean; message: string; pnl?: number }> {
        console.log('📦 PaperTradingService.closePosition called with:', {
            tradeId,
            closePrice,
        });

        try {
            const trades = await this.getAllTrades();
            console.log('📋 Total trades loaded:', trades.length);

            const tradeIndex = trades.findIndex(t => t.id === tradeId);
            console.log('🔍 Trade index found:', tradeIndex);

            if (tradeIndex === -1) {
                console.log('❌ Trade not found with id:', tradeId);
                console.log('Available trade IDs:', trades.map(t => t.id));
                return { success: false, message: 'Trade not found' };
            }

            const trade = trades[tradeIndex];
            console.log('📊 Trade to close:', {
                id: trade.id,
                status: trade.status,
                shares: trade.shares,
                entryPrice: trade.entryPrice,
                totalCost: trade.totalCost,
            });

            if (trade.status === 'CLOSED') {
                console.log('❌ Trade already closed');
                return { success: false, message: 'Trade already closed' };
            }

            const exitValue = trade.shares * closePrice;
            const pnl = exitValue - trade.totalCost;

            console.log('💵 Closing calculations:', {
                shares: trade.shares,
                closePrice,
                exitValue,
                totalCost: trade.totalCost,
                pnl,
            });

            trade.status = 'CLOSED';
            trade.closePrice = closePrice;
            trade.closeDate = new Date();

            trades[tradeIndex] = trade;
            console.log('💾 Saving updated trades...');
            await this.saveTrades(trades);
            console.log('✅ Trades saved');

            const balance = await this.getBalance();
            const newBalance = balance + exitValue;
            console.log('💰 Updating balance:', {
                oldBalance: balance,
                exitValue,
                newBalance,
            });

            await this.updateBalance(newBalance);
            console.log('✅ Balance updated');

            const message = pnl === 0
                ? `Position closed at break-even`
                : `Position closed. P&L: $${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}`;

            console.log('✅ closePosition successful:', message);

            return {
                success: true,
                message,
                pnl,
            };
        } catch (error) {
            console.error('❌ Error in closePosition:', error);
            console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
            return {
                success: false,
                message: `Error closing position: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }

    /**
     * Get portfolio with current P&L
     */
    static async getPortfolio(): Promise<Portfolio> {
        console.log('📊 Getting portfolio...');
        const trades = await this.getAllTrades();
        console.log(`📋 Total trades: ${trades.length}`);

        const openPositions = trades.filter(t => t.status === 'OPEN');
        const closedPositions = trades.filter(t => t.status === 'CLOSED');
        console.log(`📈 Open positions: ${openPositions.length}, Closed positions: ${closedPositions.length}`);

        let totalValue = await this.getBalance();
        let totalPnL = 0;

        // Calculate P&L for open positions (unrealized)
        console.log('🔄 Updating prices for open positions...');
        for (const trade of openPositions) {
            try {
                console.log(`📞 Fetching current price for trade ${trade.id} (${trade.marketQuestion})`);
                const event = await PolymarketAPI.getEventBySlug(trade.slug);
                const market = event.markets.find(m => m.id === trade.marketId);

                if (market) {
                    const currentPrice = PolymarketAPI.getCurrentPrice(market, trade.side);
                    trade.currentPrice = currentPrice;
                    const currentValue = trade.shares * currentPrice;
                    const unrealizedPnL = currentValue - trade.totalCost;

                    console.log(`💰 Trade ${trade.id}: entry=${trade.entryPrice}, current=${currentPrice}, PnL=${unrealizedPnL.toFixed(2)}`);

                    totalPnL += unrealizedPnL;
                    totalValue += currentValue;
                } else {
                    console.log(`⚠️ Market not found for trade ${trade.id}`);
                }
            } catch (error) {
                console.error(`❌ Error updating trade ${trade.id} price:`, error);
                // Use entry price as fallback when API fails
                trade.currentPrice = trade.entryPrice;
                console.log(`⚠️ Using entry price as fallback for trade ${trade.id}: ${trade.entryPrice}`);
            }
        }

        // Calculate P&L for closed positions (realized)
        console.log('📊 Calculating P&L for closed positions...');
        for (const trade of closedPositions) {
            if (trade.closePrice) {
                const exitValue = trade.shares * trade.closePrice;
                const realizedPnL = exitValue - trade.totalCost;
                console.log(`💼 Closed trade ${trade.id}: PnL=${realizedPnL.toFixed(2)}`);
                totalPnL += realizedPnL;
            }
        }

        console.log(`📊 Portfolio summary: totalValue=$${totalValue.toFixed(2)}, totalPnL=$${totalPnL.toFixed(2)}`);

        // Save daily snapshot
        await this.savePnLSnapshot(totalPnL, totalValue);

        return {
            totalValue,
            totalPnL,
            openPositions,
            closedPositions,
        };
    }

    /**
     * Clear all trades (reset)
     */
    static async clearAllTrades(): Promise<void> {
        console.log('🗑️ Clearing all trades and resetting portfolio...');
        try {
            console.log('Removing trades from storage...');
            await AsyncStorage.removeItem(TRADES_STORAGE_KEY);
            console.log('Removing PnL history from storage...');
            await AsyncStorage.removeItem(PNL_HISTORY_KEY);
            console.log('Resetting balance...');
            await this.resetBalance();
            console.log('✅ Portfolio cleared successfully');
        } catch (error) {
            console.error('❌ Error clearing trades:', error);
            throw error;
        }
    }

    /**
     * Save PnL snapshot
     */
    static async savePnLSnapshot(totalPnL: number, totalValue: number): Promise<void> {
        try {
            const today = new Date().toISOString().split('T')[0];
            const snapshots = await this.getPnLHistory();

            // Check if we already have a snapshot for today
            const existingIndex = snapshots.findIndex(s => s.date === today);

            const newSnapshot: PnLSnapshot = {
                date: today,
                totalPnL,
                totalValue,
                timestamp: Date.now(),
            };

            if (existingIndex >= 0) {
                snapshots[existingIndex] = newSnapshot;
            } else {
                snapshots.push(newSnapshot);
            }

            // Keep only last 365 days
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 365);
            const filtered = snapshots.filter(s => new Date(s.date) >= cutoffDate);

            await AsyncStorage.setItem(PNL_HISTORY_KEY, JSON.stringify(filtered));
        } catch (error) {
            console.error('Error saving PnL snapshot:', error);
        }
    }

    /**
     * Get PnL history
     */
    static async getPnLHistory(): Promise<PnLSnapshot[]> {
        try {
            const historyJson = await AsyncStorage.getItem(PNL_HISTORY_KEY);
            return historyJson ? JSON.parse(historyJson) : [];
        } catch (error) {
            console.error('Error getting PnL history:', error);
            return [];
        }
    }

    /**
     * Get filtered PnL history by time period
     */
    static async getFilteredPnLHistory(period: 'day' | 'week' | 'month' | 'all'): Promise<PnLSnapshot[]> {
        const history = await this.getPnLHistory();
        if (period === 'all') return history;

        const cutoff = new Date();
        if (period === 'day') {
            cutoff.setDate(cutoff.getDate() - 1);
        } else if (period === 'week') {
            cutoff.setDate(cutoff.getDate() - 7);
        } else if (period === 'month') {
            cutoff.setDate(cutoff.getDate() - 30);
        }

        return history.filter(s => new Date(s.date) >= cutoff);
    }
}

