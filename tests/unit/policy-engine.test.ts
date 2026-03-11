import { PolicyEngine } from '../../src/wallet/policy-engine';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('PolicyEngine', () => {
  let engine: PolicyEngine;
  let tmpDir: string;
  const wallet = '0:test_wallet_address';

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ton-policy-test-'));
    engine = new PolicyEngine(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('getPolicy / setPolicy', () => {
    it('should return default policy for unknown wallet', () => {
      const policy = engine.getPolicy(wallet);
      expect(policy.maxTransactionAmount).toBe(BigInt('1000000000'));
      expect(policy.dailySpendingLimit).toBe(BigInt('5000000000'));
      expect(policy.requireConfirmation).toBe(true);
    });

    it('should merge partial policy with defaults', () => {
      engine.setPolicy(wallet, { maxTransactionAmount: BigInt('2000000000') });
      const policy = engine.getPolicy(wallet);

      expect(policy.maxTransactionAmount).toBe(BigInt('2000000000'));
      expect(policy.dailySpendingLimit).toBe(BigInt('5000000000')); // default
    });

    it('should persist policies to disk', () => {
      engine.setPolicy(wallet, { maxTransactionAmount: BigInt('999') });

      const newEngine = new PolicyEngine(tmpDir);
      const policy = newEngine.getPolicy(wallet);
      expect(policy.maxTransactionAmount).toBe(BigInt('999'));
    });
  });

  describe('checkTransaction', () => {
    it('should allow transaction within limits', () => {
      const result = engine.checkTransaction(wallet, '0:dest', BigInt('500000000'));
      expect(result.allowed).toBe(true);
    });

    it('should deny transaction exceeding max amount', () => {
      engine.setPolicy(wallet, { maxTransactionAmount: BigInt('100') });
      const result = engine.checkTransaction(wallet, '0:dest', BigInt('200'));

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('exceeds max transaction limit');
    });

    it('should deny transaction exceeding daily limit', () => {
      engine.setPolicy(wallet, {
        maxTransactionAmount: BigInt('1000'),
        dailySpendingLimit: BigInt('500'),
      });

      engine.recordSpending(wallet, BigInt('400'));
      const result = engine.checkTransaction(wallet, '0:dest', BigInt('200'));

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('daily spending limit');
    });

    it('should deny transaction to blocked address', () => {
      engine.setPolicy(wallet, { blockedAddresses: ['0:blocked'] });
      const result = engine.checkTransaction(wallet, '0:blocked', BigInt('100'));

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('blocked');
    });

    it('should deny transaction to non-whitelisted address', () => {
      engine.setPolicy(wallet, { allowedAddresses: ['0:allowed1', '0:allowed2'] });

      const allowed = engine.checkTransaction(wallet, '0:allowed1', BigInt('100'));
      expect(allowed.allowed).toBe(true);

      const denied = engine.checkTransaction(wallet, '0:other', BigInt('100'));
      expect(denied.allowed).toBe(false);
      expect(denied.reason).toContain('not in the allowed');
    });

    it('should flag confirmation requirement', () => {
      engine.setPolicy(wallet, {
        requireConfirmation: true,
        confirmationThreshold: BigInt('100'),
      });

      const small = engine.checkTransaction(wallet, '0:dest', BigInt('50'));
      expect(small.allowed).toBe(true);
      expect(small.requiresConfirmation).toBeUndefined();

      const large = engine.checkTransaction(wallet, '0:dest', BigInt('200'));
      expect(large.allowed).toBe(true);
      expect(large.requiresConfirmation).toBe(true);
    });
  });

  describe('checkJettonTransfer', () => {
    it('should allow when no jetton whitelist', () => {
      const result = engine.checkJettonTransfer(wallet, '0:jetton', '0:dest');
      expect(result.allowed).toBe(true);
    });

    it('should deny non-whitelisted jetton', () => {
      engine.setPolicy(wallet, { allowedJettons: ['0:jetton_a'] });

      const allowed = engine.checkJettonTransfer(wallet, '0:jetton_a', '0:dest');
      expect(allowed.allowed).toBe(true);

      const denied = engine.checkJettonTransfer(wallet, '0:jetton_b', '0:dest');
      expect(denied.allowed).toBe(false);
    });

    it('should deny transfer to blocked address', () => {
      engine.setPolicy(wallet, { blockedAddresses: ['0:blocked'] });
      const result = engine.checkJettonTransfer(wallet, '0:jetton', '0:blocked');
      expect(result.allowed).toBe(false);
    });
  });

  describe('spending tracking', () => {
    it('should track daily spending', () => {
      expect(engine.getTodaySpending(wallet)).toBe(BigInt(0));

      engine.recordSpending(wallet, BigInt('100'));
      engine.recordSpending(wallet, BigInt('200'));

      expect(engine.getTodaySpending(wallet)).toBe(BigInt('300'));
    });

    it('should persist spending to disk', () => {
      engine.recordSpending(wallet, BigInt('500'));

      const newEngine = new PolicyEngine(tmpDir);
      expect(newEngine.getTodaySpending(wallet)).toBe(BigInt('500'));
    });
  });
});
