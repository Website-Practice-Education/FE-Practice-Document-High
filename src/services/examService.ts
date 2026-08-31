import api from './api';
import type { Exam } from '../types';

export const ExamService = {
  getAll: async (): Promise<Exam[]> => {
    const response = await api.get('/exams');
    const data = response.data;
    return Array.isArray(data) ? data : (data?.exams || data?.data || []);
  },

  getById: async (id: number): Promise<Exam> => {
    const response = await api.get(`/exams/${id}`);
    return response.data;
  },

  getBySubjectId: async (subjectId: number): Promise<Exam[]> => {
    const response = await api.get(`/exams/subject/${subjectId}`);
    return response.data;
  },

  create: async (exam: Omit<Exam, 'id'>): Promise<Exam> => {
    const response = await api.post('/exams', exam);
    return response.data;
  },

  update: async (id: number, exam: Exam): Promise<void> => {
    await api.put(`/exams/${id}`, exam);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/exams/${id}`);
  },
};
