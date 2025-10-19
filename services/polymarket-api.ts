import { Event, Market } from '@/types/polymarket';

const BASE_URL = 'https://gamma-api.polymarket.com';

export class PolymarketAPI {
    /**
     * Fetch all active events/markets
     */
    static async getActiveMarkets(limit: number = 50, offset: number = 0): Promise<Event[]> {
        try {
            const response = await fetch(
                `${BASE_URL}/events?closed=false&active=true&limit=${limit}&offset=${offset}`
            );

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching markets:', error);
            throw error;
        }
    }

    /**
     * Fetch event by slug
     */
    static async getEventBySlug(slug: string): Promise<Event> {
        try {
            const response = await fetch(`${BASE_URL}/events/slug/${slug}`);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching event:', error);
            throw error;
        }
    }

    /**
     * Search markets
     */
    static async searchMarkets(query: string): Promise<{ events: Event[] }> {
        try {
            const response = await fetch(`${BASE_URL}/public-search?q=${encodeURIComponent(query)}`);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error searching markets:', error);
            throw error;
        }
    }

    /**
     * Parse outcome prices from string to array of numbers
     */
    static parseOutcomePrices(outcomePricesStr: string): number[] {
        try {
            return JSON.parse(outcomePricesStr);
        } catch {
            return [];
        }
    }

    /**
     * Parse outcomes from string to array
     */
    static parseOutcomes(outcomesStr: string): string[] {
        try {
            return JSON.parse(outcomesStr);
        } catch {
            return [];
        }
    }

    /**
     * Get current price for a market
     */
    static getCurrentPrice(market: Market, side: 'YES' | 'NO'): number {
        const prices = this.parseOutcomePrices(market.outcomePrices);
        const outcomes = this.parseOutcomes(market.outcomes);

        const index = outcomes.findIndex(o => o.toUpperCase() === side);
        return index >= 0 && prices[index] ? prices[index] : 0.5;
    }
}

