import { paymentProvider } from "./provider";

export async function createPayment(bookingId: string, returnUrl: string) {
  return paymentProvider.createPayment({ bookingId, amountMdl: 500, returnUrl });
}

export async function confirmPayment(providerPaymentId: string) {
  return paymentProvider.confirmPayment(providerPaymentId);
}

export async function refundPayment(providerPaymentId: string, amountMdl?: number) {
  return paymentProvider.refundPayment(providerPaymentId, amountMdl);
}
