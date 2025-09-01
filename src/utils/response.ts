import { APIGatewayProxyResult } from 'aws-lambda';

export const successResponse = (data: any, statusCode: number = 200): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
  },
  body: JSON.stringify({
    success: true,
    data
  })
});

export const errorResponse = (message: string, statusCode: number = 500): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
  },
  body: JSON.stringify({
    success: false,
    error: message
  })
});

export const notFoundError = (message: string = 'Resource not found'): APIGatewayProxyResult => 
  errorResponse(message, 404);

export const validationError = (message: string): APIGatewayProxyResult => 
  errorResponse(message, 400);

export const unauthorizedError = (message: string = 'Unauthorized'): APIGatewayProxyResult => 
  errorResponse(message, 401);

export const conflictError = (message: string): APIGatewayProxyResult => 
  errorResponse(message, 409);
