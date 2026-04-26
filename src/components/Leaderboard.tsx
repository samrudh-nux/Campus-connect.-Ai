import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star, Flame, Search, Filter, TrendingUp, Award, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';

export default function Leaderboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'users'), 
      where('role', '==', 'ambassador'),
      orderBy('xp', 'desc'),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-16">
      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-10">
        <div className="max-w-xl">
          <div className="flex items-center gap-3 mb-4">
             <span className="ai-badge !bg-indigo-600 !text-white border-none px-3 py-1">Season 4 Live</span>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] font-mono italic">Sector: Global Alpha</span>
          </div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none mb-4">Global Intelligence Rankings</h2>
          <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-md">Top performing ambassadors ranked by tactical intelligence, campaign ROI, and community impact points.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex-1 md:flex-none glass-card !rounded-2xl px-6 py-4 flex items-center gap-3 shadow-2xl shadow-slate-100 border-none group hover:border-indigo-400 transition-all">
             <Search className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
             <input type="text" placeholder="Search ranks..." className="bg-transparent border-none outline-none font-black text-xs text-slate-400 uppercase tracking-widest w-48" />
          </div>
        </div>
      </div>

      {/* Top 3 Podium - Modern Unstop Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-end mb-24 px-4 md:px-0">
        {users.slice(0, 3).map((user, idx) => {
          const isWinner = idx === 0;
          return (
            <motion.div 
              key={user.uid}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.2, type: "spring", stiffness: 100 }}
              className={`relative group ${isWinner ? 'order-2 md:-translate-y-12' : idx === 1 ? 'order-1' : 'order-3'}`}
            >
              <div className={`glass-card p-12 rounded-[3.5rem] text-center transition-all duration-700 hover:shadow-[0_20px_100px_rgba(79,70,229,0.15)] overflow-hidden relative ${isWinner ? 'bg-gradient-to-br from-indigo-700 to-purple-900 text-white border-none shadow-2xl shadow-indigo-200' : 'bg-white text-slate-900 border-slate-100'}`}>
                {isWinner && (
                  <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12">
                    <Trophy className="w-48 h-48" />
                  </div>
                )}
                
                <div className="relative mb-10 inline-block">
                  <div className={`w-32 h-32 rounded-[2.5rem] mx-auto flex items-center justify-center text-5xl font-black shadow-2xl relative z-10 transition-transform duration-700 group-hover:scale-110 overflow-hidden ${isWinner ? 'bg-white text-indigo-700' : 'bg-slate-50 text-slate-300 border border-slate-100'}`}>
                    {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : user.displayName[0]}
                  </div>
                  <div className={`absolute -top-6 -right-6 w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform duration-500 z-20 ${isWinner ? 'bg-amber-400 text-white scale-110' : 'bg-slate-950 text-white'}`}>
                    {isWinner ? <Trophy className="w-7 h-7" /> : idx === 1 ? <Award className="w-7 h-7" /> : <Medal className="w-7 h-7" />}
                  </div>
                  <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] z-30 shadow-2xl ${isWinner ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'}`}>
                    {idx + 1}{idx === 0 ? 'st' : idx === 1 ? 'nd' : 'rd'} ALPHA
                  </div>
                </div>
                
                <h3 className="text-2xl font-black tracking-tight mb-2 truncate px-4 group-hover:text-indigo-200 transition-colors">{user.displayName}</h3>
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-10 ${isWinner ? 'opacity-60' : 'text-slate-400'}`}>{user.campus}</p>
                
                <div className={`p-6 rounded-[2rem] flex justify-between items-center transition-colors ${isWinner ? 'bg-white/10' : 'bg-slate-50'}`}>
                  <div className="text-left">
                    <p className={`text-[9px] font-black uppercase tracking-widest opacity-60 mb-0.5`}>Alpha Earnings</p>
                    <p className="text-xl font-black">${(user.totalEarned || 0).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[9px] font-black uppercase tracking-widest opacity-60 mb-0.5`}>XP Capital</p>
                    <p className="text-xl font-black">{user.xp.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Ranking Table */}
      <div className="glass-card rounded-[3.5rem] overflow-hidden border-none shadow-2xl shadow-slate-100">
        <div className="px-12 py-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 backdrop-blur-3xl">
          <div className="flex gap-12">
             <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Global Rank</span>
             <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Candidate Intel</span>
          </div>
          <div className="flex gap-24">
             <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest hidden md:block">Sector Analysis</span>
             <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest w-28 text-right">XP Capital</span>
          </div>
        </div>
        
        <div className="divide-y divide-slate-50">
          {users.slice(3).map((user, idx) => (
            <motion.div 
              key={user.uid}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="px-12 py-8 flex justify-between items-center hover:bg-slate-50/80 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-12">
                <span className="text-lg font-black text-slate-200 group-hover:text-indigo-400 transition-colors w-8">0{idx + 4}</span>
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-sm font-black text-slate-400 border border-slate-200 overflow-hidden group-hover:rotate-6 transition-transform shadow-inner">
                     {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : user.displayName[0]}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-none mb-2">{user.displayName}</h4>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user.campus}</span>
                       <span className="w-1 h-1 rounded-full bg-slate-200" />
                       <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Ranked Tier {user.level}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-24">
                <div className="flex items-center gap-4 hidden lg:flex">
                   <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                     <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${user.intelligenceScore * 10}%` }}
                        transition={{ duration: 1, ease: "circOut" }}
                        className="h-full bg-indigo-600 rounded-full" 
                      />
                   </div>
                   <span className="text-xs font-black text-slate-900">{user.intelligenceScore} IQ</span>
                </div>
                <div className="w-28 text-right">
                  <span className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{user.xp.toLocaleString()}</span>
                  <div className="flex items-center justify-end gap-1 mt-1 text-emerald-500">
                     <TrendingUp className="w-3 h-3" />
                     <span className="text-[9px] font-black uppercase tracking-widest">+124 Growth</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-6 py-10 opacity-40">
         <div className="h-px bg-slate-200 w-32" />
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic text-center">Protocol Synchronized with Global Autonomous Engine V4.8 • Alpha Sector</p>
      </div>
    </div>
  );
}
