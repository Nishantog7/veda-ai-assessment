import express from 'express';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import { Assignment } from '../models/Assignment';

dotenv.config();

const router = express.Router();

// 1. Hardcoded Upstash Connection using exact credentials
const UPSTASH_URL = "rediss://default:gQAAAAAAAhbHAAIgcDE0ZTMxZGM1ZTE1Y2Q0MDRlYWRiNGIxMGJkNjJhMWRhOA@well-dragon-136903.upstash.io:6379";

const redisConnection = new IORedis(UPSTASH_URL, {
  maxRetriesPerRequest: null,
});

// 2. Queue name MUST exactly match the Worker ('assignment-queue')
const assignmentQueue = new Queue('assignment-queue', {
  connection: redisConnection as any
});

// ==========================================
// ROUTE 1: Start the AI Generation (POST)
// ==========================================
router.post('/generate', async (req, res) => {
  try {
    const { questions, marks, instructions } = req.body;

    const newAssignment = await Assignment.create({
      status: 'pending',
      metadata: { totalQuestions: questions, totalMarks: marks, instructions }
    });

    await assignmentQueue.add('generate-paper', {
      assignmentId: newAssignment._id,
      questions: questions,
      marks: marks,
      instructions: instructions
    });

    // Invalidate the cache so the new assignment shows up instantly!
    await redisConnection.del('all_assignments');

    res.status(202).json({ 
      message: 'Generation started', 
      assignmentId: newAssignment._id 
    });

  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Failed to start generation process' });
  }
});

// ==========================================
// ROUTE 2: Fetch the Completed Paper (GET)
// ==========================================
router.get('/assignment/:id', async (req, res) => {
  try {
    // Look up the paper in MongoDB using the ID from the URL
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    
    // Send the full assignment (including the Gemini generated paper) to the frontend
    res.json(assignment);
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch paper' });
  }
});

// ==========================================
// ROUTE 3: Fetch ALL Assignments (With Redis Caching!)
// ==========================================
router.get('/assignments', async (req, res) => {
  try {
    // 1. Check if we have the data cached in Redis first
    const cachedAssignments = await redisConnection.get('all_assignments');
    
    if (cachedAssignments) {
      console.log('⚡ Serving fast response from Redis Cache!');
      return res.json(JSON.parse(cachedAssignments));
    }

    // 2. If no cache, do the heavy lifting from MongoDB
    console.log('🗄️ Fetching from MongoDB...');
    const assignments = await Assignment.find().sort({ _id: -1 });

    // 3. Save the result in Redis for 1 hour (3600 seconds)
    await redisConnection.set('all_assignments', JSON.stringify(assignments), 'EX', 3600);

    res.json(assignments);
  } catch (error) {
    console.error('Fetch all error:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// ==========================================
// ROUTE 4: Delete an Assignment
// ==========================================
router.delete('/assignment/:id', async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    
    // Invalidate cache so the deleted assignment disappears everywhere
    await redisConnection.del('all_assignments');

    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete' });
  }
});

export default router;