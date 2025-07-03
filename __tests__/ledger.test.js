import assert from 'node:assert';
import test from 'node:test';
import { ReconciliationLedger } from '../dist/ledger.js';

test('ReconciliationLedger enforces double-entry invariant and handles idempotency', () => {
  const ledger = new ReconciliationLedger();
  const hook = { idempotencyKey: 'idemp_001', paymentId: 'pi_100', amountCents: 5000, feeCents: 150, currency: 'usd', status: 'succeeded' as const };

  assert.strictEqual(ledger.processPayment(hook), true);
  assert.strictEqual(ledger.processPayment(hook), false); // Repeated webhook ignored

  assert.strictEqual(ledger.getBalance('revenue:sales').credits, 5000);
  assert.strictEqual(ledger.getBalance('asset:cash').debits, 4850);
  assert.strictEqual(ledger.getBalance('expense:fees').debits, 150);
});
