import { AuditLogEntry } from '../ton/types';
import * as fs from 'fs';
import * as path from 'path';

export class AuditLogger {
  private logFile: string;
  private dataDir: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.logFile = path.join(dataDir, 'audit.json');
    this.ensureDataDir();
  }

  private ensureDataDir(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  log(entry: Omit<AuditLogEntry, 'timestamp'>): AuditLogEntry {
    const fullEntry: AuditLogEntry = {
      ...entry,
      timestamp: Date.now(),
    };

    const logs = this.loadLogs();
    logs.push(fullEntry);
    fs.writeFileSync(this.logFile, JSON.stringify(logs, null, 2));

    return fullEntry;
  }

  getLogs(options?: {
    walletAddress?: string;
    tool?: string;
    result?: 'success' | 'denied' | 'error';
    limit?: number;
    since?: number;
  }): AuditLogEntry[] {
    let logs = this.loadLogs();

    if (options?.walletAddress) {
      logs = logs.filter(
        (l) =>
          l.params.walletAddress === options.walletAddress ||
          l.params.address === options.walletAddress
      );
    }

    if (options?.tool) {
      logs = logs.filter((l) => l.tool === options.tool);
    }

    if (options?.result) {
      logs = logs.filter((l) => l.result === options.result);
    }

    if (options?.since) {
      logs = logs.filter((l) => l.timestamp >= options.since!);
    }

    // Most recent first
    logs.sort((a, b) => b.timestamp - a.timestamp);

    if (options?.limit) {
      logs = logs.slice(0, options.limit);
    }

    return logs;
  }

  getStats(walletAddress?: string): {
    total: number;
    success: number;
    denied: number;
    errors: number;
  } {
    const logs = this.getLogs({ walletAddress });
    return {
      total: logs.length,
      success: logs.filter((l) => l.result === 'success').length,
      denied: logs.filter((l) => l.result === 'denied').length,
      errors: logs.filter((l) => l.result === 'error').length,
    };
  }

  clear(): void {
    fs.writeFileSync(this.logFile, '[]');
  }

  private loadLogs(): AuditLogEntry[] {
    if (!fs.existsSync(this.logFile)) {
      return [];
    }
    const content = fs.readFileSync(this.logFile, 'utf8');
    return JSON.parse(content);
  }
}
