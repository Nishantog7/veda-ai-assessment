'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { 
  UploadCloud, Plus, Minus, X, Mic, ArrowLeft, ArrowRight, Calendar, Loader2
} from 'lucide-react';
import AppLayout from '../../components/AppLayout';

export default function CreateAssignmentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  
  // Dynamic Question Rows State
  const [questionRows, setQuestionRows] = useState([
    { id: 1, type: 'Multiple Choice Questions', questions: 4, marks: 1 },
    { id: 2, type: 'Short Questions', questions: 3, marks: 2 },
  ]);

  const questionTypes = [
    'Multiple Choice Questions', 'Short Questions', 
    'Diagram/Graph-Based Questions', 'Numerical Problems', 'Long Essay Questions'
  ];

  const handleAddRow = () => {
    setQuestionRows([...questionRows, { id: Date.now(), type: questionTypes[0], questions: 1, marks: 1 }]);
  };

  const handleRemoveRow = (id: number) => {
    if (questionRows.length > 1) {
      setQuestionRows(questionRows.filter(row => row.id !== id));
    }
  };

  const updateRow = (id: number, field: string, value: string | number) => {
    setQuestionRows(questionRows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  // Calculate Totals automatically
  const totalQuestions = questionRows.reduce((sum, row) => sum + row.questions, 0);
  const totalMarks = questionRows.reduce((sum, row) => sum + (row.questions * row.marks), 0);

  const handleSubmit = async () => {
    if (totalQuestions <= 0 || totalMarks <= 0) {
      alert("Please add at least one question and mark.");
      return;
    }

    setIsLoading(true);

    // Format the complex UI into a smart prompt for the AI backend
    const formattedInstructions = `
      Due Date: ${dueDate || 'Not specified'}.
      Format required: 
      ${questionRows.map(r => `- ${r.questions} ${r.type} (worth ${r.marks} mark(s) each)`).join('\n')}
      Additional Context from Teacher: ${additionalInfo || 'None'}
    `;

    try {
      const response = await fetch('https://veda-ai-assessment-2phj.onrender.com/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: totalQuestions,
          marks: totalMarks,
          instructions: formattedInstructions,
        }),
      });

      const data = await response.json();

      if (response.ok && data.assignmentId) {
        // Connect to socket and wait for the background worker to finish
        const socket = io('https://veda-ai-assessment-2phj.onrender.com');
        socket.emit('join_room', data.assignmentId);

        socket.on('generation_complete', () => {
          socket.disconnect();
          router.push(`/output/${data.assignmentId}`);
        });

        socket.on('generation_failed', () => {
          alert('AI Generation failed. Please try again.');
          setIsLoading(false);
          socket.disconnect();
        });
      } else {
        alert('Failed to start generation');
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      alert('Error connecting to server.');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#E85D36]" />
        <p className="mt-4 text-gray-600 font-medium">Analyzing parameters & generating assignment...</p>
      </div>
    );
  }

  return (
    <AppLayout title="Create Assignment">
      <div className="max-w-[850px] mx-auto pb-20">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-3 w-3 bg-green-500 rounded-full"></div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create Assignment</h2>
            <p className="text-sm text-gray-500">Set up a new assignment for your students</p>
          </div>
        </div>

        {/* Progress Bar (Visual Only for Figma match) */}
        <div className="flex gap-2 mb-8">
          <div className="h-1 flex-1 bg-gray-800 rounded-full"></div>
          <div className="h-1 flex-1 bg-gray-200 rounded-full"></div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Assignment Details</h3>
          <p className="text-sm text-gray-500 mb-8">Basic information about your assignment</p>

          {/* Upload Box */}
          <div className="border-2 border-dashed border-gray-200 bg-gray-50 rounded-2xl p-8 flex flex-col items-center justify-center mb-8 hover:bg-gray-100 transition-colors cursor-pointer text-center">
            <div className="bg-white p-3 rounded-full shadow-sm mb-4">
              <UploadCloud className="h-6 w-6 text-gray-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Choose a file or drag & drop it here</p>
            <p className="text-xs text-gray-400 mb-4">JPEG, PNG, upto 10MB</p>
            <button className="px-5 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
              Browse Files
            </button>
            <p className="text-xs text-gray-400 mt-4">Upload images of your preferred document/image</p>
          </div>

          {/* Due Date */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Due Date</label>
            <div className="relative w-full max-w-md">
              <input 
                type="date" 
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 text-gray-600"
              />
              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Question Types Grid */}
          <div className="mb-8">
            <div className="flex text-xs font-semibold text-gray-500 mb-4 px-2">
              <div className="flex-1">Question Type</div>
              <div className="w-[140px] text-center">No. of Questions</div>
              <div className="w-[140px] text-center">Marks</div>
            </div>

            <div className="space-y-4">
              {questionRows.map((row) => (
                <div key={row.id} className="flex items-center gap-4">
                  {/* Select Dropdown */}
                  <div className="flex-1">
                    <select 
                      value={row.type}
                      onChange={(e) => updateRow(row.id, 'type', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none appearance-none cursor-pointer"
                    >
                      {questionTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <button onClick={() => handleRemoveRow(row.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X className="h-4 w-4" />
                  </button>

                  {/* Question Counter */}
                  <div className="flex items-center justify-between w-[120px] bg-gray-50 border border-gray-200 rounded-full px-3 py-2">
                    <button onClick={() => updateRow(row.id, 'questions', Math.max(1, row.questions - 1))} className="text-gray-400 hover:text-black">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="font-semibold text-sm text-gray-700">{row.questions}</span>
                    <button onClick={() => updateRow(row.id, 'questions', row.questions + 1)} className="text-gray-400 hover:text-black">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Marks Counter */}
                  <div className="flex items-center justify-between w-[120px] bg-gray-50 border border-gray-200 rounded-full px-3 py-2">
                    <button onClick={() => updateRow(row.id, 'marks', Math.max(1, row.marks - 1))} className="text-gray-400 hover:text-black">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="font-semibold text-sm text-gray-700">{row.marks}</span>
                    <button onClick={() => updateRow(row.id, 'marks', row.marks + 1)} className="text-gray-400 hover:text-black">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Button & Totals */}
            <div className="flex justify-between items-end mt-6">
              <button onClick={handleAddRow} className="flex items-center gap-2 text-sm font-bold text-gray-800 bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-full transition-colors">
                <Plus className="h-4 w-4" />
                Add Question Type
              </button>
              <div className="text-right text-sm font-semibold text-gray-600">
                <p>Total Questions: <span className="text-black">{totalQuestions}</span></p>
                <p>Total Marks: <span className="text-black">{totalMarks}</span></p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mb-10">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Additional Information (For better output)</label>
            <div className="relative">
              <textarea 
                rows={3}
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="e.g Generate a question paper for 3 hour exam duration covering Newton's laws..."
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none text-gray-700 placeholder-gray-400"
              />
              <button className="absolute bottom-4 right-4 bg-gray-200 p-2 rounded-full hover:bg-gray-300 transition-colors">
                <Mic className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between border-t border-gray-100 pt-8">
            <button 
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-full text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </button>
            <button 
              onClick={handleSubmit}
              className="flex items-center gap-2 px-8 py-3 bg-[#1A1D21] rounded-full text-sm font-bold text-white hover:bg-black transition-colors shadow-md"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}