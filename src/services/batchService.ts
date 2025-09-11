import { BatchModel } from '../models/Batch';
import { CourseModel } from '../models/Course';
import { EnrollmentModel } from '../models/Enrollment';
import { Batch, PaginationParams } from '../types/course';

export interface CreateBatchRequest {
  name: string;
  description?: string;
  courseId: string;
  startDate: string;
  endDate: string;
  schedule?: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    sessionType: string;
    topic: string;
    isRecurring: boolean;
  }[];
  timezone?: string;
  maxStudents: number;
  isPublic?: boolean;
  allowWaitlist?: boolean;
  autoEnroll?: boolean;
}

export class BatchService {
  async createBatch(batchData: CreateBatchRequest): Promise<Batch> {
    // Verify course exists and instructor owns it
    const course = await CourseModel.findOne({ _id: batchData.courseId });
    if (!course) {
      throw new Error('Course not found or access denied');
    }

    const batch = new BatchModel({
      ...batchData,
      courseName: course.title,
      instructorName: course.instructorName,
      enrolledStudents: 0,
      waitlistCount: 0,
      completionRate: 0,
      averageProgress: 0
    });

    const savedBatch = await batch.save();
    return savedBatch.toJSON() as any;
  }

  async getBatchById(batchId: string): Promise<Batch | null> {
    const batch = await BatchModel.findOne({ _id: batchId });
    return batch ? batch.toJSON() as any : null;
  }

  async updateBatch(batchId: string, updateData: Partial<CreateBatchRequest>, instructorId: string): Promise<Batch | null> {
    const batch = await BatchModel.findOneAndUpdate(
      { _id: batchId },
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );
    return batch ? batch.toJSON() as any : null;
  }

  async deleteBatch(batchId: string, instructorId: string): Promise<boolean> {
    // Check if batch has enrollments
    const enrollmentCount = await EnrollmentModel.countDocuments({ batchId });
    if (enrollmentCount > 0) {
      throw new Error('Cannot delete batch with active enrollments');
    }

    const result = await BatchModel.deleteOne({ _id: batchId });
    return result.deletedCount > 0;
  }

  async listBatches(filters: PaginationParams & { courseId?: string; instructorId?: string; status?: string; sortBy?: string; sortOrder?: string; search?: string }): Promise<{ batches: Batch[]; total: number; pages: number }> {
    const query: any = {};

    if (filters.courseId) {
      query.courseId = filters.courseId;
    }

    if (filters.instructorId) {
      query.instructorId = filters.instructorId;
    }

    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    // Add search functionality
    if (filters.search && filters.search.trim()) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { courseName: { $regex: filters.search, $options: 'i' } }
      ];
    }

    // Build sort object with fallback
    const sortField = filters.sortBy || 'createdAt';
    const sortDirection = filters.sortOrder === 'asc' ? 1 : -1;
    const sortObj: any = { [sortField]: sortDirection, _id: 1 };

    const skip = (filters.page - 1) * filters.limit;
    
    const [batches, total] = await Promise.all([
      BatchModel.find(query).sort(sortObj).skip(skip).limit(filters.limit),
      BatchModel.countDocuments(query)
    ]);

    return {
      batches: batches.map(batch => batch.toJSON() as any),
      total,
      pages: Math.ceil(total / filters.limit)
    };
  }

  async getBatchStudents(batchId: string, instructorId: string): Promise<any[]> {
    // Verify batch ownership
    const batch = await BatchModel.findOne({ _id: batchId });
    if (!batch) {
      throw new Error('Batch not found or access denied');
    }

    const enrollments = await EnrollmentModel.find({ batchId }).sort({ enrolledAt: -1 });
    return enrollments.map(enrollment => enrollment.toJSON());
  }

  async addStudentToBatch(batchId: string, studentData: { studentId: string; studentName: string; studentEmail: string; status?: string }, instructorId: string): Promise<any> {
    // Verify batch ownership and get batch details
    const batch = await BatchModel.findOne({ _id: batchId });
    if (!batch) {
      throw new Error('Batch not found or access denied');
    }

    // Check if student is already enrolled
    const existingEnrollment = await EnrollmentModel.findOne({
      studentId: studentData.studentId,
      courseId: batch.courseId
    });

    if (existingEnrollment) {
      throw new Error('Student already enrolled in this course');
    }

    // Check batch capacity
    if (batch.enrolledStudents >= batch.maxStudents) {
      throw new Error('Batch is full');
    }

    // Create enrollment
    const enrollment = new EnrollmentModel({
      ...studentData,
      courseId: batch.courseId,
      batchId: batchId,
      status: studentData.status || 'active',
      paymentAmount: 0 // This should come from course price
    });

    await enrollment.save();

    // Update batch enrolled count
    await BatchModel.updateOne(
      { _id: batchId },
      { $inc: { enrolledStudents: 1 } }
    );

    return enrollment.toJSON();
  }

  async removeStudentFromBatch(batchId: string, studentId: string, instructorId: string): Promise<boolean> {
    // Verify batch ownership
    const batch = await BatchModel.findOne({ _id: batchId });
    if (!batch) {
      throw new Error('Batch not found or access denied');
    }

    const result = await EnrollmentModel.deleteOne({ batchId, studentId });
    
    if (result.deletedCount > 0) {
      // Update batch enrolled count
      await BatchModel.updateOne(
        { _id: batchId },
        { $inc: { enrolledStudents: -1 } }
      );
      return true;
    }

    return false;
  }
}
