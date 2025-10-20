import { Event, Market } from '@/types/polymarket';
import { Platform } from 'react-native';

// Use backend proxy for web, direct API for mobile
const API_BASE_URL = Platform.OS === 'web' 
    ? (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api/polymarket')  // Backend proxy
    : 'https://gamma-api.polymarket.com';     // Direct API for mobile

export class PolymarketAPI {
    /**
     * Make API request with proper error handling
     */
    private static async makeRequest(url: string): Promise<Response> {
        const fullUrl = `${API_BASE_URL}${url}`;
        console.log(`🔄 Making API request to: ${fullUrl}`);

        const response = await fetch(fullUrl, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        console.log(`✅ API request successful`);
        return response;
    }

    /**
     * Fetch all active events/markets
     */
    static async getActiveMarkets(limit: number = 50, offset: number = 0): Promise<Event[]> {
        try {
            const response = await this.makeRequest(
                `/events?closed=false&active=true&limit=${limit}&offset=${offset}`
            );
            return await response.json();
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
            const response = await this.makeRequest(`/events/slug/${slug}`);
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
            const response = await this.makeRequest(`/public-search?q=${encodeURIComponent(query)}`);
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

