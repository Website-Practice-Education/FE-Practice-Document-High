import api from './api';
import { SharedDocument } from '../types';

// Helper to normalize array responses from backend
const normalizeArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (data?.data) return Array.isArray(data.data) ? data.data : [data.data];
  if (data?.items) return data.items;
  return [];
};

const moderationService = {
  // Get pending documents
  getPendingDocuments: async (page = 1, pageSize = 20) => {
    const response = await api.get('/moderation/pending', {
      params: { page, pageSize }
    });
    return response.data;
  },

  // Get documents by status
  getDocumentsByStatus: async (status: string, page = 1, pageSize = 20) => {
    const response = await api.get('/moderation/documents', {
      params: { status, page, pageSize }
    });
    return response.data;
  },

  // Get all documents for moderation (all statuses)
  getAllDocuments: async (page = 1, pageSize = 20) => {
    const response = await api.get('/moderation/documents', {
      params: { page, pageSize }
    });
    return response.data;
  },

  // Get pending count
  getPendingCount: async () => {
    const response = await api.get('/moderation/pending/count');
    return response.data;
  },

  // Get document details
  getDocument: async (id: number) => {
    const response = await api.get(`/moderation/documents/${id}`);
    return response.data?.data || response.data;
  },

  // Approve document
  approveDocument: async (id: number, notes?: string) => {
    const response = await api.post(`/moderation/approve/${id}`, { notes });
    return response.data;
  },

  // Reject document
  rejectDocument: async (id: number, reason: string) => {
    const response = await api.post(`/moderation/reject/${id}`, { reason });
    return response.data;
  },

  // Update document content
  updateDocument: async (id: number, data: Partial<SharedDocument>) => {
    const response = await api.put(`/moderation/documents/${id}`, data);
    return response.data?.data || response.data;
  },

  // Delete document
  deleteDocument: async (id: number) => {
    const response = await api.delete(`/moderation/documents/${id}`);
    return response.data;
  },

  // Batch approve
  approveBatch: async (documentIds: number[], notes?: string) => {
    const response = await api.post('/moderation/approve-batch', {
      documentIds,
      notes
    });
    return response.data;
  },

  // Batch reject
  rejectBatch: async (documentIds: number[], reason: string) => {
    const response = await api.post('/moderation/reject-batch', {
      documentIds,
      reason
    });
    return response.data;
  },
};

export default moderationService;
