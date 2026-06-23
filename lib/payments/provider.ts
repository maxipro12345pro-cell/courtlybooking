import type { Payment, PaymentStatus } from "@/lib/domain/types";

export interface CreatePaymentInput {
  bookingId: string;
  amountMdl: 500;
  returnUrl: string;
}

export interface PaymentResult {
  payment: Payment;
  checkoutUrl?: string;
}

export interface PaymentProvider {
  readonly name: string;
  createPayment(input: CreatePaymentInput): Promise<PaymentResult>;
  confirmPayment(providerPaymentId: string): Promise<PaymentStatus>;
  handleWebhook(payload: unknown, signature?: string): Promise<void>;
  refundPayment(providerPaymentId: string, amountMdl?: number): Promise<PaymentStatus>;
}

export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    const id = `pay_${Date.now().toString(36)}`;
    return {
      payment: {
        id,
        bookingId: input.bookingId,
        provider: this.name,
        providerPaymentId: `mock_${id}`,
        amountMdl: 500,
        currency: "MDL",
        status: "pending",
        createdAt: new Date().toISOString(),
      },
    };
  }

  async confirmPayment(): Promise<PaymentStatus> { return "succeeded"; }
  async handleWebhook(): Promise<void> { return; }
  async refundPayment(): Promise<PaymentStatus> { return "refunded"; }
}

export const paymentProvider: PaymentProvider = new MockPaymentProvider();
