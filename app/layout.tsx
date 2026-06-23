import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PadelPoint — online booking",
  description: "Онлайн-бронирование indoor padel-кортов PadelPoint с оплатой во время бронирования.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
