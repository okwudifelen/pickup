"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase, CheckCircle, Clock, Wallet, ArrowUpRight,
  ArrowDownLeft, Star, Loader2, PlusCircle, TrendingUp, Lock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { WalletWidget } from "@/components/WalletWidget";
import { RatingDisplay } from "@/components/RatingStars";
import { createSupabaseClient } from "@/lib/supabase";
import {
  formatCurrency, formatDate, getCategoryColor, getCategoryLabel,
  getStatusColor, getStatusLabel, generateAvatarUrl, cn
} from "@/lib/utils";
import { Job, EscrowTransaction, Rating, User } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createSupabaseClient();

  const [user, setUser] = useState<User | null>(null);
  const [postedJobs, setPostedJobs] = useState<Job[]>([]);
  const [acceptedJobs, setAcceptedJobs] = useState<Job[]>([]);
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [ratingsReceived, setRatingsReceived] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posted" | "accepted" | "wallet" | "ratings">("posted");

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push("/auth");
        return;
      }

      const [
        { data: userData },
        { data: posted },
        { data: accepted },
        { data: txns },
        { data: ratings },
      ] = await Promise.all([
        supabase.from("users").select("*").eq("id", authUser.id).single(),
        supabase
          .from("jobs")
          .select(`*, poster:users!jobs_poster_id_fkey(id, full_name, avatar_url, rating), acceptor:users!jobs_acceptor_id_fkey(id, full_name, avatar_url, rating)`)
          .eq("poster_id", authUser.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("jobs")
          .select(`*, poster:users!jobs_poster_id_fkey(id, full_name, avatar_url, rating), acceptor:users!jobs_acceptor_id_fkey(id, full_name, avatar_url, rating)`)
          .eq("acceptor_id", authUser.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("escrow_transactions")
          .select(`*, job:jobs(title, payment_amount)`)
          .or(`from_user_id.eq.${authUser.id},to_user_id.eq.${authUser.id}`)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("ratings")
          .select(`*, rater:users!ratings_rater_id_fkey(full_name, avatar_url), job:jobs(title)`)
          .eq("ratee_id", authUser.id)
          .order("created_at", { ascending: false }),
      ]);

      setUser(userData);
      setPostedJobs((posted as unknown as Job[]) || []);
      setAcceptedJobs((accepted as unknown as Job[]) || []);
      setTransactions((txns as unknown as EscrowTransaction[]) || []);
      setRatingsReceived((ratings as unknown as Rating[]) || []);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!user) return null;

  const totalEarned = transactions
    .filter((t) => t.to_user_id === user.id && t.status === "released")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = transactions
    .filter((t) => t.from_user_id === user.id && t.status === "released")
    .reduce((sum, t) => sum + t.amount, 0);

  const tabs = [
    { id: "posted", label: "Posted", icon: Briefcase, count: postedJobs.length },
    { id: "accepted", label: "Accepted", icon: CheckCircle, count: acceptedJobs.length },
    { id: "wallet", label: "Wallet", icon: Wallet, count: transactions.length },
    { id: "ratings", label: "Ratings", icon: Star, count: ratingsReceived.length },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0f0f0f] py-8">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">
              Welcome back, {user.full_name.split(" ")[0]}
            </p>
          </div>
          <Link href="/post">
            <Button variant="solana" size="sm" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Post a Job
            </Button>
          </Link>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Wallet Balance",
              value: formatCurrency(user.wallet_balance),
              icon: Wallet,
              color: "text-[#14F195]",
              bg: "bg-[#14F195]/10",
            },
            {
              label: "Jobs Completed",
              value: user.total_jobs_completed,
              icon: CheckCircle,
              color: "text-green-400",
              bg: "bg-green-500/10",
            },
            {
              label: "Total Earned",
              value: formatCurrency(totalEarned),
              icon: TrendingUp,
              color: "text-blue-400",
              bg: "bg-blue-500/10",
            },
            {
              label: "Your Rating",
              value: user.rating > 0 ? `${user.rating}/5` : "No ratings",
              icon: Star,
              color: "text-yellow-400",
              bg: "bg-yellow-500/10",
            },
          ].map((stat) => (
            <Card key={stat.label} className="bg-[#111827] border-white/10">
              <CardContent className="p-4">
                <div className={cn("inline-flex p-2 rounded-lg mb-3", stat.bg)}>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
                <p className={cn("text-lg font-bold", stat.color)}>{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-[#111827] border border-white/10 rounded-lg mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                      : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={cn(
                      "text-xs rounded-full px-1.5",
                      activeTab === tab.id ? "bg-purple-500/30 text-purple-300" : "bg-white/10 text-slate-400"
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {(activeTab === "posted" || activeTab === "accepted") && (
              <div className="space-y-3">
                {(activeTab === "posted" ? postedJobs : acceptedJobs).length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No jobs yet</p>
                    {activeTab === "posted" && (
                      <Link href="/post" className="mt-3 inline-block">
                        <Button variant="outline" size="sm" className="border-white/10 text-slate-300 gap-2">
                          <PlusCircle className="h-4 w-4" />
                          Post your first job
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  (activeTab === "posted" ? postedJobs : acceptedJobs).map((job) => (
                    <Link key={job.id} href={`/jobs/${job.id}`} className="block">
                      <Card className="bg-[#111827] border-white/10 hover:border-purple-500/30 transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-white text-sm truncate">{job.title}</h3>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <Badge className={cn("text-xs border", getCategoryColor(job.category))} variant="outline">
                                  {getCategoryLabel(job.category)}
                                </Badge>
                                <Badge className={cn("text-xs border", getStatusColor(job.status))} variant="outline">
                                  {getStatusLabel(job.status)}
                                </Badge>
                                {job.escrow_locked && (
                                  <div className="flex items-center gap-1 text-[#9945FF] text-xs">
                                    <Lock className="h-3 w-3" />
                                    <span>Escrowed</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-1">{formatDate(job.created_at)}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">
                                {formatCurrency(job.payment_amount)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                )}
              </div>
            )}

            {activeTab === "wallet" && (
              <div className="space-y-3">
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No transactions yet</p>
                  </div>
                ) : (
                  transactions.map((tx) => {
                    const isSent = tx.from_user_id === user.id;
                    return (
                      <Card key={tx.id} className="bg-[#111827] border-white/10">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-full shrink-0",
                              isSent ? "bg-red-500/10" : "bg-green-500/10"
                            )}>
                              {isSent ? (
                                <ArrowUpRight className="h-4 w-4 text-red-400" />
                              ) : (
                                <ArrowDownLeft className="h-4 w-4 text-green-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-300 truncate">
                                {(tx.job as unknown as {title: string})?.title || "Unknown Job"}
                              </p>
                              <p className="text-xs text-slate-500 font-mono truncate">
                                {tx.tx_hash.slice(0, 16)}...
                              </p>
                              <p className="text-xs text-slate-600">{formatDate(tx.created_at)}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={cn(
                                "text-sm font-bold",
                                isSent ? "text-red-400" : "text-green-400"
                              )}>
                                {isSent ? "-" : "+"}{formatCurrency(tx.amount)}
                              </p>
                              <Badge
                                className={cn(
                                  "text-xs border mt-1",
                                  tx.status === "released"
                                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                                    : tx.status === "locked"
                                    ? "bg-[#9945FF]/20 text-purple-400 border-purple-500/30"
                                    : "bg-red-500/20 text-red-400 border-red-500/30"
                                )}
                                variant="outline"
                              >
                                {tx.status}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === "ratings" && (
              <div className="space-y-3">
                {ratingsReceived.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No ratings yet</p>
                    <p className="text-slate-600 text-xs mt-1">Complete jobs to receive ratings</p>
                  </div>
                ) : (
                  ratingsReceived.map((rating) => (
                    <Card key={rating.id} className="bg-[#111827] border-white/10">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage
                              src={rating.rater?.avatar_url || generateAvatarUrl(rating.rater?.full_name || "")}
                            />
                            <AvatarFallback className="bg-purple-900/50 text-xs text-purple-300">
                              {rating.rater?.full_name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-slate-300">
                                {rating.rater?.full_name || "Anonymous"}
                              </span>
                              <RatingDisplay rating={rating.score} size="sm" />
                            </div>
                            <p className="text-xs text-slate-500 mb-1">
                              For: {(rating.job as unknown as {title: string})?.title}
                            </p>
                            {rating.comment && (
                              <p className="text-xs text-slate-400">{rating.comment}</p>
                            )}
                            <p className="text-xs text-slate-600 mt-1">{formatDate(rating.created_at)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Wallet */}
          <div className="space-y-4">
            <WalletWidget user={user} />

            <Card className="bg-[#111827] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-white">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total Earned</span>
                  <span className="text-green-400 font-medium">{formatCurrency(totalEarned)}</span>
                </div>
                <Separator className="bg-white/5" />
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total Spent</span>
                  <span className="text-red-400 font-medium">{formatCurrency(totalSpent)}</span>
                </div>
                <Separator className="bg-white/5" />
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Active Posted</span>
                  <span className="text-white font-medium">
                    {postedJobs.filter((j) => ["open", "in_progress"].includes(j.status)).length}
                  </span>
                </div>
                <Separator className="bg-white/5" />
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Active Accepted</span>
                  <span className="text-white font-medium">
                    {acceptedJobs.filter((j) => j.status === "in_progress").length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
