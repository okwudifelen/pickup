import { createClient } from "@supabase/supabase-js";

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          full_name: string;
          campus_email: string;
          avatar_url: string | null;
          wallet_balance: number;
          fake_wallet_address: string | null;
          rating: number;
          total_jobs_completed: number;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          campus_email: string;
          avatar_url?: string | null;
          wallet_balance?: number;
          fake_wallet_address?: string | null;
          rating?: number;
          total_jobs_completed?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          campus_email?: string;
          avatar_url?: string | null;
          wallet_balance?: number;
          fake_wallet_address?: string | null;
          rating?: number;
          total_jobs_completed?: number;
          created_at?: string;
        };
      };
      jobs: {
        Row: {
          id: string;
          poster_id: string;
          title: string;
          description: string;
          category: string;
          payment_amount: number;
          status: string;
          acceptor_id: string | null;
          escrow_locked: boolean;
          created_at: string;
          deadline: string | null;
        };
        Insert: {
          id?: string;
          poster_id: string;
          title: string;
          description: string;
          category: string;
          payment_amount: number;
          status?: string;
          acceptor_id?: string | null;
          escrow_locked?: boolean;
          created_at?: string;
          deadline?: string | null;
        };
        Update: {
          id?: string;
          poster_id?: string;
          title?: string;
          description?: string;
          category?: string;
          payment_amount?: number;
          status?: string;
          acceptor_id?: string | null;
          escrow_locked?: boolean;
          created_at?: string;
          deadline?: string | null;
        };
      };
      escrow_transactions: {
        Row: {
          id: string;
          job_id: string;
          from_user_id: string;
          to_user_id: string;
          amount: number;
          status: string;
          tx_hash: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          from_user_id: string;
          to_user_id: string;
          amount: number;
          status?: string;
          tx_hash: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          from_user_id?: string;
          to_user_id?: string;
          amount?: number;
          status?: string;
          tx_hash?: string;
          created_at?: string;
        };
      };
      ratings: {
        Row: {
          id: string;
          job_id: string;
          rater_id: string;
          ratee_id: string;
          score: number;
          comment: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          rater_id: string;
          ratee_id: string;
          score: number;
          comment: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          rater_id?: string;
          ratee_id?: string;
          score?: number;
          comment?: string;
          created_at?: string;
        };
      };
      disputes: {
        Row: {
          id: string;
          job_id: string;
          raised_by: string;
          reason: string;
          status: string;
          resolution: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          raised_by: string;
          reason: string;
          status?: string;
          resolution?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          raised_by?: string;
          reason?: string;
          status?: string;
          resolution?: string | null;
          created_at?: string;
        };
      };
    };
  };
};

// Client-side Supabase client (for use in client components)
export const createSupabaseClient = () =>
  createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// Server-side Supabase client (for use in server components and actions)
export const createSupabaseServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
