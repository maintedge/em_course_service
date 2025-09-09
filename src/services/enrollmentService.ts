import { EnrollmentModel } from '../models/Enrollment';
import { CourseModel } from '../models/Course';
import { BatchModel } from '../models/Batch';
import { Enrollment, EnrollmentStatus, PaymentStatus, PaginationParams } from '../types/course';

export interface EnrollStudentRequest {
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  batchId?: string;
  paymentAmount: number;
}

export class EnrollmentService {
  async enrollStudent(enrollmentData: EnrollStudentRequest): Promise<Enrollment> {
    // Verify course exists
    const course = await CourseModel.findOne({ _id: enrollmentData.courseId });
    if (!course) {
      throw new Error('Course not found');
    }

    // Check if student is already enrolled
    const existingEnrollment = await EnrollmentModel.findOne({
      studentId: enrollmentData.studentId,
      courseId: enrollmentData.courseId
    });

    if (existingEnrollment) {
      throw new Error('Student already enrolled in this course');
    }

    // If batch is specified, verify it exists and has capacity
    if (enrollmentData.batchId) {
      const batch = await BatchModel.findOne({ _id: enrollmentData.batchId });
      if (!batch) {
        throw new Error('Batch not found');
      }
      if (batch.enrolledStudents >= batch.maxStudents && !batch.allowWaitlist) {
        throw new Error('Batch is full and waitlist is not allowed');
      }
    }

    // Create enrollment
    const enrollment = new EnrollmentModel({
      ...enrollmentData,
      status: EnrollmentStatus.ACTIVE,
      progress: 0,
      completedLessons: [],
      certificateIssued: false,
      paymentStatus: enrollmentData.paymentAmount > 0 ? PaymentStatus.PENDING : PaymentStatus.PAID
    });

    const savedEnrollment = await enrollment.save();

    // Update course enrolled count
    await CourseModel.updateOne(
      { _id: enrollmentData.courseId },
      { $inc: { enrolledStudents: 1 } }
    );

    // Update batch enrolled count if applicable
    if (enrollmentData.batchId) {
      await BatchModel.updateOne(
        { _id: enrollmentData.batchId },
        { $inc: { enrolledStudents: 1 } }
      );
    }

    return savedEnrollment.toJSON() as any;
  }

  async getEnrollmentById(enrollmentId: string): Promise<Enrollment | null> {
    const enrollment = await EnrollmentModel.findOne({ _id: enrollmentId });
    return enrollment ? enrollment.toJSON() as any : null;
  }

  async updateEnrollmentStatus(enrollmentId: string, status: EnrollmentStatus, reason?: string): Promise<Enrollment | null> {
    const enrollment = await EnrollmentModel.findOneAndUpdate(
      { _id: enrollmentId },
      { status, updatedAt: new Date() },
      { new: true }
    );
    return enrollment ? enrollment.toJSON() as any : null;
  }

  async listEnrollments(filters: PaginationParams & {
    studentId?: string;
    courseId?: string;
    batchId?: string;
    status?: string;
  }): Promise<{ enrollments: Enrollment[]; total: number; pages: number }> {
    const query: any = {};

    if (filters.studentId) {
      query.studentId = filters.studentId;
    }

    if (filters.courseId) {
      query.courseId = filters.courseId;
    }

    if (filters.batchId) {
      query.batchId = filters.batchId;
    }

    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    const skip = (filters.page - 1) * filters.limit;
    const [enrollments, total] = await Promise.all([
      EnrollmentModel.find(query).sort({ enrolledAt: -1 }).skip(skip).limit(filters.limit),
      EnrollmentModel.countDocuments(query)
    ]);

    return {
      enrollments: enrollments.map(enrollment => enrollment.toJSON() as any),
      total,
      pages: Math.ceil(total / filters.limit)
    };
  }

  async updateStudentProgress(enrollmentId: string, progress: number, completedLessons: string[]): Promise<Enrollment | null> {
    const enrollment = await EnrollmentModel.findOneAndUpdate(
      { _id: enrollmentId },
      { 
        progress,
        completedLessons,
        lastAccessedAt: new Date().toISOString(),
        updatedAt: new Date()
      },
      { new: true }
    );
    return enrollment ? enrollment.toJSON() as any : null;
  }

  async issueCertificate(enrollmentId: string): Promise<Enrollment | null> {
    const enrollment = await EnrollmentModel.findOne({ _id: enrollmentId });
    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    if (enrollment.progress < 100) {
      throw new Error('Student has not completed the course');
    }

    if (enrollment.certificateIssued) {
      throw new Error('Certificate already issued');
    }

    const updatedEnrollment = await EnrollmentModel.findOneAndUpdate(
      { _id: enrollmentId },
      { 
        certificateIssued: true,
        certificateIssuedAt: new Date().toISOString(),
        updatedAt: new Date()
      },
      { new: true }
    );

    return updatedEnrollment ? updatedEnrollment.toJSON() as any : null;
  }

  async getStudentProgress(studentId: string, courseId: string): Promise<Enrollment | null> {
    const enrollment = await EnrollmentModel.findOne({ studentId, courseId });
    return enrollment ? enrollment.toJSON() as any : null;
  }

  async dropEnrollment(enrollmentId: string): Promise<boolean> {
    const enrollment = await EnrollmentModel.findOne({ _id: enrollmentId });
    if (!enrollment) {
      return false;
    }

    // Update enrollment status
    await EnrollmentModel.updateOne(
      { _id: enrollmentId },
      { status: EnrollmentStatus.DROPPED, updatedAt: new Date() }
    );

    // Update course enrolled count
    await CourseModel.updateOne(
      { _id: enrollment.courseId },
      { $inc: { enrolledStudents: -1 } }
    );

    // Update batch enrolled count if applicable
    if (enrollment.batchId) {
      await BatchModel.updateOne(
        { _id: enrollment.batchId },
        { $inc: { enrolledStudents: -1 } }
      );
    }

    return true;
  }
}
// Get student enrollments - simplified version
export const getStudentEnrollments = async (userId: string) => {
  try {
    // Mock data for now - replace with actual database queries
    const mockEnrollments = [
      {
        id: 'enroll_1',
        studentId: userId,
        courseId: 'course_1',
        batchId: 'batch_1',
        courseName: 'JavaScript Fundamentals',
        batchName: 'JS-2024-01',
        enrollmentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        progress: 65,
        completedAssignments: 3,
        totalAssignments: 8,
        lastAccessedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'enroll_2',
        studentId: userId,
        courseId: 'course_2',
        batchId: 'batch_2',
        courseName: 'React Development',
        batchName: 'React-2024-01',
        enrollmentDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        progress: 25,
        completedAssignments: 1,
        totalAssignments: 6,
        lastAccessedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    return {
      enrollments: mockEnrollments,
      total: mockEnrollments.length
    };
  } catch (error) {
    console.error('Error fetching student enrollments:', error);
    throw error;
  }
};
