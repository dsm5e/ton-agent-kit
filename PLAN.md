# TON Agent Kit — MCP Server + Agentic Wallet

## Что строим

Один npm-пакет `ton-agent-kit` — MCP сервер, который позволяет любому AI-агенту (Claude, Cursor, etc.) **читать и писать** в TON блокчейн через встроенный агентный кошелёк с policy engine.

## Ценность для пользователей

| Кто | Что получает |
|-----|-------------|
| **AI-разработчик** | Подключил MCP → Claude умеет отправлять TON, деплоить контракты, работать с jettons |
| **Бизнес** | AI-агент автономно принимает/отправляет платежи с лимитами и правилами |
| **Экосистема TON** | Закрывает 2 главных gap: write-MCP + agentic wallet |

## Архитектура

```
┌─────────────────────────────────────────────┐
│  AI Host (Claude, Cursor, etc.)             │
│  ↕ MCP Protocol (stdio)                    │
├─────────────────────────────────────────────┤
│  ton-agent-kit MCP Server                   │
│  ┌───────────┐ ┌──────────┐ ┌────────────┐ │
│  │ Read Tools │ │Write Tools│ │Wallet Tools│ │
│  │ (TONAPI)  │ │(@ton/ton) │ │(Policy Eng)│ │
│  └───────────┘ └──────────┘ └────────────┘ │
│        ↓             ↓            ↓         │
│  ┌──────────────────────────────────────┐   │
│  │  Agentic Wallet Core                 │   │
│  │  - Key management (encrypted)        │   │
│  │  - Policy engine (limits, whitelist) │   │
│  │  - Transaction signing               │   │
│  │  - Audit log                         │   │
│  └──────────────────────────────────────┘   │
│        ↓             ↓                      │
│  ┌──────────┐  ┌──────────┐                 │
│  │ TON API  │  │ TON RPC  │                 │
│  │ (read)   │  │ (write)  │                 │
│  └──────────┘  └──────────┘                 │
├─────────────────────────────────────────────┤
│  TON Blockchain (testnet / mainnet)         │
│  ┌──────────────────────────────────────┐   │
│  │  Policy Contract (Tact)              │   │
│  │  - On-chain spending limits          │   │
│  │  - Whitelist enforcement             │   │
│  │  - Multi-sig for large amounts       │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## Стек технологий

| Компонент | Технология |
|-----------|-----------|
| MCP сервер | TypeScript, `@modelcontextprotocol/sdk` |
| TON чтение | `tonapi-sdk-js` (TONAPI) |
| TON запись | `@ton/ton`, `@ton/core`, `@ton/crypto` |
| Смарт-контракт | **Tact** (проще, быстрее для хакатона) |
| Тесты контракта | `@ton/sandbox` + `@ton/blueprint` + Jest |
| Тесты MCP | Jest + моки + `@modelcontextprotocol/inspector` |
| E2E тесты | TON testnet |

## MCP Tools

### Read tools
- `get_balance` — баланс адреса (TON + jettons)
- `get_transactions` — история транзакций
- `get_contract_info` — данные контракта
- `get_jetton_info` — инфо о токене
- `get_nft_info` — инфо об NFT

### Write tools
- `send_ton` — отправить TON на адрес
- `send_jetton` — отправить jettons
- `deploy_contract` — задеплоить контракт
- `call_contract` — вызвать метод контракта

### Wallet tools
- `create_wallet` — создать новый агентный кошелёк
- `get_wallet_info` — баланс, политики, история
- `set_policy` — установить правила (лимиты, whitelist)
- `get_audit_log` — лог всех действий агента

## Policy Engine

```typescript
interface WalletPolicy {
  maxTransactionAmount: bigint;     // макс. одна транзакция
  dailySpendingLimit: bigint;       // лимит в день
  allowedAddresses?: Address[];     // whitelist адресов
  blockedAddresses?: Address[];     // blacklist
  allowedJettons?: Address[];       // какие токены можно слать
  requireConfirmation: boolean;     // запрашивать подтверждение у юзера
  confirmationThreshold: bigint;    // порог для подтверждения
}
```

## Структура проекта

```
ton-agent-kit/
├── package.json
├── tsconfig.json
├── jest.config.ts
├── README.md
│
├── src/
│   ├── index.ts                    # Entry point
│   ├── server.ts                   # MCP server setup
│   │
│   ├── tools/
│   │   ├── read/
│   │   │   ├── get-balance.ts
│   │   │   ├── get-transactions.ts
│   │   │   ├── get-contract-info.ts
│   │   │   └── get-jetton-info.ts
│   │   ├── write/
│   │   │   ├── send-ton.ts
│   │   │   ├── send-jetton.ts
│   │   │   ├── deploy-contract.ts
│   │   │   └── call-contract.ts
│   │   └── wallet/
│   │       ├── create-wallet.ts
│   │       ├── get-wallet-info.ts
│   │       ├── set-policy.ts
│   │       └── get-audit-log.ts
│   │
│   ├── wallet/
│   │   ├── agentic-wallet.ts       # Wallet core logic
│   │   ├── policy-engine.ts        # Policy validation
│   │   ├── key-manager.ts          # Encrypted key storage
│   │   └── audit-logger.ts         # Transaction logging
│   │
│   ├── ton/
│   │   ├── client.ts               # TON client wrapper
│   │   ├── api.ts                  # TONAPI wrapper
│   │   └── types.ts                # Shared types
│   │
│   └── config/
│       └── config.ts               # Config management
│
├── contracts/
│   ├── agent_wallet.tact           # On-chain policy contract
│   └── wrappers/
│       └── AgentWallet.ts          # TS wrapper for contract
│
├── tests/
│   ├── unit/
│   │   ├── policy-engine.test.ts
│   │   ├── key-manager.test.ts
│   │   └── audit-logger.test.ts
│   ├── integration/
│   │   ├── read-tools.test.ts
│   │   ├── write-tools.test.ts
│   │   └── wallet-tools.test.ts
│   ├── contract/
│   │   └── agent-wallet.spec.ts    # Sandbox tests
│   └── e2e/
│       └── testnet.test.ts         # Real testnet tests
│
└── scripts/
    ├── deploy.ts                   # Deploy to testnet
    └── demo.ts                     # Demo scenario
```

## План на 14 дней

### Неделя 1: Core

| День | Задача | Статус |
|------|--------|--------|
| **1-2** | Setup проекта, MCP сервер skeleton, Read tools (get_balance, get_transactions, get_jetton_info) + unit тесты | ✅ |
| **3-4** | Agentic Wallet core: key manager, policy engine, audit logger + unit тесты | ✅ |
| **5-6** | Write tools (send_ton, send_jetton) + policy validation + integration тесты | ✅ |
| **7** | Смарт-контракт AgentWallet.tact + sandbox тесты | ⬜ |

### Неделя 2: Polish & Ship

| День | Задача | Статус |
|------|--------|--------|
| **8-9** | Deploy контракта на testnet, wallet MCP tools (create_wallet, set_policy), E2E тесты | ⬜ |
| **10-11** | deploy_contract + call_contract tools, get_audit_log, полный integration test suite | ⬜ |
| **12-13** | Demo сценарий, README, документация, видео | ⬜ |
| **14** | Финальное тестирование, submit | ⬜ |

## Стратегия тестирования

### 4 уровня тестов:

**1. Unit тесты** (Jest, моки)
- Policy engine: проверка лимитов, whitelist, daily limits
- Key manager: создание/шифрование/расшифровка ключей
- Audit logger: корректная запись логов
- Каждый tool в изоляции

**2. Contract тесты** (`@ton/sandbox`)
- Деплой AgentWallet в локальный эмулятор
- Проверка on-chain лимитов
- Bounce при превышении лимита
- Owner vs Agent permissions

**3. Integration тесты** (Jest + testnet API)
- Read tools → реальный TONAPI (testnet)
- Write tools → полный flow: создать кошелёк → set policy → send TON → проверить policy enforcement
- MCP protocol compliance

**4. E2E тесты** (testnet)
- Полный сценарий: AI создаёт кошелёк → устанавливает лимиты → отправляет TON → пытается превысить лимит → получает отказ
- Деплой контракта на testnet и взаимодействие через MCP

## Что нужно настроить

- [x] GitHub репо
- [ ] TONAPI ключ — зарегистрироваться на tonapi.io
- [ ] Testnet кошелёк — Tonkeeper в testnet mode + тестовые TON
- [ ] Node.js 18+
