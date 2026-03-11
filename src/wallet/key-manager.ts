import { mnemonicNew, mnemonicToPrivateKey, KeyPair } from '@ton/crypto';
import { WalletContractV4 } from '@ton/ton';
import { Address } from '@ton/core';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface StoredWallet {
  address: string;
  publicKey: string;
  encryptedMnemonic: string;
  iv: string;
  salt: string;
  createdAt: number;
}

export class KeyManager {
  private dataDir: string;
  private walletsFile: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.walletsFile = path.join(dataDir, 'wallets.json');
    this.ensureDataDir();
  }

  private ensureDataDir(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  async createWallet(password: string): Promise<{ address: string; publicKey: string; mnemonic: string[] }> {
    const mnemonic = await mnemonicNew();
    const keyPair = await mnemonicToPrivateKey(mnemonic);
    const wallet = WalletContractV4.create({
      publicKey: keyPair.publicKey,
      workchain: 0,
    });

    const address = wallet.address.toString();
    const publicKey = keyPair.publicKey.toString('hex');

    const encrypted = this.encryptMnemonic(mnemonic, password);

    const stored: StoredWallet = {
      address,
      publicKey,
      encryptedMnemonic: encrypted.data,
      iv: encrypted.iv,
      salt: encrypted.salt,
      createdAt: Date.now(),
    };

    this.saveWallet(stored);

    return { address, publicKey, mnemonic };
  }

  async getKeyPair(address: string, password: string): Promise<KeyPair> {
    const stored = this.loadWallet(address);
    if (!stored) {
      throw new Error(`Wallet not found: ${address}`);
    }

    const mnemonic = this.decryptMnemonic(
      stored.encryptedMnemonic,
      stored.iv,
      stored.salt,
      password
    );

    return mnemonicToPrivateKey(mnemonic);
  }

  getWalletContract(address: string, password: string): { contract: InstanceType<typeof WalletContractV4>; keyPairPromise: Promise<KeyPair> } {
    const stored = this.loadWallet(address);
    if (!stored) {
      throw new Error(`Wallet not found: ${address}`);
    }

    const publicKey = Buffer.from(stored.publicKey, 'hex');
    const contract = WalletContractV4.create({ publicKey, workchain: 0 });
    const keyPairPromise = this.getKeyPair(address, password);

    return { contract, keyPairPromise };
  }

  listWallets(): StoredWallet[] {
    const wallets = this.loadAllWallets();
    return wallets.map(({ encryptedMnemonic, iv, salt, ...rest }) => ({
      ...rest,
      encryptedMnemonic: '***',
      iv: '***',
      salt: '***',
    }));
  }

  walletExists(address: string): boolean {
    return this.loadWallet(address) !== null;
  }

  private encryptMnemonic(mnemonic: string[], password: string): { data: string; iv: string; salt: string } {
    const salt = crypto.randomBytes(32);
    const key = crypto.scryptSync(password, salt, 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    const plaintext = mnemonic.join(' ');
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      data: encrypted,
      iv: iv.toString('hex'),
      salt: salt.toString('hex'),
    };
  }

  private decryptMnemonic(data: string, ivHex: string, saltHex: string, password: string): string[] {
    const salt = Buffer.from(saltHex, 'hex');
    const key = crypto.scryptSync(password, salt, 32);
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted.split(' ');
  }

  private loadAllWallets(): StoredWallet[] {
    if (!fs.existsSync(this.walletsFile)) {
      return [];
    }
    const content = fs.readFileSync(this.walletsFile, 'utf8');
    return JSON.parse(content);
  }

  private loadWallet(address: string): StoredWallet | null {
    const wallets = this.loadAllWallets();
    return wallets.find((w) => w.address === address) || null;
  }

  private saveWallet(wallet: StoredWallet): void {
    const wallets = this.loadAllWallets();
    const existingIndex = wallets.findIndex((w) => w.address === wallet.address);
    if (existingIndex >= 0) {
      wallets[existingIndex] = wallet;
    } else {
      wallets.push(wallet);
    }
    fs.writeFileSync(this.walletsFile, JSON.stringify(wallets, null, 2));
  }
}
