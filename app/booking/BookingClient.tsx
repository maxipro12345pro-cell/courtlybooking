"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CalendarDays, Check, X } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import CourtMapSection from "@/components/booking/CourtMapSection";

const reveal = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

function toDateValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function nextSaturday() {
  const date = new Date();
  const offset = (6 - date.getDay() + 7) % 7 || 7;
  date.setDate(date.getDate() + offset);
  return toDateValue(date);
}

export default function BookingClient({ initialDate }: { initialDate: string }) {
  const pathname = usePathname();
  const [date, setDate] = useState(initialDate);
  const [showDateModal, setShowDateModal] = useState(false);
  const today = useMemo(() => toDateValue(new Date()), []);
  const tomorrow = useMemo(() => {
    const value = new Date();
    value.setDate(value.getDate() + 1);
    return toDateValue(value);
  }, []);
  const weekend = useMemo(nextSaturday, []);

  useEffect(() => {
    if (pathname !== "/" && pathname !== "/booking") return;

    const previousScrollRestoration =
      "scrollRestoration" in window.history ? window.history.scrollRestoration : null;

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    const frame = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });

    return () => {
      cancelAnimationFrame(frame);
      if (previousScrollRestoration) {
        window.history.scrollRestoration = previousScrollRestoration;
      }
    };
  }, [pathname]);

  useEffect(() => {
    if ((pathname === "/" || pathname === "/booking") && !sessionStorage.getItem("padelpoint:date-modal-seen")) {
      const frame = requestAnimationFrame(() => setShowDateModal(true));
      return () => cancelAnimationFrame(frame);
    }
  }, [pathname]);

  useEffect(() => {
    if (!showDateModal) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDateModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showDateModal]);

  function closeDateModal() {
    sessionStorage.setItem("padelpoint:date-modal-seen", "1");
    setShowDateModal(false);
  }

  function chooseQuickDate(value: string) {
    setDate(value);
  }

  return (
    <AppShell>
      <motion.main initial="hidden" animate="visible" transition={{ staggerChildren: .09 }} className="mx-auto max-w-[1380px] px-5 pb-32 pt-9 lg:px-8 lg:py-12">
        <motion.a variants={reveal} transition={{ duration: .45, ease: [0.22, 1, 0.36, 1] }} href="https://padelpoint.md" className="group mb-7 inline-flex items-center gap-3 rounded-full border border-sand bg-white py-1.5 pl-1.5 pr-5 text-sm font-black text-primary shadow-sm transition hover:border-primary/30">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#050505] text-white transition group-hover:-translate-x-0.5"><ArrowLeft size={17} /></span>
          На основной сайт
        </motion.a>
        <motion.div variants={reveal} transition={{ duration: .55, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-terracotta">PadelPoint · Online booking</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-.055em] text-primary sm:text-6xl">Бронирование корта</h1>
            <p className="mt-3 text-base text-gray-500 sm:text-lg">Выберите дату, корт и удобное время</p>
          </div>
          <label className="min-w-[230px] rounded-full border border-sand bg-white px-5 py-3 shadow-sm transition hover:border-terracotta">
            <span className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-gray-400"><CalendarDays size={14} />Дата игры</span>
            <input type="date" min={today} value={date} onChange={(event) => setDate(event.target.value)} className="w-full bg-transparent font-black text-primary outline-none" />
          </label>
        </motion.div>

        <motion.div variants={reveal} transition={{ duration: .55, ease: [0.22, 1, 0.36, 1] }} className="mt-6 flex flex-wrap gap-2 text-xs font-bold text-primary/65">
          {['9 крытых кортов', '500 MDL / час', '60 минут', 'Оплата онлайн'].map((item) => (
            <motion.span whileHover={{ y: -2 }} key={item} className="flex items-center gap-2 rounded-full border border-lime/70 bg-white px-4 py-2 shadow-[0_0_0_1px_rgba(216,255,62,.18)]"><Check size={13} className="text-terracotta" />{item}</motion.span>
          ))}
        </motion.div>

        <motion.div variants={reveal} transition={{ duration: .65, ease: [0.22, 1, 0.36, 1] }} className="-mx-3 mt-7 sm:mx-0"><CourtMapSection date={date} /></motion.div>
      </motion.main>

      <AnimatePresence>
        {showDateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .25 }} className="fixed inset-0 z-[100] grid place-items-center bg-black/65 px-5 py-8 backdrop-blur-[5px]" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) closeDateModal(); }}>
            <motion.section initial={{ opacity: 0, y: 34, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: .98 }} transition={{ type: "spring", stiffness: 270, damping: 25 }} role="dialog" aria-modal="true" aria-labelledby="quick-date-title" className="w-full max-w-[560px] overflow-hidden rounded-[34px] bg-white shadow-2xl">
              <div className="relative bg-terracotta px-7 pb-8 pt-7 text-white sm:px-9">
                <button type="button" onClick={closeDateModal} aria-label="Закрыть выбор даты" className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white/20 transition hover:rotate-90 hover:bg-white hover:text-primary"><X size={18} /></button>
                <p className="text-xs font-black uppercase tracking-[.18em] text-lime">Начнём бронирование</p>
                <h2 id="quick-date-title" className="mt-3 max-w-sm text-4xl font-black leading-[1.02] tracking-[-.05em]">Когда хотите играть?</h2>
                <p className="mt-3 text-sm text-white/75">Выберите дату — после этого сразу откроется карта кортов.</p>
              </div>

              <div className="p-7 sm:p-9">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Сегодня", value: today },
                    { label: "Завтра", value: tomorrow },
                    { label: "Выходные", value: weekend },
                  ].map((option) => (
                    <button key={option.label} type="button" onClick={() => chooseQuickDate(option.value)} className={`rounded-2xl border px-2 py-3 text-sm font-black transition ${date === option.value ? "border-[#050505] bg-lime text-[#050505]" : "border-sand bg-canvas text-primary hover:border-terracotta"}`}>{option.label}</button>
                  ))}
                </div>

                <label className="mt-4 block rounded-2xl border border-sand bg-canvas px-5 py-4">
                  <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-400"><CalendarDays size={15} />Или выберите дату</span>
                  <input type="date" min={today} value={date} onChange={(event) => setDate(event.target.value)} className="w-full bg-transparent text-lg font-black text-primary outline-none" />
                </label>

                <button type="button" onClick={closeDateModal} className="group mt-5 flex min-h-14 w-full items-center justify-between rounded-full bg-lime py-1.5 pl-6 pr-1.5 text-sm font-black text-[#050505]">
                  <span>Показать свободные корты</span>
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-[#050505] text-white transition group-hover:translate-x-0.5"><ArrowRight size={18} /></span>
                </button>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
