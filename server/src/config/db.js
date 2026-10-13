import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServerInstance = null;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  const forceInMemory = process.env.USE_IN_MEMORY_DB === 'true';

  if (!forceInMemory && uri && !uri.includes('localhost:27017')) {
    try {
      console.log(`[DB] Attempting connection to configured MongoDB URI...`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[DB] Successfully connected to MongoDB Atlas / Remote Cluster.`);
      return mongoose.connection;
    } catch (err) {
      console.warn(`[DB] Remote MongoDB connection failed (${err.message}). Falling back to in-memory database...`);
    }
  }

  // Try local or start MongoMemoryServer
  if (!forceInMemory && uri) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 2000,
      });
      console.log(`[DB] Connected to local MongoDB instance.`);
      return mongoose.connection;
    } catch (err) {
      console.warn(`[DB] Local MongoDB not running on ${uri}. Starting zero-config MongoMemoryServer...`);
    }
  }

  // Start in-memory MongoDB
  try {
    mongoMemoryServerInstance = await MongoMemoryServer.create();
    const memUri = mongoMemoryServerInstance.getUri();
    await mongoose.connect(memUri);
    console.log(`[DB] Connected to in-memory MongoDB server: ${memUri}`);
    return mongoose.connection;
  } catch (memErr) {
    console.error(`[DB] Failed to launch MongoMemoryServer:`, memErr);
    throw memErr;
  }
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServerInstance) {
      await mongoMemoryServerInstance.stop();
    }
    console.log('[DB] Disconnected from database.');
  } catch (err) {
    console.error('[DB] Error during database disconnect:', err.message);
  }
}
