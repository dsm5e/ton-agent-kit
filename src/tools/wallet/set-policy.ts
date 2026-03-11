import { AgenticWallet } from '../../wallet/agentic-wallet';
import { successResult, errorResult, ToolResult, WalletPolicy } from '../../ton/types';

export async function setPolicyTool(
  wallet: AgenticWallet,
  params: {
    wallet_address: string;
    max_transaction_amount?: string;
    daily_spending_limit?: string;
    allowed_addresses?: string[];
    blocked_addresses?: string[];
    allowed_jettons?: string[];
    require_confirmation?: boolean;
    confirmation_threshold?: string;
  }
): Promise<ToolResult> {
  try {
    const policyUpdate: Partial<WalletPolicy> = {};

    if (params.max_transaction_amount !== undefined) {
      policyUpdate.maxTransactionAmount = BigInt(Math.floor(Number(params.max_transaction_amount) * 1e9));
    }
    if (params.daily_spending_limit !== undefined) {
      policyUpdate.dailySpendingLimit = BigInt(Math.floor(Number(params.daily_spending_limit) * 1e9));
    }
    if (params.allowed_addresses !== undefined) {
      policyUpdate.allowedAddresses = params.allowed_addresses;
    }
    if (params.blocked_addresses !== undefined) {
      policyUpdate.blockedAddresses = params.blocked_addresses;
    }
    if (params.allowed_jettons !== undefined) {
      policyUpdate.allowedJettons = params.allowed_jettons;
    }
    if (params.require_confirmation !== undefined) {
      policyUpdate.requireConfirmation = params.require_confirmation;
    }
    if (params.confirmation_threshold !== undefined) {
      policyUpdate.confirmationThreshold = BigInt(Math.floor(Number(params.confirmation_threshold) * 1e9));
    }

    const result = wallet.setPolicy(params.wallet_address, policyUpdate);

    return successResult({
      status: 'policy_updated',
      wallet: params.wallet_address,
      policy: {
        maxTransactionAmount: `${Number(result.maxTransactionAmount) / 1e9} TON`,
        dailySpendingLimit: `${Number(result.dailySpendingLimit) / 1e9} TON`,
        allowedAddresses: result.allowedAddresses || [],
        blockedAddresses: result.blockedAddresses || [],
        allowedJettons: result.allowedJettons || [],
        requireConfirmation: result.requireConfirmation,
        confirmationThreshold: `${Number(result.confirmationThreshold) / 1e9} TON`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResult(`Failed to set policy: ${message}`);
  }
}
