import api from './api';
import type { Question } from '../types';

export const QuestionService = {
  getAll: async (): Promise<Question[]> => {
    const response = await api.get('/questions');
    return response.data;
  },

  getById: async (id: number): Promise<Question> => {
    const response = await api.get(`/questions/${id}`);
    return response.data;
  },

  getBySubjectId: async (subjectId: number): Promise<Question[]> => {
    const response = await api.get(`/questions/subject/${subjectId}`);
    return response.data;
  },

  getByLessonId: async (lessonId: number): Promise<Question[]> => {
    const response = await api.get(`/questions/lesson/${lessonId}`);
    return response.data;
  },

  create: async (question: Omit<Question, 'id'>): Promise<Question> => {
    const response = await api.post('/questions', question);
    return response.data;
  },

  update: async (id: number, question: Question): Promise<void> => {
    await api.put(`/questions/${id}`, question);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/questions/${id}`);
  },
};
