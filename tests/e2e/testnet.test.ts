/**
 * E2E tests against TON testnet.
 *
 * These tests use real TONAPI to verify read tools work correctly.
 * Write tests require a funded testnet wallet and are skipped by default.
 *
 * Run with: TONAPI_KEY=... npx jest tests/e2e
 */

import { Api, HttpClient } from 'tonapi-sdk-js';
import { getBalance } from '../../src/tools/read/get-balance';
import { getTransactions } from '../../src/tools/read/get-transactions';
import { getJettonInfo } from '../../src/tools/read/get-jetton-info';
import { getContractInfo } from '../../src/tools/read/get-contract-info';

// Known testnet addresses for testing
const TESTNET_KNOWN_ADDRESS = '0:0000000000000000000000000000000000000000000000000000000000000000'; // Zero address (always exists)
const USDT_JETTON_MAINNET = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs'; // USDT on mainnet

const apiKey = process.env.TONAPI_KEY;
const skipE2E = !apiKey;

function createTestApi(): Api<unknown> {
  const httpClient = new HttpClient({
    baseUrl: 'https://testnet.tonapi.io',
    baseApiParams: {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    },
  });
  return new Api(httpClient);
}

function createMainnetApi(): Api<unknown> {
  const httpClient = new HttpClient({
    baseUrl: 'https://tonapi.io',
    baseApiParams: {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    },
  });
  return new Api(httpClient);
}

const describeE2E = skipE2E ? describe.skip : describe;

describeE2E('E2E: Read Tools on Testnet', () => {
  let api: Api<unknown>;

  beforeAll(() => {
    api = createTestApi();
  });

  it('should get balance of a known testnet address', async () => {
    const result = await getBalance(api, { address: TESTNET_KNOWN_ADDRESS });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.address).toBeTruthy();
    expect(data.balance).toContain('TON');
    expect(data.status).toBeTruthy();
  }, 15000);

  it('should get transactions for a testnet address', async () => {
    const result = await getTransactions(api, { address: TESTNET_KNOWN_ADDRESS, limit: 3 });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.transactions).toBeDefined();
    expect(data.count).toBeLessThanOrEqual(3);
  }, 15000);

  it('should get contract info', async () => {
    const result = await getContractInfo(api, { address: TESTNET_KNOWN_ADDRESS });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.address).toBeTruthy();
    expect(data.status).toBeTruthy();
  }, 15000);

  it('should handle non-existent address gracefully', async () => {
    const result = await getBalance(api, { address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c' });

    // Should return result (possibly with zero balance) or error - not crash
    expect(result.content[0].text).toBeTruthy();
  }, 15000);
});

describeE2E('E2E: Jetton Info on Mainnet', () => {
  let api: Api<unknown>;

  beforeAll(() => {
    api = createMainnetApi();
  });

  it('should get USDT jetton info', async () => {
    const result = await getJettonInfo(api, { jetton_address: USDT_JETTON_MAINNET });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.symbol).toBe('USD₮');
    expect(data.holdersCount).toBeGreaterThan(0);
  }, 15000);
});

describeE2E('E2E: Wallet Creation', () => {
  it('should create a wallet and verify address format', async () => {
    const { KeyManager } = await import('../../src/wallet/key-manager');
    const fs = await import('fs');
    const path = await import('path');
    const os = await import('os');

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ton-e2e-'));

    try {
      const km = new KeyManager(tmpDir);
      const result = await km.createWallet('e2e-test-password');

      // Valid TON address format
      expect(result.address).toMatch(/^[-\w:+/=]{48,}$/);
      expect(result.mnemonic).toHaveLength(24);
      expect(result.publicKey).toHaveLength(64); // hex

      // Verify we can decrypt
      const keyPair = await km.getKeyPair(result.address, 'e2e-test-password');
      expect(keyPair.publicKey.toString('hex')).toBe(result.publicKey);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
