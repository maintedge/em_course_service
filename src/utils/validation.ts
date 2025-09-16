import Joi from 'joi';
import { CourseCategory, CourseLevel, CourseStatus, AssignmentType, AssignmentDifficulty } from '../types/course';

export const createCourseSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  description: Joi.string().min(10).required(),
  category: Joi.string().valid(...Object.values(CourseCategory)).required(),
  level: Joi.string().valid(...Object.values(CourseLevel)).required(),
  duration: Joi.number().min(1).required(),
  price: Joi.number().min(0).required(),
  currency: Joi.string().length(3).default('USD'),
  thumbnail: Joi.string().uri().allow('').optional(),
  maxStudents: Joi.number().min(1).max(1000).required(),
  isPublic: Joi.boolean().default(true),
  allowSelfEnrollment: Joi.boolean().default(true),
  certificateEnabled: Joi.boolean().default(false),
  prerequisites: Joi.array().items(Joi.string()).default([]),
  tags: Joi.array().items(Joi.string()).default([])
});

export const updateCourseSchema = Joi.object({
  title: Joi.string().min(3).max(255).optional(),
  description: Joi.string().min(10).optional(),
  category: Joi.string().valid(...Object.values(CourseCategory)).optional(),
  level: Joi.string().valid(...Object.values(CourseLevel)).optional(),
  duration: Joi.number().min(1).optional(),
  price: Joi.number().min(0).optional(),
  thumbnail: Joi.string().uri().allow('').optional(),
  maxStudents: Joi.number().min(1).max(1000).optional(),
  isPublic: Joi.boolean().optional(),
  allowSelfEnrollment: Joi.boolean().optional(),
  certificateEnabled: Joi.boolean().optional(),
  prerequisites: Joi.array().items(Joi.string()).optional(),
  tags: Joi.array().items(Joi.string()).optional()
});

export const createBatchSchema = Joi.object({
  name: Joi.string().min(3).max(255).required(),
  description: Joi.string().optional(),
  courseId: Joi.string().required(),
  instructorId: Joi.string().required(),
  startDate: Joi.string().isoDate().required(),
  endDate: Joi.string().isoDate().required(),
  schedule: Joi.array().items(
    Joi.object({
      dayOfWeek: Joi.number().min(0).max(6).required(),
      startTime: Joi.string().pattern(/^([0-1]\d|2[0-3]):([0-5]\d)$/).required(), // "HH:mm"
      endTime: Joi.string().pattern(/^([0-1]\d|2[0-3]):([0-5]\d)$/).required(),   // "HH:mm"
      sessionType: Joi.string().valid('lecture', 'lab', 'seminar', 'workshop', 'tutorial').required(),
      topic: Joi.string().allow('').optional(),
      isRecurring: Joi.boolean().default(true)
    })
  ).default([]),
  timezone: Joi.string().default('UTC'),
  maxStudents: Joi.number().min(1).max(1000).required(),
  isPublic: Joi.boolean().default(true),
  allowWaitlist: Joi.boolean().default(true),
  autoEnroll: Joi.boolean().default(false)
});

export const createAssignmentSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  description: Joi.string().optional(),
  instructions: Joi.string().required(),
  courseId: Joi.string().required(),
  batchId: Joi.string().optional(),
  type: Joi.string().valid(...Object.values(AssignmentType)).required(),
  difficulty: Joi.string().valid(...Object.values(AssignmentDifficulty)).required(),
  estimatedHours: Joi.number().min(1).default(1),
  maxScore: Joi.number().min(1).default(100),
  passingScore: Joi.number().min(0).default(60),
  assignedDate: Joi.string().isoDate().required(),
  dueDate: Joi.string().isoDate().required(),
  allowLateSubmission: Joi.boolean().default(true),
  latePenalty: Joi.number().min(0).max(100).default(10),
  maxAttempts: Joi.number().min(1).default(1),
  isGroupAssignment: Joi.boolean().default(false)
});

export const enrollStudentSchema = Joi.object({
  studentId: Joi.string().required(),
  studentName: Joi.string().required(),
  studentEmail: Joi.string().email().required(),
  courseId: Joi.string().required(),
  batchId: Joi.string().optional(),
  paymentAmount: Joi.number().min(0).required()
});

export const paginationSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20)
});

export const courseFiltersSchema = paginationSchema.keys({
  search: Joi.string().allow('').optional(),
  category: Joi.string().valid(...Object.values(CourseCategory), 'all').optional(),
  level: Joi.string().valid(...Object.values(CourseLevel), 'all').optional(),
  status: Joi.string().optional(),
  instructorId: Joi.string().optional(),
  sortBy: Joi.string().valid('title', 'createdAt', 'price', 'enrolledStudents', 'averageRating').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// Batch filters schema for batch API
export const batchFiltersSchema = paginationSchema.keys({
  courseId: Joi.string().optional(),
  isPublic: Joi.boolean().optional(),
  allowWaitlist: Joi.boolean().optional(),
  autoEnroll: Joi.boolean().optional(),
  search: Joi.string().allow('').optional(),
  status: Joi.string().optional(),
  sortBy: Joi.string().valid('name', 'startDate', 'endDate', 'maxStudents', 'enrolledStudents', 'createdAt').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  // Add other batch-specific filters as needed
});

// Course status update schema
export const updateCourseStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(CourseStatus)).required()
});

// Schedule event validation schema
export const createScheduleEventSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  courseId: Joi.string().required(),
  batchId: Joi.string().optional(),
  eventType: Joi.string().required(),
  startTime: Joi.string().isoDate().required(),
  endTime: Joi.string().isoDate().required(),
  location: Joi.string().optional(),
  meetingUrl: Joi.string().uri().optional(),
  isRecurring: Joi.boolean().default(false),
  recurrencePattern: Joi.string().optional(),
  attendees: Joi.array().items(Joi.string()).optional(),
  maxAttendees: Joi.number().min(1).optional(),
  isRequired: Joi.boolean().default(true),
  materials: Joi.array().items(Joi.string()).optional()
});

// Assignment filters schema
export const assignmentFiltersSchema = Joi.object({
  search: Joi.string().allow('').optional(),
  courseId: Joi.string().optional(),
  batchId: Joi.string().optional(),
  type: Joi.string().optional(),
  status: Joi.string().optional(),
  difficulty: Joi.string().optional(),
  sortBy: Joi.string().valid('title', 'dueDate', 'createdAt', 'difficulty', 'maxScore').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

// Schedule filters schema
export const scheduleFiltersSchema = Joi.object({
  search: Joi.string().allow('').optional(),
  courseId: Joi.string().optional(),
  batchId: Joi.string().optional(),
  instructorId: Joi.string().optional(),
  type: Joi.string().optional(),
  status: Joi.string().optional(),
  startDate: Joi.string().isoDate().optional(),
  endDate: Joi.string().isoDate().optional(),
  dateRange: Joi.string().optional(),
  sortBy: Joi.string().valid('title', 'startTime', 'createdAt', 'eventType').default('startTime'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

export const validateRequest = (data: any, schema: any) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    throw new Error(`Validation error: ${error.details.map((d: any) => d.message).join(', ')}`);
  }
  return value;
};
