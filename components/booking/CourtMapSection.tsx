"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Clock3, DoorOpen, Layers3, LoaderCircle, Map, ShieldCheck } from "lucide-react";
import { BOOKING_HOURS, CLUB, COURT_SEED } from "@/lib/domain/config";

type SlotStatus = "available" | "booked" | "held" | "past" | "unavailable";
type CourtColor = "blue" | "terracotta";
type ViewMode = "map3d" | "plan2d" | "schedule";

interface Slot { time: string; status: SlotStatus }
interface CustomerDetails { fullName: string; phone: string; email: string; guests: string }
interface MapCourt {
  id: string; name: string; label: string; color: CourtColor; type: "indoor"; priceMdl: 500;
  x: number; y: number; width: number; height: number; level: "upper" | "lower"; slots: Slot[];
}

const positions = [
  { x: 25, y: 7, width: 13, height: 31, level: "upper" as const },
  { x: 40, y: 7, width: 13, height: 31, level: "upper" as const },
  { x: 55, y: 7, width: 13, height: 31, level: "upper" as const },
  { x: 70, y: 7, width: 13, height: 31, level: "upper" as const },
  { x: 85, y: 7, width: 11, height: 31, level: "upper" as const },
  { x: 11, y: 7, width: 12, height: 31, level: "upper" as const },
  { x: 18, y: 48, width: 21, height: 29, level: "lower" as const },
  { x: 42, y: 48, width: 21, height: 29, level: "lower" as const },
  { x: 66, y: 48, width: 21, height: 29, level: "lower" as const },
];

const statusPattern: SlotStatus[][] = [
  ["past","past","available","available","booked","available","held","available","available","booked","available","available","booked","available","unavailable"],
  ["past","past","available","held","available","available","booked","booked","available","available","available","held","available","booked","available"],
  ["past","past","past","available","available","booked","available","available","held","available","booked","available","available","available","booked"],
];

const courts: MapCourt[] = COURT_SEED.map((court, index) => ({
  ...court,
  ...positions[index],
  slots: BOOKING_HOURS.map((time, slotIndex) => ({ time, status: statusPattern[index % statusPattern.length][slotIndex] })),
}));

const emptyCustomer: CustomerDetails = {
  fullName: "",
  phone: "",
  email: "",
  guests: "1",
};

function isCustomerComplete(customer: CustomerDetails) {
  return Boolean(
    customer.fullName.trim() &&
    customer.phone.trim() &&
    customer.email.trim() &&
    Number(customer.guests) >= 1,
  );
}

export default function CourtMapSection({ date }: { date: string }) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("map3d");
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerDetails>(emptyCustomer);
  const [formTouched, setFormTouched] = useState(false);
  const [holding, setHolding] = useState(false);
  const selectedCourt = courts.find((court) => court.id === selectedCourtId) ?? null;
  const customerComplete = isCustomerComplete(customer);

  function selectCourt(court: MapCourt) {
    setSelectedCourtId(court.id);
    setSelectedTime(null);
    setFormTouched(false);
    if (viewMode === "plan2d") window.setTimeout(() => setViewMode("schedule"), 150);
    else setViewMode("plan2d");
  }

  function backToMap() { setSelectedCourtId(null); setSelectedTime(null); setFormTouched(false); setViewMode("map3d"); }

  function updateCustomer(field: keyof CustomerDetails, value: string) {
    setCustomer((current) => ({ ...current, [field]: value }));
  }

  async function continueBooking() {
    if (!selectedCourt || !selectedTime) return;
    setFormTouched(true);
    if (!customerComplete) return;
    setHolding(true);
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    const bookingId = `bk_${Date.now().toString(36)}_${selectedCourt.id}`;
    const booking = {
      id: bookingId,
      courtId: selectedCourt.id,
      courtName: selectedCourt.name,
      date,
      time: selectedTime,
      durationMinutes: 60,
      priceMdl: 500,
      status: "held",
      holdExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      crm_lead_id: null,
      crm_sync_status: "not_requested",
      customer: {
        fullName: customer.fullName.trim(),
        phone: customer.phone.trim(),
        email: customer.email.trim(),
        guests: Number(customer.guests),
      },
      createdAt: new Date().toISOString(),
    };
    sessionStorage.setItem(`booking:${bookingId}`, JSON.stringify(booking));
    const existing = JSON.parse(localStorage.getItem("padelpoint:bookings") || "[]");
    localStorage.setItem("padelpoint:bookings", JSON.stringify([booking, ...existing.filter((item: { id: string }) => item.id !== bookingId)]));
    router.push(`/checkout?bookingId=${bookingId}`);
  }

  return (
    <LayoutGroup id="padelpoint-courts">
      <div className="grid items-start gap-5 rounded-[38px] bg-terracotta p-3 shadow-soft sm:p-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="relative h-[570px] min-w-0 sm:h-[620px]">
          <AnimatePresence initial={false} mode="popLayout">
            {viewMode !== "schedule" ? (
              <motion.div key="map" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ClubMap courts={courts} viewMode={viewMode} selectedCourtId={selectedCourtId} onModeChange={setViewMode} onSelect={selectCourt} onFlattenComplete={() => { if (selectedCourtId && viewMode === "plan2d") setViewMode("schedule"); }} />
              </motion.div>
            ) : selectedCourt ? (
              <motion.div key="schedule" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Schedule court={selectedCourt} selectedTime={selectedTime} customer={customer} formTouched={formTouched} onSelectTime={setSelectedTime} onBack={backToMap} onCustomerChange={updateCustomer} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        <BookingSummary court={selectedCourt} time={selectedTime} date={date} customer={customer} customerComplete={customerComplete} formTouched={formTouched} loading={holding} onCustomerChange={updateCustomer} onContinue={continueBooking} />
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-sand bg-white p-4 shadow-[0_-12px_40px_rgba(17,24,39,.12)] xl:hidden"><MobileSummary court={selectedCourt} time={selectedTime} customerComplete={customerComplete} loading={holding} onContinue={continueBooking} /></div>
    </LayoutGroup>
  );
}

function ClubMap({ courts, viewMode, selectedCourtId, onModeChange, onSelect, onFlattenComplete }: { courts: MapCourt[]; viewMode: "map3d" | "plan2d"; selectedCourtId: string | null; onModeChange: (mode: "map3d" | "plan2d") => void; onSelect: (court: MapCourt) => void; onFlattenComplete: () => void }) {
  return <div className="flex h-full flex-col overflow-hidden rounded-[30px] border border-white/30 bg-terracotta"><div className="flex items-center justify-between border-b border-white/30 px-5 py-4"><div><h2 className="font-black text-white">Карта PadelPoint</h2><p className="mt-1 text-xs text-white/70">9 indoor-кортов · 500 MDL / час</p></div><div className="flex rounded-full bg-white/15 p-1"><Mode active={viewMode === "map3d"} label="3D" icon={<Layers3 size={14} />} onClick={() => onModeChange("map3d")} /><Mode active={viewMode === "plan2d"} label="План" icon={<Map size={14} />} onClick={() => onModeChange("plan2d")} /></div></div><div className="relative flex-1 overflow-x-auto overflow-y-hidden bg-terracotta p-3 [perspective:1500px]"><motion.div animate={{ rotateX: viewMode === "map3d" ? 34 : 0, rotateZ: viewMode === "map3d" ? -12 : 0, scale: viewMode === "map3d" ? .9 : 1 }} transition={{ type: "spring", stiffness: 110, damping: 22 }} onAnimationComplete={() => { if (viewMode === "plan2d" && selectedCourtId) onFlattenComplete(); }} className="relative mx-auto aspect-[1.85] h-full min-h-[430px] min-w-[820px] [transform-style:preserve-3d]"><Building dimmed={Boolean(selectedCourtId)} /><Columns dimmed={Boolean(selectedCourtId)} />{courts.map((court) => <CourtZone key={court.id} court={court} selected={selectedCourtId === court.id} dimmed={Boolean(selectedCourtId && selectedCourtId !== court.id)} onSelect={onSelect} />)}<div className="absolute bottom-[4%] left-[43%] flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[9px] font-black uppercase tracking-wider text-primary shadow-lg [transform:translateZ(18px)]"><DoorOpen size={13} />Вход и reception</div></motion.div><Floating className="right-5 top-5" title="Свободно сегодня" /></div></div>;
}

function Building({ dimmed }: { dimmed: boolean }) { return <motion.div animate={{ opacity: dimmed ? .35 : 1 }} className="pointer-events-none absolute inset-0 [transform-style:preserve-3d]"><div className="absolute bottom-[3%] left-[3%] h-[20%] w-[94%] border border-[#c5c9c3] bg-[#E5E7E2] shadow-[0_20px_28px_rgba(62,68,70,.25)] [transform:translateZ(8px)]"><div className="absolute inset-x-[3%] top-[24%] flex justify-between">{Array.from({ length: 15 }, (_, i) => <i key={i} className="h-5 w-[4%] border border-[#aeb5b4] bg-[#d5e1e2]/75" />)}</div><div className="absolute inset-x-[2%] top-[-14%] border-t-2 border-[#78878b]/60" /></div><div className="absolute left-[8%] top-[43%] h-[35%] w-[82%] border border-[#bcc2c3] bg-[#dfe2de] shadow-lg [transform:translateZ(4px)]" /><div className="absolute left-[7%] top-[4%] h-[38%] w-[90%] border border-[#c8ccc5] bg-[#f4f5f2] shadow-xl [transform:translateZ(37px)]" /><div className="absolute left-[5%] top-[51%] h-[26%] w-[10%] border border-[#c7cbc5] bg-[#f4f3ed] shadow-lg [transform:translateZ(14px)]"><b className="absolute left-2 top-2 text-[7px] uppercase tracking-wider text-primary/50">Lounge</b></div></motion.div>; }
function Columns({ dimmed }: { dimmed: boolean }) { return <motion.div animate={{ opacity: dimmed ? .35 : 1 }} className="pointer-events-none absolute inset-0 z-30">{[9,24,39,54,69,84,97].map((left) => <i key={left} className="absolute top-[1%] h-[78%] w-[1%] bg-gradient-to-r from-[#aeb3b1] via-white to-[#9ca3a1] shadow-md [transform:translateZ(62px)]" style={{ left: `${left}%` }} />)}<i className="absolute left-[7%] top-[1%] h-[2%] w-[91%] bg-[#c9cdca] [transform:translateZ(63px)]" /></motion.div>; }

function CourtZone({ court, selected, dimmed, onSelect }: { court: MapCourt; selected: boolean; dimmed: boolean; onSelect: (court: MapCourt) => void }) {
  const [hovered, setHovered] = useState(false);
  const available = court.slots.filter((slot) => slot.status === "available").length;
  return <motion.button layoutId={`court-${court.id}`} type="button" onClick={() => onSelect(court)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocus={() => setHovered(true)} onBlur={() => setHovered(false)} aria-label={`Открыть расписание ${court.name}`} animate={{ opacity: dimmed ? .22 : 1, scale: selected ? 1.07 : 1, z: selected ? 80 : court.level === "upper" ? 48 : 16 }} whileHover={{ scale: 1.035 }} className={`absolute z-20 rounded-[2px] border-2 border-white/85 p-[3px] shadow-[0_10px_18px_rgba(38,46,50,.25)] outline-none ${court.color === "blue" ? "bg-[#1268B3]" : "bg-[#B95F42]"} ${selected ? "ring-4 ring-lime" : "hover:ring-4 hover:ring-white"}`} style={{ left: `${court.x}%`, top: `${court.y}%`, width: `${court.width}%`, height: `${court.height}%` }}><CourtLines /><span className={`absolute left-1.5 top-1.5 rounded-full px-1.5 py-1 text-[9px] font-black leading-none ${selected ? "bg-lime text-[#050505]" : "bg-[#050505] text-white"}`}>{court.label}</span><AnimatePresence>{hovered && <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`pointer-events-none absolute left-1/2 z-50 w-44 -translate-x-1/2 rounded-2xl bg-[#050505] p-3 text-left text-white shadow-2xl ${court.y < 20 ? "top-[108%]" : "bottom-[108%]"}`}><b className="block text-xs">{court.name}</b><small className="mt-1 block text-white/60">Indoor · 500 MDL / час</small><span className="mt-2 block border-t border-white/10 pt-2 text-[10px] text-lime">{available} свободных слотов</span></motion.span>}</AnimatePresence></motion.button>;
}

function CourtLines() { return <span className="pointer-events-none absolute inset-[7%] border-2 border-white/85"><i className="absolute inset-y-0 left-1/2 border-l-2 border-white/85" /><i className="absolute inset-x-0 top-1/2 border-t-2 border-white/85" /><i className="absolute inset-y-[23%] left-[25%] right-[25%] border-x border-white/85" /></span>; }
function Floating({ title, className }: { title: string; className: string }) { return <div className={`pointer-events-none absolute z-50 rounded-full bg-lime px-4 py-2 text-[11px] font-black text-[#050505] shadow-lg ${className}`}>{title}</div>; }
function Mode({ active, label, icon, onClick }: { active: boolean; label: string; icon: React.ReactNode; onClick: () => void }) { return <button type="button" onClick={onClick} className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-black ${active ? "bg-lime text-[#050505]" : "text-white/75"}`}>{icon}{label}</button>; }

function Schedule({ court, selectedTime, customer, formTouched, onSelectTime, onBack, onCustomerChange }: { court: MapCourt; selectedTime: string | null; customer: CustomerDetails; formTouched: boolean; onSelectTime: (time: string) => void; onBack: () => void; onCustomerChange: (field: keyof CustomerDetails, value: string) => void }) {
  return <div className="h-full overflow-y-auto rounded-[30px] border border-sand bg-white shadow-soft"><div className="flex items-center gap-3 border-b border-sand p-5"><button type="button" onClick={onBack} aria-label="Вернуться к карте" className="grid h-10 w-10 place-items-center rounded-full bg-[#050505] text-white"><ArrowLeft size={18} /></button><motion.div layoutId={`court-${court.id}`} className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-white/80 ${court.color === "blue" ? "bg-[#1268B3]" : "bg-[#B95F42]"}`}><CourtLines /></motion.div><div><h3 className="font-black text-primary">{court.name}</h3><p className="mt-1 text-xs text-gray-400">Indoor · 500 MDL · 60 минут</p></div></div><div className="p-5"><div className="mb-5"><h4 className="font-black text-primary">Выберите время</h4><p className="mt-1 text-xs text-gray-400">Ежедневно с 07:00 до 22:00</p></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{court.slots.map((slot) => { const disabled = slot.status !== "available"; const selected = slot.time === selectedTime; return <button key={slot.time} type="button" disabled={disabled} onClick={() => onSelectTime(slot.time)} className={`min-h-[64px] rounded-2xl border px-3 py-2 text-left transition ${selected ? "border-[#050505] bg-lime text-[#050505] ring-2 ring-[#050505]" : disabled ? "cursor-not-allowed border-gray-100 bg-gray-100 text-gray-400" : "border-sand bg-white text-primary hover:border-terracotta"}`}><b className="block text-sm">{slot.time}</b><small className="mt-1 block font-bold">{selected ? "Выбрано" : slot.status === "available" ? "500 MDL" : slot.status === "held" ? "Удерживается" : slot.status === "past" ? "Прошло" : "Занято"}</small></button>; })}</div>{selectedTime && <div className="mt-6 rounded-[24px] border border-sand bg-canvas p-5 xl:hidden"><CustomerFields customer={customer} formTouched={formTouched} onChange={onCustomerChange} /></div>}</div></div>;
}

function BookingSummary({ court, time, date, customer, customerComplete, formTouched, loading, onCustomerChange, onContinue }: { court: MapCourt | null; time: string | null; date: string; customer: CustomerDetails; customerComplete: boolean; formTouched: boolean; loading: boolean; onCustomerChange: (field: keyof CustomerDetails, value: string) => void; onContinue: () => void }) {
  return <aside className="sticky top-28 hidden rounded-[28px] border border-sand bg-white p-6 shadow-soft xl:block"><h3 className="text-lg font-black text-primary">Ваша бронь</h3>{court && time ? <div className="mt-5"><div className="rounded-[22px] bg-terracotta p-5 text-white"><small className="text-white/70">PadelPoint</small><b className="mt-1 block text-lg">{court.name}</b><p className="mt-1 text-xs text-white/75">{date} · {time}–{`${String(Number(time.slice(0,2))+1).padStart(2,"0")}:00`}</p></div><div className="my-5 flex items-end justify-between"><span className="text-sm text-gray-500">К оплате</span><b className="text-2xl font-black text-primary">500 MDL</b></div><CustomerFields customer={customer} formTouched={formTouched} onChange={onCustomerChange} /><button type="button" onClick={onContinue} disabled={loading || !customerComplete} className="group mt-5 flex min-h-14 w-full items-center justify-between rounded-full bg-lime py-1.5 pl-5 pr-1.5 text-sm font-black text-[#050505] disabled:bg-gray-200 disabled:text-gray-400 disabled:opacity-80"><span>{loading ? "Создаём бронь..." : "Перейти к оплате"}</span><span className="grid h-11 w-11 place-items-center rounded-full bg-[#050505] text-white">{loading ? <LoaderCircle size={17} className="animate-spin" /> : <ArrowRight size={17} />}</span></button><p className="mt-3 flex items-center justify-center gap-1 text-[10px] text-gray-400"><ShieldCheck size={12} /> Слот удерживается 10 минут</p></div> : <div className="mt-5 rounded-[22px] border border-dashed border-sand bg-canvas p-7 text-center"><Clock3 className="mx-auto text-primary/25" /><p className="mt-4 text-sm font-black text-primary">Выберите корт и время</p><p className="mt-2 text-xs text-gray-400">Итог появится здесь</p></div>}</aside>;
}
function MobileSummary({ court, time, customerComplete, loading, onContinue }: { court: MapCourt | null; time: string | null; customerComplete: boolean; loading: boolean; onContinue: () => void }) {
  return <div className="mx-auto flex max-w-3xl items-center gap-3"><div className="min-w-0 flex-1">{court && time ? <><p className="truncate text-xs text-gray-500">{customerComplete ? court.name : "Заполните данные брони"}</p><b className="text-primary">{time} · 500 MDL</b></> : <b className="text-sm text-primary">Выберите корт и время</b>}</div><button type="button" disabled={!court || !time || !customerComplete || loading} onClick={onContinue} className="flex items-center gap-2 rounded-full bg-lime py-1.5 pl-5 pr-1.5 text-sm font-black text-[#050505] disabled:bg-gray-200 disabled:text-gray-400">{loading ? "Создаём..." : "Оплатить"}<span className="grid h-9 w-9 place-items-center rounded-full bg-[#050505] text-white"><ArrowRight size={15} /></span></button></div>;
}

function CustomerFields({ customer, formTouched, onChange }: { customer: CustomerDetails; formTouched: boolean; onChange: (field: keyof CustomerDetails, value: string) => void }) {
  return (
    <div>
      <div className="mb-3">
        <h4 className="text-sm font-black text-primary">Данные для брони</h4>
        <p className="mt-1 text-xs text-gray-400">Эти поля обязательны для администратора клуба.</p>
      </div>
      <div className="grid gap-3">
        <CustomerField label="ФИО" value={customer.fullName} placeholder="Иван Петров" required invalid={formTouched && !customer.fullName.trim()} onChange={(value) => onChange("fullName", value)} />
        <CustomerField label="Номер телефона" value={customer.phone} placeholder="+373 78 003100" type="tel" required invalid={formTouched && !customer.phone.trim()} onChange={(value) => onChange("phone", value)} />
        <CustomerField label="Email" value={customer.email} placeholder="name@email.com" type="email" required invalid={formTouched && !customer.email.trim()} onChange={(value) => onChange("email", value)} />
        <CustomerField label="Количество гостей" value={customer.guests} placeholder="1" type="number" min={1} max={8} required invalid={formTouched && Number(customer.guests) < 1} onChange={(value) => onChange("guests", value)} />
      </div>
      {formTouched && !isCustomerComplete(customer) && <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">Заполните ФИО, номер, email и количество гостей.</p>}
    </div>
  );
}

function CustomerField({ label, value, placeholder, type = "text", min, max, required, invalid, onChange }: { label: string; value: string; placeholder: string; type?: string; min?: number; max?: number; required?: boolean; invalid?: boolean; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-primary/55">{label}{required && <span className="text-terracotta"> *</span>}</span>
      <input value={value} placeholder={placeholder} type={type} min={min} max={max} required={required} onChange={(event) => onChange(event.target.value)} className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm font-bold text-primary outline-none transition focus:border-terracotta ${invalid ? "border-red-300 ring-2 ring-red-100" : "border-sand"}`} />
    </label>
  );
}
