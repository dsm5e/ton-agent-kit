import { Api } from 'tonapi-sdk-js';
import { successResult, errorResult, ToolResult } from '../../ton/types';

export const getJettonInfoSchema = {
  name: 'get_jetton_info',
  description: 'Get information about a jetton (TON token) by its master contract address',
  inputSchema: {
    type: 'object' as const,
    properties: {
      jetton_address: {
        type: 'string',
        description: 'Jetton master contract address',
      },
    },
    required: ['jetton_address'],
  },
};

export async function getJettonInfo(
  api: Api<unknown>,
  params: { jetton_address: string }
): Promise<ToolResult> {
  try {
    const jetton = await api.jettons.getJettonInfo(params.jetton_address);

    const result = {
      name: jetton.metadata.name,
      symbol: jetton.metadata.symbol,
      description: jetton.metadata.description,
      decimals: jetton.metadata.decimals,
      totalSupply: jetton.total_supply,
      mintable: jetton.mintable,
      address: jetton.metadata.address,
      holdersCount: jetton.holders_count,
    };

    return successResult(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResult(`Failed to get jetton info: ${message}`);
  }
}
