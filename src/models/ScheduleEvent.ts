import mongoose, { Schema, Document } from 'mongoose';
import { ScheduleEvent, ScheduleEventType, ScheduleEventStatus } from '../types/course';

interface ScheduleEventDocument extends Document, Omit<ScheduleEvent, 'id'> {}

const scheduleEventSchema = new Schema<ScheduleEventDocument>({
  title: { type: String, required: true },
  description: { type: String },
  courseId: { type: String, required: true, index: true },
  batchId: { type: String, index: true },
  instructorId: { type: String, required: true, index: true },
  eventType: { 
    type: String, 
    required: true,
    enum: Object.values(ScheduleEventType)
  },
  startTime: { type: Date, required: true, index: true },
  endTime: { type: Date, required: true },
  location: { type: String },
  meetingUrl: { type: String },
  isRecurring: { type: Boolean, default: false },
  recurrencePattern: { type: String },
  attendees: [{ type: String }],
  maxAttendees: { type: Number },
  isRequired: { type: Boolean, default: true },
  materials: [{ type: String }],
  status: { 
    type: String, 
    required: true,
    enum: Object.values(ScheduleEventStatus),
    default: ScheduleEventStatus.SCHEDULED
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for better query performance
scheduleEventSchema.index({ courseId: 1, startTime: 1 });
scheduleEventSchema.index({ batchId: 1, startTime: 1 });
scheduleEventSchema.index({ instructorId: 1, startTime: 1 });
scheduleEventSchema.index({ startTime: 1, status: 1 });

export const ScheduleEventModel = mongoose.model<ScheduleEventDocument>('ScheduleEvent', scheduleEventSchema);
