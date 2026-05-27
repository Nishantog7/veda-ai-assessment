import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { QueueEvents, Queue } from 'bullmq';
import IORedis from 'ioredis';

// Import background worker and routes
import './workers/aiWorker';
import generateRoute from './routes/generate'; 

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// 1. Setup Socket.io for real-time frontend updates
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*', // Fallback to allow Vercel domain
    methods: ['GET', 'POST'],
  },
});

// 2. Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', 
}));
app.use(express.json());

// 3. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI as string)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// 4. Socket.io Event Listeners
io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);
  
  // When the frontend submits the form, it joins a room specific to that assignment
  socket.on('join_room', (assignmentId) => {
    socket.join(assignmentId);
    console.log(`Socket ${socket.id} joined room: ${assignmentId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// 5. Register Routes
app.use('/api', generateRoute);

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'VedaAI Backend is running smoothly' });
});

// Export 'io' so we can trigger it 
export { io };

// ============================================================================
// 6. BULLMQ EVENT LISTENER (Wakes up the frontend via WebSockets)
// ============================================================================

// Use the exact hardcoded Upstash URL
const UPSTASH_URL = "rediss://default:gQAAAAAAAhbHAAIgcDE0ZTMxZGM1ZTE1Y2Q0MDRlYWRiNGIxMGJkNjJhMWRhOA@well-dragon-136903.upstash.io:6379";
const redisConnection = new IORedis(UPSTASH_URL, { maxRetriesPerRequest: null });

const queueEvents = new QueueEvents('assignment-queue', { connection: redisConnection as any });
const assignmentQueue = new Queue('assignment-queue', { connection: redisConnection as any });

queueEvents.on('completed', async ({ jobId, returnvalue }) => {
  try {
    const job = await assignmentQueue.getJob(jobId);
    if (job) {
      const assignmentId = job.data.assignmentId;
      
      // Parse the data Gemini sent back
      const result = typeof returnvalue === 'string' ? JSON.parse(returnvalue) : returnvalue;

      // Save it to MongoDB without breaking schemas
      if (result && result.paper) {
        const { ObjectId } = mongoose.Types;
        await mongoose.connection.collection('assignments').updateOne(
          { _id: new ObjectId(assignmentId) },
          { $set: { status: 'completed', paper: result.paper } }
        );
      }

      console.log(`Waking up frontend for assignment: ${assignmentId}`);
      io.to(assignmentId).emit('generation_complete', { assignmentId });
    }
  } catch (err) {
    console.error("Socket emit error:", err);
  }
});

queueEvents.on('failed', async ({ jobId }) => {
  try {
    const job = await assignmentQueue.getJob(jobId);
    if (job) {
      console.log(`Job failed for assignment: ${job.data.assignmentId}`);
      io.to(job.data.assignmentId).emit('generation_failed');
    }
  } catch (err) {
    console.error("Failed event error:", err);
  }
});

// ============================================================================
// 7. Start the Server (Dynamic Port for Render)
// ============================================================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});