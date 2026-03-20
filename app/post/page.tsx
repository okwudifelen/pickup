"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PlusCircle, FileText, DollarSign, Calendar, Tag,
  Eye, EyeOff, AlertCircle, Loader2, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createJob } from "@/lib/actions";
import { createSupabaseClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import {
  getCategoryColor, getCategoryLabel, formatCurrency, cn,
} from "@/lib/utils";
import { JobCategory, User } from "@/types";

const CATEGORIES: { value: JobCategory; label: string; emoji: string }[] = [
  { value: "tutoring", label: "Tutoring", emoji: "📚" },
  { value: "moving", label: "Moving", emoji: "📦" },
  { value: "design", label: "Design", emoji: "🎨" },
  { value: "errands", label: "Errands", emoji: "🏃" },
  { value: "tech", label: "Tech Help", emoji: "💻" },
  { value: "other", label: "Other", emoji: "✨" },
];

export default function PostJobPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createSupabaseClient();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "" as JobCategory | "",
    payment_amount: "",
    deadline: "",
  });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push("/auth");
        return;
      }
      const { data } = await supabase.from("users").select("*").eq("id", authUser.id).single();
      setUser(data as unknown as User | null);
    };
    fetchUser();
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const insufficientFunds =
    user && formData.payment_amount
      ? user.wallet_balance < Number(formData.payment_amount)
      : false;

  const isFormValid =
    formData.title.trim() &&
    formData.description.trim() &&
    formData.category &&
    formData.payment_amount &&
    Number(formData.payment_amount) > 0 &&
    !insufficientFunds;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !user) return;

    setLoading(true);
    try {
      const result = await createJob({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category as JobCategory,
        payment_amount: Number(formData.payment_amount),
        deadline: formData.deadline || null,
      });

      if (result.success && result.data) {
        toast({
          title: "Job Posted!",
          description: "Your job is now live on Pickup",
        });
        router.push(`/jobs/${result.data.id}`);
      } else {
        toast({
          variant: "destructive",
          title: "Failed to Post Job",
          description: result.error,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] py-8">
      <div className="container max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Post a Job</h1>
          <p className="text-slate-400 text-sm">
            Describe what you need done and how much you&apos;re willing to pay
          </p>
        </div>

        {/* Balance warning */}
        {user && (
          <div className="mb-6 p-3 bg-[#111827] border border-white/10 rounded-lg flex items-center justify-between">
            <span className="text-sm text-slate-400">Your Balance</span>
            <span
              className={cn(
                "text-sm font-bold",
                insufficientFunds ? "text-red-400" : "text-[#14F195]"
              )}
            >
              {formatCurrency(user.wallet_balance)}
            </span>
          </div>
        )}

        <div className="grid gap-6">
          {/* Form */}
          <Card className="bg-[#111827] border-white/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-400" />
                Job Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-slate-300">
                    Job Title <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Help me move furniture this weekend"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    className="bg-[#0f0f0f] border-white/10 focus:border-purple-500/50 text-white placeholder:text-slate-600"
                    maxLength={100}
                    required
                  />
                  <p className="text-xs text-slate-500 text-right">
                    {formData.title.length}/100
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-slate-300">
                    Description <span className="text-red-400">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what needs to be done, any requirements, location, etc."
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    className="bg-[#0f0f0f] border-white/10 focus:border-purple-500/50 text-white placeholder:text-slate-600 min-h-[120px] resize-none"
                    maxLength={1000}
                    required
                  />
                  <p className="text-xs text-slate-500 text-right">
                    {formData.description.length}/1000
                  </p>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label className="text-slate-300">
                    Category <span className="text-red-400">*</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => handleChange("category", cat.value)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all",
                          formData.category === cat.value
                            ? "border-purple-500/60 bg-purple-500/10 text-purple-300"
                            : "border-white/10 bg-[#0f0f0f] text-slate-400 hover:border-white/20 hover:text-slate-300"
                        )}
                      >
                        <span className="text-xl">{cat.emoji}</span>
                        <span className="text-xs font-medium">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment */}
                <div className="space-y-2">
                  <Label htmlFor="payment" className="text-slate-300">
                    Payment Amount (USDC) <span className="text-red-400">*</span>
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      id="payment"
                      type="number"
                      placeholder="0.00"
                      value={formData.payment_amount}
                      onChange={(e) => handleChange("payment_amount", e.target.value)}
                      className={cn(
                        "pl-9 bg-[#0f0f0f] border-white/10 focus:border-purple-500/50 text-white placeholder:text-slate-600",
                        insufficientFunds && "border-red-500/50 focus:border-red-500/50"
                      )}
                      min="1"
                      max="10000"
                      step="0.01"
                      required
                    />
                  </div>
                  {insufficientFunds && (
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <p className="text-xs">
                        Insufficient balance. You have {formatCurrency(user.wallet_balance)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Deadline (optional) */}
                <div className="space-y-2">
                  <Label htmlFor="deadline" className="text-slate-300">
                    Deadline{" "}
                    <span className="text-slate-500 font-normal">(optional)</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      id="deadline"
                      type="datetime-local"
                      value={formData.deadline}
                      onChange={(e) => handleChange("deadline", e.target.value)}
                      className="pl-9 bg-[#0f0f0f] border-white/10 focus:border-purple-500/50 text-white [color-scheme:dark]"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                </div>

                <Separator className="bg-white/5" />

                {/* Preview toggle */}
                {isFormValid && (
                  <div
                    className="bg-[#0f0f0f] border border-white/10 rounded-lg p-4 space-y-3 cursor-pointer"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                        <Eye className="h-4 w-4 text-purple-400" />
                        Preview
                      </span>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 text-slate-500 transition-transform",
                          showPreview && "rotate-90"
                        )}
                      />
                    </div>

                    {showPreview && (
                      <div className="border-t border-white/5 pt-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-white text-sm">
                            {formData.title}
                          </h3>
                          <span className="text-xs font-bold text-[#14F195] shrink-0">
                            {formData.payment_amount} USDC
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {formData.description}
                        </p>
                        <div className="flex gap-2">
                          {formData.category && (
                            <Badge
                              className={cn(
                                "text-xs border",
                                getCategoryColor(formData.category as JobCategory)
                              )}
                              variant="outline"
                            >
                              {getCategoryLabel(formData.category as JobCategory)}
                            </Badge>
                          )}
                          <Badge
                            className="text-xs border bg-green-500/20 text-green-400 border-green-500/30"
                            variant="outline"
                          >
                            Open
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="solana"
                  className="w-full gap-2"
                  disabled={!isFormValid || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Posting Job...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-4 w-4" />
                      Post Job for {formData.payment_amount ? `${formData.payment_amount} USDC` : "USDC"}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
