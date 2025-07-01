import { LedgerEntry, PaymentWebhook } from './types.js';

export class ReconciliationLedger {
  private entries: LedgerEntry[] = [];
  private processedWebhooks = new Set<string>();

  processPayment(hook: PaymentWebhook): boolean {
    if (this.processedWebhooks.has(hook.idempotencyKey)) {
      return false; // Idempotent skip
    }
    this.processedWebhooks.add(hook.idempotencyKey);

    const netAmount = hook.amountCents - hook.feeCents;
    const now = Date.now();

    // Double entry:
    // Debit: Cash Asset (net received)
    this.entries.push({ id: `e_${this.entries.length + 1}`, transactionId: hook.paymentId, account: 'asset:cash', debit: netAmount, credit: 0, timestamp: now });
    // Debit: Processing Expense (fee)
    this.entries.push({ id: `e_${this.entries.length + 1}`, transactionId: hook.paymentId, account: 'expense:fees', debit: hook.feeCents, credit: 0, timestamp: now });
    // Credit: Revenue (total charge)
    this.entries.push({ id: `e_${this.entries.length + 1}`, transactionId: hook.paymentId, account: 'revenue:sales', debit: 0, credit: hook.amountCents, timestamp: now });

    this.verifyInvariants();
    return true;
  }

  verifyInvariants(): boolean {
    let totalDebit = 0;
    let totalCredit = 0;
    for (const e of this.entries) {
      totalDebit += e.debit;
      totalCredit += e.credit;
    }
    if (totalDebit !== totalCredit) {
      throw new Error(`Ledger balance invariant violated: Debit ${totalDebit} !== Credit ${totalCredit}`);
    }
    return true;
  }

  getBalance(account: string): { debits: number; credits: number; net: number } {
    const list = this.entries.filter(e => e.account === account);
    const debits = list.reduce((a, b) => a + b.debit, 0);
    const credits = list.reduce((a, b) => a + b.credit, 0);
    return { debits, credits, net: debits - credits };
  }
}
