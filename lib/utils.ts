import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { JobCategory, JobStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `${amount.toFixed(2)} USDC`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } else if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return "Just now";
  }
}

export function formatDeadline(dateString: string | null): string {
  if (!dateString) return "No deadline";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncateAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function getCategoryLabel(category: JobCategory): string {
  const labels: Record<JobCategory, string> = {
    tutoring: "Tutoring",
    moving: "Moving",
    design: "Design",
    errands: "Errands",
    tech: "Tech Help",
    other: "Other",
  };
  return labels[category] || category;
}

export function getCategoryColor(category: JobCategory): string {
  const colors: Record<JobCategory, string> = {
    tutoring: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    moving: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    design: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    errands: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    tech: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    other: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };
  return colors[category] || colors.other;
}

export function getStatusColor(status: JobStatus): string {
  const colors: Record<JobStatus, string> = {
    open: "bg-green-500/20 text-green-400 border-green-500/30",
    in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    completed: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    disputed: "bg-red-500/20 text-red-400 border-red-500/30",
    cancelled: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };
  return colors[status] || colors.cancelled;
}

export function getStatusLabel(status: JobStatus): string {
  const labels: Record<JobStatus, string> = {
    open: "Open",
    in_progress: "In Progress",
    completed: "Completed",
    disputed: "Disputed",
    cancelled: "Cancelled",
  };
  return labels[status] || status;
}

export function isValidCampusEmail(email: string): boolean {
  return email.endsWith(".edu") || email.endsWith(".ac.uk");
}

export function generateAvatarUrl(name: string): string {
  const seed = encodeURIComponent(name);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
}
