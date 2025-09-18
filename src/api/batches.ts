import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectDB } from '../utils/db';
import { BatchService } from '../services/batchService';
import { UserModel } from '../models/User';
import { successResponse, errorResponse, handleError } from '../utils/response';
import { validateRequest, createBatchSchema, paginationSchema, batchFiltersSchema } from '../utils/validation';

const batchService = new BatchService();

export const createBatch = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const body = JSON.parse(event.body || '{}');
    const validatedData = validateRequest(body, createBatchSchema);

    const batch = await batchService.createBatch(validatedData);
    return successResponse(batch, 201);
  } catch (error) {
    return handleError(error);
  }
};

export const getBatch = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const batchId = event.pathParameters?.id;
    if (!batchId) {
      return errorResponse('Batch ID is required', 400);
    }

    const batch = await batchService.getBatchById(batchId);
    if (!batch) {
      return errorResponse('Batch not found', 404);
    }

    return successResponse(batch);
  } catch (error) {
    return handleError(error);
  }
};

export const updateBatch = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const batchId = event.pathParameters?.id;
    if (!batchId) {
      return errorResponse('Batch ID is required', 400);
    }

    const body = JSON.parse(event.body || '{}');
    const instructorId = event.requestContext.authorizer?.principalId;
    if (!instructorId) {
      return errorResponse('Unauthorized', 401);
    }

    const batch = await batchService.updateBatch(batchId, body, instructorId);
    if (!batch) {
      return errorResponse('Batch not found or access denied', 404);
    }

    return successResponse(batch);
  } catch (error) {
    return handleError(error);
  }
};

export const deleteBatch = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const batchId = event.pathParameters?.id;
    if (!batchId) {
      return errorResponse('Batch ID is required', 400);
    }

    const instructorId = event.requestContext.authorizer?.principalId;
    if (!instructorId) {
      return errorResponse('Unauthorized', 401);
    }

    const deleted = await batchService.deleteBatch(batchId, instructorId);
    if (!deleted) {
      return errorResponse('Batch not found or access denied', 404);
    }

    return successResponse({ message: 'Batch deleted successfully' });
  } catch (error) {
    return handleError(error);
  }
};

export const listBatches = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const queryParams = event.queryStringParameters || {};
    const validatedFilters = validateRequest(queryParams, batchFiltersSchema);

    // Add additional filters
    const filters = {
      ...validatedFilters,
      courseId: queryParams.courseId,
      instructorId: queryParams.instructorId,
      status: queryParams.status
    };

    const result = await batchService.listBatches(filters);
    
    return successResponse({
      batches: result.batches,
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

export const getBatchStudents = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const batchId = event.pathParameters?.id;
    if (!batchId) {
      return errorResponse('Batch ID is required', 400);
    }

    const instructorId = event.requestContext.authorizer?.principalId;
    if (!instructorId) {
      return errorResponse('Unauthorized', 401);
    }

    const students = await batchService.getBatchStudents(batchId, instructorId);
    return successResponse(students);
  } catch (error) {
    return handleError(error);
  }
};

export const addStudentToBatch = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const batchId = event.pathParameters?.id;
    if (!batchId) {
      return errorResponse('Batch ID is required', 400);
    }

    const body = JSON.parse(event.body || '{}');
    const { studentId, studentName, studentEmail, status } = body;

    if (!studentId || !studentName || !studentEmail) {
      return errorResponse('Student ID, name, and email are required', 400);
    }

    const instructorId = event.requestContext.authorizer?.principalId;
    if (!instructorId) {
      return errorResponse('Unauthorized', 401);
    }

    const enrollment = await batchService.addStudentToBatch(
      batchId,
      { studentId, studentName, studentEmail, status },
      instructorId
    );

    return successResponse(enrollment, 201);
  } catch (error) {
    return handleError(error);
  }
};

export const removeStudentFromBatch = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const batchId = event.pathParameters?.id;
    const studentId = event.pathParameters?.studentId;

    if (!batchId || !studentId) {
      return errorResponse('Batch ID and Student ID are required', 400);
    }

    const instructorId = event.requestContext.authorizer?.principalId;
    if (!instructorId) {
      return errorResponse('Unauthorized', 401);
    }

    const removed = await batchService.removeStudentFromBatch(batchId, studentId, instructorId);
    if (!removed) {
      return errorResponse('Student not found in batch', 404);
    }

    return successResponse({ message: 'Student removed from batch successfully' });
  } catch (error) {
    return handleError(error);
  }
};

export const getTutors = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    // Query users directly from the same database
    const tutorUsers = await UserModel.find({ 
      role: { $regex: /^tutor$/i }, // Case-insensitive match for 'tutor'
      status: 'active' 
    }).lean(); // Use lean() for plain objects

    console.log('Raw tutor users from DB:', JSON.stringify(tutorUsers, null, 2));

    // Transform to expected format with flexible field mapping
    const tutors = tutorUsers.map((user: any) => {
      // Try different possible field names
      const firstName = user.firstName || user.first_name || user.fname || '';
      const lastName = user.lastName || user.last_name || user.lname || '';
      const name = user.name || `${firstName} ${lastName}`.trim() || user.username || 'Unknown User';
      
      return {
        id: user._id?.toString() || user.id,
        name: name === ' ' ? 'Unknown User' : name,
        email: user.email
      };
    });

    console.log('Transformed tutors:', JSON.stringify(tutors, null, 2));
    return successResponse(tutors);
  } catch (error) {
    console.error('Error fetching tutors:', error);
    return handleError(error);
  }
};

export const getBatchTutors = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const batchId = event.pathParameters?.id;
    if (!batchId) {
      return errorResponse('Batch ID is required', 400);
    }

    const instructorId = event.requestContext.authorizer?.principalId;
    if (!instructorId) {
      return errorResponse('Unauthorized', 401);
    }

    const tutors = await batchService.getBatchTutors(batchId, instructorId);
    return successResponse(tutors);
  } catch (error) {
    return handleError(error);
  }
};

export const addTutorToBatch = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const batchId = event.pathParameters?.id;
    if (!batchId) {
      return errorResponse('Batch ID is required', 400);
    }

    const body = JSON.parse(event.body || '{}');
    const { tutorId, tutorName, tutorEmail } = body;

    if (!tutorId || !tutorName || !tutorEmail) {
      return errorResponse('Tutor ID, name, and email are required', 400);
    }

    const instructorId = event.requestContext.authorizer?.principalId;
    if (!instructorId) {
      return errorResponse('Unauthorized', 401);
    }

    const assignment = await batchService.addTutorToBatch(
      batchId,
      { tutorId, tutorName, tutorEmail },
      instructorId
    );

    return successResponse(assignment, 201);
  } catch (error) {
    return handleError(error);
  }
};

export const removeTutorFromBatch = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const batchId = event.pathParameters?.id;
    const tutorId = event.pathParameters?.tutorId;

    if (!batchId || !tutorId) {
      return errorResponse('Batch ID and Tutor ID are required', 400);
    }

    const instructorId = event.requestContext.authorizer?.principalId;
    if (!instructorId) {
      return errorResponse('Unauthorized', 401);
    }

    const removed = await batchService.removeTutorFromBatch(batchId, tutorId, instructorId);
    if (!removed) {
      return errorResponse('Tutor not found in batch', 404);
    }

    return successResponse({ message: 'Tutor removed from batch successfully' });
  } catch (error) {
    return handleError(error);
  }
};
