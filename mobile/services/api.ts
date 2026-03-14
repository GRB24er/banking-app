import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/api';

class ApiClient {
  private baseUrl: string;
  private onUnauthorized?: () => void;
  private maxRetries: number = 2;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setOnUnauthorized(callback: () => void) {
    this.onUnauthorized = callback;
  }

  private async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('auth_token');
    } catch (err) {
      console.warn('Failed to retrieve auth token:', err);
      return null;
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    timeoutMs: number = 15000,
    retries: number = 0
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

      if (response.status === 401 && this.onUnauthorized) {
        this.onUnauthorized();
        return { success: false, error: 'Session expired. Please sign in again.' } as any;
      }

      if (response.status >= 500 && retries < this.maxRetries) {
        await this.delay(1000 * (retries + 1));
        return this.request<T>(endpoint, options, timeoutMs, retries + 1);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        if (retries < this.maxRetries) {
          await this.delay(1000 * (retries + 1));
          return this.request<T>(endpoint, options, timeoutMs, retries + 1);
        }
        return { success: false, error: 'Request timed out. Please check your connection.' } as any;
      }
      if (retries < this.maxRetries && options.method === 'GET') {
        await this.delay(1000 * (retries + 1));
        return this.request<T>(endpoint, options, timeoutMs, retries + 1);
      }
      return { success: false, error: error.message || 'Network error. Please try again.' } as any;
    } finally {
      clearTimeout(timeout);
    }
  }

  get<T = any>(endpoint: string, timeoutMs?: number) {
    return this.request<T>(endpoint, { method: 'GET' }, timeoutMs);
  }

  post<T = any>(endpoint: string, body: any, timeoutMs?: number) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }, timeoutMs);
  }

  put<T = any>(endpoint: string, body: any, timeoutMs?: number) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }, timeoutMs);
  }

  delete<T = any>(endpoint: string, timeoutMs?: number) {
    return this.request<T>(endpoint, { method: 'DELETE' }, timeoutMs);
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
