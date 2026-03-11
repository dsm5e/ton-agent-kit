import { TonClient } from '@ton/ton';
import { AppConfig } from '../config/config';

export function createTonClient(config: AppConfig): TonClient {
  const endpoint = config.network === 'testnet'
    ? 'https://testnet.toncenter.com/api/v2/jsonRPC'
    : 'https://toncenter.com/api/v2/jsonRPC';

  return new TonClient({ endpoint });
}
