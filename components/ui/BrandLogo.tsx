export default function BrandLogo({ light = false }: { light?: boolean }) {
  return (
    <a href="/" className="flex items-center gap-3" aria-label="PadelPoint — бронирование">
      <span className="relative grid h-12 w-12 place-items-center rounded-full border-2 border-terracotta text-terracotta">
        <span className="text-[9px] font-black tracking-[.12em]">PP</span>
        <span className="absolute inset-1 rounded-full border border-terracotta/45" />
      </span>
      <span className={`text-lg font-black tracking-[-0.045em] ${light ? "text-white" : "text-primary"}`}>PADELPOINT</span>
    </a>
  );
}
