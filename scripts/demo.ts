/**
 * Demo scenario: shows the full ton-agent-kit workflow
 *
 * Run: TONAPI_KEY=... npx ts-node scripts/demo.ts
 */

import { loadConfig } from '../src/config/config';
import { createTonApi } from '../src/ton/api';
import { createTonClient } from '../src/ton/client';
import { KeyManager } from '../src/wallet/key-manager';
import { PolicyEngine } from '../src/wallet/policy-engine';
import { AuditLogger } from '../src/wallet/audit-logger';
import { AgenticWallet } from '../src/wallet/agentic-wallet';
import { getBalance } from '../src/tools/read/get-balance';
import { getTransactions } from '../src/tools/read/get-transactions';
import { resolve } from 'path';

const DIVIDER = '─'.repeat(60);

function log(title: string, data: unknown) {
  console.log(`\n${DIVIDER}`);
  console.log(`  ${title}`);
  console.log(DIVIDER);
  if (typeof data === 'string') {
    console.log(data);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function demo() {
  console.log('\n  TON AGENT KIT — DEMO\n');

  // 1. Setup
  const config = loadConfig();
  const api = createTonApi(config);
  const tonClient = createTonClient(config);
  const dataDir = resolve(process.cwd(), '.data', 'demo');

  const keyManager = new KeyManager(dataDir);
  const policyEngine = new PolicyEngine(dataDir);
  const auditLogger = new AuditLogger(dataDir);
  const wallet = new AgenticWallet(tonClient, keyManager, policyEngine, auditLogger);

  // 2. Read blockchain — get balance of a known address
  log('1. READ: Get balance (TON zero address on testnet)', '');
  const balanceResult = await getBalance(api, {
    address: '0:0000000000000000000000000000000000000000000000000000000000000000',
  });
  console.log(balanceResult.content[0].text);

  // 3. Read blockchain — get transactions
  log('2. READ: Get recent transactions', '');
  const txResult = await getTransactions(api, {
    address: '0:0000000000000000000000000000000000000000000000000000000000000000',
    limit: 3,
  });
  console.log(txResult.content[0].text);

  // 4. Create wallet
  log('3. WALLET: Create a new agent wallet', '');
  const created = await wallet.createWallet('demo-password-123');
  console.log(`  Address:    ${created.address}`);
  console.log(`  Public Key: ${created.publicKey}`);
  console.log(`  Mnemonic:   ${created.mnemonic.slice(0, 3).join(' ')} ... (24 words)`);

  // 5. Set policy
  log('4. POLICY: Set spending limits', '');
  const policy = wallet.setPolicy(created.address, {
    maxTransactionAmount: BigInt('2000000000'),   // 2 TON
    dailySpendingLimit: BigInt('10000000000'),     // 10 TON
    requireConfirmation: true,
    confirmationThreshold: BigInt('1000000000'),   // 1 TON
    blockedAddresses: ['EQBadAddressExample_blocked_for_demo'],
  });
  console.log(`  Max TX:         ${Number(policy.maxTransactionAmount) / 1e9} TON`);
  console.log(`  Daily Limit:    ${Number(policy.dailySpendingLimit) / 1e9} TON`);
  console.log(`  Confirmation:   above ${Number(policy.confirmationThreshold) / 1e9} TON`);
  console.log(`  Blocked:        ${policy.blockedAddresses?.length || 0} addresses`);

  // 6. Policy enforcement demo
  log('5. POLICY CHECK: Try sending 0.5 TON (within limits)', '');
  const check1 = policyEngine.checkTransaction(
    created.address,
    'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2',
    BigInt('500000000')
  );
  console.log(`  Allowed: ${check1.allowed}`);
  console.log(`  Needs confirmation: ${check1.requiresConfirmation || false}`);

  log('6. POLICY CHECK: Try sending 1.5 TON (needs confirmation)', '');
  const check2 = policyEngine.checkTransaction(
    created.address,
    'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2',
    BigInt('1500000000')
  );
  console.log(`  Allowed: ${check2.allowed}`);
  console.log(`  Needs confirmation: ${check2.requiresConfirmation || false}`);

  log('7. POLICY CHECK: Try sending 5 TON (exceeds max tx)', '');
  const check3 = policyEngine.checkTransaction(
    created.address,
    'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2',
    BigInt('5000000000')
  );
  console.log(`  Allowed: ${check3.allowed}`);
  console.log(`  Reason:  ${check3.reason}`);

  log('8. POLICY CHECK: Try sending to blocked address', '');
  const check4 = policyEngine.checkTransaction(
    created.address,
    'EQBadAddressExample_blocked_for_demo',
    BigInt('100000000')
  );
  console.log(`  Allowed: ${check4.allowed}`);
  console.log(`  Reason:  ${check4.reason}`);

  // 7. Audit log
  log('9. AUDIT: Full action log', '');
  const logs = wallet.getAuditLog();
  console.log(`  Total entries: ${logs.length}`);
  logs.forEach((entry, i) => {
    console.log(`  [${i + 1}] ${entry.action} — ${entry.result} — ${new Date(entry.timestamp).toISOString()}`);
  });

  // 8. Stats
  log('10. STATS: Audit summary', '');
  const stats = wallet.getAuditStats();
  console.log(`  Total:   ${stats.total}`);
  console.log(`  Success: ${stats.success}`);
  console.log(`  Denied:  ${stats.denied}`);
  console.log(`  Errors:  ${stats.errors}`);

  console.log(`\n${DIVIDER}`);
  console.log('  DEMO COMPLETE');
  console.log(`  Wallet created, policies set, all checks passed.`);
  console.log(`  To use with Claude Desktop, see README.md`);
  console.log(`${DIVIDER}\n`);
}

demo().catch(console.error);
