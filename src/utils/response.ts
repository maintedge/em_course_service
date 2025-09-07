import { APIGatewayProxyResult } from 'aws-lambda';
import { ApiResponse } from '../types/course';

export const createResponse = <T>(
  statusCode: number,
  success: boolean,
  data?: T,
  error?: string
): APIGatewayProxyResult => {
  const response: ApiResponse<T> = {
    success,
    timestamp: new Date().toISOString()
  };

  if (data !== undefined) {
    response.data = data;
  }

  if (error) {
    response.error = error;
  }

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify(response)
  };
};

export const successResponse = <T>(data: T, statusCode: number = 200): APIGatewayProxyResult => {
  return createResponse(statusCode, true, data);
};

export const errorResponse = (error: string, statusCode: number = 400): APIGatewayProxyResult => {
  return createResponse(statusCode, false, undefined, error);
};

export const handleError = (error: any): APIGatewayProxyResult => {
  console.error('API Error:', error);

  if (error.message?.includes('Validation error')) {
    return errorResponse(error.message, 400);
  }

  if (error.message?.includes('not found')) {
    return errorResponse(error.message, 404);
  }

  if (error.message?.includes('already exists')) {
    return errorResponse(error.message, 409);
  }

  if (error.message?.includes('Unauthorized')) {
    return errorResponse('Unauthorized', 401);
  }

  if (error.message?.includes('Forbidden')) {
    return errorResponse('Forbidden', 403);
  }

  return errorResponse('Internal server error', 500);
};
