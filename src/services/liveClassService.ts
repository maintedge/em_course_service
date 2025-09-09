import { LiveClassRecordingModel } from '../models/LiveClassRecording';
import { EnrollmentModel } from '../models/Enrollment';

export interface CreateRecordingRequest {
  courseId: string;
  batchId: string;
  moduleId: string;
  lessonId: string;
  title: string;
  description?: string;
  instructorId: string;
  instructorName: string;
  recordingUrl: string;
  duration: number;
  recordedAt: Date;
  fileSize?: number;
  quality?: '720p' | '1080p' | '480p';
  topics?: string[];
  tags?: string[];
  thumbnail?: string;
}

export class LiveClassService {
  async createRecording(recordingData: CreateRecordingRequest) {
    const recording = new LiveClassRecordingModel({
      ...recordingData,
      status: 'ready'
    });

    // Auto-assign access to enrolled students in the batch
    const enrollments = await EnrollmentModel.find({ 
      courseId: recordingData.courseId, 
      batchId: recordingData.batchId,
      status: 'active'
    });
    
    recording.allowedStudentIds = enrollments.map(e => e.studentId);
    recording.allowedBatchIds = [recordingData.batchId];

    const saved = await recording.save();
    return saved.toJSON();
  }

  async getRecording(recordingId: string) {
    const recording = await LiveClassRecordingModel.findById(recordingId);
    return recording ? recording.toJSON() : null;
  }

  async getRecordingsForCourse(courseId: string, instructorId?: string) {
    const query: any = { courseId };
    if (instructorId) query.instructorId = instructorId;

    const recordings = await LiveClassRecordingModel.find(query)
      .sort({ recordedAt: -1 });
    
    return recordings.map(r => r.toJSON());
  }

  async getStudentRecordings(courseId: string, studentId: string, batchId: string) {
    const recordings = await LiveClassRecordingModel.find({
      courseId,
      $or: [
        { isPublic: true },
        { allowedStudentIds: studentId },
        { allowedBatchIds: batchId }
      ],
      status: 'ready',
      $and: [
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: new Date() } }
          ]
        }
      ]
    }).sort({ recordedAt: -1 });

    return recordings.map(r => r.toJSON());
  }

  async updateRecordingAccess(recordingId: string, instructorId: string, accessData: {
    isPublic?: boolean;
    allowedStudentIds?: string[];
    allowedBatchIds?: string[];
    expiresAt?: Date;
  }) {
    const recording = await LiveClassRecordingModel.findOneAndUpdate(
      { _id: recordingId, instructorId },
      accessData,
      { new: true }
    );

    return recording ? recording.toJSON() : null;
  }

  async deleteRecording(recordingId: string, instructorId: string) {
    const result = await LiveClassRecordingModel.deleteOne({ 
      _id: recordingId, 
      instructorId 
    });
    return result.deletedCount > 0;
  }

  async incrementViewCount(recordingId: string, watchTime: number) {
    const recording = await LiveClassRecordingModel.findById(recordingId);
    if (!recording) return null;

    recording.viewCount += 1;
    
    // Update average watch time
    const totalWatchTime = recording.averageWatchTime * (recording.viewCount - 1) + watchTime;
    recording.averageWatchTime = totalWatchTime / recording.viewCount;

    const saved = await recording.save();
    return saved.toJSON();
  }
}
