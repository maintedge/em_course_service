import { ScheduleModel } from '../models/Schedule';
import { BatchModel } from '../models/Batch';
import { Types } from 'mongoose';

export class ScheduleService {
  async generateScheduleForBatch(
    batchId: string,
    courseId: string,
    startDate: Date,
    endDate: Date,
    selectedDays: { dayOfWeek: number; startTime: string; endTime: string; sessionType?: string; topic?: string }[]
  ): Promise<void> {
    // Clear existing schedules for this batch
    await ScheduleModel.deleteMany({ batchId });

    const schedules = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      const selectedDay = selectedDays.find(day => day.dayOfWeek === dayOfWeek);
      
      if (selectedDay) {
        schedules.push({
          batchId,
          courseId,
          date: new Date(current),
          dayOfWeek,
          startTime: selectedDay.startTime,
          endTime: selectedDay.endTime,
          sessionType: selectedDay.sessionType || 'lecture',
          topic: selectedDay.topic || ''
        });
      }
      
      current.setDate(current.getDate() + 1);
    }

    if (schedules.length > 0) {
      await ScheduleModel.insertMany(schedules);
    }
  }

  async getScheduleForBatch(batchId: string): Promise<any[]> {
    const schedules = await ScheduleModel.find({ batchId }).sort({ date: 1 });
    return schedules.map(schedule => schedule.toJSON());
  }

  async deleteScheduleForBatch(batchId: string): Promise<void> {
    await ScheduleModel.deleteMany({ batchId });
  }

  async updateScheduleTutorForBatch(
    batchId: string, 
    tutorId: string, 
    tutorName: string, 
    isInitialAssignment: boolean = false
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const query: any = { batchId };
    
    // For tutor changes, only update future sessions
    if (!isInitialAssignment) {
      query.date = { $gte: today };
    }

    await ScheduleModel.updateMany(
      query,
      { 
        $set: { 
          tutorId, 
          tutorName 
        } 
      }
    );
  }

  async removeTutorFromSchedule(batchId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await ScheduleModel.updateMany(
      { 
        batchId,
        date: { $gte: today }
      },
      { 
        $set: { 
          tutorId: null, 
          tutorName: '' 
        } 
      }
    );
  }

  async getAllSchedules(filters: {
    page: number;
    limit: number;
    startDate?: string;
    endDate?: string;
    batchId?: string;
    tutorId?: string;
    dayOfWeek?: number;
    sortBy: string;
    sortOrder: string;
  }): Promise<{ schedules: any[]; total: number; pages: number }> {
    const query: any = {};

    // Date filters
    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) {
        query.date.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.date.$lte = new Date(filters.endDate);
      }
    }

    // Other filters
    if (filters.batchId) {
      query.batchId = filters.batchId;
    }
    if (filters.tutorId) {
      query.tutorId = filters.tutorId;
    }
    if (filters.dayOfWeek !== undefined) {
      query.dayOfWeek = filters.dayOfWeek;
    }

    // Sorting
    const sortField = filters.sortBy === 'batch' ? 'batchName' : filters.sortBy;
    const sortOrder = filters.sortOrder === 'desc' ? -1 : 1;
    const sort: any = { [sortField]: sortOrder };

    // Pagination
    const skip = (filters.page - 1) * filters.limit;

    // Aggregate to join with batch data
    const pipeline = [
      { $match: query },
      {
        $lookup: {
          from: 'batches',
          let: { batchId: { $toObjectId: "$batchId" } },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$batchId"] } } }
          ],
          as: 'batch'
        }
      },
      {
        $addFields: {
          batchName: { $arrayElemAt: ['$batch.name', 0] },
          courseName: { $arrayElemAt: ['$batch.courseName', 0] }
        }
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: filters.limit },
      {
        $project: {
          _id: 1,
          batchId: 1,
          courseId: 1,
          date: 1,
          dayOfWeek: 1,
          startTime: 1,
          endTime: 1,
          sessionType: 1,
          topic: 1,
          status: 1,
          tutorId: 1,
          tutorName: 1,
          batchName: 1,
          courseName: 1
        }
      }
    ];

    const schedules = await ScheduleModel.aggregate(pipeline);
    const total = await ScheduleModel.countDocuments(query);
    const pages = Math.ceil(total / filters.limit);

    return {
      schedules: schedules.map(schedule => ({
        ...schedule,
        id: schedule._id.toString(),
        date: schedule.date?.toISOString()
      })),
      total,
      pages
    };
  }

  async updateScheduleTutor(scheduleId: string, tutorId: string | null, tutorName: string): Promise<any> {
    const result = await ScheduleModel.findByIdAndUpdate(
      scheduleId,
      { 
        tutorId: tutorId || null,
        tutorName: tutorName || ''
      },
      { new: true }
    );

    return result;
  }
}
