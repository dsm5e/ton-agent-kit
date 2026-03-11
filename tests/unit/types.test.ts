import {
  formatTon,
  parseTon,
  successResult,
  errorResult,
  DEFAULT_POLICY,
} from '../../src/ton/types';

describe('Type Utilities', () => {
  describe('formatTon', () => {
    it('should format nanotons to TON', () => {
      expect(formatTon(BigInt('1000000000'))).toBe('1 TON');
      expect(formatTon(BigInt('5500000000'))).toBe('5.5 TON');
      expect(formatTon(BigInt('0'))).toBe('0 TON');
    });
  });

  describe('parseTon', () => {
    it('should parse TON to nanotons', () => {
      expect(parseTon(1)).toBe(BigInt('1000000000'));
      expect(parseTon('5.5')).toBe(BigInt('5500000000'));
      expect(parseTon(0)).toBe(BigInt('0'));
    });
  });

  describe('successResult', () => {
    it('should wrap string data', () => {
      const result = successResult('hello');
      expect(result.content[0].text).toBe('hello');
      expect(result.isError).toBeUndefined();
    });

    it('should JSON-stringify objects with bigint support', () => {
      const result = successResult({ value: BigInt('123') });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.value).toBe('123');
    });
  });

  describe('errorResult', () => {
    it('should create error response', () => {
      const result = errorResult('something failed');
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe('Error: something failed');
    });
  });

  describe('DEFAULT_POLICY', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_POLICY.maxTransactionAmount).toBe(BigInt('1000000000'));
      expect(DEFAULT_POLICY.dailySpendingLimit).toBe(BigInt('5000000000'));
      expect(DEFAULT_POLICY.requireConfirmation).toBe(true);
    });
  });
});
