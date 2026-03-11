import { Api, HttpClient } from 'tonapi-sdk-js';
import { AppConfig } from '../config/config';

export function createTonApi(config: AppConfig): Api<unknown> {
  const baseUrl = config.network === 'testnet'
    ? 'https://testnet.tonapi.io'
    : 'https://tonapi.io';

  const httpClient = new HttpClient({
    baseUrl,
    baseApiParams: {
      headers: {
        Authorization: `Bearer ${config.tonApiKey}`,
        'Content-Type': 'application/json',
      },
    },
  });

  return new Api(httpClient);
}
