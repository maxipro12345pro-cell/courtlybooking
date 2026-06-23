import BookingClient from "./booking/BookingClient";

export default function HomePage() {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  return <BookingClient initialDate={tomorrow} />;
}
