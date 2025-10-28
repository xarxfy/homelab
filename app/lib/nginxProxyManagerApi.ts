import { getToken } from './auth';

const API_URL = 'http://localhost:3001';

export interface NginxProxyManagerConfig {
    host: string;
    port: string;
    email: string;
    password: string;
}

export interface ProxyHost {
    id: number;
    domain_names: string[];
    forward_host: string;
    forward_port: number;
    certificate_id: number;
    ssl_forced: boolean;
    http2_support: boolean;
    enabled: boolean;
    created_on: string;
    modified_on: string;
}

export interface Certificate {
    id: number;
    provider: string;
    nice_name: string;
    domain_names: string[];
    expires_on: string;
}

export interface Stats {
    proxy_hosts: number;
    redirection_hosts: number;
    streams: number;
    dead_hosts: number;
    certificates: number;
    users: number;
}

export class NginxProxyManagerAPI {
    private config: NginxProxyManagerConfig;
    private token: string | null = null;

    constructor(config: NginxProxyManagerConfig) {
        this.config = config;
    }

    private async authenticate(): Promise<string> {
        if (this.token) return this.token;

        const authToken = getToken();
        const response = await fetch(`${API_URL}/api/nginx-proxy-manager/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                host: this.config.host,
                port: this.config.port,
                email: this.config.email,
                password: this.config.password,
            }),
        });

        if (!response.ok) {
            throw new Error(`NPM Auth failed: ${response.status}`);
        }

        const data = await response.json();
        this.token = data.token;

        if (!this.token) {
            throw new Error('No token received from NPM');
        }

        return this.token;
    }

    private async query(endpoint: string): Promise<any> {
        const npmToken = await this.authenticate();
        const authToken = getToken();

        const response = await fetch(`${API_URL}/api/nginx-proxy-manager/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                host: this.config.host,
                port: this.config.port,
                token: npmToken,
                endpoint,
            }),
        });

        if (!response.ok) {
            throw new Error(`NPM API Error: ${response.status}`);
        }

        return response.json();
    }

    private async action(endpoint: string, method: string = 'POST', body: any = {}): Promise<any> {
        const npmToken = await this.authenticate();
        const authToken = getToken();

        const response = await fetch(`${API_URL}/api/nginx-proxy-manager/action`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                host: this.config.host,
                port: this.config.port,
                token: npmToken,
                endpoint,
                method,
                body,
            }),
        });

        if (!response.ok) {
            throw new Error(`NPM API Error: ${response.status}`);
        }

        return response.json();
    }

    async getProxyHosts(): Promise<ProxyHost[]> {
        return this.query('/api/nginx/proxy-hosts');
    }

    async getCertificates(): Promise<Certificate[]> {
        return this.query('/api/nginx/certificates');
    }

    async toggleProxyHost(hostId: number, enabled: boolean): Promise<ProxyHost> {
        return this.action(`/api/nginx/proxy-hosts/${hostId}`, 'PUT', { enabled });
    }

    async getStats(): Promise<Stats> {
        const [hosts, certs] = await Promise.all([
            this.getProxyHosts(),
            this.getCertificates()
        ]);

        const enabledHosts = hosts.filter(h => h.enabled).length;
        const disabledHosts = hosts.filter(h => !h.enabled).length;

        return {
            proxy_hosts: hosts.length,
            redirection_hosts: 0,
            streams: 0,
            dead_hosts: disabledHosts,
            certificates: certs.length,
            users: 0,
        };
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.authenticate();
            return true;
        } catch {
            return false;
        }
    }
}