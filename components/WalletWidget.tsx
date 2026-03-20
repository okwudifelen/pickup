"use client";

import React, { useState, useEffect } from "react";
import { Wallet, Copy, CheckCircle, Zap, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getOrCreateWalletAddress,
  formatWalletAddress,
  FAKE_NETWORK,
  FAKE_CURRENCY,
} from "@/lib/wallet";
import { updateUserWalletAddress } from "@/lib/actions";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@/types";
import { cn } from "@/lib/utils";

interface WalletWidgetProps {
  user: User | null;
  compact?: boolean;
  className?: string;
}

export function WalletWidget({ user, compact = false, className }: WalletWidgetProps) {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem("pickup_wallet_address");
    if (stored) {
      setWalletAddress(stored);
      setIsConnected(true);
    }
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    await new Promise((r) => setTimeout(r, 2000));
    const address = getOrCreateWalletAddress();
    setWalletAddress(address);
    setIsConnected(true);
    setIsConnecting(false);

    if (user) {
      await updateUserWalletAddress(address);
    }

    toast({
      title: "Wallet Connected!",
      description: `Connected to ${FAKE_NETWORK}`,
      variant: "default",
    });
  };

  const handleCopyAddress = async () => {
    if (!walletAddress) return;
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
    });
  };

  if (!isConnected) {
    return (
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        variant="solana"
        size={compact ? "sm" : "default"}
        className={cn("gap-2", className)}
      >
        {isConnecting ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </>
        )}
      </Button>
    );
  }

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 bg-gradient-to-r from-[#9945FF]/10 to-[#14F195]/10 border border-purple-500/20 rounded-full px-3 py-1.5",
          className
        )}
      >
        <div className="h-2 w-2 rounded-full bg-[#14F195] animate-pulse" />
        <span className="text-xs font-medium text-slate-300">
          {formatWalletAddress(walletAddress)}
        </span>
        <span className="text-xs font-bold bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">
          {user?.wallet_balance?.toFixed(2) ?? "0.00"} USDC
        </span>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "bg-gradient-to-br from-[#1a0533] to-[#0a1a0a] border border-purple-500/30 overflow-hidden relative",
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#9945FF]/5 to-[#14F195]/5" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#9945FF]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#14F195]/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

      <CardContent className="p-5 relative">
        {/* Network badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#14F195] animate-pulse" />
            <span className="text-xs text-[#14F195] font-medium">{FAKE_NETWORK}</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-[#9945FF]" />
            <span className="text-xs text-[#9945FF] font-medium">Fast Finality</span>
          </div>
        </div>

        {/* Balance */}
        <div className="mb-4">
          <p className="text-xs text-slate-400 mb-1">Available Balance</p>
          <p className="text-3xl font-bold bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">
            {user?.wallet_balance?.toFixed(2) ?? "0.00"}
          </p>
          <p className="text-sm text-slate-400">{FAKE_CURRENCY}</p>
        </div>

        {/* Address */}
        <div className="bg-black/30 rounded-lg p-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Wallet Address</p>
            <p className="text-sm font-mono text-slate-300">
              {formatWalletAddress(walletAddress)}
            </p>
          </div>
          <button
            onClick={handleCopyAddress}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
          >
            {copied ? (
              <CheckCircle className="h-4 w-4 text-[#14F195]" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
