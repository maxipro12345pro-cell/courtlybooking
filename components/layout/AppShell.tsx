"use client";

import { CalendarDays, MapPin, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import Footer from "@/components/layout/Footer";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div id="top" className="min-h-screen">
      <motion.header initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, ease: [0.22, 1, 0.36, 1] }} className="sticky top-0 z-40 border-b border-sand bg-white/95 backdrop-blur">
        <div className="mx-auto grid min-h-[92px] max-w-[1380px] items-center gap-4 px-5 py-3 lg:grid-cols-[1fr_auto_1fr] lg:px-8">
          <div className="hidden items-center gap-5 lg:flex">
            <HeaderInfo icon={<MapPin size={16} />} text={<>Кишинёв, бул. Дачия<br />58/12</>} />
            <HeaderInfo icon={<CalendarDays size={16} />} text={<>Пн-Вс · 08:00–<br />23:00</>} />
            <HeaderInfo icon={<Smartphone size={16} />} text={<>+373 (78)<br />003100</>} />
          </div>

          <a href="/" className="mx-auto grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-sand lg:h-24 lg:w-24" aria-label="PadelPoint — бронирование">
            <img src="/brand/padelpoint-logo.svg" alt="PadelPoint" className="h-[92%] w-[92%] rounded-full object-cover" />
          </a>

          <nav className="flex flex-wrap items-center justify-center gap-2 lg:justify-end" aria-label="Основная навигация">
            <NavPill href="https://padelpoint.md/">Главная</NavPill>
            <NavPill href="https://padelpoint.md/pro-klub/">О клубе</NavPill>
            <NavPill href="https://padelpoint.md/poslugy/">Услуги</NavPill>
            <NavPill href="https://padelpoint.md/blog/">Блог</NavPill>
            <NavPill href="https://padelpoint.md/#contacts">Контакты</NavPill>
          </nav>
        </div>
      </motion.header>
      {children}
      <Footer />
    </div>
  );
}

function HeaderInfo({ icon, text }: { icon: React.ReactNode; text: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-sm font-bold leading-tight text-primary">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-white">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function NavPill({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="rounded-full border border-sand bg-white px-5 py-3 text-sm font-black text-primary transition hover:border-primary hover:bg-primary hover:text-white">
      {children}
    </a>
  );
}
