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

  async getStudentBatchDetails(studentId: string): Promise<any[]> {
    const enrollments = await EnrollmentModel.find({ 
      studentId,
      status: { $ne: EnrollmentStatus.DROPPED }
    });

    const batchDetails = await Promise.all(
      enrollments.map(async (enrollment) => {
        const [course, batch] = await Promise.all([
          CourseModel.findOne({ _id: enrollment.courseId }),
          enrollment.batchId ? BatchModel.findOne({ _id: enrollment.batchId }) : null
        ]);

        return {
          enrollmentId: enrollment._id,
          courseId: enrollment.courseId,
          courseName: course?.title || 'Unknown Course',
          batchId: enrollment.batchId,
          batchName: batch?.name || 'No Batch Assigned',
          progress: enrollment.progress,
          status: enrollment.status,
          startDate: batch?.startDate,
          endDate: batch?.endDate,
          instructorName: batch?.instructorName,
          enrolledAt: enrollment.enrolledAt,
          lastAccessedAt: enrollment.lastAccessedAt,
          completedLessons: enrollment.completedLessons?.length || 0,
          certificateIssued: enrollment.certificateIssued
        };
      })
    );

    return batchDetails;
  }
}
