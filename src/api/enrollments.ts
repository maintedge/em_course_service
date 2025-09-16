import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectDB } from '../utils/db';
import { EnrollmentService } from '../services/enrollmentService';
import { successResponse, errorResponse, handleError } from '../utils/response';
import { validateRequest, enrollStudentSchema, paginationSchema } from '../utils/validation';
import { EnrollmentStatus } from '../types/course';

const enrollmentService = new EnrollmentService();

export const enrollStudent = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const body = JSON.parse(event.body || '{}');
    const validatedData = validateRequest(body, enrollStudentSchema);

    const enrollment = await enrollmentService.enrollStudent(validatedData);
    return successResponse(enrollment, 201);
  } catch (error) {
    return handleError(error);
  }
};

export const getEnrollment = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const enrollmentId = event.pathParameters?.id;
    if (!enrollmentId) {
      return errorResponse('Enrollment ID is required', 400);
    }

    const enrollment = await enrollmentService.getEnrollmentById(enrollmentId);
    if (!enrollment) {
      return errorResponse('Enrollment not found', 404);
    }

    return successResponse(enrollment);
  } catch (error) {
    return handleError(error);
  }
};

export const updateEnrollmentStatus = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const enrollmentId = event.pathParameters?.id;
    if (!enrollmentId) {
      return errorResponse('Enrollment ID is required', 400);
    }

    const body = JSON.parse(event.body || '{}');
    const { status, reason } = body;

    if (!status || !Object.values(EnrollmentStatus).includes(status)) {
      return errorResponse('Valid status is required', 400);
    }

    const enrollment = await enrollmentService.updateEnrollmentStatus(enrollmentId, status, reason);
    if (!enrollment) {
      return errorResponse('Enrollment not found', 404);
    }

    return successResponse(enrollment);
  } catch (error) {
    return handleError(error);
  }
};

export const listEnrollments = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const queryParams = event.queryStringParameters || {};
    const validatedFilters = validateRequest(queryParams, paginationSchema);

    // Add additional filters
    const filters = {
      ...validatedFilters,
      studentId: queryParams.studentId,
      courseId: queryParams.courseId,
      batchId: queryParams.batchId,
      status: queryParams.status
    };

    const result = await enrollmentService.listEnrollments(filters);
    
    return successResponse({
      enrollments: result.enrollments,
      pagination: {
        page: validatedFilters.page,
        limit: validatedFilters.limit,
        total: result.total,
        pages: result.pages
      }
    });
  } catch (error) {
    return handleError(error);
  }
};

export const updateStudentProgress = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const enrollmentId = event.pathParameters?.id;
    if (!enrollmentId) {
      return errorResponse('Enrollment ID is required', 400);
    }

    const body = JSON.parse(event.body || '{}');
    const { progress, completedLessons } = body;

    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return errorResponse('Progress must be a number between 0 and 100', 400);
    }

    if (!Array.isArray(completedLessons)) {
      return errorResponse('Completed lessons must be an array', 400);
    }

    const enrollment = await enrollmentService.updateStudentProgress(enrollmentId, progress, completedLessons);
    if (!enrollment) {
      return errorResponse('Enrollment not found', 404);
    }

    return successResponse(enrollment);
  } catch (error) {
    return handleError(error);
  }
};

export const issueCertificate = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const enrollmentId = event.pathParameters?.id;
    if (!enrollmentId) {
      return errorResponse('Enrollment ID is required', 400);
    }

    const enrollment = await enrollmentService.issueCertificate(enrollmentId);
    if (!enrollment) {
      return errorResponse('Enrollment not found', 404);
    }

    return successResponse(enrollment);
  } catch (error) {
    return handleError(error);
  }
};

export const getStudentProgress = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const queryParams = event.queryStringParameters || {};
    const { studentId, courseId } = queryParams;

    if (!studentId || !courseId) {
      return errorResponse('Student ID and Course ID are required', 400);
    }

    const enrollment = await enrollmentService.getStudentProgress(studentId, courseId);
    if (!enrollment) {
      return errorResponse('Enrollment not found', 404);
    }

    return successResponse(enrollment);
  } catch (error) {
    return handleError(error);
  }
};

export const dropEnrollment = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const enrollmentId = event.pathParameters?.id;
    if (!enrollmentId) {
      return errorResponse('Enrollment ID is required', 400);
    }

    const dropped = await enrollmentService.dropEnrollment(enrollmentId);
    if (!dropped) {
      return errorResponse('Enrollment not found', 404);
    }

    return successResponse({ message: 'Enrollment dropped successfully' });
  } catch (error) {
    return handleError(error);
  }
};

export const getStudentBatchDetails = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const studentId = event.pathParameters?.studentId;
    if (!studentId) {
      return errorResponse('Student ID is required', 400);
    }

    const batchDetails = await enrollmentService.getStudentBatchDetails(studentId);
    return successResponse({ batches: batchDetails });
  } catch (error) {
    return handleError(error);
  }
};
