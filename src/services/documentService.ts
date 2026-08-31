import api from './api';
import {
  SharedDocument,
  CreateDocumentRequest,
  DocumentFilterRequest,
  DocumentPaginationResponse
} from '../types';

// Helper to normalize array responses from backend
const normalizeArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (data?.data) return Array.isArray(data.data) ? data.data : [data.data];
  if (data?.items) return data.items;
  return [];
};

const documentService = {
  // Lấy danh sách tài liệu với bộ lọc
  getDocuments: async (filter: DocumentFilterRequest = {}): Promise<DocumentPaginationResponse> => {
    const params = new URLSearchParams();
    
    if (filter.subjectId) params.append('subjectId', filter.subjectId.toString());
    if (filter.topicId) params.append('topicId', filter.topicId.toString());
    if (filter.minQuestionCount !== undefined) params.append('minQuestionCount', filter.minQuestionCount.toString());
    if (filter.maxQuestionCount !== undefined) params.append('maxQuestionCount', filter.maxQuestionCount.toString());
    if (filter.gradeLevel) params.append('gradeLevel', filter.gradeLevel.toString());
    if (filter.documentType) params.append('documentType', filter.documentType);
    if (filter.keyword) params.append('keyword', filter.keyword);
    if (filter.sortBy) params.append('sortBy', filter.sortBy);
    if (filter.sortOrder) params.append('sortOrder', filter.sortOrder);
    params.append('page', (filter.page || 1).toString());
    params.append('pageSize', (filter.pageSize || 20).toString());

    const response = await api.get(`/documents?${params.toString()}`);
    console.log('documentService raw response:', response);
    console.log('documentService response.data:', response.data);
    return response.data;
  },

  // Lấy chi tiết một tài liệu
  getDocumentById: async (id: number): Promise<SharedDocument> => {
    const response = await api.get(`/documents/${id}`);
    return response.data?.data || response.data;
  },

  // Upload file lên storage
  uploadFile: async (file: File, folder: string = 'documents'): Promise<{ fileUrl: string; fileName: string; fileSize: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data?.data || response.data;
  },

  // Xóa file khỏi storage
  deleteFile: async (fileUrl: string): Promise<void> => {
    await api.delete('/documents/files', { data: { fileUrl } });
  },

  // Tạo tài liệu mới
  createDocument: async (data: CreateDocumentRequest): Promise<SharedDocument> => {
    const response = await api.post('/documents', data);
    return response.data?.data || response.data;
  },

  // Tạo tài liệu với file upload (upload file trước, sau đó tạo document)
  createDocumentWithFile: async (
    documentData: Omit<CreateDocumentRequest, 'fileUrl' | 'fileName' | 'fileType' | 'fileSize'>,
    file?: File
  ): Promise<SharedDocument> => {
    let fileUrl = '';
    
    // Nếu có file, upload lên storage trước
    if (file) {
      const uploadResult = await documentService.uploadFile(file);
      fileUrl = uploadResult.fileUrl;
    }

    // Tạo document với file URL đã upload
    const response = await api.post('/documents', {
      ...documentData,
      fileUrl,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
    });
    return response.data?.data || response.data;
  },

  // Cập nhật tài liệu
  updateDocument: async (id: number, data: Partial<CreateDocumentRequest>): Promise<SharedDocument> => {
    const response = await api.put(`/documents/${id}`, data);
    return response.data?.data || response.data;
  },

  // Xóa tài liệu
  deleteDocument: async (id: number): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },

  // Tăng lượt tải
  incrementDownload: async (id: number): Promise<void> => {
    await api.post(`/documents/${id}/download`);
  },

  // Tăng lượt thích
  incrementLike: async (id: number): Promise<void> => {
    await api.post(`/documents/${id}/like`);
  },

  // Lấy tài liệu theo môn học
  getBySubject: async (subjectId: number, page = 1, pageSize = 20): Promise<SharedDocument[]> => {
    const response = await api.get(`/documents/by-subject/${subjectId}?page=${page}&pageSize=${pageSize}`);
    return normalizeArray(response.data);
  },

  // Lấy tài liệu theo chủ đề
  getByTopic: async (topicId: number, page = 1, pageSize = 20): Promise<SharedDocument[]> => {
    const response = await api.get(`/documents/by-topic/${topicId}?page=${page}&pageSize=${pageSize}`);
    return normalizeArray(response.data);
  },

  // Tìm kiếm tài liệu
  search: async (keyword: string, page = 1, pageSize = 20): Promise<SharedDocument[]> => {
    const response = await api.get(`/documents/search?keyword=${encodeURIComponent(keyword)}&page=${page}&pageSize=${pageSize}`);
    return normalizeArray(response.data);
  },

  // Lấy tài liệu của người dùng hiện tại
  getMyDocuments: async (page = 1, pageSize = 20): Promise<SharedDocument[]> => {
    const response = await api.get(`/documents/my-documents?page=${page}&pageSize=${pageSize}`);
    return normalizeArray(response.data);
  },
};

export default documentService;
