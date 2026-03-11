import { WalletPolicy, DEFAULT_POLICY } from '../ton/types';
import * as fs from 'fs';
import * as path from 'path';

export interface PolicyCheckResult {
  allowed: boolean;
  reason?: string;
  requiresConfirmation?: boolean;
}

interface DailySpending {
  date: string;
  total: bigint;
}

export class PolicyEngine {
  private policies: Map<string, WalletPolicy> = new Map();
  private dailySpending: Map<string, DailySpending> = new Map();
  private dataDir: string;
  private policiesFile: string;
  private spendingFile: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.policiesFile = path.join(dataDir, 'policies.json');
    this.spendingFile = path.join(dataDir, 'spending.json');
    this.ensureDataDir();
    this.loadFromDisk();
  }

  private ensureDataDir(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  setPolicy(walletAddress: string, policy: Partial<WalletPolicy>): WalletPolicy {
    const current = this.getPolicy(walletAddress);
    const merged: WalletPolicy = { ...current, ...policy };
    this.policies.set(walletAddress, merged);
    this.saveToDisk();
    return merged;
  }

  getPolicy(walletAddress: string): WalletPolicy {
    return this.policies.get(walletAddress) || { ...DEFAULT_POLICY };
  }

  checkTransaction(
    walletAddress: string,
    destination: string,
    amount: bigint
  ): PolicyCheckResult {
    const policy = this.getPolicy(walletAddress);

    // Check max transaction amount
    if (amount > policy.maxTransactionAmount) {
      return {
        allowed: false,
        reason: `Amount ${amount} exceeds max transaction limit ${policy.maxTransactionAmount}`,
      };
    }

    // Check daily spending limit
    const todaySpending = this.getTodaySpending(walletAddress);
    if (todaySpending + amount > policy.dailySpendingLimit) {
      return {
        allowed: false,
        reason: `Transaction would exceed daily spending limit. Today: ${todaySpending}, Requested: ${amount}, Limit: ${policy.dailySpendingLimit}`,
      };
    }

    // Check blocked addresses
    if (policy.blockedAddresses?.includes(destination)) {
      return {
        allowed: false,
        reason: `Destination ${destination} is blocked`,
      };
    }

    // Check allowed addresses (if whitelist is set)
    if (policy.allowedAddresses && policy.allowedAddresses.length > 0) {
      if (!policy.allowedAddresses.includes(destination)) {
        return {
          allowed: false,
          reason: `Destination ${destination} is not in the allowed addresses list`,
        };
      }
    }

    // Check if confirmation is required
    if (policy.requireConfirmation && amount >= policy.confirmationThreshold) {
      return {
        allowed: true,
        requiresConfirmation: true,
        reason: `Amount ${amount} exceeds confirmation threshold ${policy.confirmationThreshold}`,
      };
    }

    return { allowed: true };
  }

  checkJettonTransfer(
    walletAddress: string,
    jettonAddress: string,
    destination: string
  ): PolicyCheckResult {
    const policy = this.getPolicy(walletAddress);

    // Check allowed jettons (if whitelist is set)
    if (policy.allowedJettons && policy.allowedJettons.length > 0) {
      if (!policy.allowedJettons.includes(jettonAddress)) {
        return {
          allowed: false,
          reason: `Jetton ${jettonAddress} is not in the allowed jettons list`,
        };
      }
    }

    // Check blocked addresses
    if (policy.blockedAddresses?.includes(destination)) {
      return {
        allowed: false,
        reason: `Destination ${destination} is blocked`,
      };
    }

    return { allowed: true };
  }

  recordSpending(walletAddress: string, amount: bigint): void {
    const today = this.getToday();
    const key = `${walletAddress}:${today}`;
    const current = this.dailySpending.get(key);

    if (current && current.date === today) {
      current.total += amount;
    } else {
      this.dailySpending.set(key, { date: today, total: amount });
    }
    this.saveToDisk();
  }

  getTodaySpending(walletAddress: string): bigint {
    const today = this.getToday();
    const key = `${walletAddress}:${today}`;
    const spending = this.dailySpending.get(key);
    if (spending && spending.date === today) {
      return spending.total;
    }
    return BigInt(0);
  }

  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  private saveToDisk(): void {
    // Save policies
    const policiesObj: Record<string, any> = {};
    for (const [addr, policy] of this.policies) {
      policiesObj[addr] = {
        ...policy,
        maxTransactionAmount: policy.maxTransactionAmount.toString(),
        dailySpendingLimit: policy.dailySpendingLimit.toString(),
        confirmationThreshold: policy.confirmationThreshold.toString(),
      };
    }
    fs.writeFileSync(this.policiesFile, JSON.stringify(policiesObj, null, 2));

    // Save spending
    const spendingObj: Record<string, any> = {};
    for (const [key, spending] of this.dailySpending) {
      spendingObj[key] = { date: spending.date, total: spending.total.toString() };
    }
    fs.writeFileSync(this.spendingFile, JSON.stringify(spendingObj, null, 2));
  }

  private loadFromDisk(): void {
    // Load policies
    if (fs.existsSync(this.policiesFile)) {
      const content = JSON.parse(fs.readFileSync(this.policiesFile, 'utf8'));
      for (const [addr, policy] of Object.entries(content) as any[]) {
        this.policies.set(addr, {
          ...policy,
          maxTransactionAmount: BigInt(policy.maxTransactionAmount),
          dailySpendingLimit: BigInt(policy.dailySpendingLimit),
          confirmationThreshold: BigInt(policy.confirmationThreshold),
        });
      }
    }

    // Load spending
    if (fs.existsSync(this.spendingFile)) {
      const content = JSON.parse(fs.readFileSync(this.spendingFile, 'utf8'));
      for (const [key, spending] of Object.entries(content) as any[]) {
        this.dailySpending.set(key, { date: spending.date, total: BigInt(spending.total) });
      }
    }
  }
}
