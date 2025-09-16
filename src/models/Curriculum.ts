import mongoose, { Schema, Document } from 'mongoose';

export interface ICurriculum extends Document {
  courseId: string;
  courseName: string;
  modules: Array<{
    id: string;
    title: string;
    description: string;
    order: number;
    duration: string;
    lessons: Array<{
      id: string;
      title: string;
      type: string;
      duration: string;
      order: number;
      content?: string;
      resources?: string[];
    }>;
  }>;
  totalModules: number;
  totalLessons: number;
  estimatedDuration: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const CurriculumSchema: Schema = new Schema({
  courseId: { type: String, required: true, index: true },
  courseName: { type: String, required: true },
  modules: [{
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    order: { type: Number, required: true },
    duration: { type: String },
    lessons: [{
      id: { type: String, required: true },
      title: { type: String, required: true },
      type: { type: String, required: true },
      duration: { type: String },
      order: { type: Number, required: true },
      content: { type: String },
      resources: [{ type: String }]
    }]
  }],
  totalModules: { type: Number, default: 0 },
  totalLessons: { type: Number, default: 0 },
  estimatedDuration: { type: String },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model<ICurriculum>('Curriculum', CurriculumSchema);
