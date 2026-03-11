import { AgenticWallet } from '../../wallet/agentic-wallet';
import { successResult, errorResult, ToolResult } from '../../ton/types';

export async function createWalletTool(
  wallet: AgenticWallet,
  params: { password: string }
): Promise<ToolResult> {
  try {
    const result = await wallet.createWallet(params.password);

    return successResult({
      status: 'created',
      address: result.address,
      publicKey: result.publicKey,
      mnemonic: result.mnemonic,
      warning: 'Save the mnemonic securely! It will not be shown again in plaintext.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResult(`Failed to create wallet: ${message}`);
  }
}
