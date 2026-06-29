import { ArrowUpRight, Instagram, MapPin, Send, ArrowUp } from "lucide-react";

const navLinks = [
  { label: "Главная", href: "https://padelpoint.md/" },
  { label: "Услуги", href: "https://padelpoint.md/poslugy/" },
  { label: "О клубе", href: "https://padelpoint.md/pro-klub/" },
  { label: "Блог", href: "https://padelpoint.md/blog/" },
  { label: "Публичная оферта", href: "https://padelpoint.md/privacy-policy/" },
];

export default function Footer() {
  return (
    <footer className="px-2 pb-2 pt-10 sm:px-3 lg:pt-14">
      <section className="overflow-hidden rounded-[34px] bg-[#10232C] text-white sm:rounded-[42px]">
        <div className="mx-auto max-w-[1380px] px-6 py-10 sm:px-8 lg:px-10 lg:py-14">
          <div className="grid gap-10 lg:grid-cols-[1.25fr_.9fr] lg:gap-16">
            <div>
              <img
                src="/brand/padelpoint-logo.jpg"
                alt="PadelPoint"
                className="h-20 w-20 rounded-full object-cover sm:h-24 sm:w-24"
              />

              <h2 className="mt-10 max-w-3xl text-4xl font-black leading-[.96] tracking-[-.065em] sm:text-5xl lg:text-6xl">
                Создаём пространство для игры.
                <span className="block text-white/55">Вдохновляем на движение.</span>
                <span className="block">
                  Padel <span className="text-lime">starts here</span>
                </span>
              </h2>

              <p className="mt-16 text-xs font-bold text-white/35">
                ©2026 Padelpoint Chisinau — All rights reserved.
              </p>
            </div>

            <div className="grid content-start gap-10 sm:grid-cols-2">
              <nav className="flex flex-wrap gap-2 sm:col-span-2" aria-label="Footer navigation">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="rounded-full border border-white/25 px-5 py-2.5 text-sm font-black text-white/90 transition hover:border-lime hover:bg-lime hover:text-[#050505]"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              <FooterBlock title="Локация">
                <a
                  href="https://maps.app.goo.gl/HxmCLM9DhefHU3w29"
                  className="group inline-flex max-w-[230px] gap-2 text-sm font-black leading-5 text-white transition hover:text-lime"
                >
                  <MapPin size={16} className="mt-0.5 shrink-0 text-lime" />
                  Кишинёв, бул. Дачия 58/12, комплекс СТРААЛ
                </a>
              </FooterBlock>

              <FooterBlock title="Контакты">
                <a href="tel:+37378003100" className="text-sm font-black text-white transition hover:text-lime">
                  +373 (78) 003100
                </a>
                <div className="mt-5 space-y-3">
                  <a href="https://www.instagram.com/padelpoint.hub" className="flex items-center gap-2 text-sm font-black text-white transition hover:text-lime">
                    <Instagram size={16} /> Instagram
                  </a>
                  <a href="https://t.me/padelpointchat" className="flex items-center gap-2 text-sm font-black text-white transition hover:text-lime">
                    <Send size={16} /> Telegram
                  </a>
                  <p className="max-w-[190px] text-xs leading-4 text-white/40">
                    Чат для общения и поиска партнёров
                  </p>
                </div>
              </FooterBlock>

              <FooterBlock title="Ежедневно">
                <p className="text-sm font-black text-white">8:00–23:00</p>
              </FooterBlock>

              <FooterBlock title="Email">
                <a href="mailto:padelpoint.md@gmail.com" className="text-sm font-black text-white transition hover:text-lime">
                  padelpoint.md@gmail.com
                </a>
              </FooterBlock>
            </div>
          </div>

          <div className="mt-12">
            <p className="select-none text-[21vw] font-black leading-[.75] tracking-[-.09em] text-white sm:text-[18vw] lg:text-[170px]">
              Padel Point
            </p>
          </div>

          <a
            href="#top"
            className="group mt-6 flex min-h-16 items-center justify-between rounded-full bg-white/7 py-2 pl-6 pr-2 text-sm font-black text-white transition hover:bg-lime hover:text-[#050505]"
          >
            <span>/ Вернуться в начало</span>
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#050505] transition group-hover:bg-[#050505] group-hover:text-white">
              <ArrowUp size={18} />
            </span>
          </a>
        </div>
      </section>
    </footer>
  );
}

function FooterBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-sm text-white/35">{title}:</p>
      {children}
    </div>
  );
}
