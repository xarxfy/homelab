import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import https from 'https';
import bcrypt from 'bcrypt';
import db from './database.js';
import { authenticateToken, generateToken } from './middleware/auth.js';

const app = express();
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// Ignore self-signed certificates
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

// ==================== PROXMOX TEST (OHNE AUTH) ====================

app.post('/api/proxmox/test', async (req, res) => {
    const { host, port, tokenId, tokenSecret } = req.body;

    console.log('🧪 Testing Proxmox connection:', host);

    if (!host || !tokenId || !tokenSecret) {
        return res.status(400).json({ error: 'Missing credentials' });
    }

    try {
        const url = `https://${host}:${port || '8006'}/api2/json/nodes`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `PVEAPIToken=${tokenId}=${tokenSecret}`,
            },
            agent: httpsAgent
        });

        if (!response.ok) {
            throw new Error(`Proxmox API returned status ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Connection test successful');
        res.json({ success: true, data: data.data });
    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        res.status(500).json({ error: error.message, success: false });
    }
});

// ============================================
// ADGUARD HOME PROXY
// ============================================

// AdGuard Home Query (GET requests)
app.post('/api/adguard/query', authenticateToken, async (req, res) => {
    const { host, port, username, password, endpoint } = req.body;

    if (!host || !username || !password || !endpoint) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const url = `http://${host}:${port}${endpoint}`;
        const auth = Buffer.from(`${username}:${password}`).toString('base64');

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`AdGuard API returned ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('AdGuard API Error:', error);
        res.status(500).json({ error: error.message || 'AdGuard API request failed' });
    }
});

// AdGuard Home Action (POST/PUT/DELETE requests)
app.post('/api/adguard/action', authenticateToken, async (req, res) => {
    const { host, port, username, password, endpoint, method = 'POST', body = {} } = req.body;

    if (!host || !username || !password || !endpoint) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const url = `http://${host}:${port}${endpoint}`;
        const auth = Buffer.from(`${username}:${password}`).toString('base64');

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
            },
            body: method !== 'GET' ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            throw new Error(`AdGuard API returned ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('AdGuard Action Error:', error);
        res.status(500).json({ error: error.message || 'AdGuard action failed' });
    }
});

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
        const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?')
            .get(username, email);

        if (existing) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = db.prepare(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
        ).run(username, email, passwordHash);

        const user = { id: result.lastInsertRowid, username, email };
        const token = generateToken(user);

        res.json({ user, token });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    try {
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, user.password_hash);

        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken(user);

        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                must_change_password: user.must_change_password === 1
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Update user profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
    const { username, email, currentPassword, newPassword } = req.body;

    if (!username || !email) {
        return res.status(400).json({ error: 'Username and email required' });
    }

    try {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if current password is provided when changing password
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ error: 'Current password required to change password' });
            }

            const valid = await bcrypt.compare(currentPassword, user.password_hash);
            if (!valid) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ error: 'New password must be at least 6 characters' });
            }

            const newPasswordHash = await bcrypt.hash(newPassword, 10);

            db.prepare(
                'UPDATE users SET username = ?, email = ?, password_hash = ?, must_change_password = 0 WHERE id = ?'
            ).run(username, email, newPasswordHash, req.user.id);
        } else {
            db.prepare(
                'UPDATE users SET username = ?, email = ?, must_change_password = 0 WHERE id = ?'
            ).run(username, email, req.user.id);
        }

        const updatedUser = { id: req.user.id, username, email, must_change_password: false };
        const token = generateToken(updatedUser);

        res.json({
            user: updatedUser,
            token
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

// ==================== INTEGRATIONS ROUTES ====================

// Get all integrations for current user
app.get('/api/integrations', authenticateToken, (req, res) => {
    try {
        const integrations = db.prepare(
            'SELECT id, name, type, config, created_at FROM integrations WHERE user_id = ?'
        ).all(req.user.id);

        const parsed = integrations.map(i => ({
            ...i,
            config: JSON.parse(i.config)
        }));

        res.json(parsed);
    } catch (error) {
        console.error('Get integrations error:', error);
        res.status(500).json({ error: 'Failed to fetch integrations' });
    }
});

// Create integration
app.post('/api/integrations', authenticateToken, (req, res) => {
    const { id, name, type, config } = req.body;

    if (!id || !name || !type || !config) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        db.prepare(
            'INSERT INTO integrations (id, user_id, name, type, config) VALUES (?, ?, ?, ?, ?)'
        ).run(id, req.user.id, name, type, JSON.stringify(config));

        res.json({ success: true, integration: { id, name, type, config } });
    } catch (error) {
        console.error('Create integration error:', error);
        res.status(500).json({ error: 'Failed to create integration' });
    }
});

// Update integration
app.put('/api/integrations/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { name, type, config } = req.body;

    try {
        const result = db.prepare(
            'UPDATE integrations SET name = ?, type = ?, config = ? WHERE id = ? AND user_id = ?'
        ).run(name, type, JSON.stringify(config), id, req.user.id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Integration not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Update integration error:', error);
        res.status(500).json({ error: 'Failed to update integration' });
    }
});

// Delete integration
app.delete('/api/integrations/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    try {
        const result = db.prepare(
            'DELETE FROM integrations WHERE id = ? AND user_id = ?'
        ).run(id, req.user.id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Integration not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Delete integration error:', error);
        res.status(500).json({ error: 'Failed to delete integration' });
    }
});

// ==================== DASHBOARD ROUTES ====================

// Get dashboard
app.get('/api/dashboard', authenticateToken, (req, res) => {
    try {
        const dashboard = db.prepare(
            'SELECT config FROM dashboards WHERE user_id = ?'
        ).get(req.user.id);

        if (!dashboard) {
            return res.json({ tiles: [], serviceConfigs: {} });
        }

        res.json(JSON.parse(dashboard.config));
    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard' });
    }
});

// Save dashboard
app.put('/api/dashboard', authenticateToken, (req, res) => {
    const { tiles, serviceConfigs } = req.body;

    if (!tiles || !serviceConfigs) {
        return res.status(400).json({ error: 'Invalid dashboard config' });
    }

    try {
        const config = JSON.stringify({ tiles, serviceConfigs });

        db.prepare(`
            INSERT INTO dashboards (user_id, config, updated_at) 
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) 
            DO UPDATE SET config = ?, updated_at = CURRENT_TIMESTAMP
        `).run(req.user.id, config, config);

        res.json({ success: true });
    } catch (error) {
        console.error('Save dashboard error:', error);
        res.status(500).json({ error: 'Failed to save dashboard' });
    }
});

// ==================== PROXMOX PROXY ROUTES (MIT AUTH) ====================

app.post('/api/proxmox/query', authenticateToken, async (req, res) => {
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

app.post('/api/proxmox/action', authenticateToken, async (req, res) => {
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
    console.log(`║  ✅ Homelab Backend läuft!            ║`);
    console.log(`║  📡 Port: ${PORT}                          ║`);
    console.log(`║  🌐 URL: http://localhost:${PORT}        ║`);
    console.log(`║  🗄️  Database: SQLite                  ║`);
    console.log('╚════════════════════════════════════════╝');
});