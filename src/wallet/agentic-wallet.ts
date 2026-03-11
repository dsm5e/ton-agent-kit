import { TonClient } from '@ton/ton';
import { internal, toNano } from '@ton/core';
import { KeyManager } from './key-manager';
import { PolicyEngine, PolicyCheckResult } from './policy-engine';
import { AuditLogger } from './audit-logger';
import { WalletPolicy, formatTon } from '../ton/types';

export interface SendResult {
  success: boolean;
  txHash?: string;
  error?: string;
  policyCheck: PolicyCheckResult;
}

export class AgenticWallet {
  private keyManager: KeyManager;
  private policyEngine: PolicyEngine;
  private auditLogger: AuditLogger;
  private tonClient: TonClient;

  constructor(
    tonClient: TonClient,
    keyManager: KeyManager,
    policyEngine: PolicyEngine,
    auditLogger: AuditLogger
  ) {
    this.tonClient = tonClient;
    this.keyManager = keyManager;
    this.policyEngine = policyEngine;
    this.auditLogger = auditLogger;
  }

  async createWallet(password: string): Promise<{ address: string; publicKey: string; mnemonic: string[] }> {
    const result = await this.keyManager.createWallet(password);

    this.auditLogger.log({
      action: 'create_wallet',
      tool: 'create_wallet',
      params: { address: result.address },
      result: 'success',
    });

    return result;
  }

  async sendTon(
    walletAddress: string,
    password: string,
    destination: string,
    amount: bigint,
    comment?: string
  ): Promise<SendResult> {
    // Policy check
    const policyCheck = this.policyEngine.checkTransaction(walletAddress, destination, amount);

    if (!policyCheck.allowed) {
      this.auditLogger.log({
        action: 'send_ton',
        tool: 'send_ton',
        params: { walletAddress, destination, amount: amount.toString() },
        result: 'denied',
        reason: policyCheck.reason,
        amount: formatTon(amount),
        destination,
      });

      return { success: false, error: policyCheck.reason, policyCheck };
    }

    try {
      const keyPair = await this.keyManager.getKeyPair(walletAddress, password);
      const { contract } = this.keyManager.getWalletContract(walletAddress, password);

      const opened = this.tonClient.open(contract);
      const seqno = await opened.getSeqno();

      await opened.sendTransfer({
        seqno,
        secretKey: keyPair.secretKey,
        messages: [
          internal({
            to: destination,
            value: amount,
            body: comment || '',
            bounce: false,
          }),
        ],
      });

      // Record spending
      this.policyEngine.recordSpending(walletAddress, amount);

      this.auditLogger.log({
        action: 'send_ton',
        tool: 'send_ton',
        params: { walletAddress, destination, amount: amount.toString() },
        result: 'success',
        amount: formatTon(amount),
        destination,
      });

      return { success: true, policyCheck };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      this.auditLogger.log({
        action: 'send_ton',
        tool: 'send_ton',
        params: { walletAddress, destination, amount: amount.toString() },
        result: 'error',
        reason: message,
        amount: formatTon(amount),
        destination,
      });

      return { success: false, error: message, policyCheck };
    }
  }

  setPolicy(walletAddress: string, policy: Partial<WalletPolicy>): WalletPolicy {
    const result = this.policyEngine.setPolicy(walletAddress, policy);

    this.auditLogger.log({
      action: 'set_policy',
      tool: 'set_policy',
      params: { walletAddress, policy: 'updated' },
      result: 'success',
    });

    return result;
  }

  getPolicy(walletAddress: string): WalletPolicy {
    return this.policyEngine.getPolicy(walletAddress);
  }

  getWalletInfo(walletAddress: string): {
    address: string;
    exists: boolean;
    policy: WalletPolicy;
    todaySpending: string;
  } {
    const exists = this.keyManager.walletExists(walletAddress);
    const policy = this.policyEngine.getPolicy(walletAddress);
    const todaySpending = this.policyEngine.getTodaySpending(walletAddress);

    return {
      address: walletAddress,
      exists,
      policy,
      todaySpending: formatTon(todaySpending),
    };
  }

  listWallets() {
    return this.keyManager.listWallets();
  }

  getAuditLog(options?: {
    walletAddress?: string;
    tool?: string;
    limit?: number;
  }) {
    return this.auditLogger.getLogs(options);
  }

  getAuditStats(walletAddress?: string) {
    return this.auditLogger.getStats(walletAddress);
  }
}
