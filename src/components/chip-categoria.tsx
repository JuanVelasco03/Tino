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
};

const BASE = "inline-flex h-11 items-center rounded-campo border px-3 text-cuerpo md:h-9";

/** C5 · Chip de categoría. En móvil crece a 44 px de alto. */
export function ChipCategoria({ etiqueta, estado = "normal", seleccionada = false }: Props) {
  if (estado === "sin-clasificar") {
    return (
      <button type="button" className={`${BASE} border-dashed border-terciario text-secundario`}>
        {etiqueta}
      </button>
    );
  }

  const marcada = estado === "sugerida" || seleccionada;

  return (
    <button
      type="button"
      aria-pressed={marcada}
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
