import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Moderate', 'Hard'], required: true },
  marks: { type: Number, required: true },
});

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questions: [questionSchema],
});

const assignmentSchema = new mongoose.Schema({
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'], 
    default: 'pending' 
  },
  metadata: {
    dueDate: Date,
    totalQuestions: Number,
    totalMarks: Number,
    instructions: String,
  },
  output: [sectionSchema], // The AI will fill this array
  createdAt: { type: Date, default: Date.now },
});

export const Assignment = mongoose.model('Assignment', assignmentSchema);