import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/api';

class ApiClient {
  private baseUrl: string;
  private onUnauthorized?: () => void;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setOnUnauthorized(callback: () => void) {
    this.onUnauthorized = callback;
  }

  private async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('auth_token');
    } catch {
      return null;
    }
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    timeoutMs: number = 15000
  ): Promise<{ success: boolean; error?: string; message?: string } & T> {
    const token = await this.getToken();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      const data = await response.json();

      if (response.status === 401 && this.onUnauthorized) {
        this.onUnauthorized();
      }

      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request timed out' } as any;
      }
      return { success: false, error: error.message || 'Network error' } as any;
    } finally {
      clearTimeout(timeout);
    }
  }

  get<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T = any>(endpoint: string, body: any, timeoutMs?: number) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }, timeoutMs);
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
