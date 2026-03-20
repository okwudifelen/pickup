// No "use client" — this file must be importable from both server and client

import { FakeWallet } from "@/types";

const BASE58_CHARS =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function generateFakeWalletAddress(): string {
  let result = "";
  const length = 44;
  for (let i = 0; i < length; i++) {
    result += BASE58_CHARS.charAt(
      Math.floor(Math.random() * BASE58_CHARS.length)
    );
  }
  return result;
}

export function generateFakeTxHash(): string {
  let result = "";
  const length = 87;
  for (let i = 0; i < length; i++) {
    result += BASE58_CHARS.charAt(
      Math.floor(Math.random() * BASE58_CHARS.length)
    );
  }
  return result;
}

export function getStoredWalletAddress(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("pickup_wallet_address");
}

export function storeWalletAddress(address: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("pickup_wallet_address", address);
}

export function clearWalletAddress(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("pickup_wallet_address");
}

export function getOrCreateWalletAddress(): string {
  const existing = getStoredWalletAddress();
  if (existing) return existing;
  const newAddress = generateFakeWalletAddress();
  storeWalletAddress(newAddress);
  return newAddress;
}

export async function simulateBlockchainConfirmation(
  delayMs: number = 2500
): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  return generateFakeTxHash();
}

export function formatWalletAddress(address: string): string {
  if (!address || address.length < 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export const FAKE_NETWORK = "Solana Mainnet";
export const FAKE_CURRENCY = "USDC";
export const INITIAL_BALANCE = 100;

export function getFakeWallet(
  address: string,
  balance: number
): FakeWallet {
  return {
    address,
    balance,
    network: FAKE_NETWORK,
  };
}
