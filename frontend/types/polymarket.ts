// Polymarket API Types
export interface Market {
    id: string;
    question: string;
    conditionId: string;
    slug: string;
    outcomes: string;
    outcomePrices: string;
    volume: string;
    active: boolean;
    closed: boolean;
    endDate: string;
    clobTokenIds: string;
    description?: string;
    image?: string;
}

export interface Event {
    id: string;
    title: string;
    slug: string;
    description: string;
    image?: string;
    active: boolean;
    closed: boolean;
    volume: number;
    liquidity: number;
    markets: Market[];
    endDate?: string;
    tags?: Tag[];
}

export interface Tag {
    id: string;
    label: string;
    slug: string;
}

// Paper Trading Types
export type PositionSide = 'YES' | 'NO';
export type PositionStatus = 'OPEN' | 'CLOSED';

export interface PaperTrade {
    id: string;
    marketId: string;
    eventTitle: string;
    marketQuestion: string;
    side: PositionSide;
    shares: number;
    entryPrice: number; // Price per share (0-1)
    currentPrice?: number;
    entryDate: Date;
    closeDate?: Date;
    closePrice?: number;
    status: PositionStatus;
    totalCost: number; // shares * entryPrice
    slug: string;
}

export interface Portfolio {
    totalValue: number;
    totalPnL: number;
    openPositions: PaperTrade[];
    closedPositions: PaperTrade[];
}

