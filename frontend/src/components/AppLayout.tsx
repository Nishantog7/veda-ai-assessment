'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutGrid, Users, FileText, Wrench, Clock, 
  Settings, Bell, ChevronDown, ArrowLeft, Plus
} from 'lucide-react';
import { useAssignmentStore } from '../store/useAssignmentStore';

export default function AppLayout({ children, title = "Assignment" }: { children: React.ReactNode, title?: string }) {
  const pathname = usePathname();
  const { assignments } = useAssignmentStore(); 

  const navItems = [
    { name: 'Home', icon: LayoutGrid, path: '#' },
    { name: 'Groups', icon: Users, path: '#' }, // Shortened for mobile
    { name: 'Assignments', icon: FileText, path: '/' },
    { name: 'Toolkit', icon: Wrench, path: '#' }, // Shortened for mobile
    { name: 'Library', icon: Clock, path: '#' },
  ];

  return (
    <div className="flex h-screen bg-[#F8F9FA] font-sans overflow-hidden">
      
      {/* DESKTOP SIDEBAR (Hidden on Mobile) */}
      <aside className="w-[280px] bg-white border-r border-gray-200 flex flex-col justify-between h-full flex-shrink-0 hidden md:flex">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3 mb-8">
            <div className="h-8 w-8 bg-gradient-to-br from-[#E85D36] to-[#D94A24] rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg leading-none">V</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">VedaAI</h1>
          </Link>

          <Link href="/create" className="flex items-center justify-center gap-2 bg-[#1A1D21] text-white px-4 py-3 rounded-full font-medium mb-8 hover:bg-black transition-colors shadow-md border border-gray-800">
            <Plus className="h-5 w-5 text-[#E85D36]" />
            Create Assignment
          </Link>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path || (item.path === '/' && pathname === '/');
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                    isActive 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-gray-700' : 'text-gray-400'}`} />
                  {item.name === 'Toolkit' ? "AI Teacher's Toolkit" : item.name === 'Groups' ? "My Groups" : item.name === 'Library' ? "My Library" : item.name}
                  
                  {item.name === 'Assignments' && assignments.length > 0 && (
                    <span className="ml-auto bg-[#E85D36] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {assignments.length}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          <Link href="#" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-gray-900 font-medium mb-4">
            <Settings className="h-5 w-5 text-gray-400" />
            Settings
          </Link>
          
          <div className="bg-gray-100 p-4 rounded-xl flex items-center gap-3">
            <div className="h-10 w-10 bg-orange-200 rounded-full flex items-center justify-center overflow-hidden border border-orange-300">
               <span className="text-xl">👨‍🏫</span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">DPS Bokaro</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* DESKTOP TOP NAVBAR */}
        <header className="h-16 bg-white flex items-center justify-between px-8 border-b border-gray-200 flex-shrink-0 hidden md:flex">
          <div className="flex items-center gap-3 text-gray-500">
            {pathname !== '/' && (
               <Link href="/" className="hover:text-gray-900 transition-colors">
                 <ArrowLeft className="h-5 w-5" />
               </Link>
            )}
            <LayoutGrid className="h-5 w-5" />
            <span className="font-medium text-gray-800">{title}</span>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="relative text-gray-500 hover:text-gray-900">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-[#E85D36] rounded-full border border-white"></span>
            </button>
            <div className="flex items-center gap-3 cursor-pointer">
              <img src="https://ui-avatars.com/api/?name=John+Doe&background=random" alt="User" className="h-8 w-8 rounded-full" />
              <span className="text-sm font-semibold text-gray-700">John Doe</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </header>

        {/* MOBILE TOP HEADER */}
        <header className="h-16 bg-white flex items-center justify-between px-4 border-b border-gray-200 flex-shrink-0 md:hidden z-10">
           <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-[#E85D36] to-[#D94A24] rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg leading-none">V</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">VedaAI</h1>
          </Link>
          <img src="https://ui-avatars.com/api/?name=John+Doe&background=random" alt="User" className="h-8 w-8 rounded-full" />
        </header>

        {/* SCROLLABLE PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto bg-[#F4F5F7] p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </main>

      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 z-50 flex justify-around items-center pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path === '/' && pathname === '/');
          return (
            <Link 
              key={item.name} 
              href={item.path} 
              className={`flex flex-col items-center gap-1 py-3 px-2 w-full relative ${isActive ? 'text-[#E85D36]' : 'text-gray-400'}`}
            >
              <item.icon className={`h-6 w-6 ${isActive ? 'fill-[#E85D36]/10' : ''}`} />
              <span className="text-[10px] font-semibold">{item.name}</span>
              {item.name === 'Assignments' && assignments.length > 0 && (
                <span className="absolute top-2 right-4 bg-[#E85D36] text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full border-2 border-white">
                  {assignments.length}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* MOBILE FLOATING ACTION BUTTON  */}
      <div className="md:hidden fixed bottom-20 right-4 z-50">
        <Link 
          href="/create"
          className="bg-[#1A1D21] text-white h-14 w-14 rounded-full flex items-center justify-center shadow-2xl border border-gray-700 hover:scale-105 transition-transform"
        >
          <Plus className="h-6 w-6 text-[#E85D36]" />
        </Link>
      </div>

    </div>
  );
}