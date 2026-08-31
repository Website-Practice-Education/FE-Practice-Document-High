import api from './api';
import type { User, ForgotPasswordRequest, ResetPasswordRequest, PasswordResetResponse } from '../types';

export const UserService = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },

  getById: async (id: number): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  getByEmail: async (email: string): Promise<User> => {
    const response = await api.get(`/users/email/${email}`);
    return response.data;
  },

  getByRole: async (role: string): Promise<User[]> => {
    const response = await api.get(`/users/role/${role}`);
    return response.data;
  },

  search: async (keyword?: string, role?: string, isActive?: boolean): Promise<User[]> => {
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (role) params.append('role', role);
    if (isActive !== undefined) params.append('isActive', String(isActive));
    const response = await api.get(`/users/search?${params.toString()}`);
    return response.data;
  },

  getRecentlyActive: async (count = 10): Promise<User[]> => {
    const response = await api.get(`/users/recently-active?count=${count}`);
    return response.data;
  },

  getInactive: async (days = 90): Promise<User[]> => {
    const response = await api.get(`/users/inactive?days=${days}`);
    return response.data;
  },

  getCount: async (): Promise<number> => {
    const response = await api.get('/users/count');
    return response.data.totalUsers;
  },

  create: async (user: Omit<User, 'id'>): Promise<User> => {
    const response = await api.post('/users', user);
    return response.data;
  },

  update: async (id: number, user: User): Promise<void> => {
    await api.put(`/users/${id}`, user);
  },

  updateProfile: async (id: number, data: { fullName?: string; grade?: number; avatarUrl?: string }): Promise<User> => {
    const response = await api.put(`/users/${id}/profile`, data);
    return response.data;
  },

  updateRole: async (id: number, role: string): Promise<void> => {
    await api.put(`/users/${id}/role`, { role });
  },

  updateStatus: async (id: number, isActive: boolean): Promise<void> => {
    await api.put(`/users/${id}/status`, { isActive });
  },

  lockAccount: async (id: number, lockUntil: string): Promise<void> => {
    await api.post(`/users/${id}/lock`, { lockUntil });
  },

  unlockAccount: async (id: number): Promise<void> => {
    await api.post(`/users/${id}/unlock`);
  },

  changePassword: async (id: number, currentPassword: string, newPassword: string): Promise<void> => {
    await api.post(`/users/${id}/change-password`, { currentPassword, newPassword });
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  deleteMultiple: async (userIds: number[]): Promise<{ successCount: number; failedCount: number }> => {
    const response = await api.post('/users/delete-multiple', { userIds });
    return response.data;
  },

  // Password Reset
  forgotPassword: async (email: string): Promise<PasswordResetResponse> => {
    const response = await api.post<PasswordResetResponse>('/users/forgot-password', { email } as ForgotPasswordRequest);
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<PasswordResetResponse> => {
    const response = await api.post<PasswordResetResponse>('/users/reset-password', {
      token,
      newPassword
    } as ResetPasswordRequest);
    return response.data;
  },
};
