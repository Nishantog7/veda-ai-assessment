'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Trash2, FileX2 } from 'lucide-react';
import { useAssignmentStore } from '../store/useAssignmentStore'; 
import AppLayout from '../components/AppLayout';

export default function DashboardPage() {
  const { assignments, isLoading, fetchAssignments } = useAssignmentStore();

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  return (
    <AppLayout title="Assignment">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Header Section */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 mt-1">Manage and create assignments for your classes</p>
        </div>

        {/* Toolbar (Filters and Search) */}
        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200 mb-6 shadow-sm">
          <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 px-3 py-1 font-medium">
            <Filter className="h-4 w-4" />
            Filter By
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search Assignment" 
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 w-64 transition-all"
            />
          </div>
        </div>

        {/* Dynamic State Rendering */}
        {isLoading ? (
          <div className="flex justify-center py-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E85D36]"></div>
          </div>
        ) : assignments.length === 0 ? (
          
          /* 0-STATE  */
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-200 border-dashed">
             <div className="w-32 h-32 mb-6 relative bg-gray-50 rounded-2xl flex items-center justify-center">
               <FileX2 className="w-16 h-16 text-gray-300" strokeWidth={1.5} />
               <div className="absolute inset-0 flex items-center justify-center mt-8 ml-8">
                 <div className="bg-red-50 p-2 rounded-full border-4 border-white shadow-sm">
                   <div className="text-red-500 font-bold text-xl leading-none">×</div>
                 </div>
               </div>
             </div>
             <h3 className="text-xl font-bold text-gray-900 mb-2">No assignments yet</h3>
             <p className="text-gray-500 text-sm max-w-md mb-8 leading-relaxed">
               Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.
             </p>
             <Link 
               href="/create"
               className="bg-[#1A1D21] text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-black transition-colors flex items-center gap-2 shadow-md"
             >
               <Plus className="h-4 w-4" />
               Create Your First Assignment
             </Link>
          </div>
        ) : (

          /* FILLED STATE */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-24 relative">
            {assignments.map((assignment) => (
              <Link 
                href={`/output/${assignment._id}`}
                key={assignment._id}
                className="block bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${assignment.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                    {/* Maps to the AI generated subject, or falls back if still generating */}
                    <h3 className="font-bold text-lg text-gray-900">
                      {assignment.paper?.subject || "Generating AI Assignment..."}
                    </h3>
                  </div>
                  
                  {/* FULLY WORKING DELETE BUTTON */}
                  <button 
                    onClick={(e) => {
                      e.preventDefault(); // Prevents navigating to the output page when clicking delete
                      if (window.confirm('Are you sure you want to delete this assignment?')) {
                        useAssignmentStore.getState().deleteAssignment(assignment._id);
                      }
                    }}
                    className="text-gray-300 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                    title="Delete Assignment"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="flex items-center gap-6 text-xs font-semibold text-gray-500">
                  <span>Assigned on : {new Date(assignment.createdAt || Date.now()).toLocaleDateString('en-GB').replace(/\//g, '-')}</span>
                  <span>Due : {new Date((assignment.createdAt ? new Date(assignment.createdAt).getTime() : Date.now()) + 86400000).toLocaleDateString('en-GB').replace(/\//g, '-')}</span>
                  <span className="ml-auto bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                    {assignment.metadata?.totalMarks} Marks
                  </span>
                </div>
              </Link>
            ))}
            
            {/* Floating Create Button */}
            <div className="fixed bottom-10 left-[calc(50%+140px)] -translate-x-1/2 z-20">
              <Link 
                 href="/create"
                 className="bg-[#1A1D21] text-white px-6 py-3.5 rounded-full text-sm font-medium hover:bg-black transition-transform hover:scale-105 flex items-center gap-2 shadow-2xl border border-gray-700"
               >
                 <Plus className="h-4 w-4" />
                 Create Assignment
               </Link>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}