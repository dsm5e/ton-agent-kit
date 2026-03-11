import { AgenticWallet } from '../../src/wallet/agentic-wallet';
import { KeyManager } from '../../src/wallet/key-manager';
import { PolicyEngine } from '../../src/wallet/policy-engine';
import { AuditLogger } from '../../src/wallet/audit-logger';
import { createWalletTool } from '../../src/tools/wallet/create-wallet';
import { getWalletInfoTool } from '../../src/tools/wallet/get-wallet-info';
import { setPolicyTool } from '../../src/tools/wallet/set-policy';
import { getAuditLogTool } from '../../src/tools/wallet/get-audit-log';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const mockTonClient = { open: jest.fn() } as any;

describe('Wallet Tools Integration', () => {
  let tmpDir: string;
  let wallet: AgenticWallet;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ton-wallet-tools-test-'));
    const keyManager = new KeyManager(tmpDir);
    const policyEngine = new PolicyEngine(tmpDir);
    const auditLogger = new AuditLogger(tmpDir);
    wallet = new AgenticWallet(mockTonClient, keyManager, policyEngine, auditLogger);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('create_wallet', () => {
    it('should create wallet and return mnemonic', async () => {
      const result = await createWalletTool(wallet, { password: 'test123' });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.status).toBe('created');
      expect(data.address).toBeTruthy();
      expect(data.mnemonic).toHaveLength(24);
      expect(data.warning).toContain('Save the mnemonic');
    });
  });

  describe('get_wallet_info', () => {
    it('should return wallet info with policy', async () => {
      const created = await createWalletTool(wallet, { password: 'test123' });
      const address = JSON.parse(created.content[0].text).address;

      const result = await getWalletInfoTool(wallet, { wallet_address: address });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.exists).toBe(true);
      expect(data.policy).toBeTruthy();
      expect(data.managedWallets).toBe(1);
    });

    it('should show non-existent wallet', async () => {
      const result = await getWalletInfoTool(wallet, { wallet_address: '0:fake' });

      const data = JSON.parse(result.content[0].text);
      expect(data.exists).toBe(false);
    });
  });

  describe('set_policy', () => {
    it('should update wallet policy', async () => {
      const created = await createWalletTool(wallet, { password: 'test123' });
      const address = JSON.parse(created.content[0].text).address;

      const result = await setPolicyTool(wallet, {
        wallet_address: address,
        max_transaction_amount: '2.0',
        daily_spending_limit: '10.0',
        require_confirmation: false,
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.status).toBe('policy_updated');
      expect(data.policy.maxTransactionAmount).toBe('2 TON');
      expect(data.policy.dailySpendingLimit).toBe('10 TON');
      expect(data.policy.requireConfirmation).toBe(false);
    });

    it('should set address whitelist', async () => {
      const created = await createWalletTool(wallet, { password: 'test123' });
      const address = JSON.parse(created.content[0].text).address;

      const result = await setPolicyTool(wallet, {
        wallet_address: address,
        allowed_addresses: ['0:addr1', '0:addr2'],
        blocked_addresses: ['0:bad_addr'],
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.policy.allowedAddresses).toEqual(['0:addr1', '0:addr2']);
      expect(data.policy.blockedAddresses).toEqual(['0:bad_addr']);
    });
  });

  describe('get_audit_log', () => {
    it('should return audit log with stats', async () => {
      // Create wallet generates an audit entry
      await createWalletTool(wallet, { password: 'test123' });

      const result = await getAuditLogTool(wallet, {});

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.stats.total).toBeGreaterThanOrEqual(1);
      expect(data.entries.length).toBeGreaterThanOrEqual(1);
      expect(data.entries[0].time).toBeTruthy(); // ISO timestamp
    });

    it('should filter by tool', async () => {
      await createWalletTool(wallet, { password: 'test1' });
      await createWalletTool(wallet, { password: 'test2' });

      const result = await getAuditLogTool(wallet, { tool: 'create_wallet' });

      const data = JSON.parse(result.content[0].text);
      expect(data.entries.length).toBe(2);
    });
  });
});
