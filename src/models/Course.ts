import { Schema, model } from 'mongoose';
import { CourseCategory, CourseLevel, CourseStatus } from '../types/course';

const courseSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 255 },
  description: { type: String, required: true, trim: true },
  category: { 
    type: String, 
    required: true, 
    enum: Object.values(CourseCategory) 
  },
  level: { 
    type: String, 
    required: true, 
    enum: Object.values(CourseLevel) 
  },
  duration: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0, default: 0 },
  currency: { type: String, default: 'USD', maxlength: 3 },
  thumbnail: { type: String, trim: true },
  status: { 
    type: String, 
    required: true, 
    enum: Object.values(CourseStatus),
    default: CourseStatus.DRAFT 
  },
  instructorId: { type: String, required: true },
  instructorName: { type: String, required: true, trim: true },
  maxStudents: { type: Number, required: true, min: 1, default: 100 },
  enrolledStudents: { type: Number, default: 0, min: 0 },
  completionRate: { type: Number, default: 0, min: 0, max: 100 },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0, min: 0 },
  isPublic: { type: Boolean, default: true },
  allowSelfEnrollment: { type: Boolean, default: true },
  certificateEnabled: { type: Boolean, default: false },
  prerequisites: [{ type: String, trim: true }],
  tags: [{ type: String, trim: true }],
  publishedAt: { type: Date }
}, {
  timestamps: true,
  toJSON: { 
    transform: (doc: any, ret: any) => {
      ret.id = ret._id.toString();
      ret.createdAt = ret.createdAt?.toISOString();
      ret.updatedAt = ret.updatedAt?.toISOString();
      ret.publishedAt = ret.publishedAt?.toISOString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

courseSchema.index({ instructorId: 1, status: 1 });
courseSchema.index({ category: 1, level: 1 });
courseSchema.index({ status: 1, isPublic: 1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ title: 'text', description: 'text' });

export const CourseModel = model('Course', courseSchema);
