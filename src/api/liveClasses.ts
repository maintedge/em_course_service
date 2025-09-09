import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectDB } from '../utils/db';
import { LiveClassService } from '../services/liveClassService';
import { successResponse, errorResponse, handleError } from '../utils/response';

const liveClassService = new LiveClassService();

export const createRecording = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const instructorId = event.requestContext.authorizer?.principalId;
    const userRole = event.requestContext.authorizer?.role;
    const instructorName = event.requestContext.authorizer?.name || 'Unknown';

    if (!instructorId || !['admin', 'instructor'].includes(userRole)) {
      return errorResponse('Insufficient permissions', 403);
    }

    const recordingData = JSON.parse(event.body || '{}');
    recordingData.instructorId = instructorId;
    recordingData.instructorName = instructorName;

    const recording = await liveClassService.createRecording(recordingData);
    return successResponse({ recording }, 201);
  } catch (error: any) {
    return handleError(error);
  }
};

export const getRecording = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const userId = event.requestContext.authorizer?.principalId;
    const userRole = event.requestContext.authorizer?.role;

    if (!userId) {
      return errorResponse('Authentication required', 401);
    }

    const { recordingId } = event.pathParameters || {};
    if (!recordingId) {
      return errorResponse('Recording ID is required', 400);
    }

    const recording = await liveClassService.getRecording(recordingId);
    if (!recording) {
      return errorResponse('Recording not found', 404);
    }

    // Check access permissions for students
    if (userRole === 'student') {
      const hasAccess = recording.isPublic || 
                       recording.allowedStudentIds.includes(userId) ||
                       recording.allowedBatchIds.length > 0; // Simplified access check

      if (!hasAccess) {
        return errorResponse('Access denied to this recording', 403);
      }
    }

    return successResponse({ recording });
  } catch (error: any) {
    return handleError(error);
  }
};

export const getCourseRecordings = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const userId = event.requestContext.authorizer?.principalId;
    const userRole = event.requestContext.authorizer?.role;

    if (!userId) {
      return errorResponse('Authentication required', 401);
    }

    const { courseId } = event.pathParameters || {};
    if (!courseId) {
      return errorResponse('Course ID is required', 400);
    }

    let recordings;
    if (userRole === 'student') {
      const { batchId } = event.queryStringParameters || {};
      recordings = await liveClassService.getStudentRecordings(courseId, userId, batchId || '');
    } else {
      recordings = await liveClassService.getRecordingsForCourse(courseId, userId);
    }

    return successResponse({ recordings, total: recordings.length });
  } catch (error: any) {
    return handleError(error);
  }
};

export const updateRecordingAccess = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const instructorId = event.requestContext.authorizer?.principalId;
    const userRole = event.requestContext.authorizer?.role;

    if (!instructorId || !['admin', 'instructor'].includes(userRole)) {
      return errorResponse('Insufficient permissions', 403);
    }

    const { recordingId } = event.pathParameters || {};
    if (!recordingId) {
      return errorResponse('Recording ID is required', 400);
    }

    const accessData = JSON.parse(event.body || '{}');
    const recording = await liveClassService.updateRecordingAccess(recordingId, instructorId, accessData);
    
    if (!recording) {
      return errorResponse('Recording not found or access denied', 404);
    }

    return successResponse({ recording });
  } catch (error: any) {
    return handleError(error);
  }
};

export const deleteRecording = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const instructorId = event.requestContext.authorizer?.principalId;
    const userRole = event.requestContext.authorizer?.role;

    if (!instructorId || !['admin', 'instructor'].includes(userRole)) {
      return errorResponse('Insufficient permissions', 403);
    }

    const { recordingId } = event.pathParameters || {};
    if (!recordingId) {
      return errorResponse('Recording ID is required', 400);
    }

    const deleted = await liveClassService.deleteRecording(recordingId, instructorId);
    if (!deleted) {
      return errorResponse('Recording not found or access denied', 404);
    }

    return successResponse({ message: 'Recording deleted successfully' });
  } catch (error: any) {
    return handleError(error);
  }
};

export const trackVideoView = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const userId = event.requestContext.authorizer?.principalId;

    if (!userId) {
      return errorResponse('Authentication required', 401);
    }

    const { recordingId } = event.pathParameters || {};
    if (!recordingId) {
      return errorResponse('Recording ID is required', 400);
    }

    const { watchTime } = JSON.parse(event.body || '{}');
    if (typeof watchTime !== 'number') {
      return errorResponse('Watch time is required', 400);
    }

    const recording = await liveClassService.incrementViewCount(recordingId, watchTime);
    if (!recording) {
      return errorResponse('Recording not found', 404);
    }

    return successResponse({ message: 'View tracked successfully' });
  } catch (error: any) {
    return handleError(error);
  }
};
