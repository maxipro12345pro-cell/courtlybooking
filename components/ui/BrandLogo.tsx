export default function BrandLogo({ light = false }: { light?: boolean }) {
  return (
    <a href="/" className="flex items-center gap-3" aria-label="PadelPoint — бронирование">
      <span className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-sand">
        <img
          src="/brand/padelpoint-logo.png"
          alt=""
          className="h-full w-full object-contain p-1"
          aria-hidden="true"
        />
      </span>
      <span className={`text-lg font-black tracking-[-0.045em] ${light ? "text-white" : "text-primary"}`}>PADELPOINT</span>
    </a>
  );
}
