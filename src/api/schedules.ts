import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectDB } from '../utils/db';
import { ScheduleService } from '../services/scheduleService';
import { successResponse, errorResponse, handleError } from '../utils/response';
import { validateRequest, createScheduleEventSchema, paginationSchema, scheduleFiltersSchema } from '../utils/validation';

const scheduleService = new ScheduleService();

export const createScheduleEvent = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const body = JSON.parse(event.body || '{}');
    const validatedData = validateRequest(body, createScheduleEventSchema);

    const instructorId = event.requestContext.authorizer?.principalId;
    if (!instructorId) {
      return errorResponse('Unauthorized', 401);
    }

    const scheduleEvent = await scheduleService.createScheduleEvent(validatedData, instructorId);
    return successResponse(scheduleEvent, 201);
  } catch (error) {
    return handleError(error);
  }
};

export const getScheduleEvent = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const eventId = event.pathParameters?.id;
    if (!eventId) {
      return errorResponse('Event ID is required', 400);
    }

    const scheduleEvent = await scheduleService.getScheduleEventById(eventId);
    if (!scheduleEvent) {
      return errorResponse('Schedule event not found', 404);
    }

    return successResponse(scheduleEvent);
  } catch (error) {
    return handleError(error);
  }
};

export const updateScheduleEvent = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const eventId = event.pathParameters?.id;
    if (!eventId) {
      return errorResponse('Event ID is required', 400);
    }

    const body = JSON.parse(event.body || '{}');
    const instructorId = event.requestContext.authorizer?.principalId;

    const updatedEvent = await scheduleService.updateScheduleEvent(eventId, body, instructorId);
    if (!updatedEvent) {
      return errorResponse('Schedule event not found or access denied', 404);
    }

    return successResponse(updatedEvent);
  } catch (error) {
    return handleError(error);
  }
};

export const deleteScheduleEvent = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const eventId = event.pathParameters?.id;
    if (!eventId) {
      return errorResponse('Event ID is required', 400);
    }

    const instructorId = event.requestContext.authorizer?.principalId;
    const deleted = await scheduleService.deleteScheduleEvent(eventId, instructorId);

    if (!deleted) {
      return errorResponse('Schedule event not found or access denied', 404);
    }

    return successResponse({ message: 'Schedule event deleted successfully' });
  } catch (error) {
    return handleError(error);
  }
};

export const listScheduleEvents = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const queryParams = event.queryStringParameters || {};
    
    // Convert string parameters to proper types
    const filters = {
      search: queryParams.search || '',
      courseId: queryParams.courseId,
      batchId: queryParams.batchId,
      instructorId: queryParams.instructorId,
      type: queryParams.type === 'all' ? undefined : queryParams.type,
      status: queryParams.status === 'all' ? undefined : queryParams.status,
      startDate: queryParams.startDate,
      endDate: queryParams.endDate,
      dateRange: queryParams.dateRange,
      sortBy: queryParams.sortBy || 'startTime',
      sortOrder: queryParams.sortOrder === 'desc' ? 'desc' : 'asc',
      page: parseInt(queryParams.page || '1'),
      limit: parseInt(queryParams.limit || '20')
    };

    const validatedFilters = validateRequest(filters, scheduleFiltersSchema);
    const result = await scheduleService.listScheduleEvents(validatedFilters);
    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
};
