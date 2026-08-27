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
