"use client";

import { useState } from "react";
import { CalendarDays, MapPin, Menu, Smartphone, X } from "lucide-react";
import { motion } from "framer-motion";
import Footer from "@/components/layout/Footer";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div id="top" className="min-h-screen">
      <motion.header
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-40 border-b border-sand bg-white/95 backdrop-blur"
      >
        <div className="mx-auto grid min-h-[68px] max-w-[1380px] grid-cols-[1fr_auto] items-center gap-4 px-5 py-2 lg:min-h-[86px] lg:grid-cols-[1fr_auto_1fr] lg:px-8">
          <div className="hidden items-center gap-5 lg:flex">
            <HeaderInfo icon={<MapPin size={16} />} text={<>Кишинёв, бул. Дачия<br />58/12</>} />
            <HeaderInfo icon={<CalendarDays size={16} />} text={<>Пн-Вс · 08:00–<br />23:00</>} />
            <HeaderInfo icon={<Smartphone size={16} />} href="tel:+37378003100" text="+373 (78) 003100" />
          </div>

          <a href="/" className="flex items-center gap-3 lg:mx-auto" aria-label="PadelPoint — бронирование">
            <span className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-sand lg:h-20 lg:w-20">
              <img src="/brand/padelpoint-logo.jpg" alt="PadelPoint" className="h-[92%] w-[92%] rounded-full object-cover" />
            </span>
            <span className="leading-none lg:hidden">
              <span className="block text-[11px] font-black uppercase tracking-[.18em] text-terracotta">PadelPoint</span>
              <span className="mt-1 block text-lg font-black tracking-[-.055em] text-primary">Booking</span>
            </span>
          </a>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="grid h-11 w-11 place-items-center justify-self-end rounded-full bg-[#050505] text-white lg:hidden"
            aria-label="Открыть меню"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <nav className="hidden flex-wrap items-center justify-center gap-2 lg:flex lg:justify-end" aria-label="Основная навигация">
            <NavPill href="https://padelpoint.md/">Главная</NavPill>
            <NavPill href="https://padelpoint.md/pro-klub/">О клубе</NavPill>
            <NavPill href="https://padelpoint.md/poslugy/">Услуги</NavPill>
            <NavPill href="https://padelpoint.md/blog/">Блог</NavPill>
            <NavPill href="https://padelpoint.md/#contacts">Контакты</NavPill>
          </nav>
        </div>

        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="border-t border-sand bg-white px-5 pb-5 lg:hidden">
            <div className="grid gap-2 pt-4">
              <MobileMenuLink href="https://padelpoint.md/">Главная</MobileMenuLink>
              <MobileMenuLink href="https://padelpoint.md/pro-klub/">О клубе</MobileMenuLink>
              <MobileMenuLink href="https://padelpoint.md/poslugy/">Услуги</MobileMenuLink>
              <MobileMenuLink href="https://padelpoint.md/blog/">Блог</MobileMenuLink>
              <MobileMenuLink href="https://padelpoint.md/#contacts">Контакты</MobileMenuLink>
              <a href="tel:+37378003100" className="mt-2 rounded-2xl bg-canvas px-4 py-3 text-sm font-black text-primary">
                +373 (78) 003100
              </a>
            </div>
          </motion.div>
        )}
      </motion.header>
      {children}
      <Footer />
    </div>
  );
}

function HeaderInfo({ icon, text, href }: { icon: React.ReactNode; text: React.ReactNode; href?: string }) {
  const content = (
    <>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-white">{icon}</span>
      <span className="whitespace-nowrap">{text}</span>
    </>
  );

  if (href) {
    return (
      <a href={href} className="flex items-center gap-3 text-sm font-extrabold leading-tight text-primary transition hover:text-terracotta">
        {content}
      </a>
    );
  }

  return <div className="flex items-center gap-3 text-sm font-extrabold leading-tight text-primary">{content}</div>;
}

function NavPill({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="rounded-full border border-sand bg-white px-5 py-3 text-sm font-black text-primary transition hover:border-primary hover:bg-primary hover:text-white">
      {children}
    </a>
  );
}

function MobileMenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="rounded-full border border-sand bg-white px-5 py-3 text-sm font-black text-primary shadow-sm">
      {children}
    </a>
  );
}
