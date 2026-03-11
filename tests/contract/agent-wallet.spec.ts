import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, Address } from '@ton/core';
import '@ton/test-utils';
import { AgentWallet } from '../../build/AgentWallet/AgentWallet_AgentWallet';

describe('AgentWallet Contract', () => {
  let blockchain: Blockchain;
  let owner: SandboxContract<TreasuryContract>;
  let agent: SandboxContract<TreasuryContract>;
  let stranger: SandboxContract<TreasuryContract>;
  let recipient: SandboxContract<TreasuryContract>;
  let contract: SandboxContract<AgentWallet>;

  const MAX_TX = toNano('1');       // 1 TON max per tx
  const DAILY_LIMIT = toNano('5');  // 5 TON daily

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    owner = await blockchain.treasury('owner');
    agent = await blockchain.treasury('agent');
    stranger = await blockchain.treasury('stranger');
    recipient = await blockchain.treasury('recipient');

    // Deploy contract
    contract = blockchain.openContract(
      await AgentWallet.fromInit(owner.address, MAX_TX, DAILY_LIMIT)
    );

    const deployResult = await contract.send(
      owner.getSender(),
      { value: toNano('10') },
      null
    );

    expect(deployResult.transactions).toHaveTransaction({
      from: owner.address,
      to: contract.address,
      success: true,
      deploy: true,
    });

    // Add agent to allowed list
    await contract.send(
      owner.getSender(),
      { value: toNano('0.05') },
      { $$type: 'AddAllowedAddress', address: agent.address }
    );
  });

  describe('deployment', () => {
    it('should deploy with correct owner', async () => {
      const contractOwner = await contract.getOwner();
      expect(contractOwner.toString()).toBe(owner.address.toString());
    });

    it('should deploy with correct policy', async () => {
      const policy = await contract.getPolicyInfo();
      expect(policy.maxTransaction).toBe(MAX_TX);
      expect(policy.dailyLimit).toBe(DAILY_LIMIT);
      expect(policy.spentToday).toBe(0n);
    });

    it('should have balance after deploy', async () => {
      const balance = await contract.getBalance();
      expect(balance).toBeGreaterThan(0n);
    });
  });

  describe('access control', () => {
    it('should allow owner to add allowed address', async () => {
      const isAllowed = await contract.getIsAllowed(agent.address);
      expect(isAllowed).toBe(true);
    });

    it('should reject non-owner adding allowed address', async () => {
      const result = await contract.send(
        stranger.getSender(),
        { value: toNano('0.05') },
        { $$type: 'AddAllowedAddress', address: stranger.address }
      );

      expect(result.transactions).toHaveTransaction({
        from: stranger.address,
        to: contract.address,
        success: false,
        exitCode: 132, // Ownable: not owner
      });
    });

    it('should allow owner to remove allowed address', async () => {
      await contract.send(
        owner.getSender(),
        { value: toNano('0.05') },
        { $$type: 'RemoveAllowedAddress', address: agent.address }
      );

      const isAllowed = await contract.getIsAllowed(agent.address);
      expect(isAllowed).toBe(false);
    });

    it('should reject stranger from transferring', async () => {
      const result = await contract.send(
        stranger.getSender(),
        { value: toNano('0.05') },
        { $$type: 'TransferTon', to: recipient.address, amount: toNano('0.1') }
      );

      expect(result.transactions).toHaveTransaction({
        from: stranger.address,
        to: contract.address,
        success: false,
      });
    });
  });

  describe('owner transfers', () => {
    it('should allow owner to transfer without limits', async () => {
      const result = await contract.send(
        owner.getSender(),
        { value: toNano('0.05') },
        { $$type: 'TransferTon', to: recipient.address, amount: toNano('3') }
      );

      expect(result.transactions).toHaveTransaction({
        from: contract.address,
        to: recipient.address,
        success: true,
      });
    });

    it('should allow owner to exceed agent limits', async () => {
      // Owner can send more than maxTransaction (1 TON)
      const result = await contract.send(
        owner.getSender(),
        { value: toNano('0.05') },
        { $$type: 'TransferTon', to: recipient.address, amount: toNano('2') }
      );

      expect(result.transactions).toHaveTransaction({
        from: contract.address,
        to: recipient.address,
        success: true,
      });
    });
  });

  describe('agent transfers with policy', () => {
    it('should allow agent to transfer within limits', async () => {
      const result = await contract.send(
        agent.getSender(),
        { value: toNano('0.05') },
        { $$type: 'TransferTon', to: recipient.address, amount: toNano('0.5') }
      );

      expect(result.transactions).toHaveTransaction({
        from: contract.address,
        to: recipient.address,
        success: true,
      });
    });

    it('should reject agent transfer exceeding max transaction', async () => {
      const result = await contract.send(
        agent.getSender(),
        { value: toNano('0.05') },
        { $$type: 'TransferTon', to: recipient.address, amount: toNano('1.5') }
      );

      expect(result.transactions).toHaveTransaction({
        from: agent.address,
        to: contract.address,
        success: false,
      });
    });

    it('should track daily spending', async () => {
      await contract.send(
        agent.getSender(),
        { value: toNano('0.05') },
        { $$type: 'TransferTon', to: recipient.address, amount: toNano('0.8') }
      );

      const policy = await contract.getPolicyInfo();
      expect(policy.spentToday).toBe(toNano('0.8'));
    });

    it('should reject agent transfer exceeding daily limit', async () => {
      // Send 4 x 1 TON = 4 TON (within daily limit of 5)
      for (let i = 0; i < 4; i++) {
        await contract.send(
          agent.getSender(),
          { value: toNano('0.05') },
          { $$type: 'TransferTon', to: recipient.address, amount: toNano('1') }
        );
      }

      const policyBefore = await contract.getPolicyInfo();
      expect(policyBefore.spentToday).toBe(toNano('4'));

      // 5th send: 1 TON + 4 TON = 5 TON — exactly at limit, should succeed
      await contract.send(
        agent.getSender(),
        { value: toNano('0.05') },
        { $$type: 'TransferTon', to: recipient.address, amount: toNano('1') }
      );

      // 6th send: would be 6 TON > 5 TON limit — should fail
      const result = await contract.send(
        agent.getSender(),
        { value: toNano('0.05') },
        { $$type: 'TransferTon', to: recipient.address, amount: toNano('1') }
      );

      expect(result.transactions).toHaveTransaction({
        from: agent.address,
        to: contract.address,
        success: false,
      });
    });

    it('should reset daily spending after 24h', async () => {
      // Spend 4 TON
      for (let i = 0; i < 4; i++) {
        await contract.send(
          agent.getSender(),
          { value: toNano('0.05') },
          { $$type: 'TransferTon', to: recipient.address, amount: toNano('1') }
        );
      }

      // Advance time by 24 hours
      if (!blockchain.now) {
        blockchain.now = Math.floor(Date.now() / 1000);
      }
      blockchain.now += 86400;

      // Should be able to spend again
      const result = await contract.send(
        agent.getSender(),
        { value: toNano('0.05') },
        { $$type: 'TransferTon', to: recipient.address, amount: toNano('1') }
      );

      expect(result.transactions).toHaveTransaction({
        from: contract.address,
        to: recipient.address,
        success: true,
      });

      const policy = await contract.getPolicyInfo();
      expect(policy.spentToday).toBe(toNano('1')); // reset + 1 TON
    });
  });

  describe('policy updates', () => {
    it('should allow owner to update limits', async () => {
      await contract.send(
        owner.getSender(),
        { value: toNano('0.05') },
        { $$type: 'SetSpendingLimit', maxTransaction: toNano('2'), dailyLimit: toNano('10') }
      );

      const policy = await contract.getPolicyInfo();
      expect(policy.maxTransaction).toBe(toNano('2'));
      expect(policy.dailyLimit).toBe(toNano('10'));
    });

    it('should reject non-owner policy updates', async () => {
      const result = await contract.send(
        agent.getSender(),
        { value: toNano('0.05') },
        { $$type: 'SetSpendingLimit', maxTransaction: toNano('100'), dailyLimit: toNano('1000') }
      );

      expect(result.transactions).toHaveTransaction({
        from: agent.address,
        to: contract.address,
        success: false,
        exitCode: 132,
      });
    });

    it('should reject zero limits', async () => {
      const result = await contract.send(
        owner.getSender(),
        { value: toNano('0.05') },
        { $$type: 'SetSpendingLimit', maxTransaction: 0n, dailyLimit: toNano('5') }
      );

      expect(result.transactions).toHaveTransaction({
        from: owner.address,
        to: contract.address,
        success: false,
      });
    });
  });
});
