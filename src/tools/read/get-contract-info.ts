import { Api } from 'tonapi-sdk-js';
import { successResult, errorResult, ToolResult, formatTon } from '../../ton/types';

export const getContractInfoSchema = {
  name: 'get_contract_info',
  description: 'Get smart contract information including code, data, and methods',
  inputSchema: {
    type: 'object' as const,
    properties: {
      address: {
        type: 'string',
        description: 'Smart contract address',
      },
    },
    required: ['address'],
  },
};

export async function getContractInfo(
  api: Api<unknown>,
  params: { address: string }
): Promise<ToolResult> {
  try {
    const account = await api.accounts.getAccount(params.address);

    const result: Record<string, unknown> = {
      address: account.address,
      balance: formatTon(BigInt(account.balance)),
      status: account.status,
      lastActivity: account.last_activity,
      interfaces: account.interfaces,
    };

    if (account.status === 'active') {
      try {
        const methods = await api.blockchain.execGetMethodForBlockchainAccount(
          params.address,
          'get_contract_data'
        );
        result.getMethods = methods;
      } catch {
        // Contract may not have this method
      }
    }

    return successResult(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResult(`Failed to get contract info: ${message}`);
  }
}
