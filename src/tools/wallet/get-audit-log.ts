import { AgenticWallet } from '../../wallet/agentic-wallet';
import { successResult, errorResult, ToolResult } from '../../ton/types';

export async function getAuditLogTool(
  wallet: AgenticWallet,
  params: {
    wallet_address?: string;
    tool?: string;
    limit?: number;
  }
): Promise<ToolResult> {
  try {
    const logs = wallet.getAuditLog({
      walletAddress: params.wallet_address,
      tool: params.tool,
      limit: params.limit || 50,
    });

    const stats = wallet.getAuditStats(params.wallet_address);

    return successResult({
      stats,
      entries: logs.map((entry) => ({
        ...entry,
        time: new Date(entry.timestamp).toISOString(),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResult(`Failed to get audit log: ${message}`);
  }
}
