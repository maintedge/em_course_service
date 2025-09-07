import { Schema, model } from 'mongoose';
import { BatchStatus } from '../types/course';

const batchSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 255 },
  description: { type: String, trim: true },
  courseId: { type: String, required: true },
  courseName: { type: String, required: true, trim: true },
  instructorId: { type: String, required: true },
  instructorName: { type: String, required: true, trim: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  schedule: [{
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    sessionType: { type: String, required: true },
    topic: { type: String, default: '' },
    isRecurring: { type: Boolean, default: true }
  }],
  timezone: { type: String, required: true, default: 'UTC' },
  maxStudents: { type: Number, required: true, min: 1, default: 30 },
  enrolledStudents: { type: Number, default: 0, min: 0 },
  waitlistCount: { type: Number, default: 0, min: 0 },
  status: { 
    type: String, 
    required: true, 
    enum: Object.values(BatchStatus),
    default: BatchStatus.UPCOMING 
  },
  isPublic: { type: Boolean, default: true },
  allowWaitlist: { type: Boolean, default: true },
  autoEnroll: { type: Boolean, default: false },
  completionRate: { type: Number, default: 0, min: 0, max: 100 },
  averageProgress: { type: Number, default: 0, min: 0, max: 100 }
}, {
  timestamps: true,
  toJSON: { 
    transform: (doc: any, ret: any) => {
      ret.id = ret._id.toString();
      ret.createdAt = ret.createdAt?.toISOString();
      ret.updatedAt = ret.updatedAt?.toISOString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

batchSchema.index({ courseId: 1, status: 1 });
batchSchema.index({ instructorId: 1 });
batchSchema.index({ startDate: 1, endDate: 1 });

export const BatchModel = model('Batch', batchSchema);
