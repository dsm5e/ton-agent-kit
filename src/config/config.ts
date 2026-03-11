import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';

dotenvConfig({ path: resolve(process.cwd(), '.env') });

export interface AppConfig {
  tonApiKey: string;
  network: 'mainnet' | 'testnet';
  dataDir: string;
}

export function loadConfig(): AppConfig {
  const tonApiKey = process.env.TONAPI_KEY;
  if (!tonApiKey) {
    throw new Error('TONAPI_KEY environment variable is required');
  }

  const network = (process.env.TON_NETWORK || 'testnet') as 'mainnet' | 'testnet';
  if (network !== 'mainnet' && network !== 'testnet') {
    throw new Error('TON_NETWORK must be "mainnet" or "testnet"');
  }

  const dataDir = process.env.DATA_DIR || resolve(process.cwd(), '.data');

  return { tonApiKey, network, dataDir };
}
