import { getToken } from './auth';

const API_URL = 'http://localhost:3001';

export interface ProxmoxConfig {
    host: string;
    port: string;
    tokenId: string;
    tokenSecret: string;
    node?: string;
    integrationId?: string;
}

export interface ServiceConfig {
    id: string;
    type: string;
    config: ProxmoxConfig | Record<string, any>;
}

export interface TileLayout {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    title: string;
    type: string;
}

export interface DashboardConfig {
    tiles: TileLayout[];
    serviceConfigs: Record<string, ServiceConfig>;
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = getToken();

    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Authentication expired');
    }

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
    }

    return response.json();
}

// Service Config (localStorage für Widget-Rendering während der Session)
export const saveServiceConfig = (serviceId: string, config: ServiceConfig): void => {
    const configs = getServiceConfigs();
    configs[serviceId] = config;
    localStorage.setItem('serviceConfigs', JSON.stringify(configs));
};

export const getServiceConfig = (serviceId: string): ServiceConfig | null => {
    const configs = getServiceConfigs();
    return configs[serviceId] || null;
};

export const getServiceConfigs = (): Record<string, ServiceConfig> => {
    const stored = localStorage.getItem('serviceConfigs');
    return stored ? JSON.parse(stored) : {};
};

export const deleteServiceConfig = (serviceId: string): void => {
    const configs = getServiceConfigs();
    delete configs[serviceId];
    localStorage.setItem('serviceConfigs', JSON.stringify(configs));
};

// Dashboard Config (Backend API)
export const saveDashboardConfig = async (tiles: TileLayout[]): Promise<void> => {
    const config: DashboardConfig = {
        tiles: tiles,
        serviceConfigs: getServiceConfigs()
    };

    await fetchWithAuth(`${API_URL}/api/dashboard`, {
        method: 'PUT',
        body: JSON.stringify(config),
    });

    console.log('✅ Dashboard in Datenbank gespeichert!');
};

export const loadDashboardConfig = async (): Promise<DashboardConfig> => {
    try {
        const config = await fetchWithAuth(`${API_URL}/api/dashboard`);

        // Lade Service-Configs in LocalStorage (für Widget-Rendering)
        if (config.serviceConfigs) {
            localStorage.setItem('serviceConfigs', JSON.stringify(config.serviceConfigs));
        }

        return config;
    } catch (error) {
        console.error('Failed to load dashboard:', error);
        return { tiles: [], serviceConfigs: {} };
    }
};