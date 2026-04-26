import React, { useState, useEffect } from 'react';
import { 
  Trophy, BookOpen, Clock, CheckCircle2, 
  Upload, Camera, Flame, Award, Zap, AlertCircle,
  Globe, Compass, Search, ChevronRight, Star, Rocket, Sparkles, Users, User, Shield, Wallet, DollarSign, History, CreditCard, Send, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, UserProfile, PayoutRequest } from '../types';
import { db } from '../lib/firebase';
import { collection, updateDoc, doc, onSnapshot, query, where, orderBy, addDoc, getDocs } from 'firebase/firestore';
import { verifyTaskProof } from '../services/geminiService';

export default function AmbassadorDashboard({ user }: { user: UserProfile }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [activePortalView, setActivePortalView] = useState<'missions' | 'battleground' | 'vault'>('missions');
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutMethod, setPayoutMethod] = useState('');

  useEffect(() => {
    const qTask = query(
      collection(db, 'tasks'), 
      where('ambassadorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsubTasks = onSnapshot(qTask, (snapshot) => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    });

    const qPayout = query(
      collection(db, 'payouts'),
      where('ambassadorId', '==', user.uid),
      orderBy('requestedAt', 'desc')
    );

    const unsubPayouts = onSnapshot(qPayout, (snapshot) => {
      setPayouts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PayoutRequest)));
    });

    return () => { unsubTasks(); unsubPayouts(); };
  }, [user.uid]);

  const handleSubmitProof = async () => {
    if (!selectedTask || !proofUrl) return;
    setSubmitting(true);

    try {
      const result = await verifyTaskProof(selectedTask.description, proofUrl);
      const taskRef = doc(db, 'tasks', selectedTask.id);
      await updateDoc(taskRef, {
        status: 'submitted',
        proofUrl: proofUrl,
        submittedAt: new Date().toISOString(),
        aiFeedback: result.feedback,
        aiConfidence: result.confidence
      });
      setSelectedTask(null);
      setProofUrl('');
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestPayout = async () => {
    if (payoutAmount <= 0 || payoutAmount > (user.earningsBalance || 0) || !payoutMethod) return;
    setRequestingPayout(true);
    try {
      await addDoc(collection(db, 'payouts'), {
        ambassadorId: user.uid,
        amount: payoutAmount,
        method: payoutMethod,
        status: 'pending',
        requestedAt: new Date().toISOString(),
        paymentMethod: payoutMethod
      });

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        earningsBalance: user.earningsBalance - payoutAmount
      });
      
      setPayoutAmount(0);
      setPayoutMethod('');
    } catch (e) {
      console.error(e);
    } finally {
      setRequestingPayout(false);
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const submittedTasks = tasks.filter(t => t.status === 'submitted');

  return (
    <div className="space-y-12 pb-24">
      {/* Dynamic Profile Deck */}
      <div className="glass-card rounded-[3.5rem] p-12 bg-gradient-to-br from-white to-indigo-50/20 border-none shadow-[0_20px_100px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/5 rounded-full blur-[100px] group-hover:scale-125 transition-transform duration-1000" />
         <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            <div className="relative">
              <div className="w-36 h-36 rounded-[3rem] bg-slate-900 flex items-center justify-center border-8 border-white shadow-2xl rotate-3 group-hover:rotate-0 transition-all duration-700 overflow-hidden">
                <span className="text-white text-5xl font-black">{user.displayName.charAt(0)}</span>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-amber-400 p-4 rounded-3xl border-8 border-white shadow-xl animate-bounce">
                <Flame className="w-8 h-8 text-white fill-white" />
              </div>
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                 <span className="ai-badge !bg-indigo-600 !text-white !border-none !px-4 !py-1.5 font-black">ELITE AMBASSADOR</span>
                 <span className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase">Season 4 Active Agent</span>
              </div>
              <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none mb-4">{user.displayName}</h1>
              <p className="text-base font-bold text-slate-500 uppercase tracking-widest">{user.campus} <span className="opacity-20 mx-3">|</span> Intelligence Tier {user.level}</p>
            </div>
         </div>
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-14 relative z-10">
            <StatsItem label="BALANCE" value={`$${(user.earningsBalance || 0).toLocaleString()}`} sub="Withdrawable" color="emerald" icon={<Wallet className="w-5 h-5" />} />
            <StatsItem label="TOTAL REVENUE" value={`$${(user.totalEarned || 0).toLocaleString()}`} sub="Life-time" color="indigo" />
            <StatsItem label="XP CAPITAL" value={user.xp.toLocaleString()} sub="Growth Metric" color="purple" />
            <StatsItem label="STREAK" value={user.streak} sub="Hot Streak" color="amber" icon={<Zap className="w-6 h-6 fill-current" />} />
         </div>
      </div>

      <div className="grid grid-cols-12 gap-10">
         <div className="col-span-12 lg:col-span-8 space-y-12">
            <div className="flex gap-4 p-1.5 bg-slate-100 rounded-3xl w-fit">
               <ViewTab active={activePortalView === 'missions'} onClick={() => setActivePortalView('missions')} label="Active Missions" />
               <ViewTab active={activePortalView === 'battleground'} onClick={() => setActivePortalView('battleground')} label="Battlegrounds" />
               <ViewTab active={activePortalView === 'vault'} onClick={() => setActivePortalView('vault')} label="The Vault" />
            </div>

            {activePortalView === 'missions' && (
               <section className="space-y-8">
                  <div className="flex items-center justify-between px-2">
                     <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
                        <Rocket className="w-5 h-5 text-indigo-600" /> MISSION CONTROL
                     </h2>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-8">
                     {pendingTasks.length === 0 ? (
                        <div className="p-32 text-center glass-card rounded-[4rem] border-dashed border-2 border-slate-200 bg-slate-50/50">
                           <Shield className="w-20 h-20 text-slate-200 mx-auto mb-8" />
                           <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-sm">Awaiting Intelligence Drop</p>
                           <p className="text-[11px] text-slate-300 mt-3 font-medium tracking-wide">AI Engine is processing global field trends...</p>
                        </div>
                      ) : (
                        pendingTasks.map((task, i) => (
                           <MissionUnit key={task.id} task={task} i={i} onClick={() => setSelectedTask(task)} />
                        ))
                      )}
                  </div>

                  {submittedTasks.length > 0 && (
                    <div className="pt-12">
                       <h2 className="text-[11px] font-black text-slate-400 mb-8 uppercase tracking-[0.4em] px-2 italic">Processing Submissions</h2>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {submittedTasks.map(task => (
                             <div key={task.id} className="glass-card p-10 rounded-[3rem] border-indigo-100 bg-indigo-50/20 flex flex-col justify-between group">
                                <div className="flex items-center gap-6 mb-8">
                                   <div className="w-14 h-14 rounded-2xl bg-white border border-indigo-100 flex items-center justify-center">
                                      <div className="w-5 h-5 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                   </div>
                                   <div>
                                      <p className="text-lg font-black text-slate-900 leading-none mb-1">{task.title}</p>
                                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">AI Syncing Metadata...</p>
                                   </div>
                                </div>
                                <div className="p-4 bg-white/50 rounded-2xl border border-white text-[10px] text-slate-500 font-medium font-mono">HASH: {task.id.slice(0, 16)}...</div>
                             </div>
                          ))}
                       </div>
                    </div>
                  )}
               </section>
            )}

            {activePortalView === 'battleground' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <BattleCard title="Regional Recruitment" pool="15.2k XP" status="Live" color="indigo" />
                 <BattleCard title="Social Influence War" pool="8.5k XP" status="Open" color="purple" />
                 <BattleCard title="Brand Ambush Sprint" pool="22k XP" status="Locked" color="amber" />
                 <BattleCard title="Growth Engineering" pool="5k XP" status="Ends Tomorrow" color="emerald" />
              </div>
            )}

            {activePortalView === 'vault' && (
               <div className="space-y-12">
                  <section className="glass-card rounded-[4rem] p-16 bg-slate-950 text-white border-none shadow-2xl relative overflow-hidden">
                     <Globe className="absolute -bottom-20 -right-20 w-80 h-80 opacity-5" />
                     <div className="relative z-10">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20">
                           <div>
                              <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.4em] mb-8 font-mono">AVAILABLE CAPITAL</h2>
                              <div className="flex items-end gap-4 mb-14">
                                 <span className="text-8xl font-black leading-none tracking-tighter">${(user.earningsBalance || 0).toLocaleString()}</span>
                                 <span className="text-2xl font-black text-emerald-400 mb-3 tracking-widest uppercase">USD</span>
                              </div>
                           </div>
                           <div className="w-full md:w-64 space-y-10">
                              <VaultStat label="Processed" value={`$${(user.totalPaid || 0).toLocaleString()}`} />
                              <VaultStat label="Life-time" value={`$${(user.totalEarned || 0).toLocaleString()}`} />
                              <div className="flex items-center gap-3">
                                 <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                 <VaultStat label="KYC Compliance" value="Verified Alpha" />
                              </div>
                           </div>
                        </div>

                        <div className="glass-card bg-white/[0.03] border-white/10 p-12 rounded-[3.5rem] max-w-2xl">
                           <h3 className="text-xl font-black mb-10 flex items-center gap-3">
                              <CreditCard className="text-emerald-400" /> Initialize Withdrawal
                           </h3>
                           <div className="space-y-8">
                              <div className="space-y-3">
                                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Amount to Release</label>
                                 <div className="relative">
                                    <span className="absolute left-10 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-500">$</span>
                                    <input 
                                       type="number" 
                                       placeholder="0.00"
                                       value={payoutAmount || ''}
                                       onChange={e => setPayoutAmount(parseFloat(e.target.value))}
                                       className="w-full px-16 py-6 bg-white/[0.05] border-2 border-transparent focus:border-emerald-500 rounded-[2.5rem] outline-none transition-all font-black text-2xl text-white"
                                    />
                                 </div>
                              </div>
                              <div className="space-y-3">
                                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Payment Protocol (UPI, PayPal, Bank)</label>
                                 <input 
                                    type="text" 
                                    placeholder="Enter details..."
                                    value={payoutMethod}
                                    onChange={e => setPayoutMethod(e.target.value)}
                                    className="w-full px-10 py-6 bg-white/[0.05] border-2 border-transparent focus:border-emerald-500 rounded-[2.5rem] outline-none transition-all font-black text-white"
                                 />
                              </div>
                              <button 
                                 onClick={handleRequestPayout}
                                 disabled={requestingPayout || !payoutAmount || payoutAmount > user.earningsBalance}
                                 className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 text-white py-6 rounded-[2.5rem] text-sm font-black uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-4"
                              >
                                 {requestingPayout ? 'TRANSMITTING...' : 'RELEASE TO BANK'} <Send className="w-5 h-5" />
                              </button>
                           </div>
                        </div>
                     </div>
                  </section>

                  <div className="glass-card rounded-[3.5rem] p-12">
                     <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-50">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                           <History className="text-indigo-600" /> Financial History
                        </h3>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Stream</span>
                     </div>
                     <div className="space-y-6">
                        {payouts.length === 0 ? (
                           <p className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] italic">No prior transactions detected</p>
                        ) : (
                           payouts.map(p => (
                              <div key={p.id} className="flex items-center justify-between py-6 group hover:bg-slate-50/50 transition-colors p-4 rounded-3xl">
                                 <div className="flex items-center gap-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${p.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : p.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                                       <Wallet className="w-7 h-7" />
                                    </div>
                                    <div>
                                       <p className="text-lg font-black text-slate-900 leading-none mb-1.5">${p.amount.toLocaleString()}</p>
                                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.paymentMethod} • {new Date(p.requestedAt).toLocaleDateString()}</p>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${p.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : p.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                       {p.status}
                                    </span>
                                    {p.transactionId && <p className="text-[9px] font-mono text-slate-300 mt-2">{p.transactionId}</p>}
                                 </div>
                              </div>
                           ))
                        )}
                     </div>
                  </div>
               </div>
            )}
         </div>

         {/* Sidebar Intel */}
         <div className="col-span-12 lg:col-span-4 space-y-12">
            <section className="glass-card p-12 rounded-[3.5rem] bg-indigo-600 text-white border-none shadow-2xl shadow-indigo-100 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-12 opacity-10">
                  <Star className="w-48 h-48" />
               </div>
               <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 mb-10 font-mono">Skill Vector Analysis</h3>
               <div className="space-y-10 relative z-10">
                  <ProgressBar label="Strategic Intel" val={88} />
                  <ProgressBar label="Network Virality" val={64} />
                  <ProgressBar label="Field Reporting" val={92} />
                  <div className="pt-8 border-t border-white/10 flex items-center gap-6">
                     <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
                        <Award className="w-8 h-8" />
                     </div>
                     <div>
                        <p className="text-sm font-black uppercase tracking-widest leading-none mb-1.5">Sector Lead</p>
                        <p className="text-[11px] font-medium opacity-60">Ranking Top 2% in Outreach</p>
                     </div>
                  </div>
               </div>
            </section>

            <section className="glass-card p-12 rounded-[3rem]">
               <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10 pb-6 border-b border-slate-50">Next Unlockable Milestone</h3>
               <div className="space-y-8">
                  {[
                    { label: "Elite Badge", xp: "5k", icon: <Award className="w-5 h-5" /> },
                    { label: "AI Oracle Access", xp: "10k", icon: <Sparkles className="w-5 h-5" /> },
                    { label: "Global Lead Role", xp: "25k", icon: <Globe className="w-5 h-5" /> }
                  ].map((m, i) => (
                    <div key={i} className="flex items-center justify-between group">
                       <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">
                             {m.icon}
                          </div>
                          <p className="text-sm font-black text-slate-900">{m.label}</p>
                       </div>
                       <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.1em]">{m.xp} XP</span>
                    </div>
                  ))}
               </div>
            </section>
         </div>
      </div>

      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-900/60 font-sans">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="bg-white rounded-[4rem] w-full max-w-2xl p-16 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-16 opacity-[0.03] rotate-45">
                 <Rocket className="w-80 h-80" />
              </div>
              <div className="relative z-10">
                <header className="mb-14 text-center">
                   <div className="ai-badge !bg-indigo-600 !text-white !border-none !px-5 !py-1.5 mb-5 mx-auto font-black italic">MISSION DEPLOYMENT</div>
                   <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4 leading-tight">{selectedTask.title}</h2>
                   <p className="text-base font-medium text-slate-500 max-w-md mx-auto">{selectedTask.description}</p>
                </header>

                <div className="space-y-10">
                   <div className="p-12 border-2 border-dashed border-slate-200 bg-slate-50 rounded-[2.5rem] text-center group hover:border-indigo-400 transition-all cursor-pointer">
                      <Camera className="w-12 h-12 text-slate-300 group-hover:text-indigo-600 transition-all mx-auto mb-6 group-hover:scale-110" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] group-hover:text-slate-950">Upload Intelligence Assets</p>
                   </div>
                   
                   <div className="space-y-4">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] px-2 font-mono">Proof Sync Hash (URL)</label>
                      <input 
                        type="text" 
                        value={proofUrl}
                        onChange={e => setProofUrl(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="w-full px-10 py-6 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-[2.5rem] outline-none transition-all font-bold text-lg"
                      />
                   </div>

                   <div className="bg-amber-50 p-8 rounded-[2rem] border border-amber-100 flex items-start gap-5">
                      <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                      <p className="text-xs font-bold text-amber-800 leading-relaxed uppercase tracking-wide">AI POLICY: ALL SUBMISSIONS ARE AUTO-AUDITED FOR META-DATA INTEGRITY. ANY SYNTHETIC EDITS RESULT IN TOTAL XP SEQUESTRATION.</p>
                   </div>
                </div>

                <div className="flex gap-6 mt-16">
                   <button onClick={() => setSelectedTask(null)} className="flex-1 py-6 text-sm font-black text-slate-400 hover:text-slate-950 transition-colors uppercase tracking-[0.3em]">Abort Mission</button>
                   <button 
                     onClick={handleSubmitProof}
                     disabled={submitting || !proofUrl}
                     className="flex-[2] bg-slate-950 hover:bg-black text-white py-7 rounded-[2.5rem] text-sm font-black shadow-2xl hover:-translate-y-1 transition-all uppercase tracking-[0.3em] flex items-center justify-center gap-3"
                   >
                     {submitting ? 'PROCESSING INTEL...' : 'INITIALIZE UPLOAD'} <ChevronRight className="w-6 h-6" />
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatsItem({ label, value, sub, color, icon = null }: any) {
  const colors: any = {
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    purple: 'text-purple-600 bg-purple-50 border-purple-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  };
  return (
    <div className="text-center group">
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{label}</p>
       <div className={`text-4xl font-black mb-1.5 flex items-center justify-center gap-2 group-hover:scale-110 transition-transform ${colors[color].split(' ')[0]}`}>
          {value} {icon}
       </div>
       <p className="text-[11px] font-bold text-slate-400 opacity-60 uppercase italic tracking-widest">{sub}</p>
    </div>
  );
}

function ViewTab({ active, onClick, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`px-10 py-3.5 rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${active ? 'bg-white text-indigo-600 shadow-xl shadow-slate-200 border border-slate-100' : 'text-slate-400 hover:text-slate-950'}`}
    >
      {label}
    </button>
  );
}

function MissionUnit({ task, i, onClick }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.1 }}
      onClick={onClick}
      className="glass-card p-12 rounded-[3.5rem] hover:border-indigo-400/50 cursor-pointer group transition-all duration-700 overflow-hidden relative"
    >
       <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-10 transition-all">
          <Zap className="w-40 h-40 text-indigo-600" />
       </div>
       <div className="flex flex-col lg:flex-row items-center gap-10">
          <div className="w-24 h-24 bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-700 rounded-3xl flex items-center justify-center flex-shrink-0 group-hover:rotate-12 group-hover:scale-110">
            <Compass className="w-12 h-12" />
          </div>
          <div className="flex-1 text-center lg:text-left">
             <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-4">
                <span className="ai-badge !bg-emerald-50 !text-emerald-700">MISSION DEPLOYED</span>
                <span className="text-[11px] font-black text-indigo-500 uppercase tracking-widest font-mono">REWARD: {task.xpValue} XP</span>
                <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest font-mono tracking-tighter bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">${(task.monetaryValue || 0).toLocaleString()} CASH</span>
             </div>
             <h3 className="text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight mb-3 leading-none">{task.title}</h3>
             <p className="text-base font-medium text-slate-500 leading-relaxed line-clamp-2 mb-10">{task.description}</p>
             <div className="flex items-center justify-between pt-10 border-t border-slate-50">
                <div className="flex -space-x-4">
                   {[1,2,3,4].map(k => <div key={k} className="w-10 h-10 rounded-full border-4 border-white bg-slate-100 shadow-inner" />)}
                </div>
                <button className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] font-mono group-hover:translate-x-2 transition-transform">Initialize Entry →</button>
             </div>
          </div>
       </div>
    </motion.div>
  );
}

function BattleCard({ title, pool, status, color }: any) {
  return (
    <div className="glass-card p-12 rounded-[3.5rem] hover:shadow-2xl hover:shadow-indigo-500/5 transition-all group overflow-hidden relative cursor-pointer">
       <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10">
          <Globe className="w-32 h-32" />
       </div>
       <div className="ai-badge !bg-slate-950 !text-white !border-none !px-4 !py-1 mb-6 font-mono italic">{status}</div>
       <h3 className="text-2xl font-black text-slate-900 mb-2 leading-none tracking-tight">{title}</h3>
       <div className="flex justify-between items-center pt-10 mt-14 border-t border-slate-50">
          <div>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Sector Pool</p>
             <p className="text-2xl font-black text-slate-950 group-hover:text-indigo-600 transition-colors">{pool}</p>
          </div>
          <button className="bg-slate-100 text-slate-400 group-hover:bg-slate-900 group-hover:text-white p-4 rounded-2xl transition-all">
             <ChevronRight className="w-6 h-6" />
          </button>
       </div>
    </div>
  );
}

function VaultStat({ label, val, value }: any) {
  return (
    <div className="space-y-2">
       <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{label}</p>
       <p className="text-2xl font-black tracking-tight">{val || value}</p>
    </div>
  );
}

function ProgressBar({ label, val }: any) {
  return (
    <div className="space-y-4">
       <div className="flex justify-between items-end">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/50">{label}</span>
          <span className="text-xs font-black text-white/80">{val}%</span>
       </div>
       <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: `${val}%` }}
            className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.4)]"
          />
       </div>
    </div>
  );
}
