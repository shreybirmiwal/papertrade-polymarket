const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files from the React app build
app.use(express.static(path.join(__dirname, '../web-build')));

// Proxy endpoint for Polymarket API
app.get('/api/polymarket/*', async (req, res) => {
    try {
        const apiPath = req.params[0]; // Get everything after /api/polymarket/
        const queryString = req.url.split('?')[1] || '';
        const fullUrl = `https://gamma-api.polymarket.com/${apiPath}${queryString ? '?' + queryString : ''}`;
        
        console.log(`🔄 Proxying request to: ${fullUrl}`);
        
        const response = await fetch(fullUrl, {
            headers: {
                'User-Agent': 'PolyPaper/1.0',
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.error(`❌ API Error: ${response.status} ${response.statusText}`);
            return res.status(response.status).json({ 
                error: `API Error: ${response.status}`,
                message: response.statusText 
            });
        }

        const data = await response.json();
        console.log(`✅ Successfully proxied request`);
        res.json(data);
        
    } catch (error) {
        console.error('❌ Proxy error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../web-build/index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 PolyPaper backend running on port ${PORT}`);
    console.log(`📡 API proxy available at http://localhost:${PORT}/api/polymarket/`);
});
