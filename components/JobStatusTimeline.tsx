import React from "react";
import { CheckCircle, Circle, Clock, AlertCircle, XCircle } from "lucide-react";
import { JobStatus } from "@/types";
import { cn } from "@/lib/utils";

interface TimelineStep {
  status: JobStatus;
  label: string;
  description: string;
}

const TIMELINE_STEPS: TimelineStep[] = [
  {
    status: "open",
    label: "Job Posted",
    description: "Waiting for someone to accept",
  },
  {
    status: "in_progress",
    label: "In Progress",
    description: "Job accepted, funds in escrow",
  },
  {
    status: "completed",
    label: "Completed",
    description: "Job done, payment released",
  },
];

interface JobStatusTimelineProps {
  currentStatus: JobStatus;
  className?: string;
}

export function JobStatusTimeline({
  currentStatus,
  className,
}: JobStatusTimelineProps) {
  const isDisputed = currentStatus === "disputed";
  const isCancelled = currentStatus === "cancelled";

  const getStepIndex = (status: JobStatus): number => {
    if (status === "open") return 0;
    if (status === "in_progress") return 1;
    if (status === "completed") return 2;
    if (status === "disputed") return 1;
    return -1;
  };

  const currentStepIndex = getStepIndex(currentStatus);

  if (isCancelled) {
    return (
      <div className={cn("flex items-center gap-3 p-4 bg-slate-500/10 border border-slate-500/20 rounded-lg", className)}>
        <XCircle className="h-5 w-5 text-slate-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-slate-300">Job Cancelled</p>
          <p className="text-xs text-slate-500">This job has been cancelled</p>
        </div>
      </div>
    );
  }

  if (isDisputed) {
    return (
      <div className={cn("flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg", className)}>
        <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-red-300">Under Dispute</p>
          <p className="text-xs text-red-400/70">A dispute has been raised for this job. Funds are held in escrow pending resolution.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div className="space-y-0">
        {TIMELINE_STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isUpcoming = index > currentStepIndex;

          return (
            <div key={step.status} className="flex gap-4">
              {/* Line and icon column */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 z-10",
                    isCompleted
                      ? "border-[#14F195] bg-[#14F195]/20"
                      : isCurrent
                      ? "border-[#9945FF] bg-[#9945FF]/20"
                      : "border-white/10 bg-white/5"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4 text-[#14F195]" />
                  ) : isCurrent ? (
                    <div className="h-3 w-3 rounded-full bg-[#9945FF] animate-pulse" />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-600" />
                  )}
                </div>
                {index < TIMELINE_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-0.5 flex-1 my-1",
                      isCompleted ? "bg-[#14F195]/40" : "bg-white/10"
                    )}
                    style={{ minHeight: "24px" }}
                  />
                )}
              </div>

              {/* Content column */}
              <div className={cn("pb-6", index === TIMELINE_STEPS.length - 1 && "pb-0")}>
                <p
                  className={cn(
                    "text-sm font-medium leading-8",
                    isCompleted
                      ? "text-[#14F195]"
                      : isCurrent
                      ? "text-white"
                      : "text-slate-500"
                  )}
                >
                  {step.label}
                </p>
                <p
                  className={cn(
                    "text-xs -mt-1",
                    isCompleted || isCurrent ? "text-slate-400" : "text-slate-600"
                  )}
                >
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
