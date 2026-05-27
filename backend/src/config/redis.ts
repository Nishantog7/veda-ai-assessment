import { Redis } from 'ioredis';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

// Construct the secure Upstash connection URL
// Notice the 'rediss://' (with two s's) - this tells it to use TLS/SSL security
const redisUrl = `rediss://default:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;

export const redisConnection = new Redis(redisUrl, {
  // BullMQ strictly requires maxRetriesPerRequest to be null
  maxRetriesPerRequest: null,
});

// Debugging listeners so you know exactly when it connects or fails
redisConnection.on('connect', () => {
  console.log(' Connected to Cloud Redis (Upstash) successfully');
});

redisConnection.on('error', (err) => {
  console.error(' Cloud Redis connection error:', err);
});