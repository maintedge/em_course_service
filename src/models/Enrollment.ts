import { Schema, model } from 'mongoose';
import { EnrollmentStatus, PaymentStatus } from '../types/course';

const enrollmentSchema = new Schema({
  studentId: { type: String, required: true },
  studentName: { type: String, required: true, trim: true },
  studentEmail: { type: String, required: true, trim: true, lowercase: true },
  courseId: { type: String, required: true },
  batchId: { type: String },
  enrolledAt: { type: String, default: () => new Date().toISOString() },
  status: { 
    type: String, 
    required: true, 
    enum: Object.values(EnrollmentStatus),
    default: EnrollmentStatus.ACTIVE 
  },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  completedLessons: [{ type: String }],
  lastAccessedAt: { type: String },
  certificateIssued: { type: Boolean, default: false },
  certificateIssuedAt: { type: String },
  paymentStatus: { 
    type: String, 
    required: true, 
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING 
  },
  paymentAmount: { type: Number, required: true, min: 0, default: 0 }
}, {
  timestamps: true,
  toJSON: { 
    transform: (doc: any, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
enrollmentSchema.index({ courseId: 1, status: 1 });
enrollmentSchema.index({ batchId: 1 });
enrollmentSchema.index({ studentId: 1 });

export const EnrollmentModel = model('Enrollment', enrollmentSchema);
