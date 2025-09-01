import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectDB } from '../utils/db';
import { successResponse, errorResponse, notFoundError, validationError, conflictError, unauthorizedError } from '../utils/response';
import { ValidationUtil } from '../utils/validation';
import { User, ActivityLog } from '../models/User';

// Helper function to get user context from event
const getUserContext = (event: APIGatewayProxyEvent) => {
  return event.requestContext.authorizer;
};

// Helper function to check if user has permission
const hasPermission = (userContext: any, permission: string): boolean => {
  return userContext?.permissions?.includes(permission) || userContext?.role === 'admin';
};

// Helper function to sanitize user data (remove sensitive fields)
const sanitizeUser = (user: any) => {
  const sanitized = user.toJSON ? user.toJSON() : user;
  delete sanitized.password;
  delete sanitized.refreshTokens;
  delete sanitized.passwordResetToken;
  delete sanitized.emailVerificationToken;
  return sanitized;
};

export const getAllUsers: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const userContext = getUserContext(event);
    if (!hasPermission(userContext, 'canManageUsers')) {
      return unauthorizedError('Insufficient permissions');
    }

    const queryParams = event.queryStringParameters || {};
    const page = parseInt(queryParams.page || '1');
    const limit = Math.min(parseInt(queryParams.limit || '10'), 100); // Max 100 per page
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};
    if (queryParams.role && queryParams.role !== 'all') {
      filter.role = queryParams.role;
    }
    if (queryParams.isActive !== undefined) {
      filter.isActive = queryParams.isActive === 'true';
    }
    if (queryParams.emailVerified !== undefined) {
      filter.emailVerified = queryParams.emailVerified === 'true';
    }
    if (queryParams.search) {
      filter.$or = [
        { name: { $regex: queryParams.search, $options: 'i' } },
        { email: { $regex: queryParams.search, $options: 'i' } }
      ];
    }
    // Get users with pagination
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -refreshTokens -passwordResetToken -emailVerificationToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter)
    ]);

    return successResponse({
      users: users.map(sanitizeUser),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('Get all users error:', error);
    return errorResponse('Failed to get users', 500);
  }
};

export const getUserById: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();
    
    const { userId } = event.pathParameters || {};
    if (!userId) return validationError('User ID is required');
    
    const user = await User.findById(userId);
    if (!user) return notFoundError('User not found');
    
    return successResponse({
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      role: user.role,
      status: user.status,
      verified: user.verified,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      bio: user.bio,
      skills: user.skills,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return errorResponse('Internal server error');
  }
};

export const createUser: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();
    
    const body = JSON.parse(event.body || '{}');
    const { name, email, role = 'student', status = 'active', verified = false, phone } = body;
    
    if (!name || !ValidationUtil.isValidName(name)) {
      return validationError('Valid name is required');
    }
    if (!email || !ValidationUtil.isValidEmail(email)) {
      return validationError('Valid email is required');
    }
    if (role && !ValidationUtil.isValidRole(role)) {
      return validationError('Invalid role');
    }
    if (phone && !ValidationUtil.isValidPhone(phone)) {
      return validationError('Invalid phone number');
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) return conflictError('User with this email already exists');
    
    const user = new User({ name, email, role, status, verified, phone });
    await user.save();
    
    return successResponse({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      verified: user.verified,
      phone: user.phone,
      createdAt: user.createdAt
    }, 201);
  } catch (error) {
    console.error('Error creating user:', error);
    return errorResponse('Internal server error');
  }
};

export const updateUser: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();
    
    const { userId } = event.pathParameters || {};
    if (!userId) return validationError('User ID is required');
    
    const body = JSON.parse(event.body || '{}');
    const updates: any = {};
    
    if (body.name) {
      if (!ValidationUtil.isValidName(body.name)) {
        return validationError('Invalid name');
      }
      updates.name = body.name;
    }
    if (body.phone) {
      if (!ValidationUtil.isValidPhone(body.phone)) {
        return validationError('Invalid phone number');
      }
      updates.phone = body.phone;
    }
    if (body.status && ValidationUtil.isValidStatus(body.status)) {
      updates.status = body.status;
    }
    if (body.bio) updates.bio = body.bio;
    if (body.skills) updates.skills = body.skills;
    if (body.dateOfBirth) updates.dateOfBirth = new Date(body.dateOfBirth);
    
    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
    if (!user) return notFoundError('User not found');
    
    return successResponse({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
      bio: user.bio,
      skills: user.skills,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return errorResponse('Internal server error');
  }
};

export const deleteUser: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();
    
    const { userId } = event.pathParameters || {};
    if (!userId) return validationError('User ID is required');
    
    const user = await User.findByIdAndDelete(userId);
    if (!user) return notFoundError('User not found');
    
    return successResponse({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return errorResponse('Internal server error');
  }
};

export const getUserStats: APIGatewayProxyHandler = async (): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();
    
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const verifiedUsers = await User.countDocuments({ verified: true });
    
    const currentMonth = new Date();
    currentMonth.setDate(1);
    const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: currentMonth } });
    
    return successResponse({
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      verifiedUsers
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return errorResponse('Internal server error');
  }
};

export const verifyUser: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();
    
    const { userId } = event.pathParameters || {};
    if (!userId) return validationError('User ID is required');
    
    const body = JSON.parse(event.body || '{}');
    const { verificationType = 'email' } = body;
    
    const updates: any = { verified: true };
    if (verificationType === 'email') updates.emailVerified = true;
    if (verificationType === 'phone') updates.phoneVerified = true;
    
    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
    if (!user) return notFoundError('User not found');
    
    return successResponse({ message: 'User verified successfully', user });
  } catch (error) {
    console.error('Error verifying user:', error);
    return errorResponse('Internal server error');
  }
};

export const suspendUser: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();
    
    const { userId } = event.pathParameters || {};
    if (!userId) return validationError('User ID is required');
    
    const body = JSON.parse(event.body || '{}');
    const { reason, duration } = body;
    
    const user = await User.findByIdAndUpdate(userId, {
      status: 'suspended',
      suspensionReason: reason,
      suspensionDuration: duration
    }, { new: true }).select('-password');
    
    if (!user) return notFoundError('User not found');
    
    return successResponse({ message: 'User suspended successfully', user });
  } catch (error) {
    console.error('Error suspending user:', error);
    return errorResponse('Internal server error');
  }
};

export const activateUser: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();
    
    const { userId } = event.pathParameters || {};
    if (!userId) return validationError('User ID is required');
    
    const user = await User.findByIdAndUpdate(userId, {
      status: 'active',
      $unset: { suspensionReason: 1, suspensionDuration: 1 }
    }, { new: true }).select('-password');
    
    if (!user) return notFoundError('User not found');
    
    return successResponse({ message: 'User activated successfully', user });
  } catch (error) {
    console.error('Error activating user:', error);
    return errorResponse('Internal server error');
  }
};

export const getUserActivity: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();
    
    const { userId } = event.pathParameters || {};
    if (!userId) return validationError('User ID is required');
    
    const { page = '1', limit = '10' } = event.queryStringParameters || {};
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // const activities = await ActivityLog.find({ userId })
    //   .skip(skip)
    //   .limit(limitNum)
    //   .sort({ timestamp: -1 });
    
    return successResponse(
      // activities.map(activity => ({
      //   id: activity._id,
      //   action: activity.action,
      //   timestamp: activity.timestamp,
      //   ip: activity.ip,
      //   device: activity.device
      // }))
      []
    );
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return errorResponse('Internal server error');
  }
};

export const bulkUpdateUsers: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();
    
    const body = JSON.parse(event.body || '{}');
    const { userIds, updates } = body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return validationError('User IDs array is required');
    }
    
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      updates
    );
    
    return successResponse({
      message: 'Users updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error bulk updating users:', error);
    return errorResponse('Internal server error');
  }
};

export const bulkDeleteUsers: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();
    
    const body = JSON.parse(event.body || '{}');
    const { userIds } = body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return validationError('User IDs array is required');
    }
    
    const result = await User.deleteMany({ _id: { $in: userIds } });
    
    return successResponse({
      message: 'Users deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error bulk deleting users:', error);
    return errorResponse('Internal server error');
  }
};

export const getUserRoles: APIGatewayProxyHandler = async (): Promise<APIGatewayProxyResult> => {
  try {
    const roles = ['admin', 'mentor', 'student', 'tutor', 'support'];
    return successResponse({ roles });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return errorResponse('Internal server error');
  }
};

export const updateUserRole: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();
    
    const { userId } = event.pathParameters || {};
    if (!userId) return validationError('User ID is required');
    
    const body = JSON.parse(event.body || '{}');
    const { role } = body;
    
    if (!role || !ValidationUtil.isValidRole(role)) {
      return validationError('Valid role is required');
    }
    
    const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select('-password');
    if (!user) return notFoundError('User not found');
    
    return successResponse({
      message: 'User role updated successfully',
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return errorResponse('Internal server error');
  }
};
