export interface Integration {
    id: string;
    name: string;
    type: string;
    config: any;
    createdAt: string;
}

export interface ProxmoxIntegration {
    host: string;
    port: string;
    tokenId: string;
    tokenSecret: string;
}

// Integration Management
export const saveIntegration = (integration: Integration): void => {
    const integrations = getIntegrations();
    integrations[integration.id] = integration;
    localStorage.setItem('integrations', JSON.stringify(integrations));
};

export const getIntegration = (id: string): Integration | null => {
    const integrations = getIntegrations();
    return integrations[id] || null;
};

export const getIntegrations = (): Record<string, Integration> => {
    const stored = localStorage.getItem('integrations');
    return stored ? JSON.parse(stored) : {};
};

export const getIntegrationsByType = (type: string): Integration[] => {
    const integrations = getIntegrations();
    return Object.values(integrations).filter(i => i.type === type);
};

export const deleteIntegration = (id: string): void => {
    const integrations = getIntegrations();
    delete integrations[id];
    localStorage.setItem('integrations', JSON.stringify(integrations));
};

export const updateIntegration = (id: string, updates: Partial<Integration>): void => {
    const integrations = getIntegrations();
    if (integrations[id]) {
        integrations[id] = { ...integrations[id], ...updates };
        localStorage.setItem('integrations', JSON.stringify(integrations));
    }
};