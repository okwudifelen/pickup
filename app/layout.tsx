import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/Navbar";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pickup — Campus Micro-Job Marketplace",
  description:
    "Find and post campus micro-jobs. Get paid in USDC with Solana escrow protection.",
  keywords: ["campus jobs", "micro jobs", "solana", "USDC", "student jobs"],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerComponentClient<any>({ cookies });

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let userData = null;
  if (authUser) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();
    userData = data;
  }

  return (
    <html lang="en">
      <body className={`${inter.className} bg-background min-h-screen`}>
        <Navbar user={userData} />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        <footer className="border-t border-white/5 py-8 mt-16">
          <div className="container max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center">
                <span className="text-white font-black text-xs">P</span>
              </div>
              <span className="text-slate-400 text-sm">
                Pickup — Campus Micro-Job Marketplace
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <div className="h-1.5 w-1.5 rounded-full bg-[#14F195]" />
              <span>Powered by Solana Mainnet (Simulated)</span>
            </div>
          </div>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
