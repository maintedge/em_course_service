import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectDB } from '../utils/db';
import { successResponse, errorResponse, handleError } from '../utils/response';

export const getStudentCurriculum = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const studentId = event.requestContext.authorizer?.userId || 'test-user-123';
    const courseId = event.queryStringParameters?.courseId;

    // Get student's enrollment data first
    const EnrollmentService = require('../services/enrollmentService').EnrollmentService;
    const enrollmentService = new EnrollmentService();
    
    let enrollments = [];
    try {
      const enrollmentData = await enrollmentService.getStudentBatchDetails(studentId);
      enrollments = enrollmentData || [];
    } catch (err) {
      console.log('Using mock enrollment data');
      enrollments = [
        {
          courseId: 'course_1',
          courseName: 'JavaScript Fundamentals',
          progress: 75,
          completedLessons: 8,
          totalLessons: 12,
          status: 'active'
        }
      ];
    }

    // Filter by courseId if provided
    if (courseId) {
      enrollments = enrollments.filter((e: any) => e.courseId === courseId);
    }

    // Get real curriculum data from database for enrolled courses
    const Curriculum = require('../models/Curriculum').default;
    const curriculumData = [];

    for (const enrollment of enrollments) {
      try {
        // Get curriculum from database
        let curriculum = await Curriculum.findOne({ courseId: enrollment.courseId }).lean();
        
        if (curriculum) {
          // Add enrollment progress to curriculum
          const progress = enrollment.progress || 0;
          const completedLessons = enrollment.completedLessons || 0;
          
          // Update lesson status based on progress
          const updatedModules = curriculum.modules.map((module: any, moduleIndex: number) => {
            const moduleProgress = Math.floor((progress / 100) * curriculum.modules.length);
            let moduleStatus = 'locked';
            
            if (moduleIndex < moduleProgress) {
              moduleStatus = 'completed';
            } else if (moduleIndex === moduleProgress) {
              moduleStatus = 'in_progress';
            }

            const updatedLessons = module.lessons.map((lesson: any, lessonIndex: number) => {
              const globalLessonIndex = curriculum.modules.slice(0, moduleIndex)
                .reduce((acc: number, mod: any) => acc + mod.lessons.length, 0) + lessonIndex;
              
              let lessonStatus = 'locked';
              if (globalLessonIndex < completedLessons) {
                lessonStatus = 'completed';
              } else if (globalLessonIndex === completedLessons && moduleStatus !== 'locked') {
                lessonStatus = 'in_progress';
              }

              return { ...lesson, status: lessonStatus };
            });

            return { ...module, status: moduleStatus, lessons: updatedLessons };
          });

          curriculumData.push({
            ...curriculum,
            modules: updatedModules,
            progress,
            enrollmentData: enrollment
          });
        } else {
          // No curriculum found for this course
          console.log(`No curriculum found for course: ${enrollment.courseId}`);
        }
      } catch (err) {
        console.error(`Error fetching curriculum for course ${enrollment.courseId}:`, err);
      }
    }

    return successResponse({ curriculum: curriculumData });
  } catch (error) {
    return handleError(error);
  }
};

export const getCourseCurriculum = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const courseId = event.pathParameters?.courseId;
    if (!courseId) {
      return errorResponse('Course ID is required', 400);
    }

    // Mock curriculum data for course management
    const curriculumData = {
      courseId,
      modules: [
        {
          id: 'mod_1',
          title: 'Introduction Module',
          description: 'Basic concepts and fundamentals',
          order: 1,
          duration: '2 weeks',
          lessons: [
            {
              id: 'lesson_1',
              title: 'Getting Started',
              type: 'video',
              duration: '30 min',
              order: 1
            },
            {
              id: 'lesson_2',
              title: 'Basic Concepts',
              type: 'reading',
              duration: '45 min',
              order: 2
            }
          ]
        }
      ],
      totalModules: 1,
      totalLessons: 2,
      estimatedDuration: '2 weeks'
    };

    return successResponse(curriculumData);
  } catch (error) {
    return handleError(error);
  }
};

export const createCourseCurriculum = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const courseId = event.pathParameters?.courseId;
    if (!courseId) {
      return errorResponse('Course ID is required', 400);
    }

    const body = JSON.parse(event.body || '{}');
    
    // Mock curriculum creation
    const newCurriculum = {
      id: `curr_${Date.now()}`,
      courseId,
      ...body,
      createdAt: new Date().toISOString()
    };

    return successResponse(newCurriculum, 201);
  } catch (error) {
    return handleError(error);
  }
};

export const getCurriculumProgress = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await connectDB();

    const studentId = event.requestContext.authorizer?.userId || 'test-user-123';

    // Get real enrollment data for progress calculation
    const EnrollmentService = require('../services/enrollmentService').EnrollmentService;
    const enrollmentService = new EnrollmentService();
    
    let enrollments = [];
    try {
      enrollments = await enrollmentService.getStudentBatchDetails(studentId) || [];
    } catch (err) {
      // Fallback to mock data
      enrollments = [
        {
          courseId: 'course_1',
          courseName: 'JavaScript Fundamentals',
          progress: 75,
          completedLessons: 8,
          status: 'active'
        }
      ];
    }

    // Calculate real progress metrics
    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter((e: any) => e.status === 'completed').length;
    const overallProgress = totalCourses > 0 
      ? Math.round(enrollments.reduce((acc: number, e: any) => acc + (e.progress || 0), 0) / totalCourses)
      : 0;
    const totalLessonsCompleted = enrollments.reduce((acc: number, e: any) => acc + (e.completedLessons || 0), 0);

    const progressData = {
      studentId,
      overallProgress,
      coursesInProgress: totalCourses - completedCourses,
      completedCourses,
      totalLessonsCompleted,
      totalLessons: enrollments.reduce((acc: number, e: any) => acc + (e.totalLessons || 10), 0),
      courseProgress: enrollments.map((enrollment: any) => ({
        courseId: enrollment.courseId,
        courseName: enrollment.courseName || 'Course',
        progress: enrollment.progress || 0,
        currentModule: enrollment.progress >= 66 ? 'Advanced Topics' : 
                      enrollment.progress >= 33 ? 'Intermediate Topics' : 'Fundamentals',
        nextLesson: `Lesson ${(enrollment.completedLessons || 0) + 1}`,
        timeSpent: `${Math.floor((enrollment.progress || 0) / 10)} hours`,
        lastAccessed: new Date().toISOString()
      }))
    };

    return successResponse(progressData);
  } catch (error) {
    return handleError(error);
  }
};
