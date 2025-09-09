import { Schema, model } from 'mongoose';

const lessonSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['video', 'reading', 'assignment', 'quiz', 'live_class'] 
  },
  duration: { type: Number, required: true, min: 0 }, // in minutes
  order: { type: Number, required: true, min: 0 },
  isRequired: { type: Boolean, default: true },
  videoUrl: { type: String, trim: true }, // For recorded classes
  liveClassId: { type: String, trim: true }, // Reference to live class recording
  content: { type: String }, // Text content for reading materials
  resources: [{ 
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, enum: ['pdf', 'link', 'video', 'document'] }
  }]
}, { _id: true });

const moduleSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  order: { type: Number, required: true, min: 0 },
  estimatedHours: { type: Number, required: true, min: 0 },
  lessons: [lessonSchema]
}, { _id: true });

const curriculumSchema = new Schema({
  courseId: { type: String, required: true, index: true },
  modules: [moduleSchema],
  totalDuration: { type: Number, default: 0 }, // Auto-calculated
  totalLessons: { type: Number, default: 0 }, // Auto-calculated
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

// Auto-calculate totals before saving
curriculumSchema.pre('save', function() {
  let totalDuration = 0;
  let totalLessons = 0;
  
  this.modules.forEach((module: any) => {
    module.lessons.forEach((lesson: any) => {
      totalDuration += lesson.duration;
      totalLessons++;
    });
  });
  
  this.totalDuration = totalDuration;
  this.totalLessons = totalLessons;
});

curriculumSchema.index({ courseId: 1 });

export const CurriculumModel = model('Curriculum', curriculumSchema);
