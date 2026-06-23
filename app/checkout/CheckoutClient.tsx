"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Clock3, CreditCard, LoaderCircle, ShieldCheck } from "lucide-react";
import AppShell from "@/components/layout/AppShell";

interface HeldBooking {
  id: string;
  courtName: string;
  date: string;
  time: string;
  times?: string[];
  durationMinutes?: number;
  priceMdl: number;
  depositMdl?: number;
  remainingHours?: number;
  remainingMdl?: number;
  status: string;
  holdExpiresAt: string;
  customer?: {
    fullName: string;
    phone: string;
    email: string;
    guests: number;
  };
}

export default function CheckoutClient({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [booking, setBooking] = useState<HeldBooking | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem(`booking:${bookingId}`);
    if (raw) setBooking(JSON.parse(raw));
  }, [bookingId]);

  async function pay() {
    if (!booking) return;
    setPaying(true);
    setError("");
    try {
      const created = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      if (!created.ok) throw new Error("Не удалось создать платёж");
      const { payment } = await created.json();
      const confirmed = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerPaymentId: payment.providerPaymentId, bookingId }),
      });
      if (!confirmed.ok) throw new Error("Платёж не подтверждён");
      const result = await confirmed.json();
      const completed = { ...booking, status: "confirmed", paymentId: payment.id, paymentStatus: result.paymentStatus };
      sessionStorage.setItem(`booking:${bookingId}`, JSON.stringify(completed));
      const existing = JSON.parse(localStorage.getItem("padelpoint:bookings") || "[]");
      localStorage.setItem(
        "padelpoint:bookings",
        JSON.stringify([completed, ...existing.filter((item: { id: string }) => item.id !== bookingId)]),
      );
      router.push(`/payment-success?bookingId=${bookingId}&paymentId=${payment.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Ошибка оплаты");
      setPaying(false);
    }
  }

  const selectedTimes = booking?.times?.length ? booking.times : booking ? [booking.time] : [];
  const depositMdl = booking?.depositMdl ?? 500;
  const totalMdl = booking?.priceMdl ?? 500;
  const remainingHours = booking?.remainingHours ?? 0;
  const remainingMdl = booking?.remainingMdl ?? 0;
  const showDepositBreakdown = remainingHours > 0;

  if (!booking) {
    return <AppShell><main className="mx-auto max-w-2xl px-5 py-20 text-center"><p className="text-xs font-black uppercase tracking-wider text-terracotta">PadelPoint booking</p><h1 className="mt-3 text-4xl font-black tracking-[-.05em] text-primary">Бронь не найдена</h1><p className="mt-3 text-gray-500">Выберите корт и время перед оплатой.</p><a href="/booking" className="mt-7 inline-flex items-center gap-3 rounded-full bg-lime py-1.5 pl-6 pr-1.5 text-sm font-black text-[#050505]">Вернуться к карте <span className="grid h-10 w-10 place-items-center rounded-full bg-[#050505] text-white"><ArrowRight size={16} /></span></a></main></AppShell>;
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-[1080px] px-5 py-10 lg:px-8 lg:py-14">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[.18em] text-terracotta">Шаг 2 из 2</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-.055em] text-primary sm:text-6xl">Оплата бронирования</h1>
          <p className="mt-3 text-gray-500">Бронирование подтверждается после успешной оплаты.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
          <section className="rounded-[32px] border border-sand bg-white p-6 shadow-soft sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-terracotta text-white"><CreditCard /></span>
              <div><h2 className="font-black text-primary">Банковская карта</h2><p className="text-xs text-gray-400">Безопасная онлайн-оплата</p></div>
            </div>
            <div className="mt-7 space-y-4">
              <Field label="Номер карты" placeholder="4242 4242 4242 4242" />
              <div className="grid grid-cols-2 gap-4"><Field label="Срок" placeholder="12/29" /><Field label="CVV" placeholder="123" /></div>
              <Field label="Имя владельца" placeholder="ALEX MUNTEANU" />
            </div>
            {error && <p role="alert" className="mt-5 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <button type="button" onClick={pay} disabled={paying} className="mt-6 flex min-h-14 w-full items-center justify-between rounded-full bg-lime py-1.5 pl-6 pr-1.5 text-sm font-black text-[#050505] disabled:opacity-60">
              <span>{paying ? "Подтверждаем платёж..." : showDepositBreakdown ? `Оплатить предоплату ${depositMdl} MDL` : `Оплатить ${totalMdl} MDL`}</span>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#050505] text-white">{paying ? <LoaderCircle className="animate-spin" size={18} /> : <ArrowRight size={18} />}</span>
            </button>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-gray-400"><ShieldCheck size={12} />Защищённая платёжная сессия</p>
          </section>

          <aside className="rounded-[32px] bg-terracotta p-7 text-white shadow-soft">
            <span className="text-xs font-black uppercase tracking-wider text-lime">Детали брони</span>
            <h2 className="mt-5 text-3xl font-black">{booking.courtName}</h2>
            <div className="mt-6 space-y-4 border-y border-white/30 py-5 text-sm">
              <p className="flex items-center gap-2 text-white/80"><CalendarDays size={16} />{booking.date}</p>
              <p className="flex items-center gap-2 text-white/80"><Clock3 size={16} />{selectedTimes.length > 1 ? `${selectedTimes.length} часа: ${selectedTimes.join(", ")}` : `${booking.time} · 60 минут`}</p>
            </div>
            {booking.customer && <div className="mt-5 rounded-[22px] bg-white/12 p-4 text-xs leading-5 text-white/80"><b className="mb-2 block text-sm text-white">{booking.customer.fullName}</b><p>{booking.customer.phone}</p><p>{booking.customer.email}</p><p>Гостей: {booking.customer.guests}</p></div>}
            {showDepositBreakdown ? <div className="mt-6 space-y-3"><div className="rounded-[18px] bg-white p-4 text-primary"><p className="flex justify-between text-sm font-black"><span>Предоплата сейчас</span><span>{depositMdl} MDL</span></p><p className="mt-2 flex justify-between text-xs font-bold text-terracotta"><span>Доплата в клубе: {remainingHours} ч.</span><span>{remainingMdl} MDL</span></p></div><div className="flex items-end justify-between"><span className="text-sm text-white/70">Итого</span><b className="text-3xl">{totalMdl} MDL</b></div></div> : <div className="mt-6 flex items-end justify-between"><span className="text-sm text-white/70">Итого</span><b className="text-3xl">{totalMdl} MDL</b></div>}
            <div className="mt-7 rounded-[22px] bg-white p-4 text-xs leading-5 text-primary">Слот удерживается 10 минут. Финальное подтверждение появится сразу после оплаты.</div>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wider text-primary/55">{label}</span><input placeholder={placeholder} className="w-full rounded-2xl border border-sand bg-canvas px-4 py-3.5 text-sm text-primary outline-none transition focus:border-terracotta" /></label>;
}
