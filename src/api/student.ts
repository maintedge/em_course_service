import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectDB } from '../utils/db';
import { successResponse, errorResponse, handleError } from '../utils/response';
import { EnrollmentService } from '../services/enrollmentService';
import { getStudentAssignments } from '../services/assignmentService';

const enrollmentService = new EnrollmentService();

export const getStudentEnrollments = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const userId = event.requestContext.authorizer?.userId || 'test-user-123';
    const result = await enrollmentService.getStudentBatchDetails(userId);
    
    return successResponse({ enrollments: result });
  } catch (error) {
    return handleError(error);
  }
};

export const getStudentAssignmentsAPI = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const userId = event.requestContext.authorizer?.userId || 'test-user-123';
    const queryParams = event.queryStringParameters || {};
    
    const filters = {
      courseId: queryParams.courseId,
      status: queryParams.status, // Don't default to 'published' - let service handle it
      page: parseInt(queryParams.page || '1'),
      limit: parseInt(queryParams.limit || '20')
    };

    const result = await getStudentAssignments(userId, filters);
    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
};

export const getStudentSchedulesAPI = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const userId = event.requestContext.authorizer?.userId || 'test-user-123';
    const queryParams = event.queryStringParameters || {};
    
    const filters = {
      startDate: queryParams.startDate,
      endDate: queryParams.endDate,
      courseId: queryParams.courseId
    };

    // TODO: Implement student schedules functionality
    const result = { schedules: [], message: 'Student schedules not implemented yet' };
    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
};
