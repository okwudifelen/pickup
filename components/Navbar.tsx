"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Briefcase, LayoutDashboard, PlusCircle, User, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { WalletWidget } from "@/components/WalletWidget";
import { createSupabaseClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { User as UserType } from "@/types";
import { generateAvatarUrl, cn } from "@/lib/utils";

interface NavbarProps {
  user: UserType | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    localStorage.removeItem("pickup_wallet_address");
    toast({ title: "Signed out", description: "Come back soon!" });
    router.push("/auth");
    router.refresh();
  };

  const navLinks = [
    { href: "/", label: "Browse", icon: Briefcase },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/post", label: "Post Job", icon: PlusCircle },
  ];

  const avatarUrl =
    user?.avatar_url || generateAvatarUrl(user?.full_name || "User");

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0f0f0f]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0f0f0f]/80">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center">
              <span className="text-white font-black text-sm">P</span>
            </div>
            <span className="font-bold text-white text-lg group-hover:text-purple-300 transition-colors">
              Pickup
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === href
                    ? "text-white bg-white/10"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <WalletWidget user={user} compact />
                <Link
                  href={`/profile/${user.id}`}
                  className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/5 transition-colors"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={avatarUrl} alt={user.full_name} />
                    <AvatarFallback className="bg-purple-900/50 text-purple-300 text-xs">
                      {user.full_name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-slate-300 max-w-24 truncate">
                    {user.full_name}
                  </span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Link href="/auth">
                <Button variant="solana" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-slate-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-3 space-y-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === href
                    ? "text-white bg-white/10"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            {user ? (
              <div className="pt-2 border-t border-white/10 space-y-2">
                <div className="px-3 py-2">
                  <WalletWidget user={user} compact />
                </div>
                <Link
                  href={`/profile/${user.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-400 hover:text-white hover:bg-white/5"
                >
                  <User className="h-4 w-4" />
                  My Profile
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-400 hover:text-white hover:bg-white/5"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-white/10 px-3">
                <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="solana" size="sm" className="w-full">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
