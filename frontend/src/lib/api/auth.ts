import { User } from '@/types/asset';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    displayName: string;
    roles: string[];
  };
}

export interface UserResponse {
  id: string;
  email: string;
  display_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  roles: string[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class AuthService {
  private token: string | null = null;

  constructor() {
    // Initialize with token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
    }
  }

  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    this.setToken(data.accessToken);
    return data;
  }

  async register(userData: RegisterRequest): Promise<{ message: string; user: UserResponse }> {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(error.error || 'Registration failed');
    }

    return response.json();
  }

  async refresh(): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // Include cookies for refresh token
    });

    if (!response.ok) {
      this.clearToken();
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    this.setToken(data.accessToken);
    return data;
  }

  async logout(allDevices = false): Promise<void> {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ allDevices }),
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      this.clearToken();
    }
  }

  async getCurrentUser(): Promise<UserResponse> {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearToken();
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to get user info');
    }

    return response.json();
  }

  setToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  }

  clearToken(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export const authService = new AuthService();