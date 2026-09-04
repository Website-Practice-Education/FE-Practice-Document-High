import api from './api';
import type { Subject } from '../types';

const normalizeArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.$values)) return data.data.$values;
  if (data && typeof data === 'object') {
    const keys = ['subjects', 'data', 'items', 'results', 'records'];
    for (const key of keys) {
      const value = data[key];
      if (Array.isArray(value)) return value;
      if (value && Array.isArray(value.$values)) return value.$values;
    }
  }
  return [];
};

export const SubjectService = {
  getAll: async (): Promise<Subject[]> => {
    const response = await api.get('/subjects');
    return normalizeArray(response.data) as Subject[];
  },

  getById: async (id: number): Promise<Subject> => {
    const response = await api.get(`/subjects/${id}`);
    return response.data;
  },

  create: async (subject: Omit<Subject, 'id'>): Promise<Subject> => {
    const response = await api.post('/subjects', subject);
    return response.data;
  },

  update: async (id: number, subject: Subject): Promise<void> => {
    await api.put(`/subjects/${id}`, subject);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/subjects/${id}`);
  },
};
