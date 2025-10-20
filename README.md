# 📊 PolyPaper - Paper Trading for Polymarket

A React Native app that lets you practice trading on Polymarket prediction markets with virtual money. Perfect for learning how prediction markets work without risking real funds!

## 🏗️ Project Structure

This repository contains two separate applications that can be deployed independently:

```
PolyPaper/
├── frontend/          # React Native/Expo app
├── backend-separate/  # Express.js API proxy
└── README.md         # This file
```

## 🚀 Quick Start

### Option 1: Run Both Locally (Recommended for Development)

```bash
# Terminal 1: Start the backend
cd backend-separate
npm install
npm start

# Terminal 2: Start the frontend
cd frontend
npm install
npm run web
```

### Option 2: Run Frontend Only (Mobile)

```bash
cd frontend
npm install
npm run ios    # or npm run android
```

## 📱 Frontend (React Native/Expo)

The main application with:
- **Markets Screen**: Browse and trade on prediction markets
- **Portfolio Screen**: Track positions and P&L
- **Positions Screen**: Manage open/closed positions
- **Auto-refresh**: Real-time updates across all screens

**Location**: `frontend/`  
**Documentation**: [frontend/POLYPAPER_README.md](frontend/POLYPAPER_README.md)

## 🔧 Backend (Express.js API Proxy)

A simple backend that:
- Proxies Polymarket API requests
- Solves CORS issues for web version
- Provides reliable API access

**Location**: `backend-separate/`  
**Documentation**: [backend-separate/README.md](backend-separate/README.md)

## 🌐 Deployment

### Frontend Deployment
- **Expo**: `expo publish` or EAS Build
- **Web**: Deploy to Vercel, Netlify, etc.
- **Mobile**: App Store, Google Play Store

### Backend Deployment
- **Railway**: Connect GitHub repo, set root to `backend-separate`
- **Heroku**: Deploy `backend-separate` folder
- **Vercel**: Deploy as serverless functions
- **Your Server**: Run `npm start` in `backend-separate`

## 🔗 Environment Variables

For production deployment, set:
- `EXPO_PUBLIC_API_URL`: Backend URL (e.g., `https://your-backend.railway.app/api/polymarket`)

## 📖 Features

- 📈 **Real-time Markets**: Live Polymarket data
- 💼 **Portfolio Tracking**: Monitor your virtual trades
- 📊 **P&L Charts**: Visualize your performance
- 🔄 **Auto-refresh**: No manual reloading needed
- 📱 **Cross-platform**: Works on iOS, Android, and Web

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both frontend and backend
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details