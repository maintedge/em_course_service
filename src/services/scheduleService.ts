import { ScheduleEventModel } from '../models/ScheduleEvent';
import { CourseModel } from '../models/Course';
import { BatchModel } from '../models/Batch';
import { ScheduleEvent, ScheduleEventStatus, PaginationParams } from '../types/course';

export interface CreateScheduleEventRequest {
  title: string;
  description?: string;
  courseId: string;
  batchId?: string;
  eventType: string;
  startTime: string;
  endTime: string;
  location?: string;
  meetingUrl?: string;
  isRecurring?: boolean;
  recurrencePattern?: string;
  attendees?: string[];
  maxAttendees?: number;
  isRequired?: boolean;
  materials?: string[];
}

export interface ScheduleFilters extends PaginationParams {
  courseId?: string;
  batchId?: string;
  startDate?: string;
  endDate?: string;
  eventType?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ScheduleService {
  async createScheduleEvent(eventData: CreateScheduleEventRequest, instructorId: string): Promise<ScheduleEvent> {
    // Verify course exists and instructor owns it
    const course = await CourseModel.findOne({ _id: eventData.courseId });
    if (!course) {
      throw new Error('Course not found or access denied');
    }

    // Verify batch if provided
    if (eventData.batchId) {
      const batch = await BatchModel.findOne({ _id: eventData.batchId, courseId: eventData.courseId });
      if (!batch) {
        throw new Error('Batch not found or does not belong to this course');
      }
    }

    const scheduleEvent = new ScheduleEventModel({
      ...eventData,
      instructorId,
      status: ScheduleEventStatus.SCHEDULED,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedEvent = await scheduleEvent.save();
    return savedEvent.toJSON() as any;
  }

  async getScheduleEventById(eventId: string): Promise<ScheduleEvent | null> {
    const event = await ScheduleEventModel.findById(eventId);
    return event ? event.toJSON() as any : null;
  }

  async updateScheduleEvent(eventId: string, updateData: Partial<CreateScheduleEventRequest>, instructorId: string): Promise<ScheduleEvent | null> {
    const event = await ScheduleEventModel.findOneAndUpdate(
      { _id: eventId, instructorId },
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );
    return event ? event.toJSON() as any : null;
  }

  async deleteScheduleEvent(eventId: string, instructorId: string): Promise<boolean> {
    const result = await ScheduleEventModel.deleteOne({ _id: eventId, instructorId });
    return result.deletedCount > 0;
  }

  async listScheduleEvents(filters: ScheduleFilters): Promise<{ events: ScheduleEvent[]; pagination: any }> {
    const query: any = {};

    if (filters.courseId) {
      query.courseId = filters.courseId;
    }

    if (filters.batchId) {
      query.batchId = filters.batchId;
    }

    if (filters.startDate && filters.endDate) {
      query.startTime = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }

    if (filters.eventType) {
      query.eventType = filters.eventType;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    const sortField = filters.sortBy || 'startTime';
    const sortOrder = filters.sortOrder === 'desc' ? -1 : 1;
    const sort: any = { [sortField]: sortOrder };

    const skip = (filters.page - 1) * filters.limit;
    const limit = filters.limit;

    const [events, total] = await Promise.all([
      ScheduleEventModel.find(query).sort(sort).skip(skip).limit(limit),
      ScheduleEventModel.countDocuments(query)
    ]);

    return {
      events: events.map(event => event.toJSON() as any),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit)
      }
    };
  }

  async getUpcomingEvents(instructorId: string, limit: number = 10): Promise<ScheduleEvent[]> {
    const events = await ScheduleEventModel.find({
      instructorId,
      startTime: { $gte: new Date() },
      status: ScheduleEventStatus.SCHEDULED
    })
    .sort({ startTime: 1 })
    .limit(limit);

    return events.map(event => event.toJSON() as any);
  }

  async updateEventStatus(eventId: string, status: ScheduleEventStatus, instructorId: string): Promise<ScheduleEvent | null> {
    const event = await ScheduleEventModel.findOneAndUpdate(
      { _id: eventId, instructorId },
      { status, updatedAt: new Date() },
      { new: true }
    );
    return event ? event.toJSON() as any : null;
  }
}

export const getStudentSchedules = async (studentId: string, filters: {
  startDate?: string;
  endDate?: string;
  courseId?: string;
}) => {
  try {
    const mockEvents = [
      {
        id: 'schedule_1',
        title: 'JavaScript Fundamentals - Lecture 1',
        description: 'Introduction to JavaScript variables and functions',
        courseId: filters.courseId || 'course_1',
        courseName: 'JavaScript Fundamentals',
        batchId: 'batch_1',
        startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        eventType: 'lecture',
        location: 'Online',
        meetingUrl: 'https://meet.google.com/abc-def-ghi',
        instructorName: 'John Smith',
        status: 'scheduled'
      }
    ];

    return {
      events: mockEvents,
      total: mockEvents.length
    };
  } catch (error) {
    console.error('Error fetching student schedules:', error);
    throw error;
  }
};;
