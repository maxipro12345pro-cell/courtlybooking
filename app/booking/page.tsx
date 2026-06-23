import BookingClient from "./BookingClient";

export default async function BookingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const requestedDate = typeof params.date === "string" ? params.date : null;
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  return <BookingClient initialDate={requestedDate || tomorrow} />;
}
