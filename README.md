# eMentor Course Management Service

A comprehensive serverless microservice for managing courses, batches, assignments, and enrollments in the SkillUp LMS platform.

## Features

### Course Management
- ✅ Create, read, update, delete courses
- ✅ Course categorization and difficulty levels
- ✅ Course publishing and archiving
- ✅ Course statistics and analytics
- ✅ Instructor-based access control

### Batch Management
- ✅ Create and manage course batches
- ✅ Student enrollment in batches
- ✅ Batch capacity and waitlist management
- ✅ Batch scheduling and timeline

### Assignment Management
- ✅ Create and manage assignments
- ✅ Multiple assignment types (essay, project, coding, etc.)
- ✅ Assignment publishing and due dates
- ✅ Assignment difficulty levels

### Enrollment Management
- ✅ Student course enrollment
- ✅ Progress tracking
- ✅ Certificate issuance
- ✅ Enrollment status management

## API Endpoints

### Courses
- `POST /courses` - Create course
- `GET /courses` - List courses with filtering
- `GET /courses/{id}` - Get course details
- `PUT /courses/{id}` - Update course
- `DELETE /courses/{id}` - Delete course
- `PATCH /courses/{id}/status` - Update course status
- `POST /courses/{id}/publish` - Publish course
- `POST /courses/{id}/archive` - Archive course
- `GET /courses/statistics` - Get course statistics

### Batches
- `POST /batches` - Create batch
- `GET /batches` - List batches
- `GET /batches/{id}` - Get batch details
- `PUT /batches/{id}` - Update batch
- `DELETE /batches/{id}` - Delete batch
- `GET /batches/{id}/students` - Get batch students
- `POST /batches/{id}/students` - Add student to batch
- `DELETE /batches/{id}/students/{studentId}` - Remove student from batch

### Assignments
- `POST /assignments` - Create assignment
- `GET /assignments` - List assignments
- `GET /assignments/{id}` - Get assignment details
- `PUT /assignments/{id}` - Update assignment
- `DELETE /assignments/{id}` - Delete assignment
- `POST /assignments/{id}/publish` - Publish assignment
- `GET /assignments/due-date` - Get assignments by due date

### Enrollments
- `POST /enrollments` - Enroll student
- `GET /enrollments` - List enrollments
- `GET /enrollments/{id}` - Get enrollment details
- `PUT /enrollments/{id}/status` - Update enrollment status
- `PUT /enrollments/{id}/progress` - Update student progress
- `POST /enrollments/{id}/certificate` - Issue certificate
- `GET /enrollments/progress` - Get student progress
- `POST /enrollments/{id}/drop` - Drop enrollment

## Technology Stack

- **Runtime**: Node.js 18.x
- **Framework**: Serverless Framework
- **Database**: MongoDB with Mongoose ODM
- **Validation**: Joi
- **Authentication**: JWT with custom authorizer
- **Cloud Provider**: AWS Lambda
- **Language**: TypeScript

## Environment Variables

```bash
MONGODB_URI=mongodb://localhost:27017/skillup_courses
ENV_DATA=<AWS Secrets Manager reference>
```

## Installation & Development

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Build
npm run build

# Deploy
npm run deploy

# Run tests
npm test
```

## Database Schema

### Collections
- **courses** - Course information and metadata
- **batches** - Course batch scheduling and enrollment
- **assignments** - Assignment details and requirements
- **enrollments** - Student enrollment and progress tracking

### Key Features
- Automatic timestamps (createdAt, updatedAt)
- Proper indexing for performance
- Data validation at schema level
- Referential integrity through application logic

## Authentication & Authorization

- JWT-based authentication via custom authorizer
- Role-based access control (Admin, Instructor, Student)
- Resource-level permissions (instructors can only manage their own courses)

## Error Handling

- Comprehensive error handling with proper HTTP status codes
- Validation errors with detailed messages
- Structured error responses
- Request/response logging

## Deployment

The service is configured for AWS Lambda deployment using the Serverless Framework:

```bash
# Deploy to development
npm run dev

# Deploy to production
serverless deploy --stage prod
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:ci
```

## API Documentation

For detailed API documentation including request/response schemas, validation rules, and examples, refer to the comprehensive API documentation in the main project repository.

## Contributing

1. Follow TypeScript best practices
2. Add proper error handling
3. Include input validation
4. Write unit tests for new features
5. Update documentation
