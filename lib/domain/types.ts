export type CrmSyncStatus = "pending" | "synced" | "failed" | "not_requested";

export interface CrmFields {
  crm_contact_id?: string | null;
  crm_lead_id?: string | null;
  crm_sync_status: CrmSyncStatus;
}

export interface User extends CrmFields {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  createdAt: string;
}

export interface PlayerProfile {
  userId: string;
  avatarUrl?: string | null;
}

export interface Court {
  id: string;
  name: string;
  color: "blue" | "terracotta";
  type: "indoor";
  priceMdl: 500;
}

export type BookingStatus = "held" | "pending_payment" | "confirmed" | "cancelled" | "expired";
export type PaymentStatus = "created" | "pending" | "succeeded" | "failed" | "cancelled" | "refunded";

export interface Booking extends CrmFields {
  id: string;
  userId: string;
  courtId: string;
  startsAt: string;
  durationMinutes: 60;
  priceMdl: 500;
  status: BookingStatus;
  holdExpiresAt?: string | null;
  paymentId?: string | null;
}

export interface Payment {
  id: string;
  bookingId: string;
  provider: string;
  providerPaymentId?: string | null;
  amountMdl: 500;
  currency: "MDL";
  status: PaymentStatus;
  createdAt: string;
}

export interface CrmSyncLog {
  id: string;
  entityType: "user" | "booking" | "payment";
  entityId: string;
  status: CrmSyncStatus;
  attemptCount: number;
  lastError?: string | null;
}
