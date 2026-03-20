import React from "react";
import Link from "next/link";
import { Clock, DollarSign, User } from "lucide-react";
import { Job } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { RatingDisplay } from "@/components/RatingStars";
import {
  formatCurrency,
  formatDate,
  getCategoryLabel,
  getCategoryColor,
  getStatusColor,
  getStatusLabel,
  generateAvatarUrl,
  cn,
} from "@/lib/utils";

interface JobCardProps {
  job: Job;
  className?: string;
}

export function JobCard({ job, className }: JobCardProps) {
  const posterName = job.poster?.full_name || "Unknown";
  const avatarUrl =
    job.poster?.avatar_url || generateAvatarUrl(posterName);

  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <Card
        className={cn(
          "bg-[#111827] border-white/10 hover:border-purple-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-0.5",
          className
        )}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-base leading-tight group-hover:text-purple-300 transition-colors line-clamp-2">
                {job.title}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#9945FF]/20 to-[#14F195]/20 border border-purple-500/30 rounded-full px-3 py-1 shrink-0">
              <span className="text-sm font-bold bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent whitespace-nowrap">
                {formatCurrency(job.payment_amount)}
              </span>
            </div>
          </div>

          <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">
            {job.description}
          </p>

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Badge
              className={cn(
                "text-xs border font-medium",
                getCategoryColor(job.category)
              )}
              variant="outline"
            >
              {getCategoryLabel(job.category)}
            </Badge>
            <Badge
              className={cn(
                "text-xs border font-medium",
                getStatusColor(job.status)
              )}
              variant="outline"
            >
              {getStatusLabel(job.status)}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={avatarUrl} alt={posterName} />
                <AvatarFallback className="bg-purple-900/50 text-purple-300 text-xs">
                  {posterName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs text-slate-300 font-medium leading-none">
                  {posterName}
                </p>
                {job.poster && (
                  <RatingDisplay
                    rating={job.poster.rating}
                    size="sm"
                    className="mt-0.5"
                  />
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-500">
              <Clock className="h-3 w-3" />
              <span className="text-xs">{formatDate(job.created_at)}</span>
            </div>
          </div>

          {job.deadline && (
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-1 text-slate-500">
              <DollarSign className="h-3 w-3" />
              <span className="text-xs">
                Due: {new Date(job.deadline).toLocaleDateString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export function JobCardSkeleton() {
  return (
    <Card className="bg-[#111827] border-white/10">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-white/5 rounded animate-pulse w-1/2" />
          </div>
          <div className="h-7 w-24 bg-white/5 rounded-full animate-pulse" />
        </div>
        <div className="space-y-2 mb-4">
          <div className="h-3 bg-white/5 rounded animate-pulse" />
          <div className="h-3 bg-white/5 rounded animate-pulse w-4/5" />
        </div>
        <div className="flex gap-2 mb-4">
          <div className="h-5 w-16 bg-white/5 rounded-full animate-pulse" />
          <div className="h-5 w-16 bg-white/5 rounded-full animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 bg-white/5 rounded-full animate-pulse" />
          <div className="space-y-1">
            <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
            <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
