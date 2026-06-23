import CheckoutClient from "./CheckoutClient";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) { const params = await searchParams; const bookingId = typeof params.bookingId === "string" ? params.bookingId : ""; return <CheckoutClient bookingId={bookingId} />; }
