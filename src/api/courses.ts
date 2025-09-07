import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectDB } from '../utils/db';
import { CourseService } from '../services/courseService';
import { successResponse, errorResponse, handleError } from '../utils/response';
import { validateRequest, createCourseSchema, updateCourseSchema, courseFiltersSchema, updateCourseStatusSchema } from '../utils/validation';

const courseService = new CourseService();

export const createCourse = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const body = JSON.parse(event.body || '{}');
    const validatedData = validateRequest(body, createCourseSchema);

    // Extract user info from authorizer context
    const instructorId = event.requestContext.authorizer?.principalId;
    const instructorName = event.requestContext.authorizer?.name || 'Unknown';

    if (!instructorId) {
      return errorResponse('Unauthorized', 401);
    }

    const course = await courseService.createCourse(validatedData, instructorId, instructorName);
    return successResponse(course, 201);
  } catch (error) {
    return handleError(error);
  }
};

export const getCourse = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const courseId = event.pathParameters?.id;
    if (!courseId) {
      return errorResponse('Course ID is required', 400);
    }

    const course = await courseService.getCourseById(courseId);
    if (!course) {
      return errorResponse('Course not found', 404);
    }

    return successResponse(course);
  } catch (error) {
    return handleError(error);
  }
};

export const updateCourse = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const courseId = event.pathParameters?.id;
    if (!courseId) {
      return errorResponse('Course ID is required', 400);
    }

    const body = JSON.parse(event.body || '{}');
    const validatedData = validateRequest(body, updateCourseSchema);

    const instructorId = event.requestContext.authorizer?.principalId;
    if (!instructorId) {
      return errorResponse('Unauthorized', 401);
    }

    const course = await courseService.updateCourse(courseId, validatedData, instructorId);
    if (!course) {
      return errorResponse('Course not found or access denied', 404);
    }

    return successResponse(course);
  } catch (error) {
    return handleError(error);
  }
};

export const deleteCourse = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const courseId = event.pathParameters?.id;
    if (!courseId) {
      return errorResponse('Course ID is required', 400);
    }

    const instructorId = event.requestContext.authorizer?.principalId;
    if (!instructorId) {
      return errorResponse('Unauthorized', 401);
    }

    const deleted = await courseService.deleteCourse(courseId, instructorId);
    if (!deleted) {
      return errorResponse('Course not found or access denied', 404);
    }

    return successResponse({ message: 'Course deleted successfully' });
  } catch (error) {
    return handleError(error);
  }
};

export const listCourses = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const queryParams = event.queryStringParameters || {};
    const validatedFilters = validateRequest(queryParams, courseFiltersSchema);

    const result = await courseService.listCourses(validatedFilters);
    
    return successResponse({
      courses: result.courses,
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

export const publishCourse = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const courseId = event.pathParameters?.id;
    if (!courseId) {
      return errorResponse('Course ID is required', 400);
    }

    const instructorId = event.requestContext.authorizer?.principalId;
    if (!instructorId) {
      return errorResponse('Unauthorized', 401);
    }

    const course = await courseService.publishCourse(courseId, instructorId);
    if (!course) {
      return errorResponse('Course not found or access denied', 404);
    }

    return successResponse(course);
  } catch (error) {
    return handleError(error);
  }
};

export const archiveCourse = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const courseId = event.pathParameters?.id;
    if (!courseId) {
      return errorResponse('Course ID is required', 400);
    }

    const instructorId = event.requestContext.authorizer?.principalId;
    if (!instructorId) {
      return errorResponse('Unauthorized', 401);
    }

    const course = await courseService.archiveCourse(courseId, instructorId);
    if (!course) {
      return errorResponse('Course not found or access denied', 404);
    }

    return successResponse(course);
  } catch (error) {
    return handleError(error);
  }
};

export const updateCourseStatus = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const courseId = event.pathParameters?.id;
    if (!courseId) {
      return errorResponse('Course ID is required', 400);
    }

    const body = JSON.parse(event.body || '{}');
    const validatedData = validateRequest(body, updateCourseStatusSchema);

    const instructorId = event.requestContext.authorizer?.principalId;
    if (!instructorId) {
      return errorResponse('Unauthorized', 401);
    }

    const course = await courseService.updateCourseStatus(courseId, validatedData.status, instructorId);
    if (!course) {
      return errorResponse('Course not found or access denied', 404);
    }

    return successResponse(course);
  } catch (error) {
    return handleError(error);
  }
};

export const getCourseStatistics = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();
    console.log('Connected to DB for statistics');
    const statistics = await courseService.getCourseStatistics();
    return successResponse(statistics);
  } catch (error) {
    console.log('Error fetching statistics:', error);
    return handleError(error);
  }
};
