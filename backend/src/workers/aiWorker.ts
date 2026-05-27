import { Worker } from 'bullmq';
import { GoogleGenerativeAI } from '@google/generative-ai';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyCTEodqyVBTNfIUpOcy3sx7BEA38XGvEiI");

// Connect to Upstash Cloud Redis
const UPSTASH_URL = "rediss://default:gQAAAAAAAhbHAAIgcDE0ZTMxZGM1ZTE1Y2Q0MDRlYWRiNGIxMGJkNjJhMWRhOA@well-dragon-136903.upstash.io:6379";

const redisConnection = new IORedis(UPSTASH_URL, {
  maxRetriesPerRequest: null,
});

export const aiWorker = new Worker('assignment-queue', async (job) => {
  console.log(`🧠 AI Worker picked up Job ${job.id}`);
  const { questions, marks, instructions } = job.data;

  try {
   
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const prompt = `
      You are an expert academic teacher. Generate an exam paper based on these exact requirements:
      - Total Questions: ${questions}
      - Total Marks: ${marks}
      - Additional Instructions & Topics: ${instructions}

      You MUST respond with ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json. 
      The JSON must exactly match this structure:
      {
        "schoolName": "Delhi Public School, Sector-4, Bokaro",
        "subject": "Extract from instructions",
        "grade": "Extract from instructions or default to 8th",
        "timeAllowed": "45 Minutes",
        "maxMarks": "${marks}",
        "instructions": "All questions are compulsory.",
        "sections": [
          {
            "title": "Section A",
            "subtitle": "Short Answer Questions",
            "questions": [
              { "text": "The actual question generated...", "difficulty": "Easy", "marks": 2 }
            ]
          }
        ],
        "answerKey": ["Answer to Q1", "Answer to Q2"],
        "rubric": ["Q1: 1 mark for definition, 1 mark for correct formula.", "Q2: 2 marks for clear explanation..."]
      }
    `;

    console.log(' Asking Gemini to generate the paper and rubric...');
    const result = await model.generateContent(prompt);
    const textResponse = result.response.text();
    
    // Bulletproof Regex to extract ONLY the JSON object
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error("Raw AI Output:", textResponse);
      throw new Error("AI did not return a valid JSON object.");
    }
    
    const generatedPaper = JSON.parse(jsonMatch[0]);
    console.log(' Generation Complete! Paper & Rubric successfully structured.');

    return { success: true, paper: generatedPaper };

  } catch (error) {
    console.error(' AI Generation Failed:', error);
    throw error;
  }
}, {
  connection: redisConnection as any
});