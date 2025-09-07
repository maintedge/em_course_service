export interface Course {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  level: CourseLevel;
  duration: number;
  price: number;
  currency: string;
  thumbnail?: string;
  status: CourseStatus;
  instructorId: string;
  instructorName: string;
  maxStudents: number;
  enrolledStudents: number;
  completionRate: number;
  averageRating: number;
  totalReviews: number;
  isPublic: boolean;
  allowSelfEnrollment: boolean;
  certificateEnabled: boolean;
  prerequisites: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface Batch {
  id: string;
  name: string;
  description: string;
  courseId: string;
  courseName: string;
  instructorId: string;
  instructorName: string;
  startDate: string;
  endDate: string;
  schedule: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    sessionType: string;
    topic: string;
    isRecurring: boolean;
  }[];
  timezone: string;
  maxStudents: number;
  enrolledStudents: number;
  waitlistCount: number;
  status: BatchStatus;
  isPublic: boolean;
  allowWaitlist: boolean;
  autoEnroll: boolean;
  completionRate: number;
  averageProgress: number;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  courseId: string;
  courseName: string;
  batchId?: string;
  instructorId: string;
  type: AssignmentType;
  difficulty: AssignmentDifficulty;
  estimatedHours: number;
  maxScore: number;
  passingScore: number;
  assignedDate: string;
  dueDate: string;
  allowLateSubmission: boolean;
  latePenalty: number;
  maxAttempts: number;
  isGroupAssignment: boolean;
  status: AssignmentStatus;
  isPublished: boolean;
  totalSubmissions: number;
  gradedSubmissions: number;
  averageScore: number;
  completionRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  batchId?: string;
  enrolledAt: string;
  status: EnrollmentStatus;
  progress: number;
  completedLessons: string[];
  lastAccessedAt?: string;
  certificateIssued: boolean;
  certificateIssuedAt?: string;
  paymentStatus: PaymentStatus;
  paymentAmount: number;
}

export enum CourseCategory {
  PROGRAMMING = 'programming',
  DATA_SCIENCE = 'data_science',
  WEB_DEVELOPMENT = 'web_development',
  MOBILE_DEVELOPMENT = 'mobile_development',
  CLOUD_COMPUTING = 'cloud_computing',
  CYBERSECURITY = 'cybersecurity',
  AI_ML = 'ai_ml',
  DEVOPS = 'devops',
  UI_UX = 'ui_ux',
  BUSINESS = 'business',
  OTHER = 'other'
}

export enum CourseLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum CourseStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  SUSPENDED = 'suspended'
}

export enum BatchStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended'
}

export enum AssignmentType {
  ESSAY = 'essay',
  PROJECT = 'project',
  CODING = 'coding',
  PRESENTATION = 'presentation',
  QUIZ = 'quiz',
  PRACTICAL = 'practical',
  RESEARCH = 'research',
  CASE_STUDY = 'case_study'
}

export enum AssignmentDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum AssignmentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ACTIVE = 'active',
  CLOSED = 'closed',
  ARCHIVED = 'archived'
}

export enum EnrollmentStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DROPPED = 'dropped',
  SUSPENDED = 'suspended',
  WAITLISTED = 'waitlisted'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIAL = 'partial'
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface CourseFilters extends PaginationParams {
  search?: string;
  category?: CourseCategory | 'all';
  level?: CourseLevel | 'all';
  status?: CourseStatus | 'all';
  instructorId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateCourseRequest {
  title: string;
  description: string;
  category: CourseCategory;
  level: CourseLevel;
  duration: number;
  price: number;
  currency?: string;
  thumbnail?: string;
  maxStudents: number;
  isPublic?: boolean;
  allowSelfEnrollment?: boolean;
  certificateEnabled?: boolean;
  prerequisites?: string[];
  tags?: string[];
}

export interface UpdateCourseRequest {
  title?: string;
  description?: string;
  category?: CourseCategory;
  level?: CourseLevel;
  duration?: number;
  price?: number;
  thumbnail?: string;
  maxStudents?: number;
  isPublic?: boolean;
  allowSelfEnrollment?: boolean;
  certificateEnabled?: boolean;
  prerequisites?: string[];
  tags?: string[];
}
