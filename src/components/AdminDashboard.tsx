import React, { useState, useEffect } from 'react';
import { 
  Users, Target, TrendingUp, Sparkles, Plus, BarChart3, ShieldCheck, ArrowUpRight, Rocket, Search, Filter, Globe, Zap, AlertCircle, DollarSign, Wallet, CreditCard, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Campaign, Task, UserProfile, PayoutRequest } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, updateDoc, doc, writeBatch } from 'firebase/firestore';

export default function AdminDashboard({ user }: { user: UserProfile }) {
  const [ambassadors, setAmbassadors] = useState<UserProfile[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [activeView, setActiveView] = useState<'overview' | 'campaigns' | 'payouts' | 'events' | 'verified'>('overview');

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    goal: '',
    platform: 'Instagram',
    reward: 100,
    monetaryValue: 50 // New field for real cash reward
  });

  useEffect(() => {
    const ambQuery = query(collection(db, 'users'), where('role', '==', 'ambassador'));
    const unsubAmb = onSnapshot(ambQuery, (s) => setAmbassadors(s.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile))));

    const campQuery = query(collection(db, 'campaigns'), orderBy('createdAt', 'desc'));
    const unsubCamp = onSnapshot(campQuery, (s) => setCampaigns(s.docs.map(d => ({ id: d.id, ...d.data() } as Campaign))));

    const taskQuery = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    const unsubTask = onSnapshot(taskQuery, (s) => setTasks(s.docs.map(d => ({ id: d.id, ...d.data() } as Task))));

    const payoutQuery = query(collection(db, 'payouts'), orderBy('requestedAt', 'desc'));
    const unsubPayout = onSnapshot(payoutQuery, (s) => setPayouts(s.docs.map(d => ({ id: d.id, ...d.data() } as PayoutRequest))));

    setLoading(false);
    return () => { unsubAmb(); unsubCamp(); unsubTask(); unsubPayout(); };
  }, []);

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.goal) return;
    try {
      await addDoc(collection(db, 'campaigns'), {
        name: newCampaign.name,
        goal: newCampaign.goal,
        platform: newCampaign.platform,
        rewardValue: newCampaign.monetaryValue,
        status: 'active',
        adminId: user.uid,
        createdAt: new Date().toISOString()
      });
      setShowNewCampaign(false);
    } catch (e) {
      console.error(e);
    }
  };

  const approveTask = async (task: Task) => {
    try {
      const batch = writeBatch(db);
      
      const taskRef = doc(db, 'tasks', task.id);
      batch.update(taskRef, { status: 'approved' });
      
      const userRef = doc(db, 'users', task.ambassadorId);
      const amb = ambassadors.find(a => a.uid === task.ambassadorId);
      
      if (amb) {
        batch.update(userRef, { 
          xp: (amb.xp || 0) + (task.xpValue || 0),
          intelligenceScore: Math.min(10, (amb.intelligenceScore || 0) + 0.1),
          earningsBalance: (amb.earningsBalance || 0) + (task.monetaryValue || 0),
          totalEarned: (amb.totalEarned || 0) + (task.monetaryValue || 0)
        });
      }
      
      await batch.commit();
    } catch (e) {
      console.error("Failed to approve task:", e);
    }
  };

  const processPayout = async (payout: PayoutRequest, status: 'paid' | 'rejected') => {
    try {
      const batch = writeBatch(db);
      
      const payoutRef = doc(db, 'payouts', payout.id);
      batch.update(payoutRef, { 
        status, 
        processedAt: new Date().toISOString(),
        transactionId: status === 'paid' ? `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : null
      });
      
      if (status === 'paid') {
        const userRef = doc(db, 'users', payout.ambassadorId);
        const amb = ambassadors.find(a => a.uid === payout.ambassadorId);
        if (amb) {
          batch.update(userRef, {
            totalPaid: (amb.totalPaid || 0) + payout.amount
          });
        }
      } else if (status === 'rejected') {
        // Refund back to balance
        const userRef = doc(db, 'users', payout.ambassadorId);
        const amb = ambassadors.find(a => a.uid === payout.ambassadorId);
        if (amb) {
          batch.update(userRef, {
            earningsBalance: (amb.earningsBalance || 0) + payout.amount
          });
        }
      }
      
      await batch.commit();
    } catch (e) {
      console.error("Failed to process payout:", e);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px] text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Initializing Nexus Command...</div>;

  return (
    <div className="space-y-12">
      {/* Nexus Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <MetricCard icon={<Users className="text-indigo-600" />} label="GLOBAL AGENTS" value={ambassadors.length.toString()} change="+18.4%" trend="up" />
        <MetricCard icon={<Target className="text-purple-600" />} label="LIVE MISSIONS" value={campaigns.length.toString()} change="High Demand" trend="neutral" />
        <MetricCard icon={<DollarSign className="text-emerald-600" />} label="TOTAL CAPITAL" value={`$${ambassadors.reduce((acc, a) => acc + (a.totalEarned || 0), 0).toLocaleString()}`} change="+12% MoM" trend="up" />
        <MetricCard icon={<Wallet className="text-amber-600" />} label="PENDING PAYOUTS" value={`$${payouts.filter(p => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0).toLocaleString()}`} change="Priority" trend="neutral" />
      </div>

      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-12 lg:col-span-8 space-y-10">
          <div className="flex gap-4 p-1 bg-slate-100 rounded-2xl w-fit overflow-x-auto max-w-full">
            <Tab active={activeView === 'overview'} onClick={() => setActiveView('overview')} label="Command Center" />
            <Tab active={activeView === 'campaigns'} onClick={() => setActiveView('campaigns')} label="Operations" />
            <Tab active={activeView === 'payouts'} onClick={() => setActiveView('payouts')} label="Capital Flow" />
            <Tab active={activeView === 'events'} onClick={() => setActiveView('events')} label="Live Hackathons" />
            <Tab active={activeView === 'verified'} onClick={() => setActiveView('verified')} label="Ambassadors" />
          </div>

          {activeView === 'overview' && (
            <>
              <section className="glass-card rounded-[3rem] p-12 bg-slate-950 text-white border-none shadow-[0_40px_100px_rgba(0,0,0,0.15)] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                  <ShieldCheck className="w-64 h-64 text-indigo-400" />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-12">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                         <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                         <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Sector Monitor: Global</span>
                      </div>
                      <h2 className="text-4xl font-black tracking-tighter leading-none mb-4">Submission Control Stream</h2>
                      <p className="text-sm text-slate-400 font-medium max-w-md">Real-time verification of strategic field intelligence from across 12 sectors.</p>
                    </div>
                    <button 
                      onClick={() => setShowNewCampaign(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-5 rounded-3xl flex items-center gap-3 text-xs font-black transition-all shadow-xl shadow-indigo-500/20 uppercase tracking-widest hover:-translate-y-1"
                    >
                      <Plus className="w-4 h-4" /> Deploy Battleground
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {tasks.filter(t => t.status === 'submitted').length === 0 ? (
                      <div className="py-24 text-center border-2 border-dashed border-white/10 rounded-[2.5rem] bg-white/[0.02]">
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] italic">System Idling • No Field Intel Awaiting Verification</p>
                      </div>
                    ) : (
                      tasks.filter(t => t.status === 'submitted').map(task => (
                        <motion.div 
                          key={task.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-8 bg-white/[0.05] border border-white/[0.08] rounded-3xl flex items-center justify-between group hover:bg-white/[0.08] transition-all"
                        >
                          <div className="flex items-center gap-8">
                            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:rotate-6 transition-transform">
                              <BarChart3 className="w-7 h-7 text-indigo-400" />
                            </div>
                            <div>
                              <p className="text-lg font-black text-white leading-none mb-2">{task.title}</p>
                              <div className="flex items-center gap-3">
                                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    {ambassadors.find(a => a.uid === task.ambassadorId)?.displayName || 'Unknown Agent'}
                                 </span>
                                 <span className="w-1 h-1 rounded-full bg-slate-700" />
                                 <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{task.xpValue} XP Capital Release</span>
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => approveTask(task)}
                            className="bg-white text-slate-950 px-8 py-4 rounded-2xl hover:bg-indigo-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest shadow-lg shadow-white/5"
                          >
                            Verify & Release
                          </button>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </section>

              <div className="space-y-8">
                <div className="flex items-center justify-between px-2">
                   <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Active Operations</h2>
                   <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Full Analytics →</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {campaigns.slice(0, 4).map(camp => (
                    <div key={camp.id} className="glass-card p-10 rounded-[3rem] group relative overflow-hidden hover:border-indigo-500/30">
                       <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Zap className="w-32 h-32 text-indigo-600" />
                       </div>
                       <div className="flex justify-between items-start mb-8">
                          <span className="ai-badge !bg-emerald-50 !text-emerald-700 !border-emerald-100/50">OPERATIONAL</span>
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{camp.platform}</span>
                       </div>
                       <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight leading-tight">{camp.name}</h3>
                       <p className="text-xs font-semibold text-slate-500 leading-relaxed line-clamp-2 mb-6">{camp.goal}</p>
                       <div className="flex items-center gap-2 mb-8">
                         <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest">${camp.rewardValue} Reward</span>
                         <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 uppercase tracking-widest">Active</span>
                       </div>
                       <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                          <div className="flex -space-x-3">
                             {[1,2,3,4].map(i => <div key={i} className="w-8 h-8 rounded-full border-4 border-white bg-slate-100 shadow-sm" />)}
                             <div className="w-8 h-8 rounded-full border-4 border-white bg-slate-50 flex items-center justify-center text-[8px] font-black text-slate-400">+18</div>
                          </div>
                          <button className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] group-hover:translate-x-1 transition-transform">Control Hub →</button>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeView === 'campaigns' && (
             <div className="space-y-12">
                <div className="flex justify-between items-center px-4">
                   <div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Operational Sectors</h2>
                      <p className="text-sm font-medium text-slate-500">Managing {campaigns.length} active strategic campaigns</p>
                   </div>
                   <button 
                    onClick={() => setShowNewCampaign(true)}
                    className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
                   >
                    <Plus className="w-4 h-4" /> New Operation
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                   {campaigns.map(camp => (
                      <div key={camp.id} className="glass-card p-10 rounded-[3rem] group relative overflow-hidden bg-white hover:border-indigo-500/30 transition-all">
                         <div className="flex justify-between items-start mb-8">
                            <span className={`ai-badge ${camp.status === 'active' ? '!bg-emerald-50 !text-emerald-700' : '!bg-slate-50 !text-slate-500'}`}>
                               {camp.status.toUpperCase()}
                            </span>
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{camp.platform}</span>
                            </div>
                         </div>
                         <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tighter">{camp.name}</h3>
                         <p className="text-xs font-medium text-slate-500 leading-relaxed mb-8 line-clamp-3">{camp.goal}</p>
                         
                         <div className="space-y-6 pt-8 border-t border-slate-50">
                            <div className="flex justify-between items-center">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bounty protocol</p>
                               <span className="text-lg font-black text-emerald-600">${camp.rewardValue}</span>
                            </div>
                            <div className="flex justify-between items-center">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Field Data</p>
                               <span className="text-xs font-black text-slate-900">{tasks.filter(t => t.campaignId === camp.id).length} Submissions</span>
                            </div>
                         </div>

                         <div className="flex gap-4 mt-10">
                            <button className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Suspend</button>
                            <button className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20">Expand</button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {activeView === 'payouts' && (
             <div className="space-y-12">
                <section className="glass-card rounded-[4.5rem] p-16 bg-slate-900 border-none relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-16 opacity-5 animate-pulse">
                      <ShieldCheck className="w-96 h-96 text-emerald-400" />
                   </div>
                   <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                      <div>
                         <span className="ai-badge !bg-emerald-500 !text-white !border-none mb-6">GATEWAY READY</span>
                         <h2 className="text-5xl font-black text-white tracking-tighter leading-none mb-8">Unified Capital<br/>Integration Engine</h2>
                         <p className="text-lg text-slate-400 font-medium leading-relaxed mb-12">Real-time synchronization with Stripe & Razorpay protocols for instant field agent liquidity.</p>
                         <div className="flex gap-4">
                            <button className="bg-white text-slate-950 px-10 py-5 rounded-3xl text-xs font-black uppercase tracking-widest shadow-2xl hover:-translate-y-1 transition-all">Configure Gateway</button>
                            <button className="bg-white/5 border border-white/10 text-white px-10 py-5 rounded-3xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all">Audit Logs</button>
                         </div>
                      </div>
                      <div className="bg-white/[0.03] border border-white/10 rounded-[3.5rem] p-10 flex flex-col items-center justify-center text-center">
                         <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center mb-8">
                            <Rocket className="text-emerald-400 w-10 h-10" />
                         </div>
                         <h4 className="text-2xl font-black text-white mb-3">Gateway Operational</h4>
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-10">System Uptime: 99.99% • AES-256 Encrypted</p>
                         <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-full animate-progress-glow"></div>
                         </div>
                      </div>
                   </div>
                </section>

                <section className="glass-card rounded-[4rem] p-12 bg-slate-950 text-white border-none shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-12 opacity-5">
                      <Wallet className="w-64 h-64 text-indigo-400" />
                   </div>
                   <div className="relative z-10">
                      <div className="mb-12">
                         <span className="ai-badge !bg-emerald-500 !text-white !border-none mb-3">FINANCIAL LEDGER</span>
                         <h2 className="text-4xl font-black tracking-tighter leading-none mb-4">Capital Disbursement</h2>
                         <p className="text-sm text-slate-400 max-w-md">Verify and process withdrawal requests from field agents. Synchronized with global banking protocols.</p>
                      </div>
                      
                      <div className="space-y-4">
                         {payouts.filter(p => p.status === 'pending').length === 0 ? (
                            <div className="py-24 text-center border-2 border-dashed border-white/10 rounded-[2.5rem] bg-white/[0.02]">
                               <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] h-10 italic">Ledger Balanced • No Pending Payouts</p>
                            </div>
                         ) : (
                            payouts.filter(p => p.status === 'pending').map(payout => (
                               <motion.div 
                                 key={payout.id}
                                 initial={{ opacity: 0, y: 10 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 className="p-8 bg-white/[0.05] border border-white/[0.08] rounded-3xl flex items-center justify-between group hover:bg-white/[0.08] transition-all"
                               >
                                  <div className="flex items-center gap-8">
                                     <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                                        <CreditCard className="w-7 h-7 text-emerald-400" />
                                     </div>
                                     <div>
                                        <p className="text-lg font-black text-white leading-none mb-2">${payout.amount.toLocaleString()}</p>
                                        <div className="flex items-center gap-3">
                                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                              {ambassadors.find(a => a.uid === payout.ambassadorId)?.displayName || 'Unknown Agent'}
                                           </span>
                                           <span className="w-1 h-1 rounded-full bg-slate-700" />
                                           <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{payout.paymentMethod}</span>
                                        </div>
                                     </div>
                                  </div>
                                  <div className="flex gap-4">
                                     <button 
                                       onClick={() => processPayout(payout, 'rejected')}
                                       className="px-6 py-4 rounded-2xl hover:bg-red-500/10 text-red-400 transition-all text-xs font-black uppercase tracking-widest"
                                     >
                                        Reject
                                     </button>
                                     <button 
                                       onClick={() => processPayout(payout, 'paid')}
                                       className="bg-emerald-500 text-white px-8 py-4 rounded-2xl hover:bg-emerald-600 transition-all text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                                     >
                                        Release Capital
                                     </button>
                                  </div>
                               </motion.div>
                            ))
                         )}
                      </div>
                   </div>
                </section>

                <div className="glass-card rounded-[3.5rem] p-10">
                   <div className="flex justify-between items-center mb-10">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Transaction History</h3>
                      <History className="w-5 h-5 text-slate-400" />
                   </div>
                   <div className="space-y-4">
                      {payouts.filter(p => p.status !== 'pending').slice(0, 10).map(payout => (
                         <div key={payout.id} className="flex items-center justify-between py-6 border-b border-slate-50 last:border-0">
                            <div className="flex items-center gap-5">
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${payout.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                  <CreditCard className="w-5 h-5" />
                               </div>
                               <div>
                                  <p className="text-sm font-black text-slate-900 leading-none mb-1">${payout.amount.toLocaleString()}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                     {ambassadors.find(a => a.uid === payout.ambassadorId)?.displayName} • {new Date(payout.requestedAt).toLocaleDateString()}
                                  </p>
                               </div>
                            </div>
                            <div className="text-right">
                               <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${payout.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                  {payout.status}
                               </span>
                               <p className="text-[9px] font-mono text-slate-300 mt-1 uppercase">{payout.transactionId || '---'}</p>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             </div>
          )}

          {activeView === 'events' && (
            <div className="space-y-10">
               <div className="glass-card p-12 rounded-[3.5rem] bg-indigo-600 text-white border-none relative overflow-hidden mb-12">
                  <Globe className="absolute -bottom-20 -right-20 w-80 h-80 opacity-10" />
                  <div className="relative z-10">
                     <span className="ai-badge !bg-white/10 !text-white !border-white/20 mb-6">SEASONAL EVENT</span>
                     <h2 className="text-5xl font-black tracking-tighter leading-none mb-6">The Global Pioneer Hackathon</h2>
                     <p className="text-lg font-medium opacity-80 mb-10 max-w-xl">A 48-hour sprint for ambassadors to pitch and launch campus ecosystems. $5,000 in XP rewards available.</p>
                     <div className="flex gap-6">
                        <button className="bg-white text-indigo-600 px-10 py-5 rounded-3xl text-sm font-black uppercase tracking-widest shadow-2xl">Manage Event</button>
                        <button className="bg-white/10 border border-white/20 px-10 py-5 rounded-3xl text-sm font-black uppercase tracking-widest">Broadcast Alert</button>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <EventItem title="Viral Media Sprint" prize="2.5k XP" status="Live" icon={<Rocket />} />
                  <EventItem title="Strategy Summit" prize="5k XP" status="Opening June 1" icon={<BarChart3 />} />
               </div>
            </div>
          )}

          {activeView === 'verified' && (
             <div className="glass-card rounded-[3.5rem] p-10 overflow-hidden">
                <div className="flex justify-between items-center mb-10">
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Intelligence Field</h2>
                   <div className="flex items-center gap-4 px-6 py-3 bg-slate-50 rounded-2xl">
                      <Search className="w-4 h-4 text-slate-400" />
                      <input type="text" placeholder="Search agents..." className="bg-transparent border-none outline-none text-xs font-black uppercase tracking-widest w-40" />
                   </div>
                </div>
                <table className="w-full">
                   <thead>
                      <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                         <th className="pb-8 px-6">Name</th>
                         <th className="pb-8 px-6">Lvl</th>
                         <th className="pb-8 px-6">Capital Flow</th>
                         <th className="pb-8 px-6">Balance</th>
                         <th className="pb-8 px-6 text-right">Protocol</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {ambassadors.map(amb => (
                         <tr key={amb.uid} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="py-8 px-6">
                               <div className="flex items-center gap-5">
                                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 group-hover:scale-110 transition-transform">
                                     {amb.displayName.charAt(0)}
                                  </div>
                                  <div>
                                     <p className="text-sm font-black text-slate-900 leading-none mb-1.5">{amb.displayName}</p>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{amb.campus}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="py-8 px-6"><span className="text-sm font-bold text-slate-600">{amb.level}</span></td>
                            <td className="py-8 px-6"><span className="text-sm font-bold text-slate-600">${(amb.totalEarned || 0).toLocaleString()}</span></td>
                            <td className="py-8 px-6"><span className="text-sm font-black text-indigo-600">${(amb.earningsBalance || 0).toLocaleString()}</span></td>
                            <td className="py-8 px-6 text-right">
                               <button className="text-[10px] font-black text-slate-400 hover:text-slate-950 uppercase tracking-[0.2em]">Surgical Edit</button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          )}
        </div>

        {/* Sidebar Intelligence */}
        <div className="col-span-12 lg:col-span-4 space-y-10">
          <section className="glass-card p-12 rounded-[3.5rem] bg-indigo-600 text-white relative overflow-hidden group shadow-2xl shadow-indigo-100 border-none">
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-[80px]" />
            <div className="relative z-10">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 mb-10 font-mono italic">Emission Velocity</h3>
              <div className="flex items-end gap-4 mb-10">
                 <span className="text-7xl font-black tracking-tighter leading-none">14.2k</span>
                 <span className="text-[11px] font-black text-white/60 mb-2 uppercase tracking-widest">XP Dist.</span>
              </div>
              <div className="w-full h-2 bg-black/10 rounded-full overflow-hidden mb-10">
                 <div className="h-full bg-white rounded-full w-4/5 shadow-[0_0_20px_rgba(255,255,255,0.6)]"></div>
              </div>
              <p className="text-[11px] font-medium leading-relaxed opacity-70 border-l-2 border-white/20 pl-6">
                "Autonomous analysis recommends increasing the 'Capital Multiplier' for LinkedIn sectors."
              </p>
            </div>
          </section>

          <section className="glass-card p-10 rounded-[3rem]">
             <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10 pb-6 border-b border-slate-50">Global Lead Agents</h3>
             <div className="space-y-8">
                {ambassadors.sort((a,b) => b.xp - a.xp).slice(0, 5).map((amb, i) => (
                   <div key={amb.uid} className="flex justify-between items-center group">
                      <div className="flex items-center gap-5">
                         <span className="text-sm font-black text-slate-200 group-hover:text-indigo-600 transition-colors">0{i+1}</span>
                         <div>
                            <p className="text-sm font-black text-slate-900 mb-1 leading-none">{amb.displayName}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{amb.campus.split(' ')[0]}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-black text-indigo-600 mb-1 leading-none">{amb.xp.toLocaleString()}</p>
                         <span className="ai-badge !bg-slate-900 !text-white !border-none">LVL {amb.level}</span>
                      </div>
                   </div>
                ))}
             </div>
             <button className="w-full mt-12 py-5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">View All Intelligence</button>
          </section>
        </div>
      </div>

      {/* New Campaign Modal */}
      <AnimatePresence>
        {showNewCampaign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-3xl bg-slate-900/60 font-sans">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="bg-white rounded-[4rem] w-full max-w-2xl p-16 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-16 opacity-[0.03] rotate-12">
                 <Target className="w-64 h-64" />
              </div>
              <div className="relative z-10">
                <header className="mb-14 text-center">
                   <div className="ai-badge mb-4 mx-auto !px-4 !py-1.5">Sector Command Interface</div>
                   <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Deploy New Battleground</h2>
                   <p className="text-sm font-medium text-slate-500 max-w-md mx-auto leading-relaxed">The AI engine will automatically synthesize task clusters based on your goal.</p>
                </header>
                
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2 font-mono">Objective Protocol</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Stanford University Takeover Season 2"
                      value={newCampaign.name}
                      onChange={e => setNewCampaign({...newCampaign, name: e.target.value})}
                      className="w-full px-10 py-6 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-[2.5rem] outline-none transition-all font-bold text-lg"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2 font-mono">Mission Success Goal</label>
                    <textarea 
                      placeholder="Define what success looks like for the agents..."
                      value={newCampaign.goal}
                      onChange={e => setNewCampaign({...newCampaign, goal: e.target.value})}
                      className="w-full px-10 py-6 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-[2.5rem] outline-none transition-all font-bold text-base h-40 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2 font-mono">Sector Platform</label>
                       <select 
                        value={newCampaign.platform}
                        onChange={e => setNewCampaign({...newCampaign, platform: e.target.value})}
                        className="w-full px-10 py-6 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-[2.5rem] outline-none transition-all font-bold appearance-none cursor-pointer"
                       >
                         <option>Instagram</option>
                         <option>LinkedIn</option>
                         <option>YouTube</option>
                         <option>X (Twitter)</option>
                         <option>TikTok</option>
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2 font-mono">Cash Reward ($)</label>
                       <input 
                        type="number" 
                        value={newCampaign.monetaryValue}
                        onChange={e => setNewCampaign({...newCampaign, monetaryValue: parseInt(e.target.value)})}
                        className="w-full px-10 py-6 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-[2.5rem] outline-none transition-all font-bold"
                       />
                    </div>
                  </div>
                </div>

                <div className="flex gap-6 mt-14">
                   <button onClick={() => setShowNewCampaign(false)} className="flex-1 py-5 text-sm font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-[0.3em]">Abort Protocol</button>
                   <button 
                     onClick={handleCreateCampaign}
                     className="flex-[2] bg-slate-950 hover:bg-black text-white py-6 rounded-[2.5rem] text-sm font-black shadow-2xl hover:-translate-y-1 transition-all uppercase tracking-[0.3em] flex items-center justify-center gap-3"
                   >
                     Deploy to Field <Rocket className="w-5 h-5 text-indigo-400" />
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

function MetricCard({ icon, label, value, change, trend }: { icon: React.ReactNode, label: string, value: string, change: string, trend: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="glass-card p-10 rounded-[2.5rem] group hover:scale-[1.02] transition-all hover:border-indigo-500/20">
       <div className="flex justify-between items-start mb-8">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-white group-hover:rotate-6 transition-all">{icon}</div>
          <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg border flex items-center gap-1 ${trend === 'up' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-slate-500 bg-slate-50 border-slate-100'}`}>
             {trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
             {change}
          </span>
       </div>
       <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">{label}</p>
       <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{value}</h3>
    </div>
  );
}

function Tab({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-white text-indigo-600 shadow-xl shadow-slate-200 border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
    >
      {label}
    </button>
  );
}

function EventItem({ title, prize, status, icon }: { title: string, prize: string, status: string, icon: React.ReactNode }) {
  return (
    <div className="glass-card p-10 rounded-[3rem] group hover:shadow-2xl hover:shadow-indigo-500/5 transition-all cursor-pointer border border-transparent hover:border-indigo-500/20">
       <div className="w-16 h-16 bg-slate-50 rounded-3xl mb-8 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-12 group-hover:scale-110">
          {icon}
       </div>
       <div className="ai-badge !bg-indigo-50 !text-indigo-600 mb-4">{status}</div>
       <h3 className="text-2xl font-black text-slate-900 mb-2 leading-none tracking-tight">{title}</h3>
       <div className="flex justify-between items-center pt-8 mt-12 border-t border-slate-50">
          <div>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pool Rewards</p>
             <p className="text-xl font-black text-indigo-600">{prize}</p>
          </div>
          <button className="text-[10px] font-black text-slate-400 group-hover:text-slate-950 transition-colors uppercase tracking-[0.2em]">Orchestrate →</button>
       </div>
    </div>
  );
}
