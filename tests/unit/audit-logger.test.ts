import { AuditLogger } from '../../src/wallet/audit-logger';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('AuditLogger', () => {
  let logger: AuditLogger;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ton-audit-test-'));
    logger = new AuditLogger(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('log', () => {
    it('should add timestamp automatically', () => {
      const before = Date.now();
      const entry = logger.log({
        action: 'send_ton',
        tool: 'send_ton',
        params: { destination: '0:dest' },
        result: 'success',
      });
      const after = Date.now();

      expect(entry.timestamp).toBeGreaterThanOrEqual(before);
      expect(entry.timestamp).toBeLessThanOrEqual(after);
    });

    it('should persist logs to disk', () => {
      logger.log({
        action: 'test',
        tool: 'test_tool',
        params: {},
        result: 'success',
      });

      const newLogger = new AuditLogger(tmpDir);
      const logs = newLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('test');
    });
  });

  describe('getLogs', () => {
    beforeEach(() => {
      logger.log({ action: 'a1', tool: 'send_ton', params: { walletAddress: '0:w1' }, result: 'success' });
      logger.log({ action: 'a2', tool: 'send_ton', params: { walletAddress: '0:w2' }, result: 'denied', reason: 'limit' });
      logger.log({ action: 'a3', tool: 'set_policy', params: { walletAddress: '0:w1' }, result: 'success' });
      logger.log({ action: 'a4', tool: 'send_ton', params: { walletAddress: '0:w1' }, result: 'error', reason: 'network' });
    });

    it('should return all logs', () => {
      const logs = logger.getLogs();
      expect(logs).toHaveLength(4);
      const actions = logs.map((l) => l.action);
      expect(actions).toContain('a1');
      expect(actions).toContain('a4');
    });

    it('should filter by wallet address', () => {
      const logs = logger.getLogs({ walletAddress: '0:w1' });
      expect(logs).toHaveLength(3);
    });

    it('should filter by tool', () => {
      const logs = logger.getLogs({ tool: 'send_ton' });
      expect(logs).toHaveLength(3);
    });

    it('should filter by result', () => {
      const logs = logger.getLogs({ result: 'denied' });
      expect(logs).toHaveLength(1);
      expect(logs[0].reason).toBe('limit');
    });

    it('should respect limit', () => {
      const logs = logger.getLogs({ limit: 2 });
      expect(logs).toHaveLength(2);
    });
  });

  describe('getStats', () => {
    it('should return correct stats', () => {
      logger.log({ action: 'a1', tool: 't', params: {}, result: 'success' });
      logger.log({ action: 'a2', tool: 't', params: {}, result: 'success' });
      logger.log({ action: 'a3', tool: 't', params: {}, result: 'denied' });
      logger.log({ action: 'a4', tool: 't', params: {}, result: 'error' });

      const stats = logger.getStats();
      expect(stats.total).toBe(4);
      expect(stats.success).toBe(2);
      expect(stats.denied).toBe(1);
      expect(stats.errors).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all logs', () => {
      logger.log({ action: 'test', tool: 't', params: {}, result: 'success' });
      expect(logger.getLogs()).toHaveLength(1);

      logger.clear();
      expect(logger.getLogs()).toHaveLength(0);
    });
  });
});
