import { Address } from '@ton/core';

export interface WalletPolicy {
  maxTransactionAmount: bigint;
  dailySpendingLimit: bigint;
  allowedAddresses?: string[];
  blockedAddresses?: string[];
  allowedJettons?: string[];
  requireConfirmation: boolean;
  confirmationThreshold: bigint;
}

export interface AuditLogEntry {
  timestamp: number;
  action: string;
  tool: string;
  params: Record<string, unknown>;
  result: 'success' | 'denied' | 'error';
  reason?: string;
  txHash?: string;
  amount?: string;
  destination?: string;
}

export interface WalletInfo {
  address: string;
  publicKey: string;
  balance?: string;
  policy: WalletPolicy;
  createdAt: number;
}

export interface ToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

export const DEFAULT_POLICY: WalletPolicy = {
  maxTransactionAmount: BigInt('1000000000'),   // 1 TON
  dailySpendingLimit: BigInt('5000000000'),      // 5 TON
  requireConfirmation: true,
  confirmationThreshold: BigInt('500000000'),    // 0.5 TON
};

export function formatTon(nanotons: bigint): string {
  const tons = Number(nanotons) / 1e9;
  return `${tons} TON`;
}

export function parseTon(tons: string | number): bigint {
  return BigInt(Math.floor(Number(tons) * 1e9));
}

export function successResult(data: unknown): ToolResult {
  return {
    content: [{
      type: 'text',
      text: typeof data === 'string' ? data : JSON.stringify(data, bigIntReplacer, 2),
    }],
  };
}

export function errorResult(message: string): ToolResult {
  return {
    content: [{ type: 'text', text: `Error: ${message}` }],
    isError: true,
  };
}

function bigIntReplacer(_key: string, value: unknown): unknown {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}
