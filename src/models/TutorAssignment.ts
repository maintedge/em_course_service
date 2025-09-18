import { Schema, model } from 'mongoose';

const tutorAssignmentSchema = new Schema({
  tutorId: { type: String, required: true },
  tutorName: { type: String, required: true, trim: true },
  tutorEmail: { type: String, required: true, trim: true },
  batchId: { type: String, required: true },
  courseId: { type: String, required: true },
  assignedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, {
  timestamps: true,
  toJSON: { 
    transform: (doc: any, ret: any) => {
      ret.id = ret._id.toString();
      ret.assignedAt = ret.assignedAt?.toISOString();
      ret.createdAt = ret.createdAt?.toISOString();
      ret.updatedAt = ret.updatedAt?.toISOString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

tutorAssignmentSchema.index({ batchId: 1 });
tutorAssignmentSchema.index({ tutorId: 1 });
tutorAssignmentSchema.index({ courseId: 1 });

export const TutorAssignmentModel = model('TutorAssignment', tutorAssignmentSchema);
