import { getToken } from './auth';

const API_URL = 'http://localhost:3001';

export interface Integration {
    id: string;
    name: string;
    type: string;
    config: Record<string, any>;
    created_at?: string;
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

export const getIntegrations = async (): Promise<Integration[]> => {
    try {
        return await fetchWithAuth(`${API_URL}/api/integrations`);
    } catch (error) {
        console.error('Failed to load integrations:', error);
        return [];
    }
};

export const saveIntegration = async (integration: Integration): Promise<void> => {
    await fetchWithAuth(`${API_URL}/api/integrations`, {
        method: 'POST',
        body: JSON.stringify(integration),
    });
};

export const deleteIntegration = async (id: string): Promise<void> => {
    await fetchWithAuth(`${API_URL}/api/integrations/${id}`, {
        method: 'DELETE',
    });
};

export const getIntegrationsByType = (type: string, integrations: Integration[]): Integration[] => {
    return integrations.filter(i => i.type === type);
};