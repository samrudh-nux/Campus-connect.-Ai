import React, { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { UserProfile, UserRole } from './types';
import Navbar from './components/Navbar';
import AdminDashboard from './components/AdminDashboard';
import AmbassadorDashboard from './components/AmbassadorDashboard';
import Leaderboard from './components/Leaderboard';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, Sparkles, User, ShieldCheck, Zap, Target, Users, BookOpen, CreditCard, LogOut, Trophy } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leaderboard'>('dashboard');
  const [showLogin, setShowLogin] = useState(true);

  const loginAs = async (role: UserRole) => {
    setLoading(true);
    try {
      // Use deterministic IDs for the demo to bypass auth configuration issues
      const uid = role === 'admin' ? 'admin_demo_1' : 'amb_demo_1';
      
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);

      let profile: UserProfile;

      if (!userDoc.exists()) {
        profile = {
          uid: uid,
          email: `${role}_demo@campusconnect.ai`,
          displayName: role === 'admin' ? 'Sarah (Admin)' : 'Alex (Stanford)',
          role: role,
          campus: role === 'admin' ? 'Headquarters' : 'Stanford University',
          xp: role === 'admin' ? 0 : 750,
          level: role === 'admin' ? 1 : 4,
          streak: role === 'admin' ? 0 : 12,
          intelligenceScore: role === 'admin' ? 9.8 : 8.5,
          status: 'active',
          badges: ['Early Bird', 'Consistency King'],
          earningsBalance: role === 'admin' ? 0 : 250,
          totalEarned: role === 'admin' ? 0 : 500,
          totalPaid: role === 'admin' ? 0 : 250,
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, profile);
      } else {
        profile = userDoc.data() as UserProfile;
        // Ensure role is correct if switching (for demo purposes)
        if (profile.role !== role) {
           profile.role = role;
           await setDoc(userRef, profile, { merge: true });
        }
      }

      setUser(profile);
      setShowLogin(false);
    } catch (e) {
      console.error("Demo Logic Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        if (doc.exists()) {
          setUser(doc.data() as UserProfile);
        }
      });
      return () => unsubscribe();
    }
  }, [user?.uid]);

  const switchRole = () => {
    const nextRole = user?.role === 'admin' ? 'ambassador' : 'admin';
    loginAs(nextRole);
  };

  if (showLogin) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="mb-12 flex items-center gap-3">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-200">
            <Rocket className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">CampusConnect <span className="text-indigo-600">AI</span></h1>
        </div>
        
        <div className="glass-card p-8 rounded-3xl shadow-2xl w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 font-display">Welcome Back</h2>
          <p className="text-slate-500 mb-8 font-medium">Choose a demo profile to experience the engine.</p>
          
          <div className="space-y-4">
            <button 
              onClick={() => loginAs('admin')}
              className="w-full flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-2xl hover:bg-indigo-600 group transition-all duration-300"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="bg-white p-2.5 rounded-xl group-hover:bg-indigo-400 transition-colors">
                  <ShieldCheck className="w-5 h-5 text-indigo-600 group-hover:text-white" />
                </div>
                <div>
                  <p className="font-bold text-indigo-900 group-hover:text-white">Admin Dashboard</p>
                  <p className="text-xs text-indigo-600 group-hover:text-indigo-100 font-medium">Growth & AI Tasks</p>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-indigo-300 group-hover:text-white animate-pulse" />
            </button>

            <button 
              onClick={() => loginAs('ambassador')}
              className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-900 group transition-all duration-300"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="bg-white p-2.5 rounded-xl group-hover:bg-slate-800 transition-colors">
                  <User className="w-5 h-5 text-slate-400 group-hover:text-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-white">Ambassador Portal</p>
                  <p className="text-xs text-slate-400 group-hover:text-slate-300 font-medium">Complete tasks & XP</p>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-slate-300 group-hover:text-white" />
            </button>
          </div>
          
          <p className="mt-8 text-[10px] text-slate-400 uppercase tracking-widest font-black">Autonomous Engine MVP</p>
        </div>
      </div>
    );
  }

  if (loading || !user) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-slate-500 font-bold tracking-widest uppercase text-[10px]">Synchronizing AI...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Rocket className="w-5 h-5 font-bold" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">CampusConnect</h1>
        </div>
        
        <nav className="flex flex-col gap-2">
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<Zap className="w-4 h-4" />} 
            label="Command Center" 
          />
          <NavButton 
            active={activeTab === 'leaderboard'} 
            onClick={() => setActiveTab('leaderboard')} 
            icon={<Trophy className="w-4 h-4" />} 
            label="Intelligence" 
          />
          <div className="h-px bg-slate-100 my-4"></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">Program</p>
          <NavButton active={false} icon={<Target className="w-4 h-4" />} label="Campaigns" />
          <NavButton active={false} icon={<Users className="w-4 h-4" />} label="Ambassadors" />
          <NavButton active={false} icon={<CreditCard className="w-4 h-4" />} label="Payouts" />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="bg-slate-900 p-4 rounded-2xl text-white shadow-xl shadow-slate-200">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">AI Usage</p>
            <div className="h-1.5 w-full bg-slate-700 rounded-full mb-2">
              <div className="h-full w-3/4 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
            </div>
            <p className="text-xs font-semibold">750 / 1000 Tokens</p>
          </div>
          
          <div className="mt-6 flex items-center justify-between px-2">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 font-bold text-xs">
                  {user.displayName.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900">{user.displayName.split(' ')[0]}</p>
                  <p className="text-[10px] text-slate-400 capitalize">{user.role}</p>
                </div>
             </div>
             <button onClick={() => setShowLogin(true)} className="text-slate-400 hover:text-red-500 transition-colors">
               <LogOut className="w-4 h-4" />
             </button>
          </div>
          
          <button 
            onClick={switchRole}
            className="w-full mt-4 py-2 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-50 transition-colors uppercase tracking-widest"
          >
            Switch to {user.role === 'admin' ? 'Ambassador' : 'Admin'}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <Navbar 
          role={user.role} 
          displayName={user.displayName} 
          onSwitchRole={switchRole}
          onLogout={() => setShowLogin(true)}
        />
        
        <div className="pt-20 flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-8 py-10">
            <header className="flex justify-between items-end mb-12">
               <div>
                  <p className="text-xs font-black text-indigo-600 tracking-[0.3em] uppercase mb-2 font-mono drop-shadow-sm">System Deployment: Active</p>
                  <h1 className="text-5xl font-black text-slate-900 tracking-tighter drop-shadow-sm">
                    {user.role === 'admin' ? 'Nexus Command' : 'Ambassador Hub'} <span className="opacity-20 mx-2">/</span> <span className="text-slate-400">{user.campus.split(' ')[0]}</span>
                  </h1>
               </div>
               <div className="flex gap-4">
                  <button className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest shadow-sm hover:border-indigo-400 transition-all hover:-translate-y-0.5">Settings</button>
                  <button className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all hover:-translate-y-0.5 hover:shadow-indigo-500/20">+ Protocol</button>
               </div>
            </header>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab + user.role}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "circOut" }}
              >
                {activeTab === 'leaderboard' ? (
                  <Leaderboard />
                ) : (
                  user.role === 'admin' ? <AdminDashboard user={user} /> : <AmbassadorDashboard user={user} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group ${active ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50' : 'text-slate-500 hover:bg-slate-100'}`}
    >
      <span className={`${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>{icon}</span>
      {label}
    </button>
  );
}
