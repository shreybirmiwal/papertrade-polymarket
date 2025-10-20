# 🚀 Deployment Guide

This guide covers deploying both the frontend and backend separately.

## 📱 Frontend Deployment

### Option 1: Expo (Recommended for Mobile)

```bash
cd frontend
npm install
npx expo publish
```

### Option 2: EAS Build (For App Stores)

```bash
cd frontend
npm install -g @expo/cli
eas build --platform all
```

### Option 3: Web Deployment (Vercel/Netlify)

```bash
cd frontend
npm run build
# Deploy the build folder to your hosting service
```

## 🔧 Backend Deployment

### Option 1: Railway (Recommended)

1. Connect your GitHub repository to Railway
2. Set the root directory to `backend-separate`
3. Railway will automatically detect it's a Node.js app
4. Deploy!

### Option 2: Heroku

```bash
cd backend-separate
heroku create your-app-name
git subtree push --prefix backend-separate heroku main
```

### Option 3: Vercel (Serverless)

```bash
cd backend-separate
npm install -g vercel
vercel
```

### Option 4: Your Own Server

```bash
cd backend-separate
npm install
npm start
```

## 🔗 Connecting Frontend to Backend

After deploying the backend, update the frontend environment variable:

```bash
# In your frontend deployment, set:
EXPO_PUBLIC_API_URL=https://your-backend-url.com/api/polymarket
```

## 📋 Deployment Checklist

### Frontend
- [ ] Install dependencies
- [ ] Set `EXPO_PUBLIC_API_URL` environment variable
- [ ] Test API connection
- [ ] Deploy to chosen platform

### Backend
- [ ] Install dependencies
- [ ] Set `PORT` environment variable (if needed)
- [ ] Test API endpoints
- [ ] Deploy to chosen platform
- [ ] Update frontend with backend URL

## 🌐 Example URLs

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.railway.app`
- **API Endpoint**: `https://your-backend.railway.app/api/polymarket`

## 🔧 Environment Variables

### Frontend
- `EXPO_PUBLIC_API_URL`: Backend API URL

### Backend
- `PORT`: Server port (default: 3001)
