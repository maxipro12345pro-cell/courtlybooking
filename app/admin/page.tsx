"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, Mail, Phone, RefreshCw, UsersRound } from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";
import { BOOKING_HOURS, COURT_SEED } from "@/lib/domain/config";

type BookingStatus = "held" | "confirmed" | "cancelled" | "expired";

interface AdminBooking {
  id: string;
  courtId: string;
  courtName: string;
  date: string;
  time: string;
  times?: string[];
  status: BookingStatus;
  priceMdl: number;
  depositMdl?: number;
  remainingHours?: number;
  remainingMdl?: number;
  customer?: {
    fullName: string;
    phone: string;
    email: string;
    guests: number;
  };
  createdAt?: string;
  holdExpiresAt?: string;
}

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function nextHour(time: string) {
  return `${String(Number(time.slice(0, 2)) + 1).padStart(2, "0")}:00`;
}

function bookingTimes(booking: AdminBooking) {
  return booking.times?.length ? booking.times : [booking.time];
}

function displayBookingTimes(booking: AdminBooking) {
  const times = bookingTimes(booking);
  return times.length > 1 ? `${times.length} часа: ${times.join(", ")}` : `${booking.time}–${nextHour(booking.time)}`;
}

export default function AdminPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayValue);

  function loadBookings() {
    try {
      setBookings(JSON.parse(localStorage.getItem("padelpoint:bookings") || "[]"));
    } catch {
      setBookings([]);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  const dayBookings = useMemo(
    () => bookings.filter((booking) => booking.date === selectedDate),
    [bookings, selectedDate],
  );

  const bookingsBySlot = useMemo(() => {
    const map = new Map<string, AdminBooking>();
    for (const booking of dayBookings) {
      for (const time of bookingTimes(booking)) {
        map.set(`${booking.courtId}:${time}`, booking);
      }
    }
    return map;
  }, [dayBookings]);

  const confirmedCount = dayBookings.filter((booking) => booking.status === "confirmed").length;
  const heldCount = dayBookings.filter((booking) => booking.status === "held").length;
  const revenue = dayBookings.filter((booking) => booking.status === "confirmed").reduce((sum, booking) => sum + (booking.depositMdl ?? 500), 0);

  return (
    <main className="min-h-screen bg-canvas text-primary">
      <header className="sticky top-0 z-40 border-b border-sand bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[82px] max-w-[1440px] items-center justify-between px-5 lg:px-8">
          <BrandLogo />
          <a href="/booking" className="rounded-full border border-sand px-5 py-2 text-sm font-black transition hover:border-terracotta">
            К бронированию
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-5 py-8 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-terracotta">PadelPoint admin</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-.055em] sm:text-6xl">Схема брони кортов</h1>
            <p className="mt-3 max-w-2xl text-gray-500">Все 9 indoor-кортов на одном экране: занятость, удержания, клиенты и контакты.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="rounded-full border border-sand bg-white px-5 py-3 shadow-sm">
              <span className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-gray-400"><CalendarDays size={14} />Дата</span>
              <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="bg-transparent font-black outline-none" />
            </label>
            <button type="button" onClick={loadBookings} className="inline-flex items-center gap-2 rounded-full bg-[#050505] px-5 py-3 text-sm font-black text-white transition hover:bg-terracotta">
              <RefreshCw size={16} /> Обновить
            </button>
          </div>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <Metric label="Подтверждено" value={confirmedCount.toString()} />
          <Metric label="Удерживается" value={heldCount.toString()} />
          <Metric label="Предоплата получена" value={`${revenue} MDL`} />
        </div>

        <div className="mt-7 overflow-hidden rounded-[34px] border border-sand bg-white shadow-soft">
          <div className="border-b border-sand bg-terracotta px-5 py-4 text-white sm:px-6">
            <h2 className="text-xl font-black">Управление кортами</h2>
            <p className="mt-1 text-sm text-white/70">Схема показывает слоты 07:00–22:00. Клик по заполненной ячейке открывает данные клиента.</p>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[1120px]">
              <div className="grid grid-cols-[140px_repeat(15,minmax(64px,1fr))] border-b border-sand bg-canvas text-[11px] font-black text-gray-500">
                <div className="sticky left-0 z-10 border-r border-sand bg-canvas p-3">Корт</div>
                {BOOKING_HOURS.map((hour) => <div key={hour} className="border-r border-sand p-3 text-center last:border-r-0">{hour}</div>)}
              </div>

              {COURT_SEED.map((court) => (
                <div key={court.id} className="grid grid-cols-[140px_repeat(15,minmax(64px,1fr))] border-b border-sand last:border-b-0">
                  <div className="sticky left-0 z-10 flex items-center gap-3 border-r border-sand bg-white p-3">
                    <span className={`grid h-10 w-12 place-items-center rounded-xl border-2 border-white text-xs font-black text-white shadow-sm ${court.color === "blue" ? "bg-[#1268B3]" : "bg-terracotta"}`}>
                      {court.label}
                    </span>
                    <div>
                      <b className="block text-sm">{court.name}</b>
                      <span className="text-[10px] font-bold text-gray-400">Indoor</span>
                    </div>
                  </div>

                  {BOOKING_HOURS.map((hour) => {
                    const booking = bookingsBySlot.get(`${court.id}:${hour}`);
                    return <BookingCell key={`${court.id}-${hour}`} booking={booking} />;
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="mt-7 grid gap-4 lg:grid-cols-2">
          {dayBookings.length ? dayBookings.map((booking) => <BookingCard key={booking.id} booking={booking} />) : <div className="rounded-[28px] border border-dashed border-sand bg-white p-8 text-center text-gray-500 lg:col-span-2">На выбранную дату пока нет локально сохранённых броней.</div>}
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[24px] border border-sand bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-wider text-gray-400">{label}</p><b className="mt-2 block text-3xl font-black">{value}</b></div>;
}

function BookingCell({ booking }: { booking?: AdminBooking }) {
  if (!booking) return <div className="min-h-20 border-r border-sand bg-white p-2 last:border-r-0"><span className="block h-full rounded-xl border border-dashed border-sand bg-canvas/60" /></div>;

  const confirmed = booking.status === "confirmed";
  return (
    <details className="group min-h-20 border-r border-sand bg-white p-2 last:border-r-0">
      <summary className={`flex h-full min-h-16 cursor-pointer list-none flex-col justify-between rounded-xl p-2 text-xs font-black ${confirmed ? "bg-lime text-[#050505]" : "bg-terracotta text-white"}`}>
        <span>{confirmed ? "Оплачено" : "Hold"}</span>
        <span className="truncate">{booking.customer?.fullName || "Без имени"}</span>
      </summary>
      <div className="absolute z-30 mt-2 w-72 rounded-2xl border border-sand bg-white p-4 text-sm shadow-soft">
        <BookingDetails booking={booking} />
      </div>
    </details>
  );
}

function BookingCard({ booking }: { booking: AdminBooking }) {
  return (
    <article className="rounded-[28px] border border-sand bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-terracotta">{booking.status}</p>
          <h3 className="mt-2 text-2xl font-black">{booking.courtName}</h3>
          <p className="mt-1 flex items-center gap-2 text-sm text-gray-500"><Clock3 size={15} />{booking.date} · {displayBookingTimes(booking)}</p>
        </div>
        <b className="rounded-full bg-canvas px-4 py-2 text-sm">{booking.priceMdl ?? 500} MDL</b>
      </div>
      {(booking.remainingHours ?? 0) > 0 && <div className="mt-4 rounded-2xl border border-terracotta/20 bg-terracotta/10 p-4 text-sm font-black text-terracotta">Должен доплатить ещё {booking.remainingHours} ч. · {booking.remainingMdl} MDL</div>}
      <div className="mt-5 rounded-2xl bg-canvas p-4">
        <BookingDetails booking={booking} />
      </div>
    </article>
  );
}

function BookingDetails({ booking }: { booking: AdminBooking }) {
  return (
    <div className="space-y-2 text-sm">
      <p className="font-black">{booking.customer?.fullName || "ФИО не указано"}</p>
      <p className="flex items-center gap-2 text-gray-500"><Phone size={14} />{booking.customer?.phone || "—"}</p>
      <p className="flex items-center gap-2 text-gray-500"><Mail size={14} />{booking.customer?.email || "—"}</p>
      <p className="flex items-center gap-2 text-gray-500"><UsersRound size={14} />Гостей: {booking.customer?.guests ?? "—"}</p>
      {(booking.remainingHours ?? 0) > 0 && <p className="rounded-xl bg-terracotta/10 px-3 py-2 font-black text-terracotta">Доплата: {booking.remainingHours} ч. · {booking.remainingMdl} MDL</p>}
    </div>
  );
}
