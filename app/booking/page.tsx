import BookingClient from "./BookingClient";

export default function BookingPage() {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  return <BookingClient initialDate={tomorrow} />;
}
