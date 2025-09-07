import { AssignmentModel } from '../models/Assignment';
import { CourseModel } from '../models/Course';
import { Assignment, AssignmentStatus, PaginationParams } from '../types/course';

export interface CreateAssignmentRequest {
  title: string;
  description?: string;
  instructions: string;
  courseId: string;
  batchId?: string;
  type: string;
  difficulty: string;
  estimatedHours?: number;
  maxScore?: number;
  passingScore?: number;
  assignedDate: string;
  dueDate: string;
  allowLateSubmission?: boolean;
  latePenalty?: number;
  maxAttempts?: number;
  isGroupAssignment?: boolean;
}

export class AssignmentService {
  async createAssignment(assignmentData: CreateAssignmentRequest, instructorId: string): Promise<Assignment> {
    // Verify course exists and instructor owns it
    const course = await CourseModel.findOne({ _id: assignmentData.courseId });
    if (!course) {
      throw new Error('Course not found or access denied');
    }

    const assignment = new AssignmentModel({
      ...assignmentData,
      courseName: course.title,
      instructorId,
      totalSubmissions: 0,
      gradedSubmissions: 0,
      averageScore: 0,
      completionRate: 0
    });

    const savedAssignment = await assignment.save();
    return savedAssignment.toJSON() as any;
  }

  async getAssignmentById(assignmentId: string): Promise<Assignment | null> {
    const assignment = await AssignmentModel.findOne({ _id: assignmentId });
    return assignment ? assignment.toJSON() as any : null;
  }

  async updateAssignment(assignmentId: string, updateData: Partial<CreateAssignmentRequest>, instructorId: string): Promise<Assignment | null> {
    const assignment = await AssignmentModel.findOneAndUpdate(
      { _id: assignmentId },
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );
    return assignment ? assignment.toJSON() as any : null;
  }

  async deleteAssignment(assignmentId: string, instructorId: string): Promise<boolean> {
    const result = await AssignmentModel.deleteOne({ _id: assignmentId });
    return result.deletedCount > 0;
  }

  async listAssignments(filters: PaginationParams & { 
    courseId?: string; 
    batchId?: string; 
    instructorId?: string; 
    type?: string; 
    status?: string;
    search?: string;
  }): Promise<{ assignments: Assignment[]; total: number; pages: number }> {
    const query: any = {};

    if (filters.courseId) {
      query.courseId = filters.courseId;
    }

    if (filters.batchId) {
      query.batchId = filters.batchId;
    }

    if (filters.instructorId) {
      query.instructorId = filters.instructorId;
    }

    if (filters.type && filters.type !== 'all') {
      query.type = filters.type;
    }

    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const skip = (filters.page - 1) * filters.limit;
    const [assignments, total] = await Promise.all([
      AssignmentModel.find(query).sort({ dueDate: -1 }).skip(skip).limit(filters.limit),
      AssignmentModel.countDocuments(query)
    ]);

    return {
      assignments: assignments.map(assignment => assignment.toJSON() as any),
      total,
      pages: Math.ceil(total / filters.limit)
    };
  }

  async publishAssignment(assignmentId: string, instructorId: string): Promise<Assignment | null> {
    const assignment = await AssignmentModel.findOneAndUpdate(
      { _id: assignmentId },
      { 
        status: AssignmentStatus.PUBLISHED,
        isPublished: true,
        updatedAt: new Date()
      },
      { new: true }
    );
    return assignment ? assignment.toJSON() as any : null;
  }

  async getAssignmentsByDueDate(startDate: string, endDate: string, instructorId?: string): Promise<Assignment[]> {
    const query: any = {
      dueDate: { $gte: startDate, $lte: endDate },
      status: AssignmentStatus.PUBLISHED
    };

    if (instructorId) {
      query.instructorId = instructorId;
    }

    const assignments = await AssignmentModel.find(query).sort({ dueDate: 1 });
    return assignments.map(assignment => assignment.toJSON() as any);
  }
}
