import { getToken } from './auth';

const API_URL = 'http://localhost:3001';

export interface AdGuardConfig {
    host: string;
    port: string;
    username: string;
    password: string;
}

export interface AdGuardStats {
    dns_queries: number[];
    blocked_filtering: number[];
    replaced_safebrowsing: number[];
    replaced_parental: number[];
    num_dns_queries: number;
    num_blocked_filtering: number;
    num_replaced_safebrowsing: number;
    num_replaced_parental: number;
    num_replaced_safesearch: number;
    avg_processing_time: number;
    top_queried_domains: Array<{ [domain: string]: number }>;
    top_blocked_domains: Array<{ [domain: string]: number }>;
    top_clients: Array<{ [client: string]: number }>;
    top_upstream_responses?: Array<{ [upstream: string]: number }>;
    top_upstream_avg_time?: Array<{ [upstream: string]: number }>;
    time_units: string;
}

export interface AdGuardStatus {
    running: boolean;
    protection_enabled: boolean;
    dhcp_available: boolean;
    version: string;
}

export class AdGuardAPI {
    private config: AdGuardConfig;

    constructor(config: AdGuardConfig) {
        this.config = config;
    }

    private async query(endpoint: string): Promise<any> {
        const token = getToken();

        const response = await fetch(`${API_URL}/api/adguard/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                host: this.config.host,
                port: this.config.port,
                username: this.config.username,
                password: this.config.password,
                endpoint,
            }),
        });

        if (!response.ok) {
            throw new Error(`AdGuard API Error: ${response.status}`);
        }

        return response.json();
    }

    private async action(endpoint: string, method: string = 'POST', body: any = {}): Promise<any> {
        const token = getToken();

        const response = await fetch(`${API_URL}/api/adguard/action`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                host: this.config.host,
                port: this.config.port,
                username: this.config.username,
                password: this.config.password,
                endpoint,
                method,
                body,
            }),
        });

        if (!response.ok) {
            throw new Error(`AdGuard API Error: ${response.status}`);
        }

        return response.json();
    }

    async getStatus(): Promise<AdGuardStatus> {
        return this.query('/control/status');
    }

    async getStats(): Promise<AdGuardStats> {
        return this.query('/control/stats');
    }

    async getStatsConfig(): Promise<any> {
        return this.query('/control/stats_info');
    }

    async resetStats(): Promise<void> {
        await this.action('/control/stats_reset', 'POST');
    }

    async enableProtection(): Promise<void> {
        await this.action('/control/dns_config', 'POST', { protection_enabled: true });
    }

    async disableProtection(): Promise<void> {
        await this.action('/control/dns_config', 'POST', { protection_enabled: false });
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.getStatus();
            return true;
        } catch {
            return false;
        }
    }
}