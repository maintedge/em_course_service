# EM User Service

SkillUp LMS Microservice for user profile management.

## Features

- User profile retrieval
- User data management
- MongoDB integration
- Serverless architecture

## API Endpoints

### GET /user/profile/{userId}
Retrieve user profile by ID.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run locally:
```bash
npm run dev
```

3. Deploy:
```bash
npm run deploy
```

## Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `ENV_DATA`: Environment configuration from AWS Secrets Manager
