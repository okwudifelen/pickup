"use client";

import React, { useState } from "react";
import { Shield, Zap, Lock, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { acceptJob } from "@/lib/actions";
import { formatCurrency, truncateAddress } from "@/lib/utils";
import { Job, User } from "@/types";
import { FAKE_NETWORK } from "@/lib/wallet";

interface EscrowModalProps {
  job: Job;
  currentUser: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (txHash: string) => void;
}

type ConfirmationStep = "confirm" | "processing" | "success" | "error";

export function EscrowModal({
  job,
  currentUser,
  open,
  onOpenChange,
  onSuccess,
}: EscrowModalProps) {
  const [step, setStep] = useState<ConfirmationStep>("confirm");
  const [txHash, setTxHash] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const { toast } = useToast();

  const handleAccept = async () => {
    setStep("processing");

    // Simulate 2-3 second blockchain confirmation
    await new Promise((r) => setTimeout(r, 2500));

    const result = await acceptJob(job.id);

    if (result.success && result.data) {
      setTxHash(result.data.txHash);
      setStep("success");
      toast({
        title: "Job Accepted!",
        description: "Escrow locked successfully. Good luck!",
        variant: "default",
      });
      onSuccess?.(result.data.txHash);
    } else {
      setErrorMsg(result.error || "Failed to accept job");
      setStep("error");
    }
  };

  const handleClose = () => {
    setStep("confirm");
    setTxHash("");
    setErrorMsg("");
    onOpenChange(false);
  };

  const canAfford = currentUser.wallet_balance >= 0; // Poster pays, not acceptor
  const posterCanAfford = true; // We check this server-side

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {step === "confirm" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-full bg-gradient-to-r from-[#9945FF]/20 to-[#14F195]/20 border border-purple-500/30">
                  <Shield className="h-5 w-5 text-purple-400" />
                </div>
                <DialogTitle className="text-lg">Confirm Job Acceptance</DialogTitle>
              </div>
              <DialogDescription>
                Review the escrow details before accepting this job.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2">
              {/* Job info */}
              <div className="bg-black/30 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-white text-sm line-clamp-2">{job.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-2">{job.description}</p>
              </div>

              {/* Escrow details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#9945FF]" />
                  <span className="text-sm font-medium text-slate-300">Escrow Details</span>
                </div>

                <div className="bg-gradient-to-r from-[#9945FF]/10 to-[#14F195]/10 border border-purple-500/20 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">Amount to Lock</span>
                    <span className="text-sm font-bold bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">
                      {formatCurrency(job.payment_amount)}
                    </span>
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">Network</span>
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#14F195]" />
                      <span className="text-xs text-[#14F195]">{FAKE_NETWORK}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">Est. Confirmation</span>
                    <span className="text-xs text-slate-300">~2-3 seconds</span>
                  </div>
                </div>

                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                  <p className="text-xs text-yellow-400/80">
                    The payment will be held in escrow until you mark the job as complete. Funds are released automatically upon completion.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleClose} className="border-white/10">
                Cancel
              </Button>
              <Button onClick={handleAccept} variant="solana" className="gap-2">
                <Zap className="h-4 w-4" />
                Accept & Lock Escrow
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "processing" && (
          <div className="py-8 flex flex-col items-center gap-6">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195] animate-spin" style={{ background: "conic-gradient(from 0deg, #9945FF, #14F195, #9945FF)" }} />
              <div className="absolute inset-1 rounded-full bg-[#1a1a2e] flex items-center justify-center">
                <Lock className="h-6 w-6 text-purple-400" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-semibold text-white mb-1">Processing on Solana</p>
              <p className="text-sm text-slate-400">Locking {formatCurrency(job.payment_amount)} in escrow...</p>
              <div className="flex items-center justify-center gap-1 mt-3">
                <div className="h-1.5 w-1.5 rounded-full bg-[#14F195] animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="h-1.5 w-1.5 rounded-full bg-[#14F195] animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="h-1.5 w-1.5 rounded-full bg-[#14F195] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {step === "success" && (
          <>
            <DialogHeader>
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="p-3 rounded-full bg-green-500/20 border border-green-500/30">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <DialogTitle className="text-lg text-center">Escrow Locked!</DialogTitle>
                <DialogDescription className="text-center">
                  You&apos;ve successfully accepted this job. The payment is secured in escrow.
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="bg-black/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Transaction Hash</span>
                <ExternalLink className="h-3 w-3 text-slate-500" />
              </div>
              <p className="text-xs font-mono text-[#14F195] break-all">
                {txHash.slice(0, 20)}...{txHash.slice(-8)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <div className="h-1.5 w-1.5 rounded-full bg-[#14F195]" />
                <span className="text-xs text-[#14F195]">Confirmed on {FAKE_NETWORK}</span>
              </div>
            </div>

            <Button onClick={handleClose} variant="solana" className="w-full gap-2">
              <CheckCircle className="h-4 w-4" />
              View Job
            </Button>
          </>
        )}

        {step === "error" && (
          <>
            <DialogHeader>
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="p-3 rounded-full bg-red-500/20 border border-red-500/30">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
                <DialogTitle className="text-lg text-center">Transaction Failed</DialogTitle>
                <DialogDescription className="text-center text-red-400">
                  {errorMsg}
                </DialogDescription>
              </div>
            </DialogHeader>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} className="w-full border-white/10">
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
