# 📊 PolyPaper - Paper Trading for Polymarket

A React Native app that lets you practice trading on Polymarket prediction markets with virtual money. Perfect for learning how prediction markets work without risking real funds!

## 🌟 Features

### 📈 Markets Screen
- Browse live Polymarket prediction markets
- View real-time YES/NO prices
- Easy-to-use trading interface
- Pull to refresh for latest data

### 💼 Portfolio Screen
- Track open and closed positions
- View real-time P&L (profit & loss)
- Monitor individual trade performance
- Close positions at current market prices
- Reset portfolio to start fresh

### 🏠 Home Screen
- View your virtual balance ($10,000 starting)
- Quick access to Markets and Portfolio
- Learn how paper trading works

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install

# Start the app
npm start
```

### Run on Device/Simulator

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## 📱 How to Use

### 1. Browse Markets
- Navigate to the **Markets** tab
- Scroll through available prediction markets
- Tap on any market card to view details

### 2. Make a Trade
- Tap on a market you're interested in
- Enter the number of shares you want to buy
- Choose YES or NO
- Confirm your trade
- The cost will be deducted from your balance

### 3. Track Your Performance
- Go to the **Portfolio** tab
- View your open positions
- See real-time P&L for each position
- Tap "Close" on any position to sell at current price

### 4. Reset Portfolio
- Tap "Reset" in the Portfolio screen
- Confirms deletion of all trades
- Balance resets to $10,000

## 🏗️ Project Structure

```
PolyPaper/
├── app/
│   └── (tabs)/
│       ├── _layout.tsx       # Tab navigation
│       ├── index.tsx          # Home screen
│       ├── markets.tsx        # Markets browser
│       └── portfolio.tsx      # Portfolio tracker
├── services/
│   ├── polymarket-api.ts      # Polymarket API client
│   └── paper-trading.ts       # Trading logic & storage
├── types/
│   └── polymarket.ts          # TypeScript interfaces
└── components/                # UI components
```

## 🔧 Technical Details

### Data Storage
- Uses `AsyncStorage` for persisting trades locally
- No backend required - all data stored on device
- Supports multiple portfolios per device

### API Integration
- Connects to Polymarket Gamma API
- Fetches real-time market data
- No authentication required for read-only access

### Key Technologies
- **React Native** with Expo
- **TypeScript** for type safety
- **Expo Router** for navigation
- **AsyncStorage** for persistence

## 📊 Understanding Paper Trading

### What is Paper Trading?
Paper trading is practice trading with virtual money. It lets you:
- Learn how prediction markets work
- Test strategies without risk
- Build confidence before real trading
- Track your prediction accuracy

### How Pricing Works
- Prices range from 0¢ to 100¢
- Price represents probability (50¢ = 50% chance)
- If YES wins, YES holders get $1 per share
- If NO wins, NO holders get $1 per share

### Example Trade
1. Market: "Will it rain tomorrow?"
2. YES price: 60¢ (60% probability)
3. You buy 100 YES shares = $60 cost
4. If it rains: You get $100 (profit: $40)
5. If it doesn't rain: You get $0 (loss: $60)

## 🎯 Use Cases

### For Beginners
- Learn prediction market mechanics
- Understand probability pricing
- Practice without financial risk

### For Traders
- Test new strategies
- Analyze market movements
- Track prediction accuracy

### For Students
- Study market efficiency
- Research prediction markets
- Analyze crowd wisdom

## 🔮 Future Enhancements

Potential features to add:
- [ ] Historical trade charts
- [ ] Performance analytics
- [ ] Market search & filters
- [ ] Share positions with friends
- [ ] Leaderboards
- [ ] Export trade history
- [ ] Custom starting balance
- [ ] Multiple portfolios
- [ ] Price alerts

## 📝 API Reference

### Polymarket Gamma API
- Base URL: `https://gamma-api.polymarket.com`
- No API key required
- Rate limits apply

Key Endpoints Used:
- `GET /events` - List all markets
- `GET /events/slug/{slug}` - Get specific market
- `GET /public-search` - Search markets

## ⚠️ Disclaimer

This is a **simulation tool only**. No real money is used. Market data is provided by Polymarket's public API. This app is not affiliated with Polymarket.

For real trading, visit [polymarket.com](https://polymarket.com)

## 🤝 Contributing

Feel free to fork and improve! Some ideas:
- Add more market analytics
- Improve UI/UX
- Add social features
- Enhance performance tracking

## 📄 License

MIT License - feel free to use and modify!

---

**Happy Paper Trading! 📊🎯**

