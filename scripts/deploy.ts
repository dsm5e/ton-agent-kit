import { toNano, Address } from '@ton/core';
import { TonClient } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { AgentWallet } from '../build/AgentWallet/AgentWallet_AgentWallet';
import { loadConfig } from '../src/config/config';

async function deploy() {
  const config = loadConfig();

  const mnemonic = process.env.DEPLOY_MNEMONIC;
  if (!mnemonic) {
    console.error('DEPLOY_MNEMONIC environment variable required (space-separated 24 words)');
    process.exit(1);
  }

  const endpoint = config.network === 'testnet'
    ? 'https://testnet.toncenter.com/api/v2/jsonRPC'
    : 'https://toncenter.com/api/v2/jsonRPC';

  const client = new TonClient({ endpoint });

  const words = mnemonic.split(' ');
  const keyPair = await mnemonicToPrivateKey(words);
  const ownerAddress = Address.parse(process.env.OWNER_ADDRESS || '');

  const maxTransaction = toNano(process.env.MAX_TX || '1');
  const dailyLimit = toNano(process.env.DAILY_LIMIT || '5');

  console.log('Deploying AgentWallet...');
  console.log(`  Network: ${config.network}`);
  console.log(`  Owner: ${ownerAddress}`);
  console.log(`  Max TX: ${maxTransaction} nanoton`);
  console.log(`  Daily Limit: ${dailyLimit} nanoton`);

  const contract = client.open(
    await AgentWallet.fromInit(ownerAddress, maxTransaction, dailyLimit)
  );

  console.log(`  Contract address: ${contract.address}`);

  // Import wallet for deployment
  const { WalletContractV4 } = await import('@ton/ton');
  const wallet = client.open(
    WalletContractV4.create({ publicKey: keyPair.publicKey, workchain: 0 })
  );

  console.log(`  Deployer wallet: ${wallet.address}`);

  const seqno = await wallet.getSeqno();
  console.log(`  Seqno: ${seqno}`);

  await wallet.sendTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages: [
      {
        info: {
          type: 'internal',
          dest: contract.address,
          value: { coins: toNano('0.5') },
          bounce: false,
          ihrDisabled: true,
          bounced: false,
          ihrFee: 0n,
          forwardFee: 0n,
          createdAt: 0,
          createdLt: 0n,
        },
        init: contract.init!,
        body: new (await import('@ton/core')).Cell(),
      },
    ],
  });

  console.log('\nDeploy transaction sent! Waiting for confirmation...');
  console.log(`Check: https://${config.network === 'testnet' ? 'testnet.' : ''}tonviewer.com/${contract.address}`);
}

deploy().catch(console.error);
