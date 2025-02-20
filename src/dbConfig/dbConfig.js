// db.js
import { config } from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
config();

// Access the MongoDB URI from the environment variables
const dbURI = process.env.MONGO_URI;

const connectToDB = async () => {
  try {
    await mongoose.connect(dbURI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
};

export default connectToDB;