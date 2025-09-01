import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, minlength: 8 },
  avatar: { type: String, default: null },
  phone: { type: String, default: null },
  dateOfBirth: { type: Date, default: null },
  role: { type: String, enum: ['admin', 'mentor', 'student', 'tutor', 'support'], required: true, default: 'student' },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  education: [{
    degree: { type: String },
    institution: { type: String },
    graduationYear: { type: Number },
    fieldOfStudy: { type: String }
  }],
  interests: [{ type: String }],
  address: { type: String },
  bio: { type: String },
  skills: [{ type: String }],
  roleSpecificData: {
    adminLevel: { type: String, enum: ['super', 'regular'], default: null },
    expertise: [{ type: String }],
    experience: { type: Number, default: null },
    hourlyRate: { type: Number, default: null },
    bio: { type: String, default: null },
    enrolledCourses: [{ type: String }],
    learningGoals: [{ type: String }],
    educationLevel: { type: String, default: null },
    subjects: [{ type: String }],
    qualifications: [{ type: String }],
    teachingExperience: { type: Number, default: null },
    department: { type: String, default: null },
    supportLevel: { type: String, default: null }
  },
  permissions: {
    canAccessAdmin: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false },
    canManageCourses: { type: Boolean, default: false },
    canProvideMentorship: { type: Boolean, default: false },
    canTeachCourses: { type: Boolean, default: false },
    canProvideSupport: { type: Boolean, default: false },
    canViewAnalytics: { type: Boolean, default: false },
    canManagePayments: { type: Boolean, default: false }
  },
  subscription: {
    plan: { type: String, default: 'free' },
    startDate: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    autoRenew: { type: Boolean, default: false }
  },
  stats: {
    coursesEnrolled: { type: Number, default: 0 },
    coursesCompleted: { type: Number, default: 0 },
    totalWatchTime: { type: Number, default: 0 },
    certificatesEarned: { type: Number, default: 0 },
    challengesCompleted: { type: Number, default: 0 },
    mentorshipSessions: { type: Number, default: 0 },
    coursesCreated: { type: Number, default: 0 },
    supportTicketsResolved: { type: Number, default: 0 }
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    privacy: {
      profileVisibility: { type: String, enum: ['public', 'private', 'friends'], default: 'public' },
      showProgress: { type: Boolean, default: true }
    }
  },
  refreshTokens: [{ type: String }],
  passwordResetToken: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null },
  emailVerificationToken: { type: String, default: null },
  emailVerificationExpires: { type: Date, default: null },
  lastLoginAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);