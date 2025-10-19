import { getToken } from './auth';

const API_URL = 'http://localhost:3001';

export interface Integration {
    id: string;
    name: string;
    type: string;
    config: any;
    created_at: string;
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

export async function getIntegrations(): Promise<Integration[]> {
    return fetchWithAuth(`${API_URL}/api/integrations`);
}

export async function saveIntegration(integration: Integration): Promise<void> {
    await fetchWithAuth(`${API_URL}/api/integrations`, {
        method: 'POST',
        body: JSON.stringify(integration),
    });
}

export async function updateIntegration(id: string, integration: Integration): Promise<void> {
    await fetchWithAuth(`${API_URL}/api/integrations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(integration),
    });
}

export async function deleteIntegration(id: string): Promise<void> {
    await fetchWithAuth(`${API_URL}/api/integrations/${id}`, {
        method: 'DELETE',
    });
}

export function getIntegrationsByType(type: string, integrations: Integration[]): Integration[] {
    return integrations.filter(i => i.type === type);
}