import { AgenticWallet } from '../../src/wallet/agentic-wallet';
import { KeyManager } from '../../src/wallet/key-manager';
import { PolicyEngine } from '../../src/wallet/policy-engine';
import { AuditLogger } from '../../src/wallet/audit-logger';
import { sendTon } from '../../src/tools/write/send-ton';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Mock TonClient
const mockSendTransfer = jest.fn().mockResolvedValue(undefined);
const mockGetSeqno = jest.fn().mockResolvedValue(1);
const mockOpen = jest.fn().mockReturnValue({
  sendTransfer: mockSendTransfer,
  getSeqno: mockGetSeqno,
});

const mockTonClient = { open: mockOpen } as any;

describe('Write Tools Integration', () => {
  let tmpDir: string;
  let wallet: AgenticWallet;
  let walletAddress: string;
  const password = 'testpass123';

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ton-write-test-'));
    const keyManager = new KeyManager(tmpDir);
    const policyEngine = new PolicyEngine(tmpDir);
    const auditLogger = new AuditLogger(tmpDir);
    wallet = new AgenticWallet(mockTonClient, keyManager, policyEngine, auditLogger);

    // Create a test wallet
    const created = await wallet.createWallet(password);
    walletAddress = created.address;

    // Set permissive policy for testing
    wallet.setPolicy(walletAddress, {
      maxTransactionAmount: BigInt('10000000000'),  // 10 TON
      dailySpendingLimit: BigInt('50000000000'),     // 50 TON
      requireConfirmation: false,
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('send_ton', () => {
    it('should send TON successfully', async () => {
      const result = await sendTon(wallet, {
        wallet_address: walletAddress,
        password,
        destination: 'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2',
        amount: '0.5',
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.status).toBe('sent');
      expect(data.amount).toBe('0.5 TON');
    });

    it('should deny transaction exceeding policy limit', async () => {
      wallet.setPolicy(walletAddress, { maxTransactionAmount: BigInt('100000000') }); // 0.1 TON

      const result = await sendTon(wallet, {
        wallet_address: walletAddress,
        password,
        destination: 'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2',
        amount: '1.0',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('denied');
    });

    it('should deny transaction to blocked address', async () => {
      const blocked = 'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2';
      wallet.setPolicy(walletAddress, { blockedAddresses: [blocked] });

      const result = await sendTon(wallet, {
        wallet_address: walletAddress,
        password,
        destination: blocked,
        amount: '0.1',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('blocked');
    });

    it('should track spending after successful send', async () => {
      await sendTon(wallet, {
        wallet_address: walletAddress,
        password,
        destination: 'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2',
        amount: '1.0',
      });

      const info = wallet.getWalletInfo(walletAddress);
      expect(info.todaySpending).toBe('1 TON');
    });

    it('should deny when daily limit exceeded', async () => {
      wallet.setPolicy(walletAddress, {
        maxTransactionAmount: BigInt('5000000000'),
        dailySpendingLimit: BigInt('2000000000'), // 2 TON
      });

      // First send: 1.5 TON - ok
      await sendTon(wallet, {
        wallet_address: walletAddress,
        password,
        destination: 'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2',
        amount: '1.5',
      });

      // Second send: 1.0 TON - should be denied (1.5 + 1.0 > 2.0)
      const result = await sendTon(wallet, {
        wallet_address: walletAddress,
        password,
        destination: 'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2',
        amount: '1.0',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('daily spending limit');
    });

    it('should log all actions to audit', async () => {
      await sendTon(wallet, {
        wallet_address: walletAddress,
        password,
        destination: 'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2',
        amount: '0.1',
      });

      const logs = wallet.getAuditLog({ tool: 'send_ton' });
      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0].result).toBe('success');
    });
  });
});
