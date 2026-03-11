import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Api } from 'tonapi-sdk-js';
import { TonClient } from '@ton/ton';
import { z } from 'zod';

import { getBalance } from './tools/read/get-balance';
import { getTransactions } from './tools/read/get-transactions';
import { getJettonInfo } from './tools/read/get-jetton-info';
import { getContractInfo } from './tools/read/get-contract-info';
import { sendTon } from './tools/write/send-ton';
import { sendJetton } from './tools/write/send-jetton';
import { createWalletTool } from './tools/wallet/create-wallet';
import { getWalletInfoTool } from './tools/wallet/get-wallet-info';
import { setPolicyTool } from './tools/wallet/set-policy';
import { getAuditLogTool } from './tools/wallet/get-audit-log';

import { AgenticWallet } from './wallet/agentic-wallet';
import { KeyManager } from './wallet/key-manager';
import { PolicyEngine } from './wallet/policy-engine';
import { AuditLogger } from './wallet/audit-logger';

export function createServer(
  api: Api<unknown>,
  tonClient: TonClient,
  dataDir: string
): McpServer {
  const server = new McpServer({
    name: 'ton-agent-kit',
    version: '0.1.0',
  });

  // Initialize wallet components
  const keyManager = new KeyManager(dataDir);
  const policyEngine = new PolicyEngine(dataDir);
  const auditLogger = new AuditLogger(dataDir);
  const agenticWallet = new AgenticWallet(tonClient, keyManager, policyEngine, auditLogger);

  // === Read Tools ===

  server.tool(
    'get_balance',
    'Get TON and jetton balances for an address',
    { address: z.string().describe('TON address (raw or user-friendly format)') },
    async ({ address }) => getBalance(api, { address })
  );

  server.tool(
    'get_transactions',
    'Get recent transactions for an address',
    {
      address: z.string().describe('TON address'),
      limit: z.number().optional().describe('Number of transactions (default: 10, max: 100)'),
    },
    async ({ address, limit }) => getTransactions(api, { address, limit })
  );

  server.tool(
    'get_jetton_info',
    'Get information about a jetton (TON token)',
    { jetton_address: z.string().describe('Jetton master contract address') },
    async ({ jetton_address }) => getJettonInfo(api, { jetton_address })
  );

  server.tool(
    'get_contract_info',
    'Get smart contract information',
    { address: z.string().describe('Smart contract address') },
    async ({ address }) => getContractInfo(api, { address })
  );

  // === Write Tools ===

  server.tool(
    'send_ton',
    'Send TON to an address. Subject to wallet policy checks (limits, whitelist, etc.)',
    {
      wallet_address: z.string().describe('Sender wallet address (must be managed by this agent)'),
      password: z.string().describe('Wallet password for signing'),
      destination: z.string().describe('Recipient TON address'),
      amount: z.string().describe('Amount in TON (e.g. "0.5" or "1.0")'),
      comment: z.string().optional().describe('Optional transaction comment'),
    },
    async (params) => sendTon(agenticWallet, params)
  );

  server.tool(
    'send_jetton',
    'Send jettons (TON tokens) to an address. Subject to wallet policy checks.',
    {
      wallet_address: z.string().describe('Sender wallet address'),
      password: z.string().describe('Wallet password for signing'),
      jetton_wallet_address: z.string().describe('Jetton wallet contract address (not master address)'),
      destination: z.string().describe('Recipient TON address'),
      amount: z.string().describe('Amount of jettons to send'),
      jetton_decimals: z.number().optional().describe('Jetton decimals (default: 9)'),
    },
    async (params) => sendJetton(tonClient, keyManager, policyEngine, auditLogger, params)
  );

  // === Wallet Tools ===

  server.tool(
    'create_wallet',
    'Create a new TON wallet managed by this agent with encrypted key storage',
    {
      password: z.string().describe('Password to encrypt the wallet keys'),
    },
    async (params) => createWalletTool(agenticWallet, params)
  );

  server.tool(
    'get_wallet_info',
    'Get wallet info including balance, policy, and spending stats',
    {
      wallet_address: z.string().describe('Wallet address to query'),
    },
    async (params) => getWalletInfoTool(agenticWallet, params)
  );

  server.tool(
    'set_policy',
    'Set spending policy for a wallet (limits, whitelist, confirmation thresholds)',
    {
      wallet_address: z.string().describe('Wallet address'),
      max_transaction_amount: z.string().optional().describe('Max single transaction in TON (e.g. "1.0")'),
      daily_spending_limit: z.string().optional().describe('Daily spending limit in TON (e.g. "5.0")'),
      allowed_addresses: z.array(z.string()).optional().describe('Whitelist of allowed destination addresses'),
      blocked_addresses: z.array(z.string()).optional().describe('Blacklist of blocked addresses'),
      allowed_jettons: z.array(z.string()).optional().describe('Whitelist of allowed jetton addresses'),
      require_confirmation: z.boolean().optional().describe('Require confirmation for large transactions'),
      confirmation_threshold: z.string().optional().describe('Amount threshold for confirmation in TON'),
    },
    async (params) => setPolicyTool(agenticWallet, params)
  );

  server.tool(
    'get_audit_log',
    'Get audit log of all agent actions (transactions, policy changes, etc.)',
    {
      wallet_address: z.string().optional().describe('Filter by wallet address'),
      tool: z.string().optional().describe('Filter by tool name'),
      limit: z.number().optional().describe('Max entries to return (default: 50)'),
    },
    async (params) => getAuditLogTool(agenticWallet, params)
  );

  return server;
}
