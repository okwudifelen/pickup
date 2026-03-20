"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Clock, DollarSign, Calendar, CheckCircle,
  AlertCircle, MessageSquare, User, Lock, Loader2, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { EscrowModal } from "@/components/EscrowModal";
import { JobStatusTimeline } from "@/components/JobStatusTimeline";
import { RatingStars, RatingDisplay } from "@/components/RatingStars";
import { createSupabaseClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { markJobComplete, raiseDispute, submitRating } from "@/lib/actions";
import {
  formatCurrency, formatDate, formatDeadline, getCategoryColor,
  getCategoryLabel, getStatusColor, getStatusLabel, generateAvatarUrl, cn
} from "@/lib/utils";
import { Job, User as UserType, Rating } from "@/types";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createSupabaseClient();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [escrowModalOpen, setEscrowModalOpen] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [completingJob, setCompletingJob] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  const fetchData = async () => {
    const [{ data: authUser }, { data: jobData }] = await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from("jobs")
        .select(`
          *,
          poster:users!jobs_poster_id_fkey(id, full_name, avatar_url, rating, total_jobs_completed, campus_email, wallet_balance),
          acceptor:users!jobs_acceptor_id_fkey(id, full_name, avatar_url, rating, total_jobs_completed, campus_email, wallet_balance)
        `)
        .eq("id", jobId)
        .single(),
    ]);

    if (jobData) setJob(jobData as unknown as Job);
    else { router.push("/"); return; }

    if (authUser.user) {
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.user.id)
        .single();
      setCurrentUser(userData as unknown as UserType | null);

      // Check if user has already rated
      if (jobData.status === "completed") {
        const { data: existingRating } = await supabase
          .from("ratings")
          .select("id")
          .eq("job_id", jobId)
          .eq("rater_id", authUser.user.id)
          .single();
        setHasRated(!!existingRating);
      }
    }

    // Fetch ratings
    const { data: ratingsData } = await supabase
      .from("ratings")
      .select(`*, rater:users!ratings_rater_id_fkey(full_name, avatar_url)`)
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });

    if (ratingsData) setRatings(ratingsData as unknown as Rating[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Realtime
    const channel = supabase
      .channel(`job-${jobId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs", filter: `id=eq.${jobId}` }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [jobId]);

  const handleMarkComplete = async () => {
    if (!job) return;
    setCompletingJob(true);
    const result = await markJobComplete(job.id);
    if (result.success && result.data) {
      toast({
        title: "Job Completed!",
        description: `${formatCurrency(job.payment_amount)} released to worker. TX: ${result.data.txHash.slice(0, 12)}...`,
      });
      await fetchData();
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
    setCompletingJob(false);
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) return;
    setDisputeLoading(true);
    const result = await raiseDispute(jobId, disputeReason);
    if (result.success) {
      toast({ variant: "destructive", title: "Dispute Raised", description: "Our team will review this shortly." });
      setDisputeModalOpen(false);
      setDisputeReason("");
      await fetchData();
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
    setDisputeLoading(false);
  };

  const handleSubmitRating = async () => {
    if (!job || !currentUser) return;
    const rateeId = currentUser.id === job.poster_id ? job.acceptor_id : job.poster_id;
    if (!rateeId) return;

    setRatingLoading(true);
    const result = await submitRating({
      jobId: job.id,
      rateeId,
      score: ratingScore,
      comment: ratingComment,
    });
    if (result.success) {
      toast({ title: "Rating Submitted", description: "Thanks for your feedback!" });
      setRatingModalOpen(false);
      setHasRated(true);
      await fetchData();
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
    setRatingLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!job) return null;

  const isOwner = currentUser?.id === job.poster_id;
  const isAcceptor = currentUser?.id === job.acceptor_id;
  const isInvolved = isOwner || isAcceptor;
  const canAccept = currentUser && job.status === "open" && !isOwner;
  const canComplete = isOwner && job.status === "in_progress";
  const canDispute = isInvolved && job.status === "in_progress";
  const canRate = isInvolved && job.status === "completed" && !hasRated;

  const posterName = job.poster?.full_name || "Unknown";
  const acceptorName = job.acceptor?.full_name || "Unknown";

  return (
    <div className="min-h-screen bg-[#0f0f0f] py-8">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Back button */}
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back to listings
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job header card */}
            <Card className="bg-[#111827] border-white/10">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h1 className="text-xl font-bold text-white mb-2">{job.title}</h1>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={cn("text-xs border", getCategoryColor(job.category))} variant="outline">
                        {getCategoryLabel(job.category)}
                      </Badge>
                      <Badge className={cn("text-xs border", getStatusColor(job.status))} variant="outline">
                        {getStatusLabel(job.status)}
                      </Badge>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-[#9945FF]/20 to-[#14F195]/20 border border-purple-500/30 rounded-xl px-4 py-2 text-center shrink-0">
                    <p className="text-xs text-slate-400">Payment</p>
                    <p className="text-lg font-bold bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">
                      {formatCurrency(job.payment_amount)}
                    </p>
                  </div>
                </div>

                <Separator className="bg-white/5 mb-4" />

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>Posted {formatDate(job.created_at)}</span>
                  </div>
                  {job.deadline && (
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span>Deadline: {formatDeadline(job.deadline)}</span>
                    </div>
                  )}
                  {job.escrow_locked && (
                    <div className="flex items-center gap-2 text-[#9945FF] text-sm">
                      <Lock className="h-4 w-4 shrink-0" />
                      <span>Payment locked in escrow</span>
                    </div>
                  )}
                </div>

                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </p>
              </CardContent>
            </Card>

            {/* Action buttons */}
            {currentUser && (
              <div className="flex flex-wrap gap-3">
                {canAccept && (
                  <Button
                    variant="solana"
                    className="gap-2"
                    onClick={() => setEscrowModalOpen(true)}
                  >
                    <Lock className="h-4 w-4" />
                    Accept Job & Lock Escrow
                  </Button>
                )}
                {canComplete && (
                  <Button
                    onClick={handleMarkComplete}
                    disabled={completingJob}
                    className="gap-2 bg-green-600 hover:bg-green-500 text-white"
                  >
                    {completingJob ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Mark as Complete
                  </Button>
                )}
                {canDispute && (
                  <Button
                    variant="outline"
                    className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={() => setDisputeModalOpen(true)}
                  >
                    <AlertCircle className="h-4 w-4" />
                    Raise Dispute
                  </Button>
                )}
                {canRate && (
                  <Button
                    variant="outline"
                    className="gap-2 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                    onClick={() => setRatingModalOpen(true)}
                  >
                    <Star className="h-4 w-4" />
                    Leave a Rating
                  </Button>
                )}
              </div>
            )}

            {!currentUser && job.status === "open" && (
              <Link href="/auth">
                <Button variant="solana" className="gap-2">
                  Sign in to Accept Job
                </Button>
              </Link>
            )}

            {/* Ratings section */}
            {ratings.length > 0 && (
              <Card className="bg-[#111827] border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-400" />
                    Reviews ({ratings.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ratings.map((rating) => (
                    <div key={rating.id} className="flex gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage
                          src={rating.rater?.avatar_url || generateAvatarUrl(rating.rater?.full_name || "")}
                          alt={rating.rater?.full_name}
                        />
                        <AvatarFallback className="bg-purple-900/50 text-xs text-purple-300">
                          {rating.rater?.full_name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-slate-300">
                            {rating.rater?.full_name || "Anonymous"}
                          </span>
                          <RatingStars rating={rating.score} size="sm" />
                        </div>
                        {rating.comment && (
                          <p className="text-xs text-slate-400">{rating.comment}</p>
                        )}
                        <p className="text-xs text-slate-600 mt-1">{formatDate(rating.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Status timeline */}
            <Card className="bg-[#111827] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-white">Job Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <JobStatusTimeline currentStatus={job.status} />
              </CardContent>
            </Card>

            {/* Poster card */}
            <Card className="bg-[#111827] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-white">Posted By</CardTitle>
              </CardHeader>
              <CardContent>
                {job.poster && (
                  <Link href={`/profile/${job.poster.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={job.poster.avatar_url || generateAvatarUrl(posterName)}
                        alt={posterName}
                      />
                      <AvatarFallback className="bg-purple-900/50 text-purple-300 text-sm">
                        {posterName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-white">{posterName}</p>
                      <RatingDisplay rating={job.poster.rating} size="sm" />
                      <p className="text-xs text-slate-500 mt-0.5">
                        {job.poster.total_jobs_completed} jobs completed
                      </p>
                    </div>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Acceptor card (if in progress/completed) */}
            {job.acceptor && (
              <Card className="bg-[#111827] border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-white">Working On This</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link href={`/profile/${job.acceptor.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={job.acceptor.avatar_url || generateAvatarUrl(acceptorName)}
                        alt={acceptorName}
                      />
                      <AvatarFallback className="bg-green-900/50 text-green-300 text-sm">
                        {acceptorName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-white">{acceptorName}</p>
                      <RatingDisplay rating={job.acceptor.rating} size="sm" />
                      <p className="text-xs text-slate-500 mt-0.5">
                        {job.acceptor.total_jobs_completed} jobs completed
                      </p>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Escrow Modal */}
      {currentUser && (
        <EscrowModal
          job={job}
          currentUser={currentUser}
          open={escrowModalOpen}
          onOpenChange={setEscrowModalOpen}
          onSuccess={async (txHash) => {
            await fetchData();
          }}
        />
      )}

      {/* Dispute Modal */}
      <Dialog open={disputeModalOpen} onOpenChange={setDisputeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              Raise a Dispute
            </DialogTitle>
            <DialogDescription>
              Explain the issue. Funds will remain in escrow until resolved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-slate-300">Reason for Dispute</Label>
            <Textarea
              placeholder="Describe what went wrong..."
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              className="bg-[#0f0f0f] border-white/10 focus:border-red-500/50 text-white placeholder:text-slate-600 min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeModalOpen(false)} className="border-white/10">
              Cancel
            </Button>
            <Button
              onClick={handleDispute}
              disabled={!disputeReason.trim() || disputeLoading}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              {disputeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Dispute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rating Modal */}
      <Dialog open={ratingModalOpen} onOpenChange={setRatingModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400" />
              Leave a Rating
            </DialogTitle>
            <DialogDescription>
              Rate your experience with this job
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center gap-3 py-2">
              <RatingStars
                rating={ratingScore}
                interactive
                size="lg"
                onRatingChange={setRatingScore}
              />
              <span className="text-sm text-slate-400">
                {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][ratingScore]}
              </span>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Comment (optional)</Label>
              <Textarea
                placeholder="Share your experience..."
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                className="bg-[#0f0f0f] border-white/10 focus:border-yellow-500/50 text-white placeholder:text-slate-600"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRatingModalOpen(false)} className="border-white/10">
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRating}
              disabled={ratingLoading}
              className="bg-yellow-600 hover:bg-yellow-500 text-white"
            >
              {ratingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Rating"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
