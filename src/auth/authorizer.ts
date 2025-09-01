import { APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthorizerContext {
  userId: string;
  email: string;
  role: string;
  isVerified: string; // AWS Lambda context values must be strings
  [key: string]: string; // Index signature for additional properties
}

const generatePolicy = (
  principalId: string,
  effect: 'Allow' | 'Deny',
  resource: string,
  context?: AuthorizerContext
): APIGatewayAuthorizerResult => {
  const authResponse: APIGatewayAuthorizerResult = {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };

  if (context) {
    authResponse.context = context;
  }

  return authResponse;
};

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  try {
    const token = event.authorizationToken?.replace(/^Bearer\s+/, '');
    if (!token) {
      throw new Error('Unauthorized');
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded || !decoded.userId) {
      throw new Error('Unauthorized');
    }

    const authContext: AuthorizerContext = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      isVerified: (decoded.isVerified || false).toString()
    };


    return generatePolicy(decoded.userId, 'Allow', event.methodArn, authContext);

  } catch (error) {
    console.error('Authorization failed:', error);
    throw new Error('Unauthorized');
  }
};
