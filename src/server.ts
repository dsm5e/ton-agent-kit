import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Api } from 'tonapi-sdk-js';
import { TonClient } from '@ton/ton';
import { z } from 'zod';

import { getBalance, getBalanceSchema } from './tools/read/get-balance';
import { getTransactions, getTransactionsSchema } from './tools/read/get-transactions';
import { getJettonInfo, getJettonInfoSchema } from './tools/read/get-jetton-info';
import { getContractInfo, getContractInfoSchema } from './tools/read/get-contract-info';

export function createServer(api: Api<unknown>, tonClient: TonClient): McpServer {
  const server = new McpServer({
    name: 'ton-agent-kit',
    version: '0.1.0',
  });

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

  return server;
}
