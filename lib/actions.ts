"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Database, createSupabaseServerClient } from "./supabase";
import { generateFakeTxHash } from "./wallet";
import { ActionResult, JobCategory } from "@/types";

// Auth-aware client — only used to read the session
function getSessionClient() {
  return createServerActionClient<Database>({ cookies });
}

// Admin client — bypasses RLS, used for all DB writes and reads
function getAdminClient() {
  return createSupabaseServerClient();
}

// Get the authenticated user from the session cookie
async function getAuthUser() {
  try {
    const supabase = getSessionClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) return null;
    return session.user;
  } catch {
    return null;
  }
}

export async function createJob(formData: {
  title: string;
  description: string;
  category: JobCategory;
  payment_amount: number;
  deadline?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const admin = getAdminClient();

    const { data: userData, error: userError } = await admin
      .from("users")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return { success: false, error: "Could not fetch user data" };
    }

    if (userData.wallet_balance < formData.payment_amount) {
      return {
        success: false,
        error: `Insufficient balance. You have ${userData.wallet_balance} USDC but need ${formData.payment_amount} USDC`,
      };
    }

    const { data: job, error: jobError } = await admin
      .from("jobs")
      .insert({
        poster_id: user.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        payment_amount: formData.payment_amount,
        status: "open",
        deadline: formData.deadline || null,
      })
      .select()
      .single();

    if (jobError || !job) {
      return { success: false, error: jobError?.message || "Failed to create job" };
    }

    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true, data: { id: job.id } };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[createJob]", msg);
    return { success: false, error: msg };
  }
}

export async function acceptJob(
  jobId: string
): Promise<ActionResult<{ txHash: string }>> {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const admin = getAdminClient();

    const { data: job, error: jobError } = await admin
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) return { success: false, error: "Job not found" };
    if (job.status !== "open") return { success: false, error: "Job is no longer available" };
    if (job.poster_id === user.id) return { success: false, error: "You cannot accept your own job" };

    const { data: posterData, error: posterError } = await admin
      .from("users")
      .select("wallet_balance")
      .eq("id", job.poster_id)
      .single();

    if (posterError || !posterData) {
      return { success: false, error: "Could not fetch poster data" };
    }

    if (posterData.wallet_balance < job.payment_amount) {
      return { success: false, error: "Poster has insufficient balance for escrow" };
    }

    const txHash = generateFakeTxHash();

    // Deduct from poster wallet
    const { error: balanceError } = await admin
      .from("users")
      .update({ wallet_balance: posterData.wallet_balance - job.payment_amount })
      .eq("id", job.poster_id);

    if (balanceError) {
      console.error("[acceptJob] balance deduct error:", balanceError);
      return { success: false, error: `Failed to lock escrow: ${balanceError.message}` };
    }

    // Create escrow transaction
    const { error: escrowError } = await admin
      .from("escrow_transactions")
      .insert({
        job_id: jobId,
        from_user_id: job.poster_id,
        to_user_id: user.id,
        amount: job.payment_amount,
        status: "locked",
        tx_hash: txHash,
      });

    if (escrowError) {
      console.error("[acceptJob] escrow insert error:", escrowError);
      // Rollback
      await admin
        .from("users")
        .update({ wallet_balance: posterData.wallet_balance })
        .eq("id", job.poster_id);
      return { success: false, error: `Failed to create escrow: ${escrowError.message}` };
    }

    // Update job
    const { error: updateError } = await admin
      .from("jobs")
      .update({ status: "in_progress", acceptor_id: user.id, escrow_locked: true })
      .eq("id", jobId);

    if (updateError) {
      console.error("[acceptJob] job update error:", updateError);
      return { success: false, error: `Failed to update job: ${updateError.message}` };
    }

    revalidatePath(`/jobs/${jobId}`);
    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true, data: { txHash } };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[acceptJob] caught:", msg);
    return { success: false, error: msg };
  }
}

export async function markJobComplete(
  jobId: string
): Promise<ActionResult<{ txHash: string }>> {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const admin = getAdminClient();

    const { data: job, error: jobError } = await admin
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) return { success: false, error: "Job not found" };
    if (job.poster_id !== user.id) return { success: false, error: "Only the job poster can mark it as complete" };
    if (job.status !== "in_progress") return { success: false, error: "Job is not in progress" };
    if (!job.acceptor_id) return { success: false, error: "No one has accepted this job" };

    const { data: escrow, error: escrowFetchError } = await admin
      .from("escrow_transactions")
      .select("*")
      .eq("job_id", jobId)
      .eq("status", "locked")
      .single();

    if (escrowFetchError || !escrow) {
      console.error("[markJobComplete] escrow fetch:", escrowFetchError);
      return { success: false, error: "Escrow transaction not found" };
    }

    const { data: acceptorData, error: acceptorError } = await admin
      .from("users")
      .select("wallet_balance, total_jobs_completed")
      .eq("id", job.acceptor_id)
      .single();

    if (acceptorError || !acceptorData) {
      return { success: false, error: "Could not fetch acceptor data" };
    }

    const releaseTxHash = generateFakeTxHash();

    const { error: releaseError } = await admin
      .from("users")
      .update({
        wallet_balance: acceptorData.wallet_balance + escrow.amount,
        total_jobs_completed: acceptorData.total_jobs_completed + 1,
      })
      .eq("id", job.acceptor_id);

    if (releaseError) {
      console.error("[markJobComplete] release error:", releaseError);
      return { success: false, error: `Failed to release funds: ${releaseError.message}` };
    }

    await admin
      .from("escrow_transactions")
      .update({ status: "released" })
      .eq("id", escrow.id);

    const { error: updateError } = await admin
      .from("jobs")
      .update({ status: "completed", escrow_locked: false })
      .eq("id", jobId);

    if (updateError) {
      return { success: false, error: `Failed to update job: ${updateError.message}` };
    }

    revalidatePath(`/jobs/${jobId}`);
    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true, data: { txHash: releaseTxHash } };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[markJobComplete] caught:", msg);
    return { success: false, error: msg };
  }
}

export async function raiseDispute(
  jobId: string,
  reason: string
): Promise<ActionResult> {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const admin = getAdminClient();

    const { data: job, error: jobError } = await admin
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) return { success: false, error: "Job not found" };
    if (job.poster_id !== user.id && job.acceptor_id !== user.id) {
      return { success: false, error: "You are not involved in this job" };
    }
    if (job.status !== "in_progress") {
      return { success: false, error: "Can only dispute jobs that are in progress" };
    }

    const { error: disputeError } = await admin.from("disputes").insert({
      job_id: jobId,
      raised_by: user.id,
      reason,
      status: "open",
    });

    if (disputeError) {
      return { success: false, error: `Failed to create dispute: ${disputeError.message}` };
    }

    await admin.from("jobs").update({ status: "disputed" }).eq("id", jobId);
    await admin
      .from("escrow_transactions")
      .update({ status: "disputed" })
      .eq("job_id", jobId)
      .eq("status", "locked");

    revalidatePath(`/jobs/${jobId}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

export async function submitRating(formData: {
  jobId: string;
  rateeId: string;
  score: number;
  comment: string;
}): Promise<ActionResult> {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const admin = getAdminClient();

    const { data: job, error: jobError } = await admin
      .from("jobs")
      .select("*")
      .eq("id", formData.jobId)
      .single();

    if (jobError || !job) return { success: false, error: "Job not found" };
    if (job.status !== "completed") return { success: false, error: "Can only rate completed jobs" };
    if (job.poster_id !== user.id && job.acceptor_id !== user.id) {
      return { success: false, error: "You are not involved in this job" };
    }

    const { data: existingRating } = await admin
      .from("ratings")
      .select("id")
      .eq("job_id", formData.jobId)
      .eq("rater_id", user.id)
      .maybeSingle();

    if (existingRating) return { success: false, error: "You have already rated this job" };

    const { error: ratingError } = await admin.from("ratings").insert({
      job_id: formData.jobId,
      rater_id: user.id,
      ratee_id: formData.rateeId,
      score: formData.score,
      comment: formData.comment,
    });

    if (ratingError) {
      return { success: false, error: `Failed to submit rating: ${ratingError.message}` };
    }

    revalidatePath(`/jobs/${formData.jobId}`);
    revalidatePath(`/profile/${formData.rateeId}`);
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

export async function updateUserWalletAddress(
  walletAddress: string
): Promise<ActionResult> {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const admin = getAdminClient();
    const { error } = await admin
      .from("users")
      .update({ fake_wallet_address: walletAddress })
      .eq("id", user.id);

    if (error) return { success: false, error: `Failed to update wallet: ${error.message}` };

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

export async function getCurrentUser() {
  try {
    const user = await getAuthUser();
    if (!user) return null;

    const admin = getAdminClient();
    const { data: userData } = await admin
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    return userData;
  } catch {
    return null;
  }
}
