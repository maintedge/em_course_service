import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { envData } from '../constants';

dotenv.config();

let isConnected = false;
// For test, attach flag to global so it can be reset
const getTestFlag = (): boolean => {
  if (process.env.NODE_ENV === 'test') {
    return (global as any).__test_db_isConnected || false;
  } else {
    return isConnected;
  }
};
const setTestFlag = (val: boolean) => {
  if (process.env.NODE_ENV === 'test') {
    (global as any).__test_db_isConnected = val;
  } else {
    isConnected = val;
  }
};

export const connectDB = async (): Promise<void> => {
  if (getTestFlag()) {
    console.log('Using existing database connection');
    return;
  }

  try {
    const uri = envData.mongodb;
    console.log('Connecting to MongoDB with URI:', uri);
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    const options = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    };

    await mongoose.connect(uri, options);
    setTestFlag(true);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

export const __getTestFlag = getTestFlag;
export const __setTestFlag = setTestFlag;
