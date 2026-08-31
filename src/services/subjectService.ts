import api from './api';
import type { Subject } from '../types';

export const SubjectService = {
  getAll: async (): Promise<Subject[]> => {
    const response = await api.get('/subjects');
    console.log('SubjectService raw response:', response);
    console.log('SubjectService response.data:', response.data);
    const data = response.data;
    // Backend returns { subjects: [...] } or { data: [...] } or [...]
    return Array.isArray(data) ? data : (data?.subjects || data?.data || []);
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
