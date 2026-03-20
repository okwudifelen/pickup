"use client";

import React from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JobFilters, JobCategory, JobStatus } from "@/types";
import { cn } from "@/lib/utils";

interface JobFiltersProps {
  filters: JobFilters;
  onFiltersChange: (filters: JobFilters) => void;
  className?: string;
}

const CATEGORIES: { value: JobCategory | ""; label: string }[] = [
  { value: "", label: "All Categories" },
  { value: "tutoring", label: "Tutoring" },
  { value: "moving", label: "Moving" },
  { value: "design", label: "Design" },
  { value: "errands", label: "Errands" },
  { value: "tech", label: "Tech Help" },
  { value: "other", label: "Other" },
];

const STATUSES: { value: JobStatus | ""; label: string }[] = [
  { value: "", label: "All Status" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export function JobFiltersComponent({
  filters,
  onFiltersChange,
  className,
}: JobFiltersProps) {
  const hasActiveFilters =
    filters.category ||
    filters.status ||
    filters.minPay ||
    filters.maxPay ||
    filters.search;

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search jobs..."
          value={filters.search || ""}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          className="pl-9 bg-[#111827] border-white/10 focus:border-purple-500/50 text-white placeholder:text-slate-500"
        />
        {filters.search && (
          <button
            onClick={() => onFiltersChange({ ...filters, search: "" })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1 text-slate-400">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="text-sm">Filters:</span>
        </div>

        <Select
          value={filters.category || ""}
          onValueChange={(val) =>
            onFiltersChange({ ...filters, category: (val === "all-categories" ? "" : val) as JobCategory | "" })
          }
        >
          <SelectTrigger className="w-40 h-8 text-xs bg-[#111827] border-white/10 focus:ring-purple-500/50">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value || "all"} value={cat.value || "all-categories"} className="text-xs">
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status || ""}
          onValueChange={(val) =>
            onFiltersChange({ ...filters, status: (val === "all-status" ? "" : val) as JobStatus | "" })
          }
        >
          <SelectTrigger className="w-36 h-8 text-xs bg-[#111827] border-white/10 focus:ring-purple-500/50">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s.value || "all"} value={s.value || "all-status"} className="text-xs">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Input
            type="number"
            placeholder="Min $"
            value={filters.minPay || ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                minPay: e.target.value ? Number(e.target.value) : "",
              })
            }
            className="w-20 h-8 text-xs bg-[#111827] border-white/10 focus:border-purple-500/50"
          />
          <span className="text-slate-500 text-xs">—</span>
          <Input
            type="number"
            placeholder="Max $"
            value={filters.maxPay || ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                maxPay: e.target.value ? Number(e.target.value) : "",
              })
            }
            className="w-20 h-8 text-xs bg-[#111827] border-white/10 focus:border-purple-500/50"
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 text-xs text-slate-400 hover:text-white gap-1 px-2"
          >
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
