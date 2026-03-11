/**
 * Demo: Agent-to-Agent payment on TON
 *
 * Two AI agents autonomously exchange TON:
 * - Agent A (Data Provider) — sells data, receives payment
 * - Agent B (Data Buyer) — buys data, sends payment
 *
 * Both operate within their policy limits.
 *
 * Run: TONAPI_KEY=... npx ts-node scripts/demo-agent-to-agent.ts
 */

import { KeyManager } from '../src/wallet/key-manager';
import { PolicyEngine } from '../src/wallet/policy-engine';
import { AuditLogger } from '../src/wallet/audit-logger';
import { AgenticWallet } from '../src/wallet/agentic-wallet';
import { resolve } from 'path';
import * as fs from 'fs';

const DIVIDER = '═'.repeat(60);
const LINE = '─'.repeat(60);

function log(icon: string, msg: string) {
  console.log(`  ${icon}  ${msg}`);
}

function section(title: string) {
  console.log(`\n${LINE}`);
  console.log(`  ${title}`);
  console.log(LINE);
}

// Simulated "services" that agents provide
function simulateDataRequest(): { query: string; price: bigint } {
  return {
    query: 'TON DeFi analytics report Q1 2026',
    price: BigInt('500000000'), // 0.5 TON
  };
}

function simulateDataDelivery(): { data: string; hash: string } {
  return {
    data: '[Analytics Report: 142 protocols, $2.1B TVL, 18M users...]',
    hash: 'sha256:a1b2c3d4e5f6...',
  };
}

async function demo() {
  console.log(`\n${DIVIDER}`);
  console.log('  AGENT-TO-AGENT PAYMENT DEMO');
  console.log('  Two AI agents trading data for TON');
  console.log(DIVIDER);

  // Setup separate data dirs for each agent (isolated wallets)
  const dataDir = resolve(process.cwd(), '.data', 'a2a-demo');
  const agentADir = resolve(dataDir, 'agent-a');
  const agentBDir = resolve(dataDir, 'agent-b');

  // Clean previous demo data
  if (fs.existsSync(dataDir)) {
    fs.rmSync(dataDir, { recursive: true, force: true });
  }

  // Mock TonClient — simulates successful transactions
  const txLog: Array<{ from: string; to: string; amount: bigint; time: number }> = [];
  const balances: Record<string, bigint> = {};

  const mockTonClient = {
    open: (contract: any) => ({
      getSeqno: async () => 1,
      sendTransfer: async (params: any) => {
        const msg = params.messages[0];
        const from = contract.address?.toString() || 'unknown';
        const to = msg.info?.dest?.toString() || msg.to?.toString() || 'unknown';
        const amount = msg.info?.value?.coins || msg.value || BigInt(0);

        txLog.push({ from, to, amount, time: Date.now() });

        // Update simulated balances
        balances[from] = (balances[from] || BigInt(0)) - amount;
        balances[to] = (balances[to] || BigInt(0)) + amount;
      },
    }),
  } as any;

  // === CREATE AGENT A (Data Provider) ===

  section('STEP 1: Agent A (Data Provider) — Setup');

  const kmA = new KeyManager(agentADir);
  const peA = new PolicyEngine(agentADir);
  const alA = new AuditLogger(agentADir);
  const agentA = new AgenticWallet(mockTonClient, kmA, peA, alA);

  const walletA = await agentA.createWallet('agent-a-secret');
  balances[walletA.address] = BigInt('10000000000'); // Simulate 10 TON

  agentA.setPolicy(walletA.address, {
    maxTransactionAmount: BigInt('2000000000'),   // 2 TON max
    dailySpendingLimit: BigInt('5000000000'),      // 5 TON/day
    requireConfirmation: false,
  });

  log('🤖', `Agent A wallet: ${walletA.address.slice(0, 20)}...`);
  log('💰', `Balance: 10 TON (simulated)`);
  log('📋', `Policy: max 2 TON/tx, 5 TON/day`);
  log('🏪', `Role: Data Provider — sells analytics reports`);

  // === CREATE AGENT B (Data Buyer) ===

  section('STEP 2: Agent B (Data Buyer) — Setup');

  const kmB = new KeyManager(agentBDir);
  const peB = new PolicyEngine(agentBDir);
  const alB = new AuditLogger(agentBDir);
  const agentB = new AgenticWallet(mockTonClient, kmB, peB, alB);

  const walletB = await agentB.createWallet('agent-b-secret');
  balances[walletB.address] = BigInt('10000000000'); // Simulate 10 TON

  agentB.setPolicy(walletB.address, {
    maxTransactionAmount: BigInt('1000000000'),   // 1 TON max
    dailySpendingLimit: BigInt('3000000000'),      // 3 TON/day
    allowedAddresses: [walletA.address],           // Can only pay Agent A
    requireConfirmation: false,
  });

  log('🤖', `Agent B wallet: ${walletB.address.slice(0, 20)}...`);
  log('💰', `Balance: 10 TON (simulated)`);
  log('📋', `Policy: max 1 TON/tx, 3 TON/day, whitelist: [Agent A]`);
  log('🛒', `Role: Data Buyer — purchases analytics`);

  // === TRANSACTION 1: Agent B requests data, Agent A quotes price ===

  section('STEP 3: Negotiation');

  const request = simulateDataRequest();
  log('🛒', `Agent B requests: "${request.query}"`);
  log('🏪', `Agent A quotes: ${Number(request.price) / 1e9} TON`);

  // Agent B checks if it can afford it
  const policyCheck = peB.checkTransaction(walletB.address, walletA.address, request.price);
  log('🔒', `Agent B policy check: ${policyCheck.allowed ? 'APPROVED' : 'DENIED'}`);

  if (!policyCheck.allowed) {
    log('❌', `Deal cancelled: ${policyCheck.reason}`);
    return;
  }

  // === TRANSACTION 2: Agent B pays Agent A ===

  section('STEP 4: Payment — Agent B sends 0.5 TON to Agent A');

  const payResult = await agentB.sendTon(
    walletB.address,
    'agent-b-secret',
    walletA.address,
    request.price,
    'Payment for analytics report'
  );

  if (payResult.success) {
    log('✅', `Payment sent: ${Number(request.price) / 1e9} TON`);
    log('📊', `Agent B daily spending: ${agentB.getWalletInfo(walletB.address).todaySpending}`);
  } else {
    log('❌', `Payment failed: ${payResult.error}`);
    return;
  }

  // === TRANSACTION 3: Agent A verifies payment and delivers ===

  section('STEP 5: Delivery — Agent A delivers data');

  // In real scenario, Agent A would call get_transactions to verify
  const lastTx = txLog[txLog.length - 1];
  log('🔍', `Agent A sees incoming tx: ${Number(lastTx.amount) / 1e9} TON from ${lastTx.from.slice(0, 20)}...`);

  const delivery = simulateDataDelivery();
  log('📦', `Agent A delivers: ${delivery.data.slice(0, 50)}...`);
  log('🔐', `Data hash: ${delivery.hash}`);

  // === TRANSACTION 4: Try a second purchase ===

  section('STEP 6: Second purchase — Agent B buys again');

  const payResult2 = await agentB.sendTon(
    walletB.address,
    'agent-b-secret',
    walletA.address,
    BigInt('800000000'), // 0.8 TON
  );

  log('✅', `Second payment: ${payResult2.success ? '0.8 TON sent' : 'FAILED: ' + payResult2.error}`);
  log('📊', `Agent B daily spending: ${agentB.getWalletInfo(walletB.address).todaySpending}`);

  // === TRANSACTION 5: Try to exceed limits ===

  section('STEP 7: Policy enforcement — Agent B tries to overspend');

  // Try to send 2 TON (exceeds 1 TON max tx limit)
  const payResult3 = await agentB.sendTon(
    walletB.address,
    'agent-b-secret',
    walletA.address,
    BigInt('2000000000'), // 2 TON — exceeds max tx
  );

  log('🚫', `2 TON payment: ${payResult3.success ? 'SENT' : 'BLOCKED'}`);
  log('📋', `Reason: ${payResult3.error}`);

  // Try to send to unknown address (not in whitelist)
  const payResult4 = await agentB.sendTon(
    walletB.address,
    'agent-b-secret',
    'EQDrandomUnknownAddress_not_in_whitelist_12345678',
    BigInt('100000000'),
  );

  log('🚫', `Payment to unknown address: ${payResult4.success ? 'SENT' : 'BLOCKED'}`);
  log('📋', `Reason: ${payResult4.error}`);

  // === AUDIT LOGS ===

  section('STEP 8: Audit — Full transaction history');

  console.log('\n  Agent A audit:');
  const logsA = agentA.getAuditLog();
  logsA.forEach((e, i) => {
    log('  ', `[${i + 1}] ${e.action} — ${e.result}${e.amount ? ' — ' + e.amount : ''}`);
  });

  console.log('\n  Agent B audit:');
  const logsB = agentB.getAuditLog();
  logsB.forEach((e, i) => {
    log('  ', `[${i + 1}] ${e.action} — ${e.result}${e.amount ? ' — ' + e.amount : ''}${e.reason ? ' — ' + e.reason : ''}`);
  });

  // === SUMMARY ===

  section('STEP 9: Summary');

  const statsA = agentA.getAuditStats();
  const statsB = agentB.getAuditStats();

  console.log('\n  Agent A (Data Provider):');
  log('📊', `Actions: ${statsA.total} total, ${statsA.success} success`);
  log('💰', `Received: 1.3 TON from 2 sales`);

  console.log('\n  Agent B (Data Buyer):');
  log('📊', `Actions: ${statsB.total} total, ${statsB.success} success, ${statsB.denied} denied`);
  log('💰', `Spent: ${agentB.getWalletInfo(walletB.address).todaySpending}`);
  log('🚫', `Blocked: ${statsB.denied} transactions by policy engine`);

  console.log(`\n${DIVIDER}`);
  console.log('  DEMO COMPLETE');
  console.log('  Two agents traded autonomously within safe policy limits.');
  console.log('  No human intervention needed. Full audit trail available.');
  console.log(DIVIDER);
  console.log();

  // Cleanup
  fs.rmSync(dataDir, { recursive: true, force: true });
}

demo().catch(console.error);
