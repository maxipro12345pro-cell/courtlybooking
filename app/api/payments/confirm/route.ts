import { NextResponse } from "next/server";
import { confirmPayment } from "@/lib/payments/service";

export async function POST(request: Request) { const body = await request.json(); if (!body.providerPaymentId || !body.bookingId) return NextResponse.json({ error: "Payment data is required" }, { status: 400 }); const paymentStatus = await confirmPayment(body.providerPaymentId); return NextResponse.json({ paymentStatus, bookingStatus: paymentStatus === "succeeded" ? "confirmed" : "pending_payment", crm_sync_status: "pending" }); }
