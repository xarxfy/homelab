const API_URL = 'http://localhost:3001';

interface User {
    id: number;
    username: string;
    email: string;
}

interface AuthResponse {
    user: User;
    token: string;
}

export async function register(username: string, email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
    }

    const data = await response.json();

    // Save token
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
}

export async function login(username: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();

    // Save token
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
}

export function logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}

export function getToken(): string | null {
    return localStorage.getItem('auth_token');
}

export function getUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

export function isAuthenticated(): boolean {
    return !!getToken();
}