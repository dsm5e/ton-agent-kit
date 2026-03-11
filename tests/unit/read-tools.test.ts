import { getBalance } from '../../src/tools/read/get-balance';
import { getTransactions } from '../../src/tools/read/get-transactions';
import { getJettonInfo } from '../../src/tools/read/get-jetton-info';
import { getContractInfo } from '../../src/tools/read/get-contract-info';

// Mock TONAPI
function createMockApi() {
  return {
    accounts: {
      getAccount: jest.fn().mockResolvedValue({
        address: '0:abc123',
        balance: '5000000000',
        status: 'active',
        lastActivity: 1710000000,
        interfaces: ['wallet_v4r2'],
      }),
      getAccountJettonsBalances: jest.fn().mockResolvedValue({
        balances: [
          {
            balance: '1000000000',
            jetton: {
              name: 'Test Jetton',
              symbol: 'TJ',
              decimals: 9,
              address: '0:jetton123',
            },
          },
        ],
      }),
    },
    blockchain: {
      getBlockchainAccountTransactions: jest.fn().mockResolvedValue({
        transactions: [
          {
            hash: 'txhash123',
            utime: 1710000000,
            total_fees: '1000000',
            success: true,
            in_msg: {
              source: { address: '0:sender123' },
              value: '2000000000',
            },
            out_msgs: [
              {
                destination: { address: '0:receiver123' },
                value: '1500000000',
              },
            ],
          },
        ],
      }),
      execGetMethodForBlockchainAccount: jest.fn().mockRejectedValue(new Error('not found')),
    },
    jettons: {
      getJettonInfo: jest.fn().mockResolvedValue({
        metadata: {
          name: 'Test Jetton',
          symbol: 'TJ',
          description: 'A test jetton',
          decimals: '9',
          address: '0:jetton123',
        },
        total_supply: '1000000000000',
        mintable: true,
        holders_count: 42,
      }),
    },
  } as any;
}

describe('Read Tools', () => {
  let mockApi: ReturnType<typeof createMockApi>;

  beforeEach(() => {
    mockApi = createMockApi();
  });

  describe('get_balance', () => {
    it('should return TON balance and jettons', async () => {
      const result = await getBalance(mockApi, { address: '0:abc123' });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.balance).toBe('5 TON');
      expect(data.jettons).toHaveLength(1);
      expect(data.jettons[0].symbol).toBe('TJ');
    });

    it('should handle API errors', async () => {
      mockApi.accounts.getAccount.mockRejectedValue(new Error('Not found'));

      const result = await getBalance(mockApi, { address: '0:invalid' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Failed to get balance');
    });
  });

  describe('get_transactions', () => {
    it('should return transactions', async () => {
      const result = await getTransactions(mockApi, { address: '0:abc123' });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.transactions).toHaveLength(1);
      expect(data.transactions[0].hash).toBe('txhash123');
      expect(data.transactions[0].success).toBe(true);
    });

    it('should respect limit parameter', async () => {
      await getTransactions(mockApi, { address: '0:abc123', limit: 5 });

      expect(mockApi.blockchain.getBlockchainAccountTransactions).toHaveBeenCalledWith(
        '0:abc123',
        { limit: 5 }
      );
    });

    it('should cap limit at 100', async () => {
      await getTransactions(mockApi, { address: '0:abc123', limit: 200 });

      expect(mockApi.blockchain.getBlockchainAccountTransactions).toHaveBeenCalledWith(
        '0:abc123',
        { limit: 100 }
      );
    });
  });

  describe('get_jetton_info', () => {
    it('should return jetton metadata', async () => {
      const result = await getJettonInfo(mockApi, { jetton_address: '0:jetton123' });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.name).toBe('Test Jetton');
      expect(data.symbol).toBe('TJ');
      expect(data.holdersCount).toBe(42);
    });

    it('should handle unknown jettons', async () => {
      mockApi.jettons.getJettonInfo.mockRejectedValue(new Error('Not found'));

      const result = await getJettonInfo(mockApi, { jetton_address: '0:unknown' });

      expect(result.isError).toBe(true);
    });
  });

  describe('get_contract_info', () => {
    it('should return contract info', async () => {
      const result = await getContractInfo(mockApi, { address: '0:abc123' });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.status).toBe('active');
      expect(data.balance).toBe('5 TON');
    });
  });
});
