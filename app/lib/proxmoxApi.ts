import type { ProxmoxConfig } from './serviceConfig';

export interface ProxmoxVM {
    vmid: number;
    name: string;
    status: string;
    cpu: number;
    mem: number;
    maxmem: number;
    disk: number;
    maxdisk: number;
    uptime: number;
    type: 'qemu' | 'lxc';
}

export interface ProxmoxNodeStats {
    cpu: number;
    memory: {
        used: number;
        total: number;
    };
    uptime: number;
}

export class ProxmoxAPI {
    private config: ProxmoxConfig;
    private proxyUrl: string = '/api/proxmox';

    constructor(config: ProxmoxConfig) {
        this.config = config;
    }

    private async query(endpoint: string) {
        const response = await fetch(`${this.proxyUrl}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                host: this.config.host,
                port: this.config.port,
                tokenId: this.config.tokenId,
                tokenSecret: this.config.tokenSecret,
                endpoint: endpoint,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'API Error');
        }

        return response.json();
    }

    private async action(endpoint: string, method: string = 'POST') {
        const response = await fetch(`${this.proxyUrl}/action`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                host: this.config.host,
                port: this.config.port,
                tokenId: this.config.tokenId,
                tokenSecret: this.config.tokenSecret,
                endpoint: endpoint,
                method: method,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Action Error');
        }

        return response.json();
    }

    async getNodes(): Promise<any[]> {
        return this.query('/nodes');
    }

    async getNodeStats(node: string): Promise<ProxmoxNodeStats> {
        const status = await this.query(`/nodes/${node}/status`);
        return {
            cpu: status.cpu * 100,
            memory: {
                used: status.memory.used,
                total: status.memory.total,
            },
            uptime: status.uptime,
        };
    }

    async getVMs(node: string): Promise<ProxmoxVM[]> {
        const [qemu, lxc] = await Promise.all([
            this.query(`/nodes/${node}/qemu`).catch(() => []),
            this.query(`/nodes/${node}/lxc`).catch(() => []),
        ]);

        const vms: ProxmoxVM[] = [
            ...qemu.map((vm: any) => ({ ...vm, type: 'qemu' as const })),
            ...lxc.map((ct: any) => ({ ...ct, type: 'lxc' as const })),
        ];

        return vms;
    }

    async startVM(node: string, vmid: number, type: 'qemu' | 'lxc'): Promise<void> {
        await this.action(`/nodes/${node}/${type}/${vmid}/status/start`);
    }

    async stopVM(node: string, vmid: number, type: 'qemu' | 'lxc'): Promise<void> {
        await this.action(`/nodes/${node}/${type}/${vmid}/status/stop`);
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.getNodes();
            return true;
        } catch {
            return false;
        }
    }
}