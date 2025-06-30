export interface LedgerEntry {
  id: string;
  transactionId: string;
  account: string;
  debit: number;
  credit: number;
  timestamp: number;
}

export interface PaymentWebhook {
  idempotencyKey: string;
  paymentId: string;
  amountCents: number;
  currency: string;
  feeCents: number;
  status: 'succeeded' | 'disputed' | 'refunded';
}
