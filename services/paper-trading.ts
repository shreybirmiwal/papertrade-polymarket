import { PaperTrade, Portfolio, PositionSide } from '@/types/polymarket';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PolymarketAPI } from './polymarket-api';

const TRADES_STORAGE_KEY = '@paper_trades';
const BALANCE_STORAGE_KEY = '@paper_balance';
const INITIAL_BALANCE = 10000; // $10,000 starting balance

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
        const trades = await this.getAllTrades();
        const tradeIndex = trades.findIndex(t => t.id === tradeId);

        if (tradeIndex === -1) {
            return { success: false, message: 'Trade not found' };
        }

        const trade = trades[tradeIndex];
        if (trade.status === 'CLOSED') {
            return { success: false, message: 'Trade already closed' };
        }

        const exitValue = trade.shares * closePrice;
        const pnl = exitValue - trade.totalCost;

        trade.status = 'CLOSED';
        trade.closePrice = closePrice;
        trade.closeDate = new Date();

        trades[tradeIndex] = trade;
        await this.saveTrades(trades);

        const balance = await this.getBalance();
        await this.updateBalance(balance + exitValue);

        return {
            success: true,
            message: `Position closed. P&L: $${pnl.toFixed(2)}`,
            pnl,
        };
    }

    /**
     * Get portfolio with current P&L
     */
    static async getPortfolio(): Promise<Portfolio> {
        const trades = await this.getAllTrades();
        const openPositions = trades.filter(t => t.status === 'OPEN');
        const closedPositions = trades.filter(t => t.status === 'CLOSED');

        let totalValue = await this.getBalance();
        let totalPnL = 0;

        // Calculate P&L for open positions (unrealized)
        for (const trade of openPositions) {
            try {
                const event = await PolymarketAPI.getEventBySlug(trade.slug);
                const market = event.markets.find(m => m.id === trade.marketId);

                if (market) {
                    const currentPrice = PolymarketAPI.getCurrentPrice(market, trade.side);
                    trade.currentPrice = currentPrice;
                    const currentValue = trade.shares * currentPrice;
                    const unrealizedPnL = currentValue - trade.totalCost;
                    totalPnL += unrealizedPnL;
                    totalValue += currentValue;
                }
            } catch (error) {
                console.error('Error updating trade price:', error);
            }
        }

        // Calculate P&L for closed positions (realized)
        for (const trade of closedPositions) {
            if (trade.closePrice) {
                const exitValue = trade.shares * trade.closePrice;
                const realizedPnL = exitValue - trade.totalCost;
                totalPnL += realizedPnL;
            }
        }

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
        await AsyncStorage.removeItem(TRADES_STORAGE_KEY);
        await this.resetBalance();
    }
}

