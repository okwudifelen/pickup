import { generateFakeTxHash, simulateBlockchainConfirmation } from "./wallet";

export interface EscrowLockResult {
  txHash: string;
  success: boolean;
  error?: string;
}

export interface EscrowReleaseResult {
  txHash: string;
  success: boolean;
  error?: string;
}

export async function lockEscrow(
  fromUserId: string,
  toUserId: string,
  amount: number,
  jobId: string
): Promise<EscrowLockResult> {
  try {
    // Simulate blockchain confirmation delay (2-3 seconds)
    const delay = 2000 + Math.random() * 1000;
    const txHash = await simulateBlockchainConfirmation(delay);

    console.log(
      `[Fake Solana] Escrow locked: ${amount} USDC from ${fromUserId} for job ${jobId}`
    );
    console.log(`[Fake Solana] TX Hash: ${txHash}`);

    return {
      txHash,
      success: true,
    };
  } catch (error) {
    return {
      txHash: "",
      success: false,
      error: "Failed to lock escrow on Solana Mainnet",
    };
  }
}

export async function releaseEscrow(
  txHash: string,
  amount: number,
  toUserId: string
): Promise<EscrowReleaseResult> {
  try {
    // Simulate blockchain confirmation delay (2-3 seconds)
    const delay = 2000 + Math.random() * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    const releaseTxHash = generateFakeTxHash();

    console.log(
      `[Fake Solana] Escrow released: ${amount} USDC to ${toUserId}`
    );
    console.log(`[Fake Solana] Release TX Hash: ${releaseTxHash}`);

    return {
      txHash: releaseTxHash,
      success: true,
    };
  } catch (error) {
    return {
      txHash: "",
      success: false,
      error: "Failed to release escrow on Solana Mainnet",
    };
  }
}

export async function refundEscrow(
  originalTxHash: string,
  amount: number,
  toUserId: string
): Promise<EscrowReleaseResult> {
  try {
    const delay = 2000 + Math.random() * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    const refundTxHash = generateFakeTxHash();

    console.log(`[Fake Solana] Escrow refunded: ${amount} USDC to ${toUserId}`);
    console.log(`[Fake Solana] Refund TX Hash: ${refundTxHash}`);

    return {
      txHash: refundTxHash,
      success: true,
    };
  } catch (error) {
    return {
      txHash: "",
      success: false,
      error: "Failed to refund escrow on Solana Mainnet",
    };
  }
}
