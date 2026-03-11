import { z } from 'zod';
import { AgenticWallet } from '../../wallet/agentic-wallet';
import { successResult, errorResult, ToolResult, parseTon, formatTon } from '../../ton/types';

export const sendTonSchema = {
  name: 'send_ton',
  description: 'Send TON to an address. Subject to wallet policy checks (limits, whitelist, etc.)',
};

export async function sendTon(
  wallet: AgenticWallet,
  params: {
    wallet_address: string;
    password: string;
    destination: string;
    amount: string;
    comment?: string;
  }
): Promise<ToolResult> {
  try {
    const amount = parseTon(params.amount);

    const result = await wallet.sendTon(
      params.wallet_address,
      params.password,
      params.destination,
      amount,
      params.comment
    );

    if (!result.success) {
      return errorResult(`Transaction denied: ${result.error}`);
    }

    const response: Record<string, unknown> = {
      status: 'sent',
      from: params.wallet_address,
      to: params.destination,
      amount: formatTon(amount),
    };

    if (result.policyCheck.requiresConfirmation) {
      response.warning = 'Transaction exceeded confirmation threshold but was allowed';
    }

    return successResult(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResult(`Failed to send TON: ${message}`);
  }
}
