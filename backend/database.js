import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'homelab.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    must_change_password BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS integrations (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    config TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS dashboards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    config TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_integrations_user ON integrations(user_id);
  CREATE INDEX IF NOT EXISTS idx_dashboards_user ON dashboards(user_id);
`);

// Create default admin user if no users exist
async function createDefaultUser() {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();

    if (userCount.count === 0) {
        console.log('📝 Erstelle Standard-Admin-User...');

        const defaultUsername = 'admin';
        const defaultEmail = 'admin@nexus.local';
        const defaultPassword = 'admin123';

        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        db.prepare(
            'INSERT INTO users (username, email, password_hash, must_change_password) VALUES (?, ?, ?, 1)'
        ).run(defaultUsername, defaultEmail, passwordHash);

        console.log('✅ Standard-User erstellt:');
        console.log('   Username: admin');
        console.log('   Password: admin123');
        console.log('   ⚠️  BITTE ÄNDERE DAS PASSWORT NACH DEM ERSTEN LOGIN!');
    }
}

// Initialize default user
await createDefaultUser();

console.log('✅ Database initialized');

export default db;