export type JobCategory =
  | "tutoring"
  | "moving"
  | "design"
  | "errands"
  | "tech"
  | "other";

export type JobStatus =
  | "open"
  | "in_progress"
  | "completed"
  | "disputed"
  | "cancelled";

export type EscrowStatus = "locked" | "released" | "refunded" | "disputed";

export type DisputeStatus = "open" | "resolved";

export interface User {
  id: string;
  full_name: string;
  campus_email: string;
  avatar_url: string | null;
  wallet_balance: number;
  fake_wallet_address: string | null;
  rating: number;
  total_jobs_completed: number;
  created_at: string;
}

export interface Job {
  id: string;
  poster_id: string;
  title: string;
  description: string;
  category: JobCategory;
  payment_amount: number;
  status: JobStatus;
  acceptor_id: string | null;
  escrow_locked: boolean;
  created_at: string;
  deadline: string | null;
  poster?: User;
  acceptor?: User;
}

export interface EscrowTransaction {
  id: string;
  job_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  status: EscrowStatus;
  tx_hash: string;
  created_at: string;
  job?: Job;
}

export interface Rating {
  id: string;
  job_id: string;
  rater_id: string;
  ratee_id: string;
  score: number;
  comment: string;
  created_at: string;
  rater?: User;
  job?: Job;
}

export interface Dispute {
  id: string;
  job_id: string;
  raised_by: string;
  reason: string;
  status: DisputeStatus;
  resolution: string | null;
  created_at: string;
  job?: Job;
}

export interface JobFilters {
  category?: string;
  minPay?: number | "";
  maxPay?: number | "";
  status?: string;
  search?: string;
}

export interface FakeWallet {
  address: string;
  balance: number;
  network: string;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
