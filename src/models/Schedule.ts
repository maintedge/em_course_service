import { Schema, model } from 'mongoose';

const scheduleSchema = new Schema({
  batchId: { type: String, required: true },
  courseId: { type: String, required: true },
  date: { type: Date, required: true },
  dayOfWeek: { type: Number, required: true }, // 0=Sunday, 1=Monday, etc.
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  sessionType: { type: String, default: 'lecture' },
  topic: { type: String, default: '' },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  tutorId: { type: String, default: null },
  tutorName: { type: String, default: '' }
}, {
  timestamps: true,
  toJSON: { 
    transform: (doc: any, ret: any) => {
      ret.id = ret._id.toString();
      ret.date = ret.date?.toISOString();
      ret.createdAt = ret.createdAt?.toISOString();
      ret.updatedAt = ret.updatedAt?.toISOString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

scheduleSchema.index({ batchId: 1, date: 1 });
scheduleSchema.index({ courseId: 1 });

export const ScheduleModel = model('Schedule', scheduleSchema);
