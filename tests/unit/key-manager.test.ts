import { KeyManager } from '../../src/wallet/key-manager';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('KeyManager', () => {
  let keyManager: KeyManager;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ton-agent-kit-test-'));
    keyManager = new KeyManager(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('createWallet', () => {
    it('should create a new wallet with mnemonic', async () => {
      const result = await keyManager.createWallet('testpassword');

      expect(result.address).toBeTruthy();
      expect(result.publicKey).toBeTruthy();
      expect(result.mnemonic).toHaveLength(24);
    });

    it('should persist wallet to disk', async () => {
      const result = await keyManager.createWallet('testpassword');

      const newKeyManager = new KeyManager(tmpDir);
      expect(newKeyManager.walletExists(result.address)).toBe(true);
    });

    it('should encrypt mnemonic (not stored in plaintext)', async () => {
      const result = await keyManager.createWallet('testpassword');

      const walletsFile = path.join(tmpDir, 'wallets.json');
      const content = fs.readFileSync(walletsFile, 'utf8');

      // Mnemonic words should NOT appear in plaintext
      for (const word of result.mnemonic) {
        expect(content).not.toContain(`"${word}"`);
      }
    });
  });

  describe('getKeyPair', () => {
    it('should retrieve key pair with correct password', async () => {
      const created = await keyManager.createWallet('mypassword');
      const keyPair = await keyManager.getKeyPair(created.address, 'mypassword');

      expect(keyPair.publicKey).toBeTruthy();
      expect(keyPair.secretKey).toBeTruthy();
      expect(keyPair.publicKey.toString('hex')).toBe(created.publicKey);
    });

    it('should fail with wrong password', async () => {
      const created = await keyManager.createWallet('correctpassword');

      await expect(
        keyManager.getKeyPair(created.address, 'wrongpassword')
      ).rejects.toThrow();
    });

    it('should fail for non-existent wallet', async () => {
      await expect(
        keyManager.getKeyPair('0:nonexistent', 'password')
      ).rejects.toThrow('Wallet not found');
    });
  });

  describe('listWallets', () => {
    it('should return empty list initially', () => {
      expect(keyManager.listWallets()).toEqual([]);
    });

    it('should list created wallets without sensitive data', async () => {
      await keyManager.createWallet('pass1');
      await keyManager.createWallet('pass2');

      const wallets = keyManager.listWallets();
      expect(wallets).toHaveLength(2);
      expect(wallets[0].encryptedMnemonic).toBe('***');
      expect(wallets[0].iv).toBe('***');
      expect(wallets[0].salt).toBe('***');
    });
  });

  describe('walletExists', () => {
    it('should return false for non-existent wallet', () => {
      expect(keyManager.walletExists('0:fake')).toBe(false);
    });

    it('should return true for existing wallet', async () => {
      const result = await keyManager.createWallet('pass');
      expect(keyManager.walletExists(result.address)).toBe(true);
    });
  });
});
