import { AgenticWallet } from '../../wallet/agentic-wallet';
import { successResult, errorResult, ToolResult } from '../../ton/types';

export async function getWalletInfoTool(
  wallet: AgenticWallet,
  params: { wallet_address: string }
): Promise<ToolResult> {
  try {
    const info = wallet.getWalletInfo(params.wallet_address);
    const wallets = wallet.listWallets();

    return successResult({
      ...info,
      managedWallets: wallets.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResult(`Failed to get wallet info: ${message}`);
  }
}
