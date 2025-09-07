import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectDB } from '../utils/db';
import { AssignmentService } from '../services/assignmentService';
import { successResponse, errorResponse, handleError } from '../utils/response';
import { validateRequest, createAssignmentSchema, paginationSchema } from '../utils/validation';

const assignmentService = new AssignmentService();

export const createAssignment = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const body = JSON.parse(event.body || '{}');
    const validatedData = validateRequest(body, createAssignmentSchema);

    const instructorId = event.requestContext.authorizer?.principalId;
    if (!instructorId) {
      return errorResponse('Unauthorized', 401);
    }

    const assignment = await assignmentService.createAssignment(validatedData, instructorId);
    return successResponse(assignment, 201);
  } catch (error) {
    return handleError(error);
  }
};

export const getAssignment = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const assignmentId = event.pathParameters?.id;
    if (!assignmentId) {
      return errorResponse('Assignment ID is required', 400);
    }

    const assignment = await assignmentService.getAssignmentById(assignmentId);
    if (!assignment) {
      return errorResponse('Assignment not found', 404);
    }

    return successResponse(assignment);
  } catch (error) {
    return handleError(error);
  }
};

export const updateAssignment = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const assignmentId = event.pathParameters?.id;
    if (!assignmentId) {
      return errorResponse('Assignment ID is required', 400);
    }

    const body = JSON.parse(event.body || '{}');
    const instructorId = event.requestContext.authorizer?.principalId;
    if (!instructorId) {
      return errorResponse('Unauthorized', 401);
    }

    const assignment = await assignmentService.updateAssignment(assignmentId, body, instructorId);
    if (!assignment) {
      return errorResponse('Assignment not found or access denied', 404);
    }

    return successResponse(assignment);
  } catch (error) {
    return handleError(error);
  }
};

export const deleteAssignment = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const assignmentId = event.pathParameters?.id;
    if (!assignmentId) {
      return errorResponse('Assignment ID is required', 400);
    }

    const instructorId = event.requestContext.authorizer?.principalId;
    if (!instructorId) {
      return errorResponse('Unauthorized', 401);
    }

    const deleted = await assignmentService.deleteAssignment(assignmentId, instructorId);
    if (!deleted) {
      return errorResponse('Assignment not found or access denied', 404);
    }

    return successResponse({ message: 'Assignment deleted successfully' });
  } catch (error) {
    return handleError(error);
  }
};

export const listAssignments = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const queryParams = event.queryStringParameters || {};
    const validatedFilters = validateRequest(queryParams, paginationSchema);

    // Add additional filters
    const filters = {
      ...validatedFilters,
      courseId: queryParams.courseId,
      batchId: queryParams.batchId,
      instructorId: queryParams.instructorId,
      type: queryParams.type,
      status: queryParams.status,
      search: queryParams.search
    };

    const result = await assignmentService.listAssignments(filters);
    
    return successResponse({
      assignments: result.assignments,
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

export const publishAssignment = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const assignmentId = event.pathParameters?.id;
    if (!assignmentId) {
      return errorResponse('Assignment ID is required', 400);
    }

    const instructorId = event.requestContext.authorizer?.principalId;
    if (!instructorId) {
      return errorResponse('Unauthorized', 401);
    }

    const assignment = await assignmentService.publishAssignment(assignmentId, instructorId);
    if (!assignment) {
      return errorResponse('Assignment not found or access denied', 404);
    }

    return successResponse(assignment);
  } catch (error) {
    return handleError(error);
  }
};

export const getAssignmentsByDueDate = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const queryParams = event.queryStringParameters || {};
    const { startDate, endDate } = queryParams;

    if (!startDate || !endDate) {
      return errorResponse('Start date and end date are required', 400);
    }

    const instructorId = event.requestContext.authorizer?.principalId;
    const assignments = await assignmentService.getAssignmentsByDueDate(startDate, endDate, instructorId);

    return successResponse(assignments);
  } catch (error) {
    return handleError(error);
  }
};
