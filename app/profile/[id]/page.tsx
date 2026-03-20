"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Briefcase, CheckCircle, Star, Calendar,
  Mail, Wallet, Loader2, User
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { JobCard } from "@/components/JobCard";
import { RatingDisplay, RatingStars } from "@/components/RatingStars";
import { createSupabaseClient } from "@/lib/supabase";
import {
  formatDate, formatCurrency, getCategoryColor, getCategoryLabel,
  generateAvatarUrl, cn
} from "@/lib/utils";
import { User as UserType, Job, Rating } from "@/types";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createSupabaseClient();
  const profileId = params.id as string;

  const [profile, setProfile] = useState<UserType | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"jobs" | "reviews">("reviews");

  useEffect(() => {
    const fetchData = async () => {
      const [
        { data: authUser },
        { data: profileData },
      ] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("users").select("*").eq("id", profileId).single(),
      ]);

      if (!profileData) {
        router.push("/");
        return;
      }
      setProfile(profileData);

      if (authUser.user) {
        const { data: currentUserData } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.user.id)
          .single();
        setCurrentUser(currentUserData);
      }

      const [{ data: jobsData }, { data: ratingsData }] = await Promise.all([
        supabase
          .from("jobs")
          .select(`*, poster:users!jobs_poster_id_fkey(id, full_name, avatar_url, rating)`)
          .or(`poster_id.eq.${profileId},acceptor_id.eq.${profileId}`)
          .eq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("ratings")
          .select(`*, rater:users!ratings_rater_id_fkey(full_name, avatar_url), job:jobs(title)`)
          .eq("ratee_id", profileId)
          .order("created_at", { ascending: false }),
      ]);

      setCompletedJobs((jobsData as unknown as Job[]) || []);
      setRatings((ratingsData as unknown as Rating[]) || []);
      setLoading(false);
    };

    fetchData();
  }, [profileId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!profile) return null;

  const isOwnProfile = currentUser?.id === profile.id;
  const avatarUrl = profile.avatar_url || generateAvatarUrl(profile.full_name);
  const joinDate = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const ratingDistribution = [5, 4, 3, 2, 1].map((score) => ({
    score,
    count: ratings.filter((r) => r.score === score).length,
  }));

  return (
    <div className="min-h-screen bg-[#0f0f0f] py-8">
      <div className="container max-w-5xl mx-auto px-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile sidebar */}
          <div className="space-y-4">
            {/* Profile card */}
            <Card className="bg-[#111827] border-white/10 overflow-hidden">
              {/* Banner */}
              <div className="h-20 bg-gradient-to-r from-[#9945FF] to-[#14F195] opacity-30" />

              <CardContent className="p-5 -mt-10">
                <Avatar className="h-20 w-20 border-4 border-[#111827] mb-3">
                  <AvatarImage src={avatarUrl} alt={profile.full_name} />
                  <AvatarFallback className="bg-purple-900/50 text-purple-300 text-xl">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <h1 className="text-lg font-bold text-white">{profile.full_name}</h1>

                <div className="flex items-center gap-2 mt-2 mb-3">
                  <RatingDisplay
                    rating={profile.rating}
                    reviewCount={ratings.length}
                    size="sm"
                  />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate text-xs">{profile.campus_email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-xs">Joined {joinDate}</span>
                  </div>
                </div>

                {isOwnProfile && (
                  <Link href="/dashboard" className="mt-4 block">
                    <Badge className="w-full justify-center py-1.5 bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30 cursor-pointer transition-colors">
                      View Dashboard
                    </Badge>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Stats card */}
            <Card className="bg-[#111827] border-white/10">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-slate-400">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm">Jobs Completed</span>
                  </div>
                  <span className="text-white font-semibold">{profile.total_jobs_completed}</span>
                </div>
                <Separator className="bg-white/5" />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm">Average Rating</span>
                  </div>
                  <span className="text-white font-semibold">
                    {profile.rating > 0 ? profile.rating.toFixed(1) : "—"}
                  </span>
                </div>
                <Separator className="bg-white/5" />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Briefcase className="h-4 w-4 text-blue-400" />
                    <span className="text-sm">Reviews</span>
                  </div>
                  <span className="text-white font-semibold">{ratings.length}</span>
                </div>
              </CardContent>
            </Card>

            {/* Rating distribution */}
            {ratings.length > 0 && (
              <Card className="bg-[#111827] border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white">Rating Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {ratingDistribution.map(({ score, count }) => (
                    <div key={score} className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-4">{score}</span>
                      <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 shrink-0" />
                      <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#9945FF] to-[#14F195] rounded-full transition-all"
                          style={{ width: ratings.length > 0 ? `${(count / ratings.length) * 100}%` : "0%" }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-4 text-right">{count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-[#111827] border border-white/10 rounded-lg mb-6">
              {[
                { id: "reviews", label: "Reviews", icon: Star, count: ratings.length },
                { id: "jobs", label: "Completed Jobs", icon: Briefcase, count: completedJobs.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as "jobs" | "reviews")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                      : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
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

            {activeTab === "reviews" && (
              <div className="space-y-3">
                {ratings.length === 0 ? (
                  <div className="text-center py-16">
                    <Star className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No reviews yet</p>
                    <p className="text-slate-600 text-xs mt-1">
                      {isOwnProfile ? "Complete jobs to receive reviews" : "This user hasn't received any reviews yet"}
                    </p>
                  </div>
                ) : (
                  ratings.map((rating) => (
                    <Card key={rating.id} className="bg-[#111827] border-white/10">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <Avatar className="h-9 w-9 shrink-0">
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
                              <RatingStars rating={rating.score} size="sm" />
                            </div>
                            <p className="text-xs text-slate-500 mb-2">
                              {(rating.job as unknown as {title: string})?.title}
                            </p>
                            {rating.comment && (
                              <p className="text-sm text-slate-300 leading-relaxed">{rating.comment}</p>
                            )}
                            <p className="text-xs text-slate-600 mt-2">{formatDate(rating.created_at)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {activeTab === "jobs" && (
              <div>
                {completedJobs.length === 0 ? (
                  <div className="text-center py-16">
                    <Briefcase className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No completed jobs yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {completedJobs.map((job) => (
                      <JobCard key={job.id} job={job} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
