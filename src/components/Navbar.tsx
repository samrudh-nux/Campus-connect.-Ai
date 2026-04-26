import React from 'react';
import { Rocket, User, ShieldCheck, LogOut, Search } from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  role: UserRole;
  displayName: string;
  onSwitchRole: () => void;
  onLogout: () => void;
}

export default function Navbar({ role, displayName, onSwitchRole, onLogout }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-64 right-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-40 px-8">
      <div className="max-w-7xl mx-auto h-20 flex justify-between items-center">
        <div className="flex gap-8 items-center">
           <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 flex items-center gap-2 group cursor-pointer hover:border-indigo-400 transition-colors">
              <Search className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-400 group-hover:text-slate-600">Quick Search...</span>
              <div className="ml-4 flex gap-1 opacity-20">
                 <span className="bg-slate-300 w-4 h-4 rounded text-[8px] flex items-center justify-center font-black">⌘</span>
                 <span className="bg-slate-300 w-4 h-4 rounded text-[8px] flex items-center justify-center font-black">K</span>
              </div>
           </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5 leading-none">Session Status</p>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="text-xs font-bold text-slate-700">Authenticated</span>
                </div>
             </div>
          </div>
          
          <div className="h-10 w-px bg-slate-100 mx-2"></div>
          
          <button 
            onClick={onLogout}
            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-100 transition-all group"
            title="Secure Logout"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </nav>
  );
}
