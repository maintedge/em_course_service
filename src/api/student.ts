import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectDB } from '../utils/db';
import { successResponse, errorResponse, handleError } from '../utils/response';
import { validateRequest, paginationSchema } from '../utils/validation';
import * as courseService from '../services/courseService';
import * as assignmentService from '../services/assignmentService';
import * as scheduleService from '../services/scheduleService';
import * as enrollmentService from '../services/enrollmentService';

// Get student dashboard data
export const getStudentDashboard = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const userId = event.requestContext.authorizer?.userId || 'test-user-123';
    
    // Get student enrollments
    const enrollments = await enrollmentService.getStudentEnrollments(userId);
    
    // Get upcoming schedules (next 7 days)
    const startDate = new Date().toISOString();
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const schedules = await scheduleService.getStudentSchedules(userId, { startDate, endDate });
    
    // Get pending assignments
    const assignments = await assignmentService.getStudentAssignments(userId, { 
      status: 'published',
      page: 1,
      limit: 10 
    });
    
    // Mock student data
    const student = {
      id: userId,
      userId,
      email: 'student@example.com',
      firstName: 'John',
      lastName: 'Doe',
      enrollments: enrollments.enrollments || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Mock recent progress
    const recentProgress = [
      {
        id: '1',
        studentId: userId,
        courseId: enrollments.enrollments?.[0]?.courseId || '',
        type: 'assignment_completed' as const,
        title: 'JavaScript Basics Quiz',
        score: 85,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const dashboardData = {
      student,
      enrolledCourses: enrollments.enrollments || [],
      upcomingSchedules: schedules.events || [],
      pendingAssignments: assignments.assignments || [],
      recentProgress
    };

    return successResponse(dashboardData);
  } catch (error) {
    return handleError(error);
  }
};

// Get student enrollments
export const getStudentEnrollments = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const userId = event.requestContext.authorizer?.userId || 'test-user-123';
    const result = await enrollmentService.getStudentEnrollments(userId);
    
    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
};

// Get student schedules
export const getStudentSchedules = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const userId = event.requestContext.authorizer?.userId || 'test-user-123';
    const queryParams = event.queryStringParameters || {};
    
    const filters = {
      startDate: queryParams.startDate,
      endDate: queryParams.endDate,
      courseId: queryParams.courseId
    };

    const result = await scheduleService.getStudentSchedules(userId, filters);
    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
};

// Get student assignments
export const getStudentAssignments = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const userId = event.requestContext.authorizer?.userId || 'test-user-123';
    const queryParams = event.queryStringParameters || {};
    
    const filters = {
      courseId: queryParams.courseId,
      status: queryParams.status || 'published',
      page: parseInt(queryParams.page || '1'),
      limit: parseInt(queryParams.limit || '20')
    };

    const result = await assignmentService.getStudentAssignments(userId, filters);
    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
};

// Submit assignment
export const submitAssignment = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const userId = event.requestContext.authorizer?.userId || 'test-user-123';
    const assignmentId = event.pathParameters?.id;
    
    if (!assignmentId) {
      return errorResponse('Assignment ID is required', 400);
    }

    const body = JSON.parse(event.body || '{}');
    
    const submission = {
      assignmentId,
      studentId: userId,
      content: body.content || '',
      attachments: body.attachments || [],
      submittedAt: new Date().toISOString(),
      status: 'submitted' as const
    };

    // Mock submission creation
    const result = {
      id: `sub_${Date.now()}`,
      ...submission
    };

    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
};
