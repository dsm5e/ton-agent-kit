import { TonClient } from '@ton/ton';
import { Address, toNano, internal, beginCell } from '@ton/core';
import { KeyManager } from '../../wallet/key-manager';
import { AuditLogger } from '../../wallet/audit-logger';
import { PolicyEngine } from '../../wallet/policy-engine';
import { successResult, errorResult, ToolResult } from '../../ton/types';
import {
  AgentWallet as AgentWalletContract,
  storeAddAllowedAddress,
  storeRemoveAllowedAddress,
  storeSetSpendingLimit,
  storeTransferTon,
} from '../../../build/AgentWallet/AgentWallet_AgentWallet';

type ContractMethod = 'add_allowed_address' | 'remove_allowed_address' | 'set_spending_limit' | 'transfer_ton' | 'get_balance' | 'get_policy_info' | 'is_allowed';

export async function callContractTool(
  tonClient: TonClient,
  keyManager: KeyManager,
  policyEngine: PolicyEngine,
  auditLogger: AuditLogger,
  params: {
    wallet_address: string;
    password: string;
    contract_address: string;
    method: string;
    args?: Record<string, string>;
  }
): Promise<ToolResult> {
  try {
    const contractAddr = Address.parse(params.contract_address);
    const method = params.method as ContractMethod;
    const args = params.args || {};

    // GET methods — no wallet needed
    if (method === 'get_balance' || method === 'get_policy_info' || method === 'is_allowed') {
      return await callGetMethod(tonClient, contractAddr, method, args);
    }

    // WRITE methods — need wallet
    const keyPair = await keyManager.getKeyPair(params.wallet_address, params.password);
    const { contract } = keyManager.getWalletContract(params.wallet_address, params.password);
    const opened = tonClient.open(contract);
    const seqno = await opened.getSeqno();

    let body;
    switch (method) {
      case 'add_allowed_address':
        body = beginCell().store(storeAddAllowedAddress({
          $$type: 'AddAllowedAddress',
          address: Address.parse(args.address),
        })).endCell();
        break;

      case 'remove_allowed_address':
        body = beginCell().store(storeRemoveAllowedAddress({
          $$type: 'RemoveAllowedAddress',
          address: Address.parse(args.address),
        })).endCell();
        break;

      case 'set_spending_limit':
        body = beginCell().store(storeSetSpendingLimit({
          $$type: 'SetSpendingLimit',
          maxTransaction: toNano(args.max_transaction || '1'),
          dailyLimit: toNano(args.daily_limit || '5'),
        })).endCell();
        break;

      case 'transfer_ton':
        body = beginCell().store(storeTransferTon({
          $$type: 'TransferTon',
          to: Address.parse(args.to),
          amount: toNano(args.amount || '0'),
        })).endCell();
        break;

      default:
        return errorResult(`Unknown method: ${method}. Available: add_allowed_address, remove_allowed_address, set_spending_limit, transfer_ton, get_balance, get_policy_info, is_allowed`);
    }

    await opened.sendTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      messages: [
        internal({
          to: contractAddr,
          value: toNano('0.05'),
          body,
          bounce: true,
        }),
      ],
    });

    auditLogger.log({
      action: `call_contract:${method}`,
      tool: 'call_contract',
      params: { contract: params.contract_address, method, args },
      result: 'success',
    });

    return successResult({
      status: 'sent',
      contract: params.contract_address,
      method,
      args,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    auditLogger.log({
      action: `call_contract:${params.method}`,
      tool: 'call_contract',
      params: { contract: params.contract_address, method: params.method },
      result: 'error',
      reason: message,
    });
    return errorResult(`Failed to call contract: ${message}`);
  }
}

async function callGetMethod(
  tonClient: TonClient,
  contractAddr: Address,
  method: string,
  args: Record<string, string>
): Promise<ToolResult> {
  const contract = tonClient.open(await AgentWalletContract.fromAddress(contractAddr));

  switch (method) {
    case 'get_balance': {
      const balance = await contract.getBalance();
      return successResult({ balance: `${Number(balance) / 1e9} TON`, balanceNano: balance.toString() });
    }
    case 'get_policy_info': {
      const info = await contract.getPolicyInfo();
      return successResult({
        maxTransaction: `${Number(info.maxTransaction) / 1e9} TON`,
        dailyLimit: `${Number(info.dailyLimit) / 1e9} TON`,
        spentToday: `${Number(info.spentToday) / 1e9} TON`,
        lastResetTime: Number(info.lastResetTime),
      });
    }
    case 'is_allowed': {
      if (!args.address) return errorResult('address argument required');
      const allowed = await contract.getIsAllowed(Address.parse(args.address));
      return successResult({ address: args.address, isAllowed: allowed });
    }
    default:
      return errorResult(`Unknown get method: ${method}`);
  }
}
