import { Schema, model } from 'mongoose';

const liveClassRecordingSchema = new Schema({
  courseId: { type: String, required: true, index: true },
  batchId: { type: String, required: true, index: true },
  moduleId: { type: String, required: true },
  lessonId: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  instructorId: { type: String, required: true },
  instructorName: { type: String, required: true },
  
  // Recording details
  recordingUrl: { type: String, required: true, trim: true },
  duration: { type: Number, required: true, min: 0 }, // in minutes
  recordedAt: { type: Date, required: true },
  fileSize: { type: Number }, // in bytes
  quality: { type: String, enum: ['720p', '1080p', '480p'], default: '720p' },
  
  // Access control
  isPublic: { type: Boolean, default: false },
  allowedStudentIds: [{ type: String }], // Specific students who can access
  allowedBatchIds: [{ type: String }], // Batches that can access
  expiresAt: { type: Date }, // Optional expiration date
  
  // Metadata
  topics: [{ type: String, trim: true }],
  tags: [{ type: String, trim: true }],
  thumbnail: { type: String, trim: true },
  
  // Analytics
  viewCount: { type: Number, default: 0 },
  averageWatchTime: { type: Number, default: 0 }, // in minutes
  
  status: { 
    type: String, 
    enum: ['processing', 'ready', 'failed', 'archived'], 
    default: 'processing' 
  }
}, {
  timestamps: true,
  toJSON: { 
    transform: (doc: any, ret: any) => {
      ret.id = ret._id.toString();
      ret.createdAt = ret.createdAt?.toISOString();
      ret.updatedAt = ret.updatedAt?.toISOString();
      ret.recordedAt = ret.recordedAt?.toISOString();
      ret.expiresAt = ret.expiresAt?.toISOString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

liveClassRecordingSchema.index({ courseId: 1, batchId: 1 });
liveClassRecordingSchema.index({ instructorId: 1 });
liveClassRecordingSchema.index({ status: 1 });
liveClassRecordingSchema.index({ recordedAt: -1 });

export const LiveClassRecordingModel = model('LiveClassRecording', liveClassRecordingSchema);
