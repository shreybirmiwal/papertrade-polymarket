# PolyPaper Backend

A simple Express.js backend that acts as a proxy for the Polymarket API, solving CORS issues for the web frontend.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the backend:**
   ```bash
   npm start
   ```

3. **Start the frontend (in another terminal):**
   ```bash
   cd ../frontend
   npm install
   npm run web
   ```

## 📡 API Endpoints

- `GET /api/polymarket/*` - Proxies all requests to Polymarket API
- `GET /api/health` - Health check endpoint

## 🔧 Configuration

The backend runs on port 3001 by default. You can change this by setting the `PORT` environment variable:

```bash
PORT=8080 npm start
```

## 🌐 Deployment Options

### Option 1: Railway (Recommended)
1. Connect your GitHub repo to Railway
2. Set the root directory to `backend`
3. Deploy automatically

### Option 2: Heroku
1. Create a Heroku app
2. Set buildpack to Node.js
3. Deploy the backend folder

### Option 3: Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the backend directory
3. Follow the prompts

## 🔒 Security Notes

- This is a simple proxy - no authentication required
- Rate limiting should be added for production use
- Consider adding request validation for security
