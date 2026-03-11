import { Api } from 'tonapi-sdk-js';
import { successResult, errorResult, ToolResult, formatTon } from '../../ton/types';

export const getTransactionsSchema = {
  name: 'get_transactions',
  description: 'Get recent transactions for an address',
  inputSchema: {
    type: 'object' as const,
    properties: {
      address: {
        type: 'string',
        description: 'TON address',
      },
      limit: {
        type: 'number',
        description: 'Number of transactions to return (default: 10, max: 100)',
      },
    },
    required: ['address'],
  },
};

export async function getTransactions(
  api: Api<unknown>,
  params: { address: string; limit?: number }
): Promise<ToolResult> {
  try {
    const limit = Math.min(params.limit || 10, 100);
    const txs = await api.blockchain.getBlockchainAccountTransactions(
      params.address,
      { limit }
    );

    const result = txs.transactions.map((tx: any) => ({
      hash: tx.hash,
      timestamp: tx.utime,
      fee: formatTon(BigInt(tx.total_fees)),
      success: tx.success,
      inMsg: tx.in_msg ? {
        source: tx.in_msg.source?.address,
        value: tx.in_msg.value ? formatTon(BigInt(tx.in_msg.value)) : undefined,
      } : null,
      outMsgs: tx.out_msgs.map((msg: any) => ({
        destination: msg.destination?.address,
        value: msg.value ? formatTon(BigInt(msg.value)) : undefined,
      })),
    }));

    return successResult({ address: params.address, count: result.length, transactions: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResult(`Failed to get transactions: ${message}`);
  }
}
