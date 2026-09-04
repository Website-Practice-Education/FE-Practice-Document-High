export interface Subject {
  id: number;
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface Question {
  id: number;
  subjectId: number;
  topicId?: number;
  lessonId?: number;
  questionType: string;
  content: string;
  explanation?: string;
  difficulty?: number;
  year?: number;
  source?: string;
  fileUrl?: string;
  fileType?: string;
  isActive?: boolean;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
  subject?: Subject;
}

export interface Exam {
  id: number;
  title: string;
  subjectId?: number;
  description?: string;
  durationMinutes?: number;
  totalQuestions?: number;
  year?: number;
  examType?: string;
  isTimed?: boolean;
  allowPause?: boolean;
  showTimer?: boolean;
  isPublic?: boolean;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
  subject?: Subject;
}

export interface User {
  id: number;
  email: string;
  fullName?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  role?: string;
  grade?: number;
  avatarUrl?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export interface UserAttempt {
  id: number;
  userId: number;
  examId: number;
  score?: number;
  totalScore?: number;
  status?: string;
  startedAt?: string;
  completedAt?: string;
  timeSpent?: number;
}

export interface DashboardStats {
  subjects: number;
  questions: number;
  exams: number;
  users: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface PasswordResetResponse {
  message: string;
  email?: string;
  token?: string;
}

export interface SharedDocument {
  id: number;
  title: string;
  description?: string;
  documentType: string; // "file" or "link"
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  subjectId?: number;
  topicId?: number;
  questionCount?: number;
  gradeLevel?: number;
  linkUrl?: string;
  linkSource?: string;
  sharedByUserId?: number;
  sharedByName?: string;
  viewCount: number;
  downloadCount: number;
  likeCount: number;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  subject?: Subject;
  topic?: Topic;
  // Moderation fields
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  moderationNotes?: string;
  moderatedByUserId?: number;
  moderatedByName?: string;
  moderatedAt?: string;
}

export interface Topic {
  id: number;
  subjectId: number;
  name: string;
  description?: string;
  orderIndex?: number;
  isActive?: boolean;
  createdAt?: string;
  parentId?: number;
}

export interface CreateDocumentRequest {
  title: string;
  description?: string;
  documentType: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  subjectId?: number;
  topicId?: number;
  questionCount?: number;
  gradeLevel?: number;
  linkUrl?: string;
  linkSource?: string;
}

export interface DocumentFilterRequest {
  subjectId?: number;
  topicId?: number;
  minQuestionCount?: number;
  maxQuestionCount?: number;
  gradeLevel?: number;
  documentType?: string;
  keyword?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  pageSize?: number;
  moderationStatus?: string;
}

export interface DocumentPaginationResponse {
  success: boolean;
  data: SharedDocument[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface ModerationStats {
  pending: number;
  approved: number;
  rejected: number;
}
