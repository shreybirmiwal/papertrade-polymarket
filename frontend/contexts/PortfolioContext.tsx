import { PaperTradingService, PnLSnapshot } from '@/services/paper-trading';
import { Portfolio } from '@/types/polymarket';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface PortfolioContextType {
    portfolio: Portfolio | null;
    balance: number;
    pnlHistory: PnLSnapshot[];
    loading: boolean;
    refreshing: boolean;
    loadPortfolio: () => Promise<void>;
    refreshPortfolio: () => Promise<void>;
    updateBalance: () => Promise<void>;
    clearPortfolio: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

interface PortfolioProviderProps {
    children: ReactNode;
}

export function PortfolioProvider({ children }: PortfolioProviderProps) {
    const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
    const [balance, setBalance] = useState(0);
    const [pnlHistory, setPnlHistory] = useState<PnLSnapshot[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadPortfolio = async () => {
        try {
            setLoading(true);
            const [portfolioData, balanceData, historyData] = await Promise.all([
                PaperTradingService.getPortfolio(),
                PaperTradingService.getBalance(),
                PaperTradingService.getFilteredPnLHistory('week')
            ]);

            setPortfolio(portfolioData);
            setBalance(balanceData);
            setPnlHistory(historyData);
        } catch (error) {
            console.error('Error loading portfolio:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshPortfolio = async () => {
        try {
            setRefreshing(true);
            const [portfolioData, balanceData, historyData] = await Promise.all([
                PaperTradingService.getPortfolio(),
                PaperTradingService.getBalance(),
                PaperTradingService.getFilteredPnLHistory('week')
            ]);

            setPortfolio(portfolioData);
            setBalance(balanceData);
            setPnlHistory(historyData);
        } catch (error) {
            console.error('Error refreshing portfolio:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const updateBalance = async () => {
        try {
            const balanceData = await PaperTradingService.getBalance();
            setBalance(balanceData);
        } catch (error) {
            console.error('Error updating balance:', error);
        }
    };

    const clearPortfolio = async () => {
        try {
            setRefreshing(true);
            await PaperTradingService.clearAllTrades();
            await loadPortfolio();
        } catch (error) {
            console.error('Error clearing portfolio:', error);
        } finally {
            setRefreshing(false);
        }
    };

    // Load portfolio on mount
    useEffect(() => {
        loadPortfolio();
    }, []);

    const value: PortfolioContextType = {
        portfolio,
        balance,
        pnlHistory,
        loading,
        refreshing,
        loadPortfolio,
        refreshPortfolio,
        updateBalance,
        clearPortfolio,
    };

    return (
        <PortfolioContext.Provider value={value}>
            {children}
        </PortfolioContext.Provider>
    );
}

export function usePortfolio() {
    const context = useContext(PortfolioContext);
    if (context === undefined) {
        throw new Error('usePortfolio must be used within a PortfolioProvider');
    }
    return context;
}
