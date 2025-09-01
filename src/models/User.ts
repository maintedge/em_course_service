import mongoose from 'mongoose';

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  dateOfBirth?: Date;
  role: 'admin' | 'mentor' | 'student' | 'tutor' | 'support';
  status: 'active' | 'inactive' | 'suspended';
  verified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  bio?: string;
  skills?: string[];
  lastLogin?: Date;
  suspensionReason?: string;
  suspensionDuration?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  avatar: { type: String, default: null },
  phone: { type: String, default: null },
  dateOfBirth: { type: Date, default: null },
  role: { type: String, enum: ['admin', 'mentor', 'student', 'tutor', 'support'], required: true, default: 'student' },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  verified: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  bio: { type: String },
  skills: [{ type: String }],
  lastLogin: { type: Date },
  suspensionReason: { type: String },
  suspensionDuration: { type: String }
}, {
  timestamps: true
});

export const User = mongoose.model<IUser>('User', userSchema);

const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  ip: { type: String },
  device: { type: String },
  timestamp: { type: Date, default: Date.now }
});

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
