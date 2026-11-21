import { Check } from "lucide-react";

type Props = {
  etiqueta: string;
  /**
   * `sugerida`: la puso una regla de texto (seleccionada, con «auto» en latón).
   * `normal`: una categoría cualquiera. `sin-clasificar`: borde punteado.
   */
  estado?: "sugerida" | "normal" | "sin-clasificar";
  /** Solo para `normal`: borde en tinta y marca de verificación. */
  seleccionada?: boolean;
  /** Sin ella, el chip solo presenta. */
  onClick?: () => void;
  deshabilitado?: boolean;
};

const BASE = "inline-flex h-11 shrink-0 items-center rounded-campo border px-3 text-cuerpo whitespace-nowrap disabled:cursor-not-allowed md:h-9";

/**
 * C5 · Chip de categoría. En móvil crece a 44 px de alto. Con `onClick` es un
 * interruptor: `aria-pressed` dice si está marcado (elegido o sugerido).
 */
export function ChipCategoria({ etiqueta, estado = "normal", seleccionada = false, onClick, deshabilitado = false }: Props) {
  if (estado === "sin-clasificar") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={deshabilitado}
        className={`${BASE} border-dashed border-terciario text-secundario`}
      >
        {etiqueta}
      </button>
    );
  }

  const marcada = estado === "sugerida" || seleccionada;

  return (
    <button
      type="button"
      aria-pressed={marcada}
      onClick={onClick}
      disabled={deshabilitado}
      className={`${BASE} gap-2 bg-superficie ${marcada ? "border-texto font-medium" : "border-linea"}`}
    >
      {marcada && <Check size={16} strokeWidth={1.5} aria-hidden />}
      {etiqueta}
      {estado === "sugerida" && (
        <span className="font-mono text-rotulo font-normal text-marca-texto">auto</span>
      )}
    </button>
  );
}
