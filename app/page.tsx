"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PlusCircle, Zap, Shield, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobCard, JobCardSkeleton } from "@/components/JobCard";
import { JobFiltersComponent } from "@/components/JobFilters";
import { createSupabaseClient } from "@/lib/supabase";
import { Job, JobFilters } from "@/types";

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<JobFilters>({});
  const supabase = createSupabaseClient();

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("jobs")
        .select(
          `
          *,
          poster:users!jobs_poster_id_fkey(id, full_name, avatar_url, rating, campus_email)
        `
        )
        .order("created_at", { ascending: false });

      if (filters.category && filters.category !== "all-categories" && filters.category !== "") {
        query = query.eq("category", filters.category);
      }
      if (filters.status && filters.status !== "all-status" && filters.status !== "") {
        query = query.eq("status", filters.status);
      } else {
        // Default: exclude cancelled jobs
        query = query.in("status", ["open", "in_progress", "completed", "disputed"]);
      }
      if (filters.minPay) {
        query = query.gte("payment_amount", filters.minPay);
      }
      if (filters.maxPay) {
        query = query.lte("payment_amount", filters.maxPay);
      }
      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query.limit(50);

      if (!error && data) {
        setJobs(data as unknown as Job[]);
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("jobs-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs" },
        () => {
          fetchJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchJobs]);

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Hero section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#9945FF]/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-[#14F195]/8 rounded-full blur-[80px]" />
        </div>

        <div className="container max-w-7xl mx-auto px-4 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[#9945FF]/10 border border-purple-500/20 rounded-full px-4 py-1.5 mb-6">
              <Zap className="h-3.5 w-3.5 text-[#14F195]" />
              <span className="text-xs text-slate-300 font-medium">
                Powered by Solana · Secured by Escrow
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
              Campus Jobs,{" "}
              <span className="bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">
                Instantly Paid
              </span>
            </h1>

            <p className="text-slate-400 text-lg md:text-xl mb-8 leading-relaxed">
              Find micro-jobs on campus. Get paid in USDC with blockchain escrow
              protection. No disputes, no delays.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/post">
                <Button variant="solana" size="lg" className="gap-2 text-base px-6">
                  <PlusCircle className="h-5 w-5" />
                  Post a Job
                </Button>
              </Link>
              <Link href="#jobs">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/10 text-slate-300 hover:text-white hover:border-white/30 gap-2 text-base px-6"
                >
                  Browse Jobs
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6 max-w-md mx-auto">
              {[
                { label: "Active Jobs", value: jobs.filter((j) => j.status === "open").length.toString() },
                { label: "Secured by Escrow", value: "100%" },
                { label: "Network", value: "Solana" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl font-bold bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features strip */}
      <div className="border-y border-white/5 bg-[#111827]/50">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-center gap-8">
            {[
              { icon: Shield, text: "Escrow Protected", color: "text-[#9945FF]" },
              { icon: Zap, text: "Instant Settlement", color: "text-[#14F195]" },
              { icon: Star, text: "Verified Students", color: "text-yellow-400" },
            ].map(({ icon: Icon, text, color }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${color}`} />
                <span className="text-sm text-slate-400">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Jobs section */}
      <section id="jobs" className="py-12">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">
              Available Jobs
              {!loading && (
                <span className="ml-2 text-sm font-normal text-slate-400">
                  ({jobs.length} found)
                </span>
              )}
            </h2>
            <Link href="/post">
              <Button variant="outline" size="sm" className="gap-2 border-white/10 text-slate-300 hover:text-white">
                <PlusCircle className="h-4 w-4" />
                Post Job
              </Button>
            </Link>
          </div>

          <JobFiltersComponent
            filters={filters}
            onFiltersChange={setFilters}
            className="mb-8"
          />

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold text-slate-300 mb-2">
                No jobs found
              </h3>
              <p className="text-slate-500 mb-6">
                {Object.keys(filters).some((k) => (filters as Record<string, unknown>)[k])
                  ? "Try adjusting your filters"
                  : "Be the first to post a job!"}
              </p>
              <Link href="/post">
                <Button variant="solana" className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Post a Job
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
