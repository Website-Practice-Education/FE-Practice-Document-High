import api from './api';

export interface ForumPost {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  content: string;
  imageUrl?: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isOwner: boolean;
  createdAt: string;
  timeAgo: string;
}

export interface ForumComment {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  content: string;
  isOwner: boolean;
  createdAt: string;
  timeAgo: string;
}

export interface ForumPostsResponse {
  success: boolean;
  data: ForumPost[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface CreatePostRequest {
  content: string;
  imageUrl?: string;
}

class ForumService {
  async getPosts(page = 1, pageSize = 20): Promise<ForumPostsResponse> {
    const response = await api.get(`/forum/posts?page=${page}&pageSize=${pageSize}`);
    return response.data;
  }

  async getPost(id: number): Promise<{ success: boolean; data: ForumPost }> {
    const response = await api.get(`/forum/posts/${id}`);
    return response.data;
  }

  async createPost(content: string, imageUrl?: string): Promise<{ success: boolean; data: ForumPost; message: string }> {
    const response = await api.post('/forum/posts', { content, imageUrl });
    return response.data;
  }

  async updatePost(id: number, content: string, imageUrl?: string): Promise<{ success: boolean; data: ForumPost; message: string }> {
    const response = await api.put(`/forum/posts/${id}`, { content, imageUrl });
    return response.data;
  }

  async deletePost(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/forum/posts/${id}`);
    return response.data;
  }

  async addComment(postId: number, content: string): Promise<{ success: boolean; data: ForumComment; message: string }> {
    const response = await api.post(`/forum/posts/${postId}/comments`, { content });
    return response.data;
  }

  async getComments(postId: number, page = 1, pageSize = 50): Promise<{ success: boolean; data: ForumComment[] }> {
    const response = await api.get(`/forum/posts/${postId}/comments?page=${page}&pageSize=${pageSize}`);
    return response.data;
  }

  async deleteComment(commentId: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/forum/comments/${commentId}`);
    return response.data;
  }

  async toggleLike(postId: number): Promise<{ success: boolean; data: { isLiked: boolean }; message: string }> {
    const response = await api.post(`/forum/posts/${postId}/like`);
    return response.data;
  }

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.url || response.data.fileUrl || response.data.path;
  }
}

export const forumService = new ForumService();
export default forumService;
