import { CurriculumModel } from '../models/Curriculum';
import { LiveClassRecordingModel } from '../models/LiveClassRecording';

export interface CreateModuleRequest {
  title: string;
  description?: string;
  order: number;
  estimatedHours: number;
  lessons: CreateLessonRequest[];
}

export interface CreateLessonRequest {
  title: string;
  description?: string;
  type: 'video' | 'reading' | 'assignment' | 'quiz' | 'live_class';
  duration: number;
  order: number;
  isRequired?: boolean;
  videoUrl?: string;
  liveClassId?: string;
  content?: string;
  resources?: Array<{
    name: string;
    url: string;
    type: 'pdf' | 'link' | 'video' | 'document';
  }>;
}

export class CurriculumService {
  async createCurriculum(courseId: string, modules: CreateModuleRequest[]) {
    // Delete existing curriculum if any
    await CurriculumModel.deleteOne({ courseId });
    
    const curriculum = new CurriculumModel({
      courseId,
      modules
    });
    
    const saved = await curriculum.save();
    return saved.toJSON();
  }

  async getCurriculum(courseId: string) {
    const curriculum = await CurriculumModel.findOne({ courseId });
    return curriculum ? curriculum.toJSON() : null;
  }

  async updateModule(courseId: string, moduleId: string, updateData: Partial<CreateModuleRequest>) {
    const curriculum = await CurriculumModel.findOne({ courseId });
    if (!curriculum) throw new Error('Curriculum not found');

    const moduleIndex = curriculum.modules.findIndex((m: any) => m._id.toString() === moduleId);
    if (moduleIndex === -1) throw new Error('Module not found');

    Object.assign(curriculum.modules[moduleIndex], updateData);
    const saved = await curriculum.save();
    return saved.toJSON();
  }

  async addLesson(courseId: string, moduleId: string, lessonData: CreateLessonRequest) {
    const curriculum = await CurriculumModel.findOne({ courseId });
    if (!curriculum) throw new Error('Curriculum not found');

    const module = curriculum.modules.find((m: any) => m._id.toString() === moduleId);
    if (!module) throw new Error('Module not found');

    (module as any).lessons.push(lessonData);
    const saved = await curriculum.save();
    return saved.toJSON();
  }

  async updateLesson(courseId: string, moduleId: string, lessonId: string, updateData: Partial<CreateLessonRequest>) {
    const curriculum = await CurriculumModel.findOne({ courseId });
    if (!curriculum) throw new Error('Curriculum not found');

    const module = curriculum.modules.find((m: any) => m._id.toString() === moduleId);
    if (!module) throw new Error('Module not found');

    const lessonIndex = (module as any).lessons.findIndex((l: any) => l._id.toString() === lessonId);
    if (lessonIndex === -1) throw new Error('Lesson not found');

    Object.assign((module as any).lessons[lessonIndex], updateData);
    const saved = await curriculum.save();
    return saved.toJSON();
  }

  async deleteModule(courseId: string, moduleId: string) {
    const curriculum = await CurriculumModel.findOne({ courseId });
    if (!curriculum) throw new Error('Curriculum not found');

    curriculum.modules = curriculum.modules.filter((m: any) => m._id.toString() !== moduleId) as any;
    const saved = await curriculum.save();
    return saved.toJSON();
  }

  async deleteLesson(courseId: string, moduleId: string, lessonId: string) {
    const curriculum = await CurriculumModel.findOne({ courseId });
    if (!curriculum) throw new Error('Curriculum not found');

    const module = curriculum.modules.find((m: any) => m._id.toString() === moduleId);
    if (!module) throw new Error('Module not found');

    (module as any).lessons = (module as any).lessons.filter((l: any) => l._id.toString() !== lessonId);
    const saved = await curriculum.save();
    return saved.toJSON();
  }

  // Get curriculum for students with access control
  async getStudentCurriculum(courseId: string, studentId: string, batchId: string) {
    const curriculum = await CurriculumModel.findOne({ courseId });
    if (!curriculum) return null;

    // Get live class recordings the student can access
    const recordings = await LiveClassRecordingModel.find({
      courseId,
      $or: [
        { isPublic: true },
        { allowedStudentIds: studentId },
        { allowedBatchIds: batchId }
      ],
      status: 'ready'
    });

    const curriculumData = curriculum.toJSON();
    
    // Attach recording URLs to lessons
    curriculumData.modules.forEach((module: any) => {
      module.lessons.forEach((lesson: any) => {
        if (lesson.type === 'live_class' && lesson.liveClassId) {
          const recording = recordings.find(r => r.id === lesson.liveClassId);
          if (recording) {
            lesson.videoUrl = recording.recordingUrl;
            lesson.recordedAt = recording.recordedAt;
            lesson.duration = recording.duration;
          }
        }
      });
    });

    return curriculumData;
  }
}
