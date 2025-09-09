import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectDB } from '../utils/db';
import { CurriculumService } from '../services/curriculumService';
import { successResponse, errorResponse, handleError } from '../utils/response';

const curriculumService = new CurriculumService();

export const createCurriculum = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const instructorId = event.requestContext.authorizer?.principalId;
    const userRole = event.requestContext.authorizer?.role;

    if (!instructorId || !['admin', 'instructor'].includes(userRole)) {
      return errorResponse('Insufficient permissions', 403);
    }

    const { courseId } = event.pathParameters || {};
    if (!courseId) {
      return errorResponse('Course ID is required', 400);
    }

    const { modules } = JSON.parse(event.body || '{}');
    if (!modules || !Array.isArray(modules)) {
      return errorResponse('Modules array is required', 400);
    }

    const curriculum = await curriculumService.createCurriculum(courseId, modules);
    return successResponse({ curriculum }, 201);
  } catch (error: any) {
    return handleError(error);
  }
};

export const getCurriculum = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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

    let curriculum;
    if (userRole === 'student') {
      const { batchId } = event.queryStringParameters || {};
      curriculum = await curriculumService.getStudentCurriculum(courseId, userId, batchId || '');
    } else {
      curriculum = await curriculumService.getCurriculum(courseId);
    }

    if (!curriculum) {
      return errorResponse('Curriculum not found', 404);
    }

    return successResponse({ curriculum });
  } catch (error: any) {
    return handleError(error);
  }
};

export const addModule = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const instructorId = event.requestContext.authorizer?.principalId;
    const userRole = event.requestContext.authorizer?.role;

    if (!instructorId || !['admin', 'instructor'].includes(userRole)) {
      return errorResponse('Insufficient permissions', 403);
    }

    const { courseId } = event.pathParameters || {};
    if (!courseId) {
      return errorResponse('Course ID is required', 400);
    }

    const moduleData = JSON.parse(event.body || '{}');
    const curriculum = await curriculumService.getCurriculum(courseId);
    
    if (!curriculum) {
      const newCurriculum = await curriculumService.createCurriculum(courseId, [moduleData]);
      return successResponse({ curriculum: newCurriculum }, 201);
    } else {
      const updatedCurriculum = await curriculumService.createCurriculum(courseId, [...curriculum.modules, moduleData]);
      return successResponse({ curriculum: updatedCurriculum });
    }
  } catch (error: any) {
    return handleError(error);
  }
};

export const updateModule = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const instructorId = event.requestContext.authorizer?.principalId;
    const userRole = event.requestContext.authorizer?.role;

    if (!instructorId || !['admin', 'instructor'].includes(userRole)) {
      return errorResponse('Insufficient permissions', 403);
    }

    const { courseId, moduleId } = event.pathParameters || {};
    if (!courseId || !moduleId) {
      return errorResponse('Course ID and Module ID are required', 400);
    }

    const updateData = JSON.parse(event.body || '{}');
    const curriculum = await curriculumService.updateModule(courseId, moduleId, updateData);
    
    return successResponse({ curriculum });
  } catch (error: any) {
    return handleError(error);
  }
};

export const addLesson = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const instructorId = event.requestContext.authorizer?.principalId;
    const userRole = event.requestContext.authorizer?.role;

    if (!instructorId || !['admin', 'instructor'].includes(userRole)) {
      return errorResponse('Insufficient permissions', 403);
    }

    const { courseId, moduleId } = event.pathParameters || {};
    if (!courseId || !moduleId) {
      return errorResponse('Course ID and Module ID are required', 400);
    }

    const lessonData = JSON.parse(event.body || '{}');
    const curriculum = await curriculumService.addLesson(courseId, moduleId, lessonData);
    
    return successResponse({ curriculum }, 201);
  } catch (error: any) {
    return handleError(error);
  }
};

export const updateLesson = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const instructorId = event.requestContext.authorizer?.principalId;
    const userRole = event.requestContext.authorizer?.role;

    if (!instructorId || !['admin', 'instructor'].includes(userRole)) {
      return errorResponse('Insufficient permissions', 403);
    }

    const { courseId, moduleId, lessonId } = event.pathParameters || {};
    if (!courseId || !moduleId || !lessonId) {
      return errorResponse('Course ID, Module ID, and Lesson ID are required', 400);
    }

    const updateData = JSON.parse(event.body || '{}');
    const curriculum = await curriculumService.updateLesson(courseId, moduleId, lessonId, updateData);
    
    return successResponse({ curriculum });
  } catch (error: any) {
    return handleError(error);
  }
};

export const deleteModule = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const instructorId = event.requestContext.authorizer?.principalId;
    const userRole = event.requestContext.authorizer?.role;

    if (!instructorId || !['admin', 'instructor'].includes(userRole)) {
      return errorResponse('Insufficient permissions', 403);
    }

    const { courseId, moduleId } = event.pathParameters || {};
    if (!courseId || !moduleId) {
      return errorResponse('Course ID and Module ID are required', 400);
    }

    const curriculum = await curriculumService.deleteModule(courseId, moduleId);
    return successResponse({ curriculum });
  } catch (error: any) {
    return handleError(error);
  }
};

export const deleteLesson = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const instructorId = event.requestContext.authorizer?.principalId;
    const userRole = event.requestContext.authorizer?.role;

    if (!instructorId || !['admin', 'instructor'].includes(userRole)) {
      return errorResponse('Insufficient permissions', 403);
    }

    const { courseId, moduleId, lessonId } = event.pathParameters || {};
    if (!courseId || !moduleId || !lessonId) {
      return errorResponse('Course ID, Module ID, and Lesson ID are required', 400);
    }

    const curriculum = await curriculumService.deleteLesson(courseId, moduleId, lessonId);
    return successResponse({ curriculum });
  } catch (error: any) {
    return handleError(error);
  }
};
