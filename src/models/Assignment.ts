import { Schema, model } from 'mongoose';
import { AssignmentType, AssignmentDifficulty, AssignmentStatus } from '../types/course';

const assignmentSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 255 },
  description: { type: String, trim: true },
  instructions: { type: String, required: true, trim: true },
  courseId: { type: String, required: true },
  courseName: { type: String, required: true, trim: true },
  batchId: { type: String },
  instructorId: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: Object.values(AssignmentType) 
  },
  difficulty: { 
    type: String, 
    required: true, 
    enum: Object.values(AssignmentDifficulty) 
  },
  estimatedHours: { type: Number, default: 1, min: 1 },
  maxScore: { type: Number, required: true, default: 100, min: 1 },
  passingScore: { type: Number, required: true, default: 60, min: 0 },
  assignedDate: { type: String, required: true },
  dueDate: { type: String, required: true },
  allowLateSubmission: { type: Boolean, default: true },
  latePenalty: { type: Number, default: 10, min: 0, max: 100 },
  maxAttempts: { type: Number, default: 1, min: 1 },
  isGroupAssignment: { type: Boolean, default: false },
  status: { 
    type: String, 
    required: true, 
    enum: Object.values(AssignmentStatus),
    default: AssignmentStatus.DRAFT 
  },
  isPublished: { type: Boolean, default: false },
  totalSubmissions: { type: Number, default: 0, min: 0 },
  gradedSubmissions: { type: Number, default: 0, min: 0 },
  averageScore: { type: Number, default: 0, min: 0 },
  completionRate: { type: Number, default: 0, min: 0, max: 100 }
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

assignmentSchema.index({ courseId: 1, status: 1 });
assignmentSchema.index({ batchId: 1 });
assignmentSchema.index({ instructorId: 1 });
assignmentSchema.index({ dueDate: 1 });

export const AssignmentModel = model('Assignment', assignmentSchema);
