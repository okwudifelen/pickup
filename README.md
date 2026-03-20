# Pickup — Campus Micro-Job Marketplace

> *The gig economy, built for campus. Earn USDC. Get things done.*

🌐 **[pickup.vercel.app](https://pickup-nine-liard.vercel.app/)** ← try it here

**Pickup** connects students who need small tasks done with students who have the skills and time to do them — tutoring, moving boxes, design work, errands, and more. Every transaction is protected by a simulated on-chain escrow system built on Solana, making trust between strangers a non-issue.

---

## The Problem

Campus life is full of micro-tasks that students need help with and fellow students are perfectly positioned to fulfill. But there's no trusted, lightweight platform purpose-built for this. Generic freelance platforms are too formal. Cash is awkward. Venmo has no dispute protection.

Students lose money to flaky workers. Workers do jobs and never get paid. There's no accountability layer.

**Pickup solves this with escrow-first payments.**

---

## How It Works

1. **Post a Job** — A student posts a task (e.g. *"Help me move into my dorm — 25 USDC"*). Funds stay in their wallet.
2. **Accept & Lock** — Another student accepts. The payment is immediately locked in escrow on-chain. Neither party can touch it.
3. **Do the Work** — The job moves to *In Progress*. The worker delivers.
4. **Release & Earn** — The poster marks it complete. Escrow releases the USDC directly to the worker's wallet.
5. **Dispute if needed** — Either party can raise a dispute. Funds stay frozen until resolved.

No trust required. The smart escrow handles it.

---

## Key Features

### Escrow-Protected Payments
Every accepted job triggers an on-chain escrow lock. Funds are only released when the poster confirms completion — protecting workers from non-payment and posters from no-shows. Disputes freeze funds until manually resolved.

### Simulated Solana Wallet
Every user gets a Solana-style wallet on signup — a real-looking base58 address, a 100 USDC starting balance, and a live transaction history. Accepting a job generates a real-feeling transaction signature with a fake Solscan link and a 2-3 second confirmation simulation.

### Campus Verification
Sign up requires a valid university email. This keeps the marketplace trusted and student-only.

### Reputation System
After every completed job, both parties can rate each other (1–5 stars). Ratings are aggregated on public profiles — making reliability visible and building long-term trust within the campus community.

### Real-Time Updates
Job status changes propagate live via Supabase Realtime — no page refreshes needed. Accept a job and the poster sees it instantly.

### Dispute Resolution
Either party on an in-progress job can raise a dispute with a written reason. Escrow remains frozen until an admin resolves it, protecting both sides.

---

## The Wallet Experience

The fake Solana wallet is designed to feel authentic:

- **Base58 address** — 44-character address generated on signup, stored and synced to your profile
- **Fake tx hashes** — 87-character base58 strings that look exactly like real Solana signatures
- **Simulated confirmation** — 2-3 second processing delay with a loading state before funds move
- **Solana gradient branding** — Purple-to-green accent on all wallet UI elements
- **Fake Solscan links** — Each transaction shows a "View on Solscan" link for authenticity

---

Built for the Superteam Hackathon.
