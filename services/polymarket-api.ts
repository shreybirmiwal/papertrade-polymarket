import { Event, Market } from '@/types/polymarket';
import { Platform } from 'react-native';

const BASE_URL = 'https://gamma-api.polymarket.com';
// Use multiple CORS proxies as fallbacks for web to avoid CORS issues
const PROXY_URLS = Platform.OS === 'web' ? [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://cors-anywhere.herokuapp.com/',
] : [''];

export class PolymarketAPI {
    /**
     * Try multiple CORS proxies if one fails
     */
    private static async fetchWithFallback(url: string): Promise<Response> {
        for (let i = 0; i < PROXY_URLS.length; i++) {
            try {
                const proxyUrl = PROXY_URLS[i] + (Platform.OS === 'web' ? encodeURIComponent(BASE_URL + url) : BASE_URL + url);
                console.log(`🔄 Trying proxy ${i + 1}/${PROXY_URLS.length}: ${PROXY_URLS[i]}`);
                
                const response = await fetch(proxyUrl);
                
                if (response.ok) {
                    console.log(`✅ Success with proxy ${i + 1}`);
                    return response;
                } else {
                    console.log(`❌ Proxy ${i + 1} failed with status: ${response.status}`);
                }
            } catch (error) {
                console.log(`❌ Proxy ${i + 1} error:`, error);
            }
        }
        
        throw new Error('All CORS proxies failed');
    }

    /**
     * Fetch all active events/markets
     */
    static async getActiveMarkets(limit: number = 50, offset: number = 0): Promise<Event[]> {
        try {
            const response = await this.fetchWithFallback(
                `/events?closed=false&active=true&limit=${limit}&offset=${offset}`
            );

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
            const response = await this.fetchWithFallback(`/events/slug/${slug}`);
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
            const response = await this.fetchWithFallback(`/public-search?q=${encodeURIComponent(query)}`);
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

