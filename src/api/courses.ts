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

// Course Curriculum endpoints
export const getCourseCurriculum = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const courseId = event.pathParameters?.id;
    if (!courseId) {
      return errorResponse('Course ID is required', 400);
    }

    // Get curriculum from database
    const Curriculum = require('../models/Curriculum').default;
    const curriculum = await Curriculum.findOne({ courseId }).lean();

    if (!curriculum) {
      // Return empty curriculum structure if none exists
      const courseService = require('../services/courseService').CourseService;
      const service = new courseService();
      
      let course;
      try {
        course = await service.getCourseById(courseId);
      } catch (err) {
        return errorResponse('Course not found', 404);
      }

      const emptyCurriculum = {
        courseId,
        courseName: course?.title || 'Course',
        modules: [],
        totalModules: 0,
        totalLessons: 0,
        estimatedDuration: '0 weeks'
      };

      return successResponse({ curriculum: emptyCurriculum });
    }

    return successResponse({ curriculum });
  } catch (error) {
    return handleError(error);
  }
};

export const createCourseCurriculum = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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

    // Verify course exists and instructor has access
    const courseService = require('../services/courseService').CourseService;
    const service = new courseService();
    
    let course;
    try {
      course = await service.getCourseById(courseId);
    } catch (err) {
      return errorResponse('Course not found', 404);
    }

    if (!course) {
      return errorResponse('Course not found', 404);
    }

    if (course.instructorId !== instructorId) {
      return errorResponse('Access denied', 403);
    }

    const body = JSON.parse(event.body || '{}');
    const modules = body.modules || [];
    
    // Calculate totals
    const totalModules = modules.length;
    const totalLessons = modules.reduce((acc: number, mod: any) => acc + (mod.lessons || []).length, 0);

    // Save to database
    const Curriculum = require('../models/Curriculum').default;
    
    const curriculumData = {
      courseId,
      courseName: course.title,
      modules,
      totalModules,
      totalLessons,
      estimatedDuration: `${Math.max(1, Math.ceil(totalLessons / 2))} weeks`,
      createdBy: instructorId,
      updatedAt: new Date()
    };

    // Update or create curriculum
    const curriculum = await Curriculum.findOneAndUpdate(
      { courseId },
      curriculumData,
      { upsert: true, new: true, lean: true }
    );

    return successResponse({ curriculum }, 201);
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
