import { z } from 'zod';
import { Api } from 'tonapi-sdk-js';
import { successResult, errorResult, ToolResult, formatTon } from '../../ton/types';

export const getBalanceSchema = {
  name: 'get_balance',
  description: 'Get TON and jetton balances for an address',
  inputSchema: {
    type: 'object' as const,
    properties: {
      address: {
        type: 'string',
        description: 'TON address (raw or user-friendly format)',
      },
    },
    required: ['address'],
  },
};

export async function getBalance(
  api: Api<unknown>,
  params: { address: string }
): Promise<ToolResult> {
  try {
    const account = await api.accounts.getAccount(params.address);
    const jettons = await api.accounts.getAccountJettonsBalances(params.address);

    const result = {
      address: account.address,
      balance: formatTon(BigInt(account.balance)),
      balanceNano: account.balance.toString(),
      status: account.status,
      jettons: jettons.balances.map((j) => ({
        name: j.jetton.name,
        symbol: j.jetton.symbol,
        balance: j.balance,
        decimals: j.jetton.decimals,
        jettonAddress: j.jetton.address,
      })),
    };

    return successResult(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResult(`Failed to get balance: ${message}`);
  }
}
