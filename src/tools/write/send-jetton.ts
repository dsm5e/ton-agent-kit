import { AgenticWallet } from '../../wallet/agentic-wallet';
import { successResult, errorResult, ToolResult, parseTon } from '../../ton/types';
import { TonClient } from '@ton/ton';
import { Address, beginCell, internal, toNano } from '@ton/core';
import { KeyManager } from '../../wallet/key-manager';
import { PolicyEngine } from '../../wallet/policy-engine';
import { AuditLogger } from '../../wallet/audit-logger';

export const sendJettonSchema = {
  name: 'send_jetton',
  description: 'Send jettons (TON tokens) to an address. Subject to wallet policy checks.',
};

export async function sendJetton(
  tonClient: TonClient,
  keyManager: KeyManager,
  policyEngine: PolicyEngine,
  auditLogger: AuditLogger,
  params: {
    wallet_address: string;
    password: string;
    jetton_wallet_address: string;
    destination: string;
    amount: string;
    jetton_decimals?: number;
  }
): Promise<ToolResult> {
  try {
    // Policy check for jetton transfer
    const policyCheck = policyEngine.checkJettonTransfer(
      params.wallet_address,
      params.jetton_wallet_address,
      params.destination
    );

    if (!policyCheck.allowed) {
      auditLogger.log({
        action: 'send_jetton',
        tool: 'send_jetton',
        params: { ...params, password: '***' },
        result: 'denied',
        reason: policyCheck.reason,
        destination: params.destination,
      });
      return errorResult(`Jetton transfer denied: ${policyCheck.reason}`);
    }

    const decimals = params.jetton_decimals || 9;
    const jettonAmount = BigInt(Math.floor(Number(params.amount) * 10 ** decimals));

    const keyPair = await keyManager.getKeyPair(params.wallet_address, params.password);
    const { contract } = keyManager.getWalletContract(params.wallet_address, params.password);

    const opened = tonClient.open(contract);
    const seqno = await opened.getSeqno();

    // Build jetton transfer message body
    const forwardPayload = beginCell().endCell();
    const jettonTransferBody = beginCell()
      .storeUint(0xf8a7ea5, 32)   // op: jetton transfer
      .storeUint(0, 64)            // query_id
      .storeCoins(jettonAmount)    // amount of jettons
      .storeAddress(Address.parse(params.destination))  // destination
      .storeAddress(Address.parse(params.wallet_address)) // response_destination
      .storeBit(false)              // no custom payload
      .storeCoins(toNano('0.01'))   // forward_ton_amount
      .storeBit(false)              // no forward payload
      .endCell();

    await opened.sendTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      messages: [
        internal({
          to: Address.parse(params.jetton_wallet_address),
          value: toNano('0.05'),  // gas for jetton transfer
          body: jettonTransferBody,
          bounce: true,
        }),
      ],
    });

    auditLogger.log({
      action: 'send_jetton',
      tool: 'send_jetton',
      params: { ...params, password: '***' },
      result: 'success',
      destination: params.destination,
      amount: params.amount,
    });

    return successResult({
      status: 'sent',
      from: params.wallet_address,
      to: params.destination,
      jettonWallet: params.jetton_wallet_address,
      amount: params.amount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    auditLogger.log({
      action: 'send_jetton',
      tool: 'send_jetton',
      params: { ...params, password: '***' },
      result: 'error',
      reason: message,
    });

    return errorResult(`Failed to send jetton: ${message}`);
  }
}
