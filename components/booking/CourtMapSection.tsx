"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Clock3, DoorOpen, Layers3, LoaderCircle, Map, ShieldCheck, X } from "lucide-react";
import { BOOKING_HOURS, CLUB, COURT_SEED } from "@/lib/domain/config";

type SlotStatus = "available" | "booked" | "held" | "past" | "unavailable";
type CourtColor = "blue" | "terracotta";
type ViewMode = "map3d" | "plan2d" | "schedule";
type HalfExtension = "before" | "after" | null;

interface Slot { time: string; status: SlotStatus }
interface CustomerDetails { fullName: string; phone: string; email: string; guests: string; acceptedPolicy: boolean }
interface MapCourt {
  id: string; name: string; label: string; color: CourtColor; type: "indoor"; priceMdl: 500;
  x: number; y: number; width: number; height: number; level: "upper" | "lower"; slots: Slot[];
}

const positions = [
  { x: 11, y: 7, width: 13, height: 31, level: "upper" as const },
  { x: 25, y: 7, width: 13, height: 31, level: "upper" as const },
  { x: 40, y: 7, width: 13, height: 31, level: "upper" as const },
  { x: 55, y: 7, width: 13, height: 31, level: "upper" as const },
  { x: 70, y: 7, width: 13, height: 31, level: "upper" as const },
  { x: 85, y: 7, width: 13, height: 31, level: "upper" as const },
  { x: 18, y: 45, width: 21, height: 29, level: "lower" as const },
  { x: 42, y: 45, width: 21, height: 29, level: "lower" as const },
  { x: 66, y: 45, width: 21, height: 29, level: "lower" as const },
];

const courts: MapCourt[] = COURT_SEED.map((court, index) => ({
  ...court,
  ...positions[index],
  slots: BOOKING_HOURS.map((time) => ({ time, status: "available" as SlotStatus })),
}));

const emptyCustomer: CustomerDetails = {
  fullName: "",
  phone: "",
  email: "",
  guests: "2",
  acceptedPolicy: false,
};

function isFullNameValid(value: string) {
  return /^[A-Za-zА-Яа-яЁёȘșȚțĂăÂâÎî'’-]{2,}(?:\s+[A-Za-zА-Яа-яЁёȘșȚțĂăÂâÎî'’-]{2,})+$/.test(value.trim());
}

function isPhoneValid(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  return /^\+?[\d\s().-]{8,20}$/.test(trimmed) && digits.length >= 8 && digits.length <= 15;
}

function isEmailValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

function isGuestsValid(value: string) {
  return Number.isInteger(Number(value)) && Number(value) >= 2;
}

function isCustomerComplete(customer: CustomerDetails) {
  return Boolean(
    isFullNameValid(customer.fullName) &&
    isPhoneValid(customer.phone) &&
    isEmailValid(customer.email) &&
    isGuestsValid(customer.guests) &&
    customer.acceptedPolicy,
  );
}

function timeToMinutes(time: string) {
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
}

function minutesToTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function nextHour(time: string) {
  return `${String(Number(time.slice(0, 2)) + 1).padStart(2, "0")}:00`;
}

function previousHour(time: string) {
  return `${String(Number(time.slice(0, 2)) - 1).padStart(2, "0")}:00`;
}

function formatBookingRange(time: string, halfExtension: HalfExtension) {
  const startMinutes = timeToMinutes(time) - (halfExtension === "before" ? 30 : 0);
  const endMinutes = timeToMinutes(time) + 60 + (halfExtension === "after" ? 30 : 0);
  return `${minutesToTime(startMinutes)}–${minutesToTime(endMinutes)}`;
}

function formatHumanDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    weekday: "long",
  }).format(new Date(`${value}T00:00:00`));
}

function sortTimes(times: string[]) {
  return [...times].sort((first, second) => BOOKING_HOURS.indexOf(first) - BOOKING_HOURS.indexOf(second));
}

function formatSelectedTimes(times: string[], halfExtension: HalfExtension = null) {
  const sorted = sortTimes(times);
  if (!sorted.length) return "";
  if (sorted.length === 1) return formatBookingRange(sorted[0], halfExtension);
  return `${sorted.length} часа: ${sorted.join(", ")}`;
}

function formatRemainingPayment(amount: number) {
  if (!amount) return "0 MDL";
  const hours = amount / CLUB.priceMdl;
  return `${hours.toLocaleString("ru-RU", { maximumFractionDigits: 1 })} ч. · ${amount} MDL`;
}

function canUseHalfExtension(court: MapCourt, selectedTime: string, position: Exclude<HalfExtension, null>) {
  const neighborTime = position === "before" ? previousHour(selectedTime) : nextHour(selectedTime);
  if (position === "before" && timeToMinutes(selectedTime) - 30 < CLUB.openingHour * 60) return false;
  if (position === "after" && timeToMinutes(selectedTime) + 90 > CLUB.closingHour * 60) return false;
  const neighborSlot = court.slots.find((slot) => slot.time === neighborTime);
  return Boolean(neighborSlot && neighborSlot.status === "available");
}

export default function CourtMapSection({ date }: { date: string }) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("map3d");
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [halfExtension, setHalfExtension] = useState<HalfExtension>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [multiHour, setMultiHour] = useState(false);
  const [customer, setCustomer] = useState<CustomerDetails>(emptyCustomer);
  const [formTouched, setFormTouched] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerModalDismissed, setCustomerModalDismissed] = useState(false);
  const [holding, setHolding] = useState(false);

  const courtsForDate = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const isPast = date < todayStr;
    const isToday = date === todayStr;
    const nowMinutes = today.getHours() * 60 + today.getMinutes();
    return courts.map((court) => ({
      ...court,
      slots: court.slots.map((slot) => {
        const slotMinutes = parseInt(slot.time) * 60;
        const past = isPast || (isToday && slotMinutes < nowMinutes);
        return past ? { ...slot, status: "past" as SlotStatus } : slot;
      }),
    }));
  }, [date]);

  const selectedCourt = courtsForDate.find((court) => court.id === selectedCourtId) ?? null;
  const sortedSelectedTimes = sortTimes(selectedTimes);
  const selectedTime = sortedSelectedTimes[0] ?? null;
  const selectedHourCount = sortedSelectedTimes.length;
  const selectedDurationMinutes = selectedHourCount * 60 + (halfExtension ? 30 : 0);
  const totalPriceMdl = selectedHourCount * CLUB.priceMdl + (halfExtension ? 250 : 0);
  const depositMdl = selectedHourCount ? CLUB.priceMdl : 0;
  const remainingMdl = Math.max(totalPriceMdl - depositMdl, 0);
  const remainingHours = remainingMdl / CLUB.priceMdl;
  const customerComplete = isCustomerComplete(customer);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobileViewport(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!selectedHourCount || multiHour || customerComplete || customerModalDismissed) return;
    const timeout = window.setTimeout(() => setShowCustomerModal(true), 350);
    return () => window.clearTimeout(timeout);
  }, [selectedHourCount, multiHour, customerComplete, customerModalDismissed]);

  useEffect(() => {
    if (customerComplete) setShowCustomerModal(false);
  }, [customerComplete]);

  useEffect(() => {
    if (!showCustomerModal) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showCustomerModal]);

  function selectCourt(court: MapCourt) {
    setSelectedCourtId(court.id);
    setSelectedTimes([]);
    setHalfExtension(null);
    setFormTouched(false);
    setShowCustomerModal(false);
    setCustomerModalDismissed(false);
    if (isMobileViewport) {
      setViewMode("schedule");
      return;
    }
    if (viewMode === "plan2d") window.setTimeout(() => setViewMode("schedule"), 150);
    else setViewMode("plan2d");
  }

  function backToMap() { setSelectedCourtId(null); setSelectedTimes([]); setHalfExtension(null); setFormTouched(false); setShowCustomerModal(false); setCustomerModalDismissed(false); setViewMode("map3d"); }

  function toggleMultiHour(enabled: boolean) {
    setMultiHour(enabled);
    setHalfExtension(null);
    setShowCustomerModal(false);
    setCustomerModalDismissed(false);
    if (!enabled) setSelectedTimes((current) => current.slice(0, 1));
  }

  function selectTime(time: string) {
    setHalfExtension(null);
    setSelectedTimes((current) => {
      if (!multiHour) return current.includes(time) ? [] : [time];
      return current.includes(time) ? current.filter((item) => item !== time) : sortTimes([...current, time]);
    });
  }

  function toggleHalfExtension(position: Exclude<HalfExtension, null>) {
    if (multiHour || selectedTimes.length !== 1) return;
    setHalfExtension((current) => current === position ? null : position);
  }

  function addPreviousFullHour() {
    if (!selectedCourt || selectedTimes.length !== 1) return;
    const previousTime = previousHour(selectedTimes[0]);
    const previousSlot = selectedCourt.slots.find((slot) => slot.time === previousTime);
    if (!previousSlot || previousSlot.status !== "available") return;
    setHalfExtension(null);
    setMultiHour(true);
    setSelectedTimes(sortTimes([previousTime, selectedTimes[0]]));
  }

  function addNextFullHour() {
    if (!selectedCourt || selectedTimes.length !== 1) return;
    const nextTime = nextHour(selectedTimes[0]);
    const nextSlot = selectedCourt.slots.find((slot) => slot.time === nextTime);
    if (!nextSlot || nextSlot.status !== "available") return;
    setHalfExtension(null);
    setMultiHour(true);
    setSelectedTimes(sortTimes([selectedTimes[0], nextTime]));
  }

  function updateCustomer(field: keyof CustomerDetails, value: string | boolean) {
    setCustomer((current) => ({ ...current, [field]: value }));
  }

  function closeCustomerModal() {
    setShowCustomerModal(false);
    setCustomerModalDismissed(true);
  }

  function scrollToCustomerFields() {
    window.setTimeout(() => {
      document.getElementById("booking-customer-fields")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }

  async function continueBooking() {
    if (!selectedCourt || !selectedTime || !selectedHourCount) return;
    setFormTouched(true);
    if (!customerComplete) {
      if (!multiHour && !customerModalDismissed) setShowCustomerModal(true);
      else scrollToCustomerFields();
      return;
    }
    setHolding(true);
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    const bookingId = `bk_${Date.now().toString(36)}_${selectedCourt.id}`;
    const booking = {
      id: bookingId,
      courtId: selectedCourt.id,
      courtName: selectedCourt.name,
      date,
      time: selectedTime,
      times: sortedSelectedTimes,
      timeLabel: formatSelectedTimes(sortedSelectedTimes, halfExtension),
      durationMinutes: selectedDurationMinutes,
      halfExtension,
      priceMdl: totalPriceMdl,
      depositMdl,
      remainingHours,
      remainingMdl,
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
      <div className="mb-3 flex justify-start">
        <MultiHourToggle enabled={multiHour} onChange={toggleMultiHour} />
      </div>
      <div className="grid items-start gap-5 rounded-[38px] bg-terracotta p-3 shadow-soft sm:p-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className={`relative min-w-0 ${viewMode === "schedule" ? "h-[1180px] md:h-[620px]" : isMobileViewport ? "h-auto" : "h-[min(760px,calc(100svh-175px))] min-h-[640px] md:h-[620px]"}`}>
          <AnimatePresence initial={false} mode="popLayout">
            {viewMode !== "schedule" ? (
              <motion.div key="map" className={isMobileViewport ? "relative" : "absolute inset-0"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {isMobileViewport ? (
                  <MobileCourtPlan courts={courtsForDate} selectedCourtId={selectedCourtId} onSelect={selectCourt} />
                ) : (
                  <ClubMap courts={courtsForDate} viewMode={viewMode} selectedCourtId={selectedCourtId} onModeChange={setViewMode} onSelect={selectCourt} onFlattenComplete={() => { if (selectedCourtId && viewMode === "plan2d") setViewMode("schedule"); }} />
                )}
              </motion.div>
            ) : selectedCourt ? (
              <motion.div key="schedule" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Schedule court={selectedCourt} selectedTimes={sortedSelectedTimes} halfExtension={halfExtension} multiHour={multiHour} customer={customer} formTouched={formTouched} onSelectTime={selectTime} onHalfExtensionChange={toggleHalfExtension} onPreviousFullHour={addPreviousFullHour} onNextFullHour={addNextFullHour} onBack={backToMap} onCustomerChange={updateCustomer} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        <BookingSummary court={selectedCourt} times={sortedSelectedTimes} halfExtension={halfExtension} date={date} customer={customer} customerComplete={customerComplete} formTouched={formTouched} totalPriceMdl={totalPriceMdl} depositMdl={depositMdl} remainingHours={remainingHours} remainingMdl={remainingMdl} loading={holding} onCustomerChange={updateCustomer} onContinue={continueBooking} />
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-sand bg-white p-4 pr-20 shadow-[0_-12px_40px_rgba(17,24,39,.12)] xl:hidden"><MobileSummary court={selectedCourt} times={sortedSelectedTimes} halfExtension={halfExtension} customerComplete={customerComplete} depositMdl={depositMdl} totalPriceMdl={totalPriceMdl} loading={holding} onContinue={continueBooking} /></div>
      <AnimatePresence>
        {showCustomerModal && selectedCourt && selectedTime && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] overflow-y-auto bg-black/65 px-5 py-8 backdrop-blur-[5px]" onMouseDown={(event) => { if (event.currentTarget === event.target) closeCustomerModal(); }}>
            <motion.section initial={{ opacity: 0, y: 26, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: .98 }} transition={{ type: "spring", stiffness: 280, damping: 26 }} role="dialog" aria-modal="true" className="mx-auto max-h-[calc(100svh-64px)] w-full max-w-[440px] overflow-y-auto rounded-[32px] bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.18em] text-terracotta">Данные брони</p>
                  <h3 className="mt-2 text-2xl font-black tracking-[-.04em] text-primary">{selectedCourt.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{formatHumanDate(date)} · {selectedTime}–{nextHour(selectedTime)}</p>
                </div>
                <button type="button" onClick={closeCustomerModal} aria-label="Закрыть" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-canvas text-primary transition hover:bg-primary hover:text-white"><X size={18} /></button>
              </div>
              <CustomerFields customer={customer} formTouched={formTouched} onChange={updateCustomer} />
              <button type="button" onClick={() => { setFormTouched(true); if (isCustomerComplete(customer)) closeCustomerModal(); }} className="mt-5 flex min-h-14 w-full items-center justify-between rounded-full bg-lime py-1.5 pl-6 pr-1.5 text-sm font-black text-[#050505]">
                <span>Продолжить</span>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#050505] text-white"><ArrowRight size={17} /></span>
              </button>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}

function ClubMap({ courts, viewMode, selectedCourtId, onModeChange, onSelect, onFlattenComplete }: { courts: MapCourt[]; viewMode: "map3d" | "plan2d"; selectedCourtId: string | null; onModeChange: (mode: "map3d" | "plan2d") => void; onSelect: (court: MapCourt) => void; onFlattenComplete: () => void }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[30px] border border-white/30 bg-terracotta">
      <div className="flex items-center justify-between border-b border-white/30 px-5 py-3">
        <div>
          <h2 className="font-black text-white">Карта PadelPoint</h2>
          <p className="mt-1 text-xs text-white/70">9 indoor-кортов · 500 MDL / час</p>
        </div>
        <div className="flex rounded-full bg-white/15 p-1">
          <Mode active={viewMode === "map3d"} label="3D" icon={<Layers3 size={14} />} onClick={() => onModeChange("map3d")} />
          <Mode active={viewMode === "plan2d"} label="План" icon={<Map size={14} />} onClick={() => onModeChange("plan2d")} />
        </div>
      </div>
      <div className="relative flex-1 overflow-hidden bg-terracotta p-3 [perspective:1500px]">
        <motion.div
          animate={{ x: 0, rotateX: viewMode === "map3d" ? 34 : 0, rotateZ: viewMode === "map3d" ? -12 : 0, scale: viewMode === "map3d" ? .82 : .9 }}
          transition={{ type: "spring", stiffness: 110, damping: 22 }}
          onAnimationComplete={() => { if (viewMode === "plan2d" && selectedCourtId) onFlattenComplete(); }}
          className="relative z-20 mx-auto aspect-[1.85] h-full max-w-full [transform-style:preserve-3d]"
        >
          <Building dimmed={Boolean(selectedCourtId)} />
          <Columns dimmed={Boolean(selectedCourtId)} />
          {courts.map((court) => (
            <CourtZone key={court.id} court={court} selected={selectedCourtId === court.id} dimmed={Boolean(selectedCourtId && selectedCourtId !== court.id)} onSelect={onSelect} />
          ))}
          <div className="absolute bottom-[4%] left-[43%] flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[9px] font-black uppercase tracking-wider text-primary shadow-lg [transform:translateZ(18px)]">
            <DoorOpen size={13} />Вход и reception
          </div>
        </motion.div>
        <Floating className="right-5 top-5" title="Свободно сегодня" />
      </div>
    </div>
  );
}

function MobileCourtPlan({ courts, selectedCourtId, onSelect }: { courts: MapCourt[]; selectedCourtId: string | null; onSelect: (court: MapCourt) => void }) {
  const blueCourts = ["court-1", "court-2", "court-3", "court-4", "court-5", "court-6"]
    .map((id) => courts.find((court) => court.id === id))
    .filter(Boolean) as MapCourt[];
  const terracottaCourts = ["court-9", "court-8", "court-7"]
    .map((id) => courts.find((court) => court.id === id))
    .filter(Boolean) as MapCourt[];

  return (
    <div className="relative aspect-[1/1.71] w-full overflow-hidden rounded-[30px] border border-white/30 bg-terracotta p-1.5 md:hidden">
      <div className="relative h-full overflow-hidden rounded-[24px] bg-[#E9ECE7] p-1.5 shadow-inner">
        <div className="absolute inset-y-0 left-[51%] w-2 bg-terracotta" />
        <div className="absolute inset-y-0 right-[22%] w-px bg-primary/20" />
        <div className="absolute inset-y-0 right-0 w-[21%] bg-[#E4E8E2]" />
        <div className="absolute right-[4%] top-7 grid gap-5">
          {Array.from({ length: 10 }, (_, index) => (
            <span key={index} className="h-9 w-5 rounded-[3px] border border-primary/10 bg-[#DCE5E3]" />
          ))}
        </div>
        <div className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white px-2 py-4 text-[10px] font-black uppercase tracking-[.12em] text-primary shadow-lg [writing-mode:vertical-rl]">
          Вход и reception
        </div>

        <div className="relative z-10 grid h-full origin-center scale-[.98] grid-cols-[44%_1fr] gap-2">
          <div className="flex h-full flex-col justify-start gap-2 rounded-sm bg-white p-1.5 shadow-[0_8px_22px_rgba(17,24,39,.14)]">
            {blueCourts.map((court) => (
              <MobileCourtTile key={court.id} court={court} selected={selectedCourtId === court.id} onSelect={onSelect} variant="blue" />
            ))}
          </div>

          <div className="relative pl-2 pr-[24%]">
            <div className="absolute inset-y-3 left-0 w-1 bg-terracotta" />
            <div className="absolute inset-y-8 left-2 grid w-2 grid-rows-6">
              {Array.from({ length: 6 }, (_, index) => (
                <span key={index} className="self-center border-t-4 border-[#CBD0CB]" />
              ))}
            </div>
            <div className="flex h-full flex-col justify-center gap-8 py-8 pl-9">
              {terracottaCourts.map((court) => (
                <MobileCourtTile key={court.id} court={court} selected={selectedCourtId === court.id} onSelect={onSelect} variant="terracotta" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileCourtTile({ court, selected, variant, onSelect }: { court: MapCourt; selected: boolean; variant: CourtColor; onSelect: (court: MapCourt) => void }) {
  const available = court.slots.filter((slot) => slot.status === "available").length;
  const isTerracotta = variant === "terracotta";

  return (
    <motion.button
      layoutId={`court-${court.id}`}
      type="button"
      onClick={() => onSelect(court)}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className={`relative min-h-0 overflow-hidden border-[4px] border-white/95 p-1.5 text-left outline-none transition ${isTerracotta ? "aspect-[1/1.15] w-full place-self-center rounded-[8px]" : "aspect-[1.55/1] w-full rounded-[7px]"} ${isTerracotta ? "bg-[#B95F42]" : "bg-[#1268B3]"} ${selected ? "ring-4 ring-lime" : "shadow-[0_7px_16px_rgba(17,24,39,.18)] active:ring-4 active:ring-lime/70"}`}
      aria-label={`Открыть расписание ${court.name}`}
    >
      <CourtLines />
      <span className={`absolute z-10 rounded-full px-1.5 py-1 text-[9px] font-black leading-none ${isTerracotta ? "bottom-1 left-1" : "left-1 top-1/2 -translate-y-1/2 -rotate-90"} ${selected ? "bg-lime text-[#050505]" : "bg-[#050505] text-white"}`}>{court.label}</span>
      <span className="sr-only">{available} свободных слотов</span>
    </motion.button>
  );
}

function Building({ dimmed }: { dimmed: boolean }) { return <motion.div animate={{ opacity: dimmed ? .35 : 1 }} className="pointer-events-none absolute inset-0 [transform-style:preserve-3d]"><div className="absolute bottom-[3%] left-[3%] h-[20%] w-[94%] border border-[#c5c9c3] bg-[#E5E7E2] shadow-[0_20px_28px_rgba(62,68,70,.25)] [transform:translateZ(8px)]"><div className="absolute inset-x-[3%] top-[24%] flex justify-between">{Array.from({ length: 15 }, (_, i) => <i key={i} className="h-5 w-[4%] border border-[#aeb5b4] bg-[#d5e1e2]/75" />)}</div><div className="absolute inset-x-[2%] top-[-14%] border-t-2 border-[#78878b]/60" /></div><div className="absolute left-[8%] top-[43%] h-[35%] w-[82%] border border-[#bcc2c3] bg-[#dfe2de] shadow-lg [transform:translateZ(4px)]" /><div className="absolute left-[7%] top-[4%] h-[38%] w-[93%] border border-[#c8ccc5] bg-[#f4f5f2] shadow-xl [transform:translateZ(37px)]" /></motion.div>; }
function Columns({ dimmed }: { dimmed: boolean }) { return <motion.div animate={{ opacity: dimmed ? .35 : 1 }} className="pointer-events-none absolute inset-0 z-30">{[9,24,39,54,69,84,97].map((left) => <i key={left} className="absolute top-[1%] h-[78%] w-[1%] bg-gradient-to-r from-[#aeb3b1] via-white to-[#9ca3a1] shadow-md [transform:translateZ(62px)]" style={{ left: `${left}%` }} />)}<i className="absolute left-[7%] top-[1%] h-[2%] w-[91%] bg-[#c9cdca] [transform:translateZ(63px)]" /></motion.div>; }

function CourtZone({ court, selected, dimmed, onSelect }: { court: MapCourt; selected: boolean; dimmed: boolean; onSelect: (court: MapCourt) => void }) {
  const [hovered, setHovered] = useState(false);
  const available = court.slots.filter((slot) => slot.status === "available").length;
  const tooltipBelow = court.color === "blue";
  const depth = 64;
  return <motion.button layoutId={`court-${court.id}`} type="button" onClick={() => onSelect(court)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocus={() => setHovered(true)} onBlur={() => setHovered(false)} aria-label={`Открыть расписание ${court.name}`} animate={{ opacity: dimmed ? .22 : 1, scale: selected ? 1.05 : 1, z: hovered || selected ? depth + 80 : depth }} whileHover={{ scale: 1.025 }} className={`absolute rounded-[2px] border-2 border-white/85 p-[3px] shadow-[0_10px_18px_rgba(38,46,50,.25)] outline-none ${hovered || selected ? "z-[200]" : "z-20"} ${court.color === "blue" ? "bg-[#1268B3]" : "bg-[#B95F42]"} ${selected ? "ring-4 ring-lime" : "hover:ring-4 hover:ring-white"}`} style={{ left: `${court.x}%`, top: `${court.y}%`, width: `${court.width}%`, height: `${court.height}%` }}><CourtLines /><span className={`absolute left-1.5 top-1.5 rounded-full px-1.5 py-1 text-[9px] font-black leading-none ${selected ? "bg-lime text-[#050505]" : "bg-[#050505] text-white"}`}>{court.label}</span><AnimatePresence>{hovered && <motion.span initial={{ opacity: 0, y: tooltipBelow ? 5 : -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`pointer-events-none absolute left-1/2 z-[300] w-40 -translate-x-1/2 rounded-2xl bg-[#050505] p-2.5 text-left text-white shadow-2xl ring-1 ring-white/10 ${tooltipBelow ? "top-[calc(100%+14px)]" : "bottom-[calc(100%+14px)]"}`}><b className="block text-[11px]">{court.name}</b><small className="mt-1 block text-[10px] text-white/60">Indoor · 500 MDL / час</small><span className="mt-2 block border-t border-white/10 pt-1.5 text-[10px] text-lime">{available} свободных слотов</span></motion.span>}</AnimatePresence></motion.button>;
}

function CourtLines() { return <span className="pointer-events-none absolute inset-[7%] border-2 border-white/85"><i className="absolute inset-y-0 left-1/2 border-l-2 border-white/85" /><i className="absolute inset-x-0 top-1/2 border-t-2 border-white/85" /><i className="absolute inset-y-[23%] left-[25%] right-[25%] border-x border-white/85" /></span>; }
function Floating({ title, className }: { title: string; className: string }) { return <div className={`pointer-events-none absolute z-10 rounded-full bg-lime px-4 py-2 text-[11px] font-black text-[#050505] shadow-lg ${className}`}>{title}</div>; }
function Mode({ active, label, icon, onClick }: { active: boolean; label: string; icon: React.ReactNode; onClick: () => void }) { return <button type="button" onClick={onClick} className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-black ${active ? "bg-lime text-[#050505]" : "text-white/75"}`}>{icon}{label}</button>; }

function Schedule({ court, selectedTimes, halfExtension, multiHour, customer, formTouched, onSelectTime, onHalfExtensionChange, onPreviousFullHour, onNextFullHour, onBack, onCustomerChange }: { court: MapCourt; selectedTimes: string[]; halfExtension: HalfExtension; multiHour: boolean; customer: CustomerDetails; formTouched: boolean; onSelectTime: (time: string) => void; onHalfExtensionChange: (position: Exclude<HalfExtension, null>) => void; onPreviousFullHour: () => void; onNextFullHour: () => void; onBack: () => void; onCustomerChange: (field: keyof CustomerDetails, value: string | boolean) => void }) {
  const baseTime = !multiHour && selectedTimes.length === 1 ? selectedTimes[0] : null;

  return <div className="h-full overflow-y-auto rounded-[30px] border border-sand bg-white shadow-soft"><div className="flex items-center gap-3 border-b border-sand p-5"><button type="button" onClick={onBack} aria-label="Вернуться к карте" className="grid h-10 w-10 place-items-center rounded-full bg-[#050505] text-white"><ArrowLeft size={18} /></button><motion.div layoutId={`court-${court.id}`} className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-white/80 ${court.color === "blue" ? "bg-[#1268B3]" : "bg-[#B95F42]"}`}><CourtLines /></motion.div><div><h3 className="font-black tracking-[-.03em] text-primary">{court.name}</h3><p className="mt-1 text-xs font-bold text-gray-400">Indoor · 500 MDL / час · +30 мин = 250 MDL</p></div></div><div className="p-5"><div className="mb-5"><h4 className="text-lg font-black tracking-[-.035em] text-primary">Выберите время</h4><p className="mt-1 text-xs font-bold text-gray-400">Выберите час, затем можно добавить соседние 30 минут или полный час назад.</p></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{court.slots.map((slot) => { const disabled = slot.status !== "available"; const selected = selectedTimes.includes(slot.time); const halfBefore = Boolean(baseTime && slot.time === previousHour(baseTime)); const halfAfter = Boolean(baseTime && slot.time === nextHour(baseTime)); if (halfBefore || halfAfter) return <HalfSlotButton key={slot.time} slot={slot} position={halfBefore ? "before" : "after"} active={halfExtension === (halfBefore ? "before" : "after")} disabled={!canUseHalfExtension(court, baseTime!, halfBefore ? "before" : "after")} onClick={onHalfExtensionChange} onFullHour={halfBefore ? onPreviousFullHour : onNextFullHour} />; return <button key={slot.time} type="button" disabled={disabled} onClick={() => onSelectTime(slot.time)} className={`min-h-[64px] rounded-2xl border px-3 py-2 text-left transition ${selected ? "border-[#050505] bg-lime text-[#050505] ring-2 ring-[#050505]" : disabled ? "cursor-not-allowed border-gray-100 bg-gray-100 text-gray-400" : "border-sand bg-white text-primary hover:border-terracotta"}`}><b className="block text-sm">{slot.time}</b><small className="mt-1 block font-bold">{selected ? (halfExtension ? `Выбрано · ${formatBookingRange(slot.time, halfExtension)}` : "Выбрано") : slot.status === "available" ? "500 MDL" : slot.status === "held" ? "Удерживается" : slot.status === "past" ? "Прошло" : "Занято"}</small></button>; })}</div>{selectedTimes.length > 0 && <div id="booking-customer-fields" className="mx-auto mt-6 max-w-[680px] rounded-[28px] border border-sand bg-white p-4 shadow-sm sm:p-5 xl:hidden"><CustomerFields customer={customer} formTouched={formTouched} onChange={onCustomerChange} /></div>}</div></div>;
}

function HalfSlotButton({ slot, position, active, disabled, onClick, onFullHour }: { slot: Slot; position: Exclude<HalfExtension, null>; active: boolean; disabled: boolean; onClick: (position: Exclude<HalfExtension, null>) => void; onFullHour?: () => void }) {
  const leftIsAction = position === "after";
  const action = <button type="button" disabled={disabled} onClick={() => onClick(position)} className={`min-h-[64px] rounded-xl px-2 py-2 text-left text-[11px] font-black transition ${active ? "bg-lime text-[#050505] ring-2 ring-[#050505]" : disabled ? "cursor-not-allowed bg-gray-100 text-gray-400" : "bg-white text-primary hover:bg-lime/80"}`}><span className="block">+30 мин</span><span className="mt-1 block text-[10px]">250 MDL</span></button>;
  const muted = onFullHour ? <button type="button" disabled={disabled} onClick={onFullHour} className={`min-h-[64px] rounded-xl px-2 py-2 text-left text-[11px] font-black transition ${disabled ? "cursor-not-allowed bg-gray-100 text-gray-400" : "bg-white text-primary hover:bg-lime/80"}`}><span className="block">+1 час</span><span className="mt-1 block text-[10px]">500 MDL</span></button> : <div className="min-h-[64px] rounded-xl bg-gray-100 px-2 py-2 text-[11px] font-bold text-gray-400"><span className="block">{slot.time}</span><span className="mt-1 block">½ слот</span></div>;

  return (
    <div className="grid grid-cols-2 gap-1 rounded-2xl border border-sand bg-canvas p-1">
      {leftIsAction ? action : muted}
      {leftIsAction ? muted : action}
    </div>
  );
}

function BookingSummary({ court, times, halfExtension, date, customer, formTouched, totalPriceMdl, depositMdl, remainingMdl, loading, onCustomerChange, onContinue }: { court: MapCourt | null; times: string[]; halfExtension: HalfExtension; date: string; customer: CustomerDetails; customerComplete: boolean; formTouched: boolean; totalPriceMdl: number; depositMdl: number; remainingHours: number; remainingMdl: number; loading: boolean; onCustomerChange: (field: keyof CustomerDetails, value: string | boolean) => void; onContinue: () => void }) {
  const showDepositBreakdown = remainingMdl > 0;
  return <aside className="sticky top-28 hidden rounded-[28px] border border-sand bg-white p-6 shadow-soft xl:block"><h3 className="text-lg font-black tracking-[-.035em] text-primary">Ваша бронь</h3>{court && times.length ? <div className="mt-5"><div className="rounded-[22px] bg-terracotta p-5 text-white"><small className="text-white/70">PadelPoint</small><b className="mt-1 block text-lg">{court.name}</b><p className="mt-1 text-xs text-white/75">{formatHumanDate(date)} · {formatSelectedTimes(times, halfExtension)}</p></div>{showDepositBreakdown ? <div className="my-5 space-y-3"><div className="rounded-2xl bg-canvas p-4 text-sm"><p className="flex justify-between font-black text-primary"><span>Предоплата сейчас</span><span>{depositMdl} MDL</span></p><p className="mt-2 flex justify-between text-xs font-bold text-terracotta"><span>Доплата в клубе</span><span>{formatRemainingPayment(remainingMdl)}</span></p></div><div className="flex items-end justify-between"><span className="text-sm text-gray-500">Всего</span><b className="text-2xl font-black text-primary">{totalPriceMdl} MDL</b></div></div> : <div className="my-5 flex items-end justify-between"><span className="text-sm text-gray-500">К оплате</span><b className="text-2xl font-black text-primary">{totalPriceMdl} MDL</b></div>}<CustomerFields customer={customer} formTouched={formTouched} onChange={onCustomerChange} /><button type="button" onClick={onContinue} disabled={loading} className="group mt-5 flex min-h-14 w-full items-center justify-between rounded-full bg-lime py-1.5 pl-5 pr-1.5 text-sm font-black text-[#050505] disabled:bg-gray-200 disabled:text-gray-400 disabled:opacity-80"><span>{loading ? "Создаём бронь..." : showDepositBreakdown ? `Оплатить предоплату ${depositMdl} MDL` : "Перейти к оплате"}</span><span className="grid h-11 w-11 place-items-center rounded-full bg-[#050505] text-white">{loading ? <LoaderCircle size={17} className="animate-spin" /> : <ArrowRight size={17} />}</span></button><p className="mt-3 flex items-center justify-center gap-1 text-[10px] text-gray-400"><ShieldCheck size={12} /> Слот удерживается 10 минут</p></div> : <div className="mt-5 rounded-[22px] border border-dashed border-sand bg-canvas p-7 text-center"><Clock3 className="mx-auto text-primary/25" /><p className="mt-4 text-sm font-black text-primary">Выберите корт и время</p><p className="mt-2 text-xs text-gray-400">Итог появится здесь</p></div>}</aside>;
}
function MobileSummary({ court, times, halfExtension, customerComplete, depositMdl, totalPriceMdl, loading, onContinue }: { court: MapCourt | null; times: string[]; halfExtension: HalfExtension; customerComplete: boolean; depositMdl: number; totalPriceMdl: number; loading: boolean; onContinue: () => void }) {
  return <div className="mx-auto flex max-w-3xl items-center gap-3"><div className="min-w-0 flex-1">{court && times.length ? <><p className="truncate text-[11px] text-gray-500">{customerComplete ? court.name : "Проверьте данные брони"}</p><b className="text-sm text-primary">{formatSelectedTimes(times, halfExtension)} · {totalPriceMdl > depositMdl ? `предоплата ${depositMdl} MDL` : `${totalPriceMdl} MDL`}</b></> : <b className="text-sm text-primary">Выберите корт и время</b>}</div><button type="button" disabled={!court || !times.length || loading} onClick={onContinue} className="flex items-center gap-2 rounded-full bg-lime py-1 pl-4 pr-1 text-sm font-black text-[#050505] disabled:bg-gray-200 disabled:text-gray-400">{loading ? "..." : "Оплатить"}<span className="grid h-8 w-8 place-items-center rounded-full bg-[#050505] text-white"><ArrowRight size={14} /></span></button></div>;
}

function MultiHourToggle({ enabled, onChange }: { enabled: boolean; onChange: (enabled: boolean) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-sand bg-white px-3 py-2 text-[11px] font-black text-primary shadow-sm transition hover:border-terracotta">
      <input type="checkbox" checked={enabled} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[#050505]" />
      Выбрать несколько часов
    </label>
  );
}

function CustomerFields({ customer, formTouched, onChange }: { customer: CustomerDetails; formTouched: boolean; onChange: (field: keyof CustomerDetails, value: string | boolean) => void }) {
  const fullNameInvalid = Boolean(customer.fullName) && !isFullNameValid(customer.fullName);
  const phoneInvalid = Boolean(customer.phone) && !isPhoneValid(customer.phone);
  const emailInvalid = Boolean(customer.email) && !isEmailValid(customer.email);
  const guestsInvalid = Boolean(customer.guests) && !isGuestsValid(customer.guests);
  const policyInvalid = formTouched && !customer.acceptedPolicy;

  return (
    <div>
      <div className="mb-3">
        <h4 className="text-sm font-black text-primary">Данные для брони</h4>
        <p className="mt-1 text-xs text-gray-400">Эти поля обязательны для администратора клуба.</p>
      </div>
      <div className="grid gap-3">
        <CustomerField label="ФИО" value={customer.fullName} placeholder="Иван Петров" required invalid={fullNameInvalid || (formTouched && !isFullNameValid(customer.fullName))} hint="Неправильные данные: введите имя и фамилию" onChange={(value) => onChange("fullName", value)} />
        <CustomerField label="Номер телефона" value={customer.phone} placeholder="+373 78 003100" type="tel" inputMode="tel" required invalid={phoneInvalid || (formTouched && !isPhoneValid(customer.phone))} hint="Неправильный формат телефона. Пример: +373 78 003100" onChange={(value) => onChange("phone", value)} />
        <CustomerField label="Email" value={customer.email} placeholder="name@email.com" type="email" inputMode="email" required invalid={emailInvalid || (formTouched && !isEmailValid(customer.email))} hint="Неправильный email. Пример: name@email.com" onChange={(value) => onChange("email", value)} />
        <CustomerField label="Количество игроков" value={customer.guests} placeholder="2" type="number" min={2} max={8} required invalid={guestsInvalid || (formTouched && !isGuestsValid(customer.guests))} hint="Минимальное количество игроков — 2" onChange={(value) => onChange("guests", value)} />
      </div>
      <label className={`mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border bg-white p-3 text-xs font-bold leading-5 transition ${policyInvalid ? "border-red-300 ring-2 ring-red-100" : "border-sand"}`}>
        <input type="checkbox" checked={customer.acceptedPolicy} onChange={(event) => onChange("acceptedPolicy", event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#050505]" />
        <span>
          Я согласен с условиями обработки данных и{" "}
          <a href="https://padelpoint.md/privacy-policy/" target="_blank" rel="noreferrer" className="font-black text-terracotta underline underline-offset-2">
            публичной офертой / политикой конфиденциальности
          </a>
          .
        </span>
      </label>
      {policyInvalid && <span className="mt-1.5 block text-[10px] font-bold text-red-600">Подтвердите согласие с политикой перед оплатой.</span>}
      {(formTouched && !isCustomerComplete(customer)) && <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">Введены неправильные данные. Проверьте поля с красной обводкой.</p>}
    </div>
  );
}

function CustomerField({ label, value, placeholder, type = "text", inputMode, min, max, required, invalid, hint, onChange }: { label: string; value: string; placeholder: string; type?: string; inputMode?: "search" | "text" | "email" | "tel" | "url" | "none" | "numeric" | "decimal"; min?: number; max?: number; required?: boolean; invalid?: boolean; hint?: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-primary/55">{label}{required && <span className="text-terracotta"> *</span>}</span>
      <input value={value} placeholder={placeholder} type={type} inputMode={inputMode} min={min} max={max} required={required} onChange={(event) => onChange(event.target.value)} className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm font-bold text-primary outline-none transition focus:border-terracotta ${invalid ? "border-red-300 ring-2 ring-red-100" : "border-sand"}`} />
      {invalid && hint && <span className="mt-1.5 block text-[10px] font-bold text-red-600">{hint}</span>}
    </label>
  );
}
