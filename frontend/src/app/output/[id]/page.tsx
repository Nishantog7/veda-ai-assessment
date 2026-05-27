'use client';

import { useEffect, useState, use } from 'react';
import { ArrowLeft, Download, Loader2, RefreshCw, Copy, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';

export default function OutputPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [assignment, setAssignment] = useState<any>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    fetch(`https://veda-ai-assessment-2phj.onrender.com/api/assignment/${id}`)
      .then(res => res.json())
      .then(data => setAssignment(data))
      .catch(err => console.error(err));
  }, [id]);

  const handlePrint = () => window.print();

  // 🚀 NEW FEATURE: Export to Notion / Markdown
  const handleCopyMarkdown = async () => {
    if (!assignment?.paper) return;
    const paper = assignment.paper;
    
    let md = `# ${paper.schoolName}\n\n`;
    md += `**Subject:** ${paper.subject} | **Class:** ${paper.grade}\n`;
    md += `**Time Allowed:** ${paper.timeAllowed} | **Maximum Marks:** ${paper.maxMarks}\n\n`;
    md += `*${paper.instructions}*\n\n---\n\n`;

    paper.sections?.forEach((sec: any) => {
      md += `## ${sec.title}\n*${sec.subtitle}*\n\n`;
      sec.questions?.forEach((q: any, qIndex: number) => {
        md += `**${qIndex + 1}. [${q.difficulty}] [${q.marks} Marks]**\n${q.text}\n\n`;
      });
    });

    md += `---\n## Answer Key\n\n`;
    paper.answerKey?.forEach((ans: string, aIndex: number) => {
      md += `**${aIndex + 1}.** ${ans}\n\n`;
    });

    // Append Rubric if the AI generated it
    if (paper.rubric && paper.rubric.length > 0) {
      md += `---\n## Grading Rubric\n\n`;
      paper.rubric?.forEach((rule: string, rIndex: number) => {
        md += `- ${rule}\n`;
      });
    }

    await navigator.clipboard.writeText(md);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (!confirm("This will generate a brand new paper with the same settings. Continue?")) return;
    setIsRegenerating(true);
    
    try {
      const res = await fetch('https://veda-ai-assessment-2phj.onrender.com/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: assignment.metadata.totalQuestions,
          marks: assignment.metadata.totalMarks,
          instructions: assignment.metadata.instructions,
        }),
      });
      const data = await res.json();
      
      if (data.assignmentId) {
        const socket = io('https://veda-ai-assessment-2phj.onrender.com');
        socket.emit('join_room', data.assignmentId);

        socket.on('generation_complete', () => {
          socket.disconnect();
          setIsRegenerating(false);
          router.push(`/output/${data.assignmentId}`);
        });

        socket.on('generation_failed', () => {
          alert('AI Generation failed. Please try again.');
          setIsRegenerating(false);
          socket.disconnect();
        });
      }
    } catch (e) {
      alert("Failed to regenerate.");
      setIsRegenerating(false);
    }
  };

  const getBadgeColor = (diff: string) => {
    const d = diff?.toLowerCase() || '';
    if (d.includes('easy')) return 'bg-green-100 text-green-700 border-green-200';
    if (d.includes('medium') || d.includes('moderate')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (d.includes('hard') || d.includes('challenging')) return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (!assignment || !assignment.paper || isRegenerating) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#E85D36]" />
        <p className="mt-4 text-gray-600 font-medium">
          {isRegenerating ? "Analyzing parameters & generating new paper..." : "Loading your generated paper..."}
        </p>
      </div>
    );
  }

  const paper = assignment.paper;

  return (
    <div className="min-h-screen bg-[#F8F9FA] print:bg-white pb-20">
      
      {/* Web Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10 print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors bg-gray-100 p-2 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-800">Assignment Output</h1>
        </div>
        
        {/* Action Bar */}
        <div className="flex gap-3">
          <button 
            onClick={handleRegenerate}
            className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-full font-medium transition-colors shadow-sm text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Regenerate
          </button>
          
          {/* NEW BUTTON: Copy to Notion */}
          <button 
            onClick={handleCopyMarkdown}
            className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 px-4 py-2.5 rounded-full font-medium transition-colors shadow-sm text-sm w-40 justify-center"
          >
            {isCopied ? <><CheckCircle2 className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Export to Notion</>}
          </button>

          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-[#1F2937] hover:bg-black text-white px-5 py-2.5 rounded-full font-medium transition-colors shadow-sm text-sm"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
        </div>
      </header>

      {/* A4 Paper Canvas */}
      <main className="max-w-[850px] mx-auto mt-8 print:mt-0 print:shadow-none print:max-w-none">
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-12 print:p-0 print:border-none print:rounded-none">
          
          {/* Header Specs */}
          <div className="text-center border-b-2 border-black pb-6 mb-6">
            <h1 className="text-2xl font-bold text-black mb-1">{paper.schoolName}</h1>
            <p className="text-lg font-semibold text-black">Subject: {paper.subject}</p>
            <p className="text-lg font-semibold text-black">Class: {paper.grade}</p>
          </div>

          <div className="flex justify-between text-black font-medium mb-4">
            <p>Time Allowed: {paper.timeAllowed}</p>
            <p>Maximum Marks: {paper.maxMarks}</p>
          </div>
          <p className="text-black italic mb-6 text-sm">{paper.instructions}</p>

          <div className="border border-gray-300 p-4 mb-8 space-y-3 text-black">
            <div className="flex gap-2"><span className="font-semibold w-24">Name:</span><div className="flex-1 border-b border-dotted border-gray-400"></div></div>
            <div className="flex gap-2"><span className="font-semibold w-24">Roll Number:</span><div className="flex-1 border-b border-dotted border-gray-400"></div></div>
            <div className="flex gap-2"><span className="font-semibold w-24">Class/Sec:</span><div className="flex-1 border-b border-dotted border-gray-400"></div></div>
          </div>

          {/* Question Sections */}
          <div className="space-y-8">
            {paper.sections?.map((section: any, sIndex: number) => (
              <div key={sIndex}>
                <h2 className="text-center text-xl font-bold text-black mb-2">{section.title}</h2>
                <p className="text-black italic text-sm mb-6">{section.subtitle}</p>
                
                <div className="space-y-6">
                  {section.questions?.map((q: any, qIndex: number) => (
                    <div key={qIndex} className="flex gap-3 text-black leading-relaxed items-start">
                      <span className="font-medium mt-0.5">{qIndex + 1}.</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 print:mb-0">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border print:border-none print:p-0 print:bg-transparent print:text-black ${getBadgeColor(q.difficulty)}`}>
                            {q.difficulty}
                          </span>
                          <span className="text-xs font-semibold text-gray-500 print:text-black">[{q.marks} Marks]</span>
                        </div>
                        <p>{q.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Answer Key */}
          <div className="mt-16 pt-8 border-t-2 border-black print:break-before-page">
            <h2 className="text-xl font-bold text-black mb-6">Answer Key:</h2>
            <div className="space-y-4">
              {paper.answerKey?.map((answer: string, aIndex: number) => (
                <div key={aIndex} className="flex gap-2 text-black text-sm">
                  <span className="font-medium">{aIndex + 1}.</span>
                  <p className="flex-1 leading-relaxed">{answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* NEW SECTION: Grading Rubric  */}
          {paper.rubric && paper.rubric.length > 0 && (
            <div className="mt-12 pt-8 border-t-2 border-dashed border-gray-300 print:break-before-page">
              <h2 className="text-xl font-bold text-black mb-4">Grading Rubric (Teacher's Reference):</h2>
              <ul className="space-y-3 list-disc pl-5">
                {paper.rubric.map((rule: string, rIndex: number) => (
                  <li key={rIndex} className="text-black text-sm leading-relaxed">{rule}</li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}