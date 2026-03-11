# ton-agent-kit

MCP server that gives AI agents the ability to **read, write, and manage funds** on TON blockchain — with built-in safety through a policy engine and on-chain smart contract enforcement.

```
AI Agent (Claude, Cursor, etc.)
        ↕ MCP Protocol
   ton-agent-kit
        ↕
   TON Blockchain
```

## The Problem

AI agents today are **blind and broke** on TON. Existing MCP servers can only read blockchain data. There is no way for an AI to:
- Create and manage wallets autonomously
- Send TON or jettons with safety guardrails
- Deploy and interact with smart contracts
- Operate within programmable spending limits

## The Solution

`ton-agent-kit` is a complete agent infrastructure toolkit:

| Capability | Tools |
|-----------|-------|
| **Read blockchain** | `get_balance`, `get_transactions`, `get_jetton_info`, `get_contract_info` |
| **Send transactions** | `send_ton`, `send_jetton` |
| **Deploy & call contracts** | `deploy_agent_wallet`, `call_contract` |
| **Manage wallets** | `create_wallet`, `get_wallet_info`, `set_policy`, `get_audit_log` |

Every write operation passes through a **policy engine** that enforces:
- Per-transaction amount limits
- Daily spending caps
- Address whitelist / blacklist
- Jetton whitelist
- Confirmation thresholds

All actions are recorded in an **audit log** for full transparency.

## On-Chain Enforcement

Beyond the off-chain policy engine, `ton-agent-kit` includes an **AgentWallet smart contract** written in Tact that enforces spending policies directly on-chain:

- Owner sets limits and whitelists allowed agent addresses
- Agents can only spend within configured limits
- Daily spending resets automatically after 24 hours
- Owner bypasses all limits
- Unauthorized addresses are rejected at the contract level

## Quick Start

### 1. Install

```bash
git clone https://github.com/dsm5e/ton-agent-kit.git
cd ton-agent-kit
npm install
```

### 2. Configure

```bash
cp .env.example .env
# Edit .env with your TONAPI key from https://tonapi.io
```

### 3. Connect to Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ton-agent-kit": {
      "command": "npx",
      "args": ["ts-node", "src/index.ts"],
      "cwd": "/path/to/ton-agent-kit",
      "env": {
        "TONAPI_KEY": "your_key_here",
        "TON_NETWORK": "testnet"
      }
    }
  }
}
```

### 4. Talk to your agent

```
You: "Check the balance of EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2"
Claude: → calls get_balance → "This address has 5.3 TON and 1,000 USDT"

You: "Create a new wallet for automated payments"
Claude: → calls create_wallet → "Created wallet EQ... Save this mnemonic!"

You: "Set a spending limit of 2 TON per transaction and 10 TON daily"
Claude: → calls set_policy → "Policy updated: max 2 TON/tx, 10 TON/day"

You: "Send 0.5 TON to EQ... for the API service"
Claude: → calls send_ton → policy check passes → "Sent 0.5 TON ✓"

You: "Send 50 TON to EQ..."
Claude: → calls send_ton → policy DENIED → "Blocked: exceeds 2 TON transaction limit"
```

## Architecture

```
┌─────────────────────────────────────────────┐
│  AI Host (Claude Desktop, Cursor, etc.)     │
│  ↕ MCP Protocol (stdio)                    │
├─────────────────────────────────────────────┤
│  ton-agent-kit MCP Server (12 tools)        │
│  ┌───────────┐ ┌──────────┐ ┌────────────┐ │
│  │ Read Tools │ │Write Tools│ │Wallet Tools│ │
│  │  4 tools   │ │  4 tools  │ │  4 tools   │ │
│  └─────┬─────┘ └────┬─────┘ └─────┬──────┘ │
│        │            │              │         │
│  ┌──────────────────────────────────────┐   │
│  │  Agentic Wallet Core                 │   │
│  │  ├─ KeyManager (AES-256 encrypted)   │   │
│  │  ├─ PolicyEngine (limits/whitelist)  │   │
│  │  └─ AuditLogger (full action log)   │   │
│  └──────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│  TON Blockchain                             │
│  ┌──────────────────────────────────────┐   │
│  │  AgentWallet.tact Smart Contract     │   │
│  │  On-chain policy enforcement         │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## MCP Tools Reference

### Read Tools

| Tool | Description |
|------|------------|
| `get_balance` | Get TON and jetton balances for any address |
| `get_transactions` | Get transaction history with pagination |
| `get_jetton_info` | Get token metadata (name, supply, holders) |
| `get_contract_info` | Get smart contract status and interfaces |

### Write Tools

| Tool | Description |
|------|------------|
| `send_ton` | Send TON with policy enforcement |
| `send_jetton` | Send jettons with policy enforcement |
| `deploy_agent_wallet` | Deploy AgentWallet contract on-chain |
| `call_contract` | Call AgentWallet methods (7 available) |

### Wallet Management Tools

| Tool | Description |
|------|------------|
| `create_wallet` | Create new wallet with encrypted key storage |
| `get_wallet_info` | Get wallet status, policy, and daily spending |
| `set_policy` | Configure spending limits and whitelists |
| `get_audit_log` | View all agent actions with filtering |

## Policy Engine

```typescript
{
  maxTransactionAmount: "1 TON",     // Max per transaction
  dailySpendingLimit: "5 TON",       // Daily cumulative cap
  allowedAddresses: ["EQ..."],       // Whitelist (optional)
  blockedAddresses: ["EQ..."],       // Blacklist (optional)
  allowedJettons: ["EQ..."],         // Token whitelist (optional)
  requireConfirmation: true,         // Prompt for large amounts
  confirmationThreshold: "0.5 TON"   // Threshold for prompts
}
```

## Smart Contract (Tact)

The `AgentWallet` contract provides **on-chain enforcement** — even if the off-chain policy engine is bypassed, the smart contract itself rejects unauthorized transactions.

**Messages:**
- `AddAllowedAddress` — owner adds an agent address
- `RemoveAllowedAddress` — owner removes an agent
- `SetSpendingLimit` — owner updates max tx and daily limit
- `TransferTon` — agent or owner sends TON (with on-chain checks)

**Getters:**
- `balance()` — contract TON balance
- `isAllowed(addr)` — check if address is authorized
- `policyInfo()` — current limits and daily spending

## Testing

```bash
npm test              # Run all 83 tests
npm run test:unit     # Unit tests (mocked)
npm run test:integration  # Integration tests
npm run test:contract # Smart contract sandbox tests
npm run test:e2e      # E2E against real testnet
npm run test:coverage # Coverage report
```

**Test coverage:**
- 33 unit tests — types, read tools, key manager, policy engine, audit logger
- 27 integration tests — write flow, wallet tools, policy enforcement
- 17 contract tests — sandbox: deploy, access control, limits, daily reset
- 6 E2E tests — real TONAPI calls on testnet + mainnet

## Tech Stack

- **TypeScript** — MCP server, tools, wallet core
- **Tact** — smart contract language for TON
- **@modelcontextprotocol/sdk** — MCP server framework
- **@ton/ton, @ton/core, @ton/crypto** — TON interaction
- **tonapi-sdk-js** — TONAPI for blockchain queries
- **@ton/sandbox** — local TON emulator for contract tests
- **Jest** — test framework

## Use Cases

- **AI Developer Tools** — give Claude/Cursor direct access to TON
- **Autonomous Payment Agents** — Telegram bots that handle payments
- **DeFi Agents** — AI that trades within safe limits
- **Agent-to-Agent Payments** — machines paying machines on TON

## License

MIT
