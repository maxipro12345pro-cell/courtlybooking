import { NextResponse } from "next/server";
import { createPayment } from "@/lib/payments/service";

export async function POST(request: Request) { const body = await request.json(); if (!body.bookingId) return NextResponse.json({ error: "bookingId is required" }, { status: 400 }); const result = await createPayment(body.bookingId, `${new URL(request.url).origin}/payment-success`); return NextResponse.json(result); }
