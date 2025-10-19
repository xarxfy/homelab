import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import https from 'https';

const app = express();
app.use(cors());
app.use(express.json());

// Ignore self-signed certificates
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

// Proxy endpoint - empfängt Credentials vom Frontend
app.post('/api/proxmox/query', async (req, res) => {
    const { host, port, tokenId, tokenSecret, endpoint } = req.body;

    if (!host || !tokenId || !tokenSecret) {
        return res.status(400).json({ error: 'Missing credentials' });
    }

    try {
        const url = `https://${host}:${port || '8006'}/api2/json${endpoint}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `PVEAPIToken=${tokenId}=${tokenSecret}`,
            },
            agent: httpsAgent
        });

        if (!response.ok) {
            throw new Error(`Proxmox API Error: ${response.status}`);
        }

        const data = await response.json();
        res.json(data.data);
    } catch (error) {
        console.error('❌ Proxy Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// POST für Aktionen (Start/Stop VM)
app.post('/api/proxmox/action', async (req, res) => {
    const { host, port, tokenId, tokenSecret, endpoint, method } = req.body;

    try {
        const url = `https://${host}:${port || '8006'}/api2/json${endpoint}`;

        const response = await fetch(url, {
            method: method || 'POST',
            headers: {
                'Authorization': `PVEAPIToken=${tokenId}=${tokenSecret}`,
                'Content-Type': 'application/json',
            },
            agent: httpsAgent
        });

        if (!response.ok) {
            throw new Error(`Proxmox API Error: ${response.status}`);
        }

        const data = await response.json();
        res.json(data.data);
    } catch (error) {
        console.error('❌ Action Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════╗');
    console.log(`║  ✅ Proxmox Proxy Server läuft!       ║`);
    console.log(`║  📡 Port: ${PORT}                          ║`);
    console.log(`║  🌐 URL: http://localhost:${PORT}        ║`);
    console.log('╚════════════════════════════════════════╝');
});