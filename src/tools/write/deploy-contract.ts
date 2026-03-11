import { TonClient, WalletContractV4 } from '@ton/ton';
import { Address, toNano, internal, Cell, beginCell, stateInit } from '@ton/core';
import { KeyManager } from '../../wallet/key-manager';
import { AuditLogger } from '../../wallet/audit-logger';
import { successResult, errorResult, ToolResult } from '../../ton/types';
import { AgentWallet as AgentWalletContract } from '../../../build/AgentWallet/AgentWallet_AgentWallet';

export async function deployAgentWalletTool(
  tonClient: TonClient,
  keyManager: KeyManager,
  auditLogger: AuditLogger,
  params: {
    wallet_address: string;
    password: string;
    owner_address: string;
    max_transaction_amount?: string;
    daily_spending_limit?: string;
    initial_balance?: string;
  }
): Promise<ToolResult> {
  try {
    const ownerAddress = Address.parse(params.owner_address);
    const maxTx = toNano(params.max_transaction_amount || '1');
    const dailyLimit = toNano(params.daily_spending_limit || '5');
    const initialBalance = toNano(params.initial_balance || '0.5');

    const agentWallet = await AgentWalletContract.fromInit(ownerAddress, maxTx, dailyLimit);

    const keyPair = await keyManager.getKeyPair(params.wallet_address, params.password);
    const { contract } = keyManager.getWalletContract(params.wallet_address, params.password);

    const opened = tonClient.open(contract);
    const seqno = await opened.getSeqno();

    // Deploy by sending a message with stateInit
    await opened.sendTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      messages: [
        internal({
          to: agentWallet.address,
          value: initialBalance,
          init: agentWallet.init!,
          bounce: false,
        }),
      ],
    });

    auditLogger.log({
      action: 'deploy_agent_wallet',
      tool: 'deploy_contract',
      params: {
        owner: params.owner_address,
        contractAddress: agentWallet.address.toString(),
      },
      result: 'success',
    });

    return successResult({
      status: 'deployed',
      contractAddress: agentWallet.address.toString(),
      owner: params.owner_address,
      maxTransactionAmount: `${Number(maxTx) / 1e9} TON`,
      dailySpendingLimit: `${Number(dailyLimit) / 1e9} TON`,
      initialBalance: `${Number(initialBalance) / 1e9} TON`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    auditLogger.log({
      action: 'deploy_agent_wallet',
      tool: 'deploy_contract',
      params: { owner: params.owner_address },
      result: 'error',
      reason: message,
    });
    return errorResult(`Failed to deploy contract: ${message}`);
  }
}
