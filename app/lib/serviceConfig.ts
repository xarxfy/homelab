export interface ProxmoxConfig {
    host: string;
    port: string;
    tokenId: string;
    tokenSecret: string;
    node?: string;
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

// Service Config
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

// Dashboard Config
export const saveDashboardConfig = (tiles: TileLayout[]): void => {
    const config: DashboardConfig = {
        tiles: tiles,
        serviceConfigs: getServiceConfigs()
    };
    localStorage.setItem('dashboardConfig', JSON.stringify(config));
};

export const loadDashboardConfig = (): DashboardConfig | null => {
    const stored = localStorage.getItem('dashboardConfig');
    if (stored) {
        const config = JSON.parse(stored);
        if (config.serviceConfigs) {
            localStorage.setItem('serviceConfigs', JSON.stringify(config.serviceConfigs));
        }
        return config;
    }
    return null;
};

export const exportDashboardConfig = (): string => {
    const config: DashboardConfig = {
        tiles: JSON.parse(localStorage.getItem('dashboardConfig') || '{"tiles":[]}').tiles || [],
        serviceConfigs: getServiceConfigs()
    };
    return JSON.stringify(config, null, 2);
};

export const importDashboardConfig = (configJson: string): DashboardConfig => {
    const config = JSON.parse(configJson);
    localStorage.setItem('dashboardConfig', JSON.stringify(config));
    if (config.serviceConfigs) {
        localStorage.setItem('serviceConfigs', JSON.stringify(config.serviceConfigs));
    }
    return config;
};