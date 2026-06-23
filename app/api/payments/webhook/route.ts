import { NextResponse } from "next/server";
import { paymentProvider } from "@/lib/payments/provider";

export async function POST(request: Request) { const payload = await request.json(); await paymentProvider.handleWebhook(payload, request.headers.get("x-payment-signature") || undefined); return NextResponse.json({ received: true }); }
