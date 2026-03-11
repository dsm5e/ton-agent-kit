# Ручное тестирование ton-agent-kit

## Подготовка

```bash
cd ~/Desktop/ton-agent-kit
```

TONAPI ключ уже в `.env`. Для удобства:
```bash
export TONAPI_KEY=AEZAXZ7X6X5FYTAAAAANBZIVHXZC4YQQVN6CWSHX3BJLU4HD6D27TQAO7E7N5DA62L5LQ3Q
```

---

## TC-1: Demo скрипт
```bash
npx ts-node scripts/demo.ts
```
✅ 10 шагов выполняются, баланс читается, кошелёк создаётся, policy checks работают

---

## TC-2: Все автотесты
```bash
npm test
```
✅ 83 теста, 9 suites, все зелёные

---

## TC-3: Билд
```bash
npm run build
```
✅ Папка `dist/` без ошибок

---

## TC-4: Контракт тесты отдельно
```bash
npx jest tests/contract --verbose
```
✅ 17 тестов: deploy, access control, limits, daily reset

---

## TC-5: Coverage
```bash
npm run test:coverage
```
✅ Отчёт в `coverage/`, цель >80%

---

## TC-6: Подключение к Claude Desktop

1. Открой файл:
```bash
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

2. Вставь (или добавь в существующий):
```json
{
  "mcpServers": {
    "ton-agent-kit": {
      "command": "npx",
      "args": ["ts-node", "src/index.ts"],
      "cwd": "/Users/qwar49/Desktop/ton-agent-kit",
      "env": {
        "TONAPI_KEY": "AEZAXZ7X6X5FYTAAAAANBZIVHXZC4YQQVN6CWSHX3BJLU4HD6D27TQAO7E7N5DA62L5LQ3Q",
        "TON_NETWORK": "testnet"
      }
    }
  }
}
```

3. Перезапусти Claude Desktop
4. Проверь что видно 12 tools ton-agent-kit

---

## TC-7: Read tools в Claude Desktop

Скажи Claude:
- "Покажи баланс адреса 0:0000000000000000000000000000000000000000000000000000000000000000"
  → Должен показать ~750 TON
- "Покажи последние 3 транзакции этого адреса"
  → 3 транзакции с хешами
- "Что за токен EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs"
  → USD₮, holders count

---

## TC-8: Wallet + Policy в Claude Desktop

Скажи Claude:
- "Создай кошелёк с паролем mypass123"
  → Адрес + 24 слова мнемоники
- "Установи лимит 0.5 TON на транзакцию и 2 TON в день"
  → Policy updated
- "Покажи audit log"
  → create_wallet + set_policy записи

---

## TC-9: Policy enforcement в Claude Desktop

- "Отправь 1 TON на EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2"
  → ❌ DENIED — превышает лимит 0.5 TON
- "Отправь 0.1 TON на EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2"
  → ✅ Policy пропустит, но ошибка сети (кошелёк не пополнен) — это ОК

---

## TC-10: Пополнение testnet и реальная отправка

1. Из TC-8 скопируй адрес созданного кошелька
2. Открой Telegram → @testgiver_ton_bot → отправь адрес → получи 2 TON
3. Подожди ~30 сек
4. Скажи Claude: "Покажи баланс моего кошелька EQ..."
   → Должен показать 2 TON
5. Скажи: "Отправь 0.1 TON на 0:0000000000000000000000000000000000000000000000000000000000000000"
   → ✅ Транзакция отправлена!
6. "Покажи audit log"
   → Видна запись send_ton — success

---

## Чеклист

| # | Тест | Статус |
|---|------|--------|
| 1 | Demo скрипт | ⬜ |
| 2 | 83 автотеста | ⬜ |
| 3 | Билд | ⬜ |
| 4 | Контракт тесты | ⬜ |
| 5 | Coverage >80% | ⬜ |
| 6 | Claude Desktop подключение | ⬜ |
| 7 | Read tools | ⬜ |
| 8 | Wallet + Policy | ⬜ |
| 9 | Policy enforcement | ⬜ |
| 10 | Реальная отправка testnet | ⬜ |
