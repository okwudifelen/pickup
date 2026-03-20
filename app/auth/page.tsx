"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Zap, GraduationCap, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createSupabaseClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { isValidCampusEmail, generateAvatarUrl } from "@/lib/utils";
import { getOrCreateWalletAddress } from "@/lib/wallet";
import { INITIAL_BALANCE } from "@/lib/wallet";

type AuthMode = "signin" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createSupabaseClient();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignUp = async () => {
    if (!formData.fullName.trim()) {
      toast({
        variant: "destructive",
        title: "Name Required",
        description: "Please enter your full name",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password Too Short",
        description: "Password must be at least 6 characters",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Create user profile
        const walletAddress = getOrCreateWalletAddress();
        const avatarUrl = generateAvatarUrl(formData.fullName);

        const { error: profileError } = await supabase.from("users").insert({
          id: data.user.id,
          full_name: formData.fullName,
          campus_email: formData.email,
          avatar_url: avatarUrl,
          wallet_balance: INITIAL_BALANCE,
          fake_wallet_address: walletAddress,
          rating: 0,
          total_jobs_completed: 0,
        });

        if (profileError) {
          console.error("Profile creation error:", profileError);
        }

        toast({
          title: "Welcome to Pickup!",
          description: `Account created! You start with ${INITIAL_BALANCE} USDC.`,
        });

        router.push("/dashboard");
        router.refresh();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Sign up failed";
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!formData.email || !formData.password) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please enter your email and password",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "Signed in successfully",
      });

      router.push("/dashboard");
      router.refresh();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Sign in failed";
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup") handleSignUp();
    else handleSignIn();
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4 py-12">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#9945FF]/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-[#14F195]/6 rounded-full blur-[80px]" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center">
              <span className="text-white font-black text-lg">P</span>
            </div>
            <span className="text-2xl font-black text-white">Pickup</span>
          </div>
          <p className="text-slate-400 text-sm">
            Campus Micro-Job Marketplace
          </p>
        </div>

        <Card className="bg-[#111827] border-white/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-white">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {mode === "signin"
                ? "Sign in to your Pickup account"
                : "Join thousands of students earning on campus"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-slate-300">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="bg-[#0f0f0f] border-white/10 focus:border-purple-500/50 text-white placeholder:text-slate-600"
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                  Email
                </Label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-9 bg-[#0f0f0f] border-white/10 focus:border-purple-500/50 text-white placeholder:text-slate-600"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={mode === "signup" ? "Min. 6 characters" : "Your password"}
                    value={formData.password}
                    onChange={handleChange}
                    className="pr-10 bg-[#0f0f0f] border-white/10 focus:border-purple-500/50 text-white placeholder:text-slate-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {mode === "signup" && (
                <div className="bg-gradient-to-r from-[#9945FF]/10 to-[#14F195]/10 border border-purple-500/20 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium text-slate-300">
                    What you get for free:
                  </p>
                  {[
                    "100 USDC starting balance",
                    "Fake Solana wallet connected",
                    "Escrow-protected payments",
                  ].map((perk) => (
                    <div key={perk} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-[#14F195] shrink-0" />
                      <span className="text-xs text-slate-400">{perk}</span>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="submit"
                variant="solana"
                className="w-full gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {mode === "signup" ? "Creating account..." : "Signing in..."}
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    {mode === "signup" ? "Create Account" : "Sign In"}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() =>
                  setMode(mode === "signin" ? "signup" : "signin")
                }
                className="text-sm text-slate-400 hover:text-purple-400 transition-colors"
              >
                {mode === "signin"
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
