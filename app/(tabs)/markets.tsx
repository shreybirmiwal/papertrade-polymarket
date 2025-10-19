import { PaperTradingService } from '@/services/paper-trading';
import { PolymarketAPI } from '@/services/polymarket-api';
import { Event, Market, PositionSide } from '@/types/polymarket';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function MarketsScreen() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMarket, setSelectedMarket] = useState<{
        event: Event;
        market: Market;
    } | null>(null);
    const [tradeModalVisible, setTradeModalVisible] = useState(false);
    const [shares, setShares] = useState('100');
    const [balance, setBalance] = useState(0);
    const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    useEffect(() => {
        loadMarkets();
        loadBalance();
    }, []);

    const loadBalance = async () => {
        const bal = await PaperTradingService.getBalance();
        setBalance(bal);
    };

    const loadMarkets = async () => {
        try {
            setLoading(true);
            const data = await PolymarketAPI.getActiveMarkets(100);
            setEvents(data);
        } catch (error) {
            console.error('Error loading markets:', error);
            Alert.alert('Error', 'Failed to load markets');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadMarkets();
        await loadBalance();
        setRefreshing(false);
    };

    const openTradeModal = (event: Event, market: Market) => {
        setSelectedMarket({ event, market });
        setTradeModalVisible(true);
    };

    const executeTrade = async (side: PositionSide) => {
        if (!selectedMarket) return;

        const numShares = parseFloat(shares);
        if (isNaN(numShares) || numShares <= 0) {
            Alert.alert('Error', 'Please enter a valid number of shares');
            return;
        }

        const price = PolymarketAPI.getCurrentPrice(selectedMarket.market, side);
        const totalCost = numShares * price;

        if (totalCost > balance) {
            Alert.alert(
                'Insufficient Balance',
                `This trade costs $${totalCost.toFixed(2)} but you only have $${balance.toFixed(2)}`
            );
            return;
        }

        const result = await PaperTradingService.openPosition(
            selectedMarket.market.id,
            selectedMarket.event.title,
            selectedMarket.market.question,
            side,
            numShares,
            price,
            selectedMarket.event.slug
        );

        if (result.success) {
            Alert.alert('Success', result.message);
            setTradeModalVisible(false);
            setShares('100');
            await loadBalance();
        } else {
            Alert.alert('Error', result.message);
        }
    };

    const toggleEventExpanded = (eventId: string) => {
        setExpandedEvents((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(eventId)) {
                newSet.delete(eventId);
            } else {
                newSet.add(eventId);
            }
            return newSet;
        });
    };

    // Get all unique categories
    const getCategories = () => {
        const categorySet = new Set<string>();
        events.forEach(event => {
            if (event.tags && event.tags.length > 0) {
                event.tags.forEach(tag => categorySet.add(tag.label));
            }
        });
        return Array.from(categorySet).sort();
    };

    const renderMarket = ({ item: event }: { item: Event }) => {
        if (!event.markets || event.markets.length === 0) return null;

        const isExpanded = expandedEvents.has(event.id);
        const hasMultipleMarkets = event.markets.length > 1;

        return (
            <View style={styles.eventCard}>
                {hasMultipleMarkets ? (
                    <TouchableOpacity
                        style={styles.eventHeader}
                        onPress={() => toggleEventExpanded(event.id)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.eventHeaderContent}>
                            <Text style={styles.eventTitle}>{event.title}</Text>
                            <Text style={styles.marketCount}>{event.markets.length} markets</Text>
                        </View>
                        <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.eventHeaderSingle}>
                        <Text style={styles.eventTitleSingle}>{event.title}</Text>
                    </View>
                )}

                {(isExpanded || !hasMultipleMarkets) && event.markets.map((market) => {
                    const prices = PolymarketAPI.parseOutcomePrices(market.outcomePrices);
                    const yesPrice = prices[0] || 0.5;
                    const noPrice = prices[1] || 0.5;

                    return (
                        <View key={market.id} style={styles.marketCard}>
                            {hasMultipleMarkets && (
                                <Text style={styles.marketQuestion}>{market.question}</Text>
                            )}
                            <View style={styles.pricesContainer}>
                                <TouchableOpacity
                                    style={[styles.priceButton, styles.yesButton]}
                                    onPress={() => openTradeModal(event, market)}
                                >
                                    <Text style={styles.priceLabel}>YES</Text>
                                    <Text style={styles.priceValue}>{(yesPrice * 100).toFixed(0)}¢</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.priceButton, styles.noButton]}
                                    onPress={() => openTradeModal(event, market)}
                                >
                                    <Text style={styles.priceLabel}>NO</Text>
                                    <Text style={styles.priceValue}>{(noPrice * 100).toFixed(0)}¢</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}
            </View>
        );
    };

    const renderTradeModal = () => {
        if (!selectedMarket) return null;

        const yesPrice = PolymarketAPI.getCurrentPrice(selectedMarket.market, 'YES');
        const noPrice = PolymarketAPI.getCurrentPrice(selectedMarket.market, 'NO');
        const numShares = parseFloat(shares) || 0;

        return (
            <Modal
                visible={tradeModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setTradeModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{selectedMarket.event.title}</Text>
                        <Text style={styles.modalQuestion}>{selectedMarket.market.question}</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Shares:</Text>
                            <TextInput
                                style={styles.input}
                                value={shares}
                                onChangeText={setShares}
                                keyboardType="numeric"
                                placeholder="Number of shares"
                            />
                        </View>

                        <View style={styles.tradeOptions}>
                            <TouchableOpacity
                                style={[styles.tradeButton, styles.yesTradeButton]}
                                onPress={() => executeTrade('YES')}
                            >
                                <Text style={styles.tradeButtonLabel}>Buy YES</Text>
                                <Text style={styles.tradeButtonPrice}>
                                    ${(numShares * yesPrice).toFixed(2)}
                                </Text>
                                <Text style={styles.tradeButtonSubtext}>
                                    @ {(yesPrice * 100).toFixed(1)}¢
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.tradeButton, styles.noTradeButton]}
                                onPress={() => executeTrade('NO')}
                            >
                                <Text style={styles.tradeButtonLabel}>Buy NO</Text>
                                <Text style={styles.tradeButtonPrice}>
                                    ${(numShares * noPrice).toFixed(2)}
                                </Text>
                                <Text style={styles.tradeButtonSubtext}>
                                    @ {(noPrice * 100).toFixed(1)}¢
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.balanceText}>Balance: ${balance.toFixed(2)}</Text>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setTradeModalVisible(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    };

    if (loading && events.length === 0) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0066FF" />
            </View>
        );
    }

    const categories = getCategories();

    const filteredEvents = events.filter((event) => {
        // Filter by category
        if (selectedCategory) {
            const hasCategory = event.tags?.some(tag => tag.label === selectedCategory);
            if (!hasCategory) return false;
        }

        // Filter by search
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            event.title.toLowerCase().includes(query) ||
            event.markets.some((market) => market.question.toLowerCase().includes(query))
        );
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Markets</Text>
                <Text style={styles.balanceHeader}>Balance: ${balance.toFixed(2)}</Text>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search markets..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#999"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => setSearchQuery('')}
                    >
                        <Text style={styles.clearButtonText}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            {categories.length > 0 && (
                <View style={styles.categoriesContainer}>
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={[null, ...categories]}
                        keyExtractor={(item, index) => item || 'all'}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.categoryChip,
                                    selectedCategory === item && styles.categoryChipActive,
                                ]}
                                onPress={() => setSelectedCategory(item)}
                            >
                                <Text
                                    style={[
                                        styles.categoryChipText,
                                        selectedCategory === item && styles.categoryChipTextActive,
                                    ]}
                                >
                                    {item || 'All'}
                                </Text>
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={styles.categoriesList}
                    />
                </View>
            )}

            <FlatList
                data={filteredEvents}
                renderItem={renderMarket}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    searchQuery ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No markets found</Text>
                            <Text style={styles.emptySubtext}>
                                Try a different search term
                            </Text>
                        </View>
                    ) : null
                }
            />

            {renderTradeModal()}
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
    balanceHeader: {
        fontSize: 16,
        color: '#0066FF',
        fontWeight: '600',
    },
    list: {
        padding: 16,
    },
    eventCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    eventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 12,
    },
    eventHeaderContent: {
        flex: 1,
    },
    eventHeaderSingle: {
        padding: 16,
        paddingBottom: 8,
    },
    eventTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    eventTitleSingle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    marketCount: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    expandIcon: {
        fontSize: 14,
        color: '#666',
        marginLeft: 12,
    },
    marketCard: {
        marginBottom: 12,
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    marketQuestion: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    pricesContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    priceButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    yesButton: {
        backgroundColor: '#E8F5E9',
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    noButton: {
        backgroundColor: '#FFEBEE',
        borderWidth: 1,
        borderColor: '#F44336',
    },
    priceLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    priceValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    modalQuestion: {
        fontSize: 16,
        color: '#666',
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    tradeOptions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    tradeButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    yesTradeButton: {
        backgroundColor: '#4CAF50',
    },
    noTradeButton: {
        backgroundColor: '#F44336',
    },
    tradeButtonLabel: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    tradeButtonPrice: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    tradeButtonSubtext: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12,
        marginTop: 4,
    },
    balanceText: {
        textAlign: 'center',
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    cancelButton: {
        padding: 16,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#0066FF',
        fontSize: 16,
        fontWeight: '600',
    },
    searchContainer: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 16,
        marginTop: 8,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    searchInput: {
        flex: 1,
        padding: 12,
        fontSize: 16,
        color: '#333',
    },
    clearButton: {
        padding: 8,
    },
    clearButtonText: {
        fontSize: 18,
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
    categoriesContainer: {
        marginBottom: 16,
    },
    categoriesList: {
        paddingHorizontal: 16,
        gap: 8,
    },
    categoryChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    categoryChipActive: {
        backgroundColor: '#0066FF',
        borderColor: '#0066FF',
    },
    categoryChipText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    categoryChipTextActive: {
        color: '#fff',
    },
});

