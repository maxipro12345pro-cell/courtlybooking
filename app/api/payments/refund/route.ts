import { NextResponse } from "next/server";
import { refundPayment } from "@/lib/payments/service";

export async function POST(request: Request) { const body = await request.json(); if (!body.providerPaymentId) return NextResponse.json({ error: "providerPaymentId is required" }, { status: 400 }); const status = await refundPayment(body.providerPaymentId, body.amountMdl); return NextResponse.json({ status }); }
