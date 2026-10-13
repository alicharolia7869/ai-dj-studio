import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

import { connectDB } from './config/db.js';
import { Track } from './models/Track.js';
import { seedDatabase } from './utils/seed.js';
import authRoutes from './routes/authRoutes.js';
import trackRoutes from './routes/trackRoutes.js';
import loungeRoutes from './routes/loungeRoutes.js';
import userRoutes from './routes/userRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { errorHandler } from './middleware/error.js';
import { setupLoungeSocket } from './sockets/loungeSocket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from project root or server dir
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const app = express();
const server = http.createServer(app);

// Cross-Origin Resource Sharing
const allowedOrigins = [
  process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in dev/testing
    }
  },
  credentials: true
}));

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// JSON body parsing
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Static audio files serving
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads/audio');
app.use('/uploads/audio', express.static(uploadDir));

// Rate limiting for public auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many login attempts, please try again later.' }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AI DJ Studio API & Realtime Engine',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime())
  });
});

// Mount API v1 Routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/tracks', trackRoutes);
app.use('/api/v1/lounges', loungeRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Global Error Handler
app.use(errorHandler);

// Socket.IO configuration
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

setupLoungeSocket(io);

const PORT = process.env.PORT || 5000;

// Start server function
export async function startServer() {
  await connectDB();
  try {
    const count = await Track.countDocuments();
    if (count === 0) {
      console.log('[SERVER] Database is empty. Seeding initial demo tracks, accounts, and lounges...');
      await seedDatabase(true);
    }
  } catch (seedErr) {
    console.warn('[SERVER] Auto-seed notice:', seedErr.message);
  }

  return new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`[SERVER] AI DJ Studio API running on port ${PORT}`);
      console.log(`[SERVER] Health Check: http://localhost:${PORT}/health`);
      resolve({ app, server, io });
    });
  });
}

// Automatically start if called directly
if (process.env.NODE_ENV !== 'test') {
  startServer().catch(err => {
    console.error('[SERVER CRITICAL] Failed to start server:', err);
    process.exit(1);
  });
}

export { app, server, io };
