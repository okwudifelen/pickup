"use client";

import React from "react";
import { ExternalLink, CheckCircle, Zap } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { FAKE_NETWORK } from "@/lib/wallet";

export function useFakeTransactionToast() {
  const { toast } = useToast();

  const showTransactionToast = (
    txHash: string,
    title: string,
    description: string,
    type: "success" | "info" = "success"
  ) => {
    toast({
      variant: type === "success" ? "default" : "default",
      title: (
        <div className="flex items-center gap-2">
          {type === "success" ? (
            <CheckCircle className="h-4 w-4 text-[#14F195]" />
          ) : (
            <Zap className="h-4 w-4 text-[#9945FF]" />
          )}
          <span>{title}</span>
        </div>
      ) as unknown as string,
      description: (
        <div className="space-y-1">
          <p className="text-slate-400">{description}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-1.5 w-1.5 rounded-full bg-[#14F195]" />
            <span className="text-xs text-[#14F195]">{FAKE_NETWORK}</span>
          </div>
          <p className="text-xs font-mono text-slate-500">
            TX: {txHash.slice(0, 12)}...{txHash.slice(-6)}
          </p>
        </div>
      ) as unknown as string,
    });
  };

  const showEscrowLockedToast = (txHash: string, amount: number) => {
    showTransactionToast(
      txHash,
      "Escrow Locked",
      `${amount} USDC locked in escrow on Solana`,
      "success"
    );
  };

  const showEscrowReleasedToast = (txHash: string, amount: number) => {
    showTransactionToast(
      txHash,
      "Payment Released!",
      `${amount} USDC released to worker`,
      "success"
    );
  };

  const showJobPostedToast = () => {
    toast({
      title: "Job Posted Successfully!",
      description: "Your job is now live on Pickup",
    });
  };

  const showRatingSubmittedToast = () => {
    toast({
      title: "Rating Submitted",
      description: "Thank you for your feedback!",
    });
  };

  const showDisputeRaisedToast = () => {
    toast({
      variant: "destructive",
      title: "Dispute Raised",
      description:
        "Your dispute has been submitted. Our team will review it shortly.",
    });
  };

  return {
    showTransactionToast,
    showEscrowLockedToast,
    showEscrowReleasedToast,
    showJobPostedToast,
    showRatingSubmittedToast,
    showDisputeRaisedToast,
  };
}
