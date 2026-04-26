export type UserRole = 'admin' | 'ambassador';
export type UserStatus = 'active' | 'dropping' | 'at_risk';
export type TaskStatus = 'pending' | 'submitted' | 'approved' | 'rejected';
export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'rejected';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  campus?: string;
  xp: number;
  level: number;
  streak: number;
  intelligenceScore: number;
  status: UserStatus;
  badges: string[];
  avatarUrl?: string;
  earningsBalance: number; // Balance available to withdraw
  totalEarned: number;     // Life-time earnings
  totalPaid: number;       // Life-time paid out
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  goal: string;
  platform: string;
  adminId: string;
  rewardValue: number; // Default monetary reward
  status: 'draft' | 'active' | 'completed';
  createdAt: string;
}

export interface Task {
  id: string;
  campaignId: string;
  ambassadorId: string;
  title: string;
  description: string;
  xpValue: number;
  monetaryValue: number; // Cash reward for this task
  status: TaskStatus;
  proofUrl?: string;
  aiFeedback?: string;
  aiConfidence?: number;
  submittedAt?: string;
  createdAt: string;
}

export interface PayoutRequest {
  id: string;
  ambassadorId: string;
  amount: number;
  status: PayoutStatus;
  paymentMethod: string;
  requestedAt: string;
  processedAt?: string;
  transactionId?: string;
}
