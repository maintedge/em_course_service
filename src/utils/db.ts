import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async (): Promise<void> => {
  if (isConnected) {
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/em_user_service';
    await mongoose.connect(mongoUri);
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};
