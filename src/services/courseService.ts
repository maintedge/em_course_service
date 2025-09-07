import { CourseModel } from '../models/Course';
import { EnrollmentModel } from '../models/Enrollment';
import { Course, CreateCourseRequest, UpdateCourseRequest, CourseFilters, CourseStatus } from '../types/course';

export class CourseService {
  async createCourse(courseData: CreateCourseRequest, instructorId: string, instructorName: string): Promise<Course> {
    const course = new CourseModel({
      ...courseData,
      instructorId,
      instructorName,
      enrolledStudents: 0,
      completionRate: 0,
      averageRating: 0,
      totalReviews: 0
    });

    const savedCourse = await course.save();
    return savedCourse.toJSON() as any;
  }

  async getCourseById(courseId: string): Promise<Course | null> {
    const course = await CourseModel.findById(courseId);
    return course ? course.toJSON() as any : null;
  }

  async updateCourse(courseId: string, updateData: UpdateCourseRequest, instructorId: string): Promise<Course | null> {
    const course = await CourseModel.findOneAndUpdate(
      { _id: courseId },
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );
    return course ? course.toJSON() as any : null;
  }

  async deleteCourse(courseId: string, instructorId: string): Promise<boolean> {
    // Check if course has enrollments
    const enrollmentCount = await EnrollmentModel.countDocuments({ courseId });
    if (enrollmentCount > 0) {
      throw new Error('Cannot delete course with active enrollments');
    }

    const result = await CourseModel.deleteOne({ _id: courseId });
    return result.deletedCount > 0;
  }

  async listCourses(filters: CourseFilters): Promise<{ courses: Course[]; total: number; pages: number }> {
    const query: any = {};

    // Apply filters
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { tags: { $in: [new RegExp(filters.search, 'i')] } }
      ];
    }

    if (filters.category && filters.category !== 'all') {
      query.category = filters.category;
    }

    if (filters.level && filters.level !== 'all') {
      query.level = filters.level;
    }

    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    if (filters.instructorId) {
      query.instructorId = filters.instructorId;
    }

    // Build sort object
    const sortField = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortField]: sortOrder };

    // Execute query with pagination
    const skip = (filters.page - 1) * filters.limit;
    const [courses, total] = await Promise.all([
      CourseModel.find(query).sort(sort).skip(skip).limit(filters.limit),
      CourseModel.countDocuments(query)
    ]);

    return {
      courses: courses.map(course => course.toJSON() as any),
      total,
      pages: Math.ceil(total / filters.limit)
    };
  }

  async publishCourse(courseId: string, instructorId: string): Promise<Course | null> {
    const course = await CourseModel.findOneAndUpdate(
      { _id: courseId },
      { 
        status: CourseStatus.PUBLISHED, 
        publishedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );
    return course ? course.toJSON() as any : null;
  }

  async archiveCourse(courseId: string, instructorId: string): Promise<Course | null> {
    const course = await CourseModel.findOneAndUpdate(
      { _id: courseId },
      { 
        status: CourseStatus.ARCHIVED,
        updatedAt: new Date()
      },
      { new: true }
    );
    return course ? course.toJSON() as any : null;
  }

  async updateCourseStatus(courseId: string, status: CourseStatus, instructorId: string): Promise<Course | null> {
    const updateData: any = { 
      status,
      updatedAt: new Date()
    };

    // Set publishedAt when status changes to PUBLISHED
    if (status === CourseStatus.PUBLISHED) {
      updateData.publishedAt = new Date();
    }

    const course = await CourseModel.findOneAndUpdate(
      { _id: courseId },
      updateData,
      { new: true }
    );
    return course ? course.toJSON() as any : null;
  }

  async getCourseStatistics(): Promise<any> {
    const [totalCourses, publishedCourses, draftCourses, totalEnrollments] = await Promise.all([
      CourseModel.countDocuments(),
      CourseModel.countDocuments({ status: CourseStatus.PUBLISHED }),
      CourseModel.countDocuments({ status: CourseStatus.DRAFT }),
      EnrollmentModel.countDocuments()
    ]);

    const coursesByCategory = await CourseModel.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const coursesByLevel = await CourseModel.aggregate([
      { $group: { _id: '$level', count: { $sum: 1 } } }
    ]);

    const topCourses = await CourseModel.find({ status: CourseStatus.PUBLISHED })
      .sort({ averageRating: -1, enrolledStudents: -1 })
      .limit(5);

    const recentCourses = await CourseModel.find({ status: CourseStatus.PUBLISHED })
      .sort({ publishedAt: -1 })
      .limit(5);

    return {
      totalCourses,
      publishedCourses,
      draftCourses,
      totalEnrollments,
      coursesByCategory: coursesByCategory.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      coursesByLevel: coursesByLevel.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      topCourses: topCourses.map(course => course.toJSON()),
      recentCourses: recentCourses.map(course => course.toJSON())
    };
  }
}
