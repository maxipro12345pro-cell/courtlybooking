export const CLUB = {
  id: "padelpoint-main",
  name: "PadelPoint",
  address: "Chișinău, Moldova",
  sport: "padel",
  courtCount: 9,
  openingHour: 7,
  closingHour: 22,
  slotDurationMinutes: 60,
  priceMdl: 500,
  currency: "MDL",
} as const;

export const BOOKING_HOURS = Array.from(
  { length: CLUB.closingHour - CLUB.openingHour },
  (_, index) => `${String(CLUB.openingHour + index).padStart(2, "0")}:00`,
);

export const COURT_SEED = Array.from({ length: CLUB.courtCount }, (_, index) => ({
  id: `court-${index + 1}`,
  name: `Court ${index + 1}`,
  label: `C${index + 1}`,
  color: index < 6 ? ("blue" as const) : ("terracotta" as const),
  type: "indoor" as const,
  priceMdl: CLUB.priceMdl,
}));
