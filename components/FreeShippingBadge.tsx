type Props = { free: boolean };

export default function FreeShippingBadge({ free }: Props) {
  const base =
    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 leading-none " +
    "text-[10px] sm:text-xs whitespace-nowrap"; // 👈 evita quiebres

  return free ? (
    <span
      className={`${base} bg-green-100 text-green-700 border-green-200`}
      title="Este producto incluye envío gratis"
    >
      🚚 <span className="hidden sm:inline">Envío gratis</span>
      <span className="sm:hidden">Envío</span>
    </span>
  ) : (
    <span
      className={`${base} bg-yellow-100 text-yellow-800 border-yellow-200`}
      title="Este producto no incluye envío gratis"
    >
      ⚠️ <span className="hidden sm:inline">No incluye envío gratis</span>
      <span className="sm:hidden">Sin envío gratis</span>
    </span>
  );
}
