import apiClient from '../api';
import { LoginRequest, AuthResponse } from '@/types';

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });
    return response.data;
  },

  logout() {
    localStorage.clear();
    window.location.href = '/login';
  },

  getStoredUser() {
    return {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
      role: localStorage.getItem('role'),
      fullName: localStorage.getItem('fullName'),
      username: localStorage.getItem('username'),
      email: localStorage.getItem('email'),
    };
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  },

  getRole(): string | null {
    return localStorage.getItem('role');
  },
};
