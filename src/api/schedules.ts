import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectDB } from '../utils/db';
import { ScheduleService } from '../services/scheduleService';
import { successResponse, errorResponse, handleError } from '../utils/response';

const scheduleService = new ScheduleService();

export const getBatchSchedule = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const batchId = event.pathParameters?.id;
    if (!batchId) {
      return errorResponse('Batch ID is required', 400);
    }

    const schedule = await scheduleService.getScheduleForBatch(batchId);
    return successResponse(schedule);
  } catch (error) {
    return handleError(error);
  }
};

export const getAllSchedules = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const queryParams = event.queryStringParameters || {};
    const filters = {
      page: parseInt(queryParams.page || '1'),
      limit: parseInt(queryParams.limit || '20'),
      startDate: queryParams.startDate,
      endDate: queryParams.endDate,
      batchId: queryParams.batchId,
      tutorId: queryParams.tutorId,
      dayOfWeek: queryParams.dayOfWeek ? parseInt(queryParams.dayOfWeek) : undefined,
      sortBy: queryParams.sortBy || 'date',
      sortOrder: queryParams.sortOrder || 'asc'
    };

    const result = await scheduleService.getAllSchedules(filters);
    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
};

export const updateScheduleTutor = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const scheduleId = event.pathParameters?.id;
    const { tutorId, tutorName } = JSON.parse(event.body || '{}');

    if (!scheduleId) {
      return errorResponse('Schedule ID is required', 400);
    }

    const result = await scheduleService.updateScheduleTutor(scheduleId, tutorId, tutorName);
    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
};
