import type { Moneda } from "@/domain/dinero/formato";

type Props = {
  /** Lo tecleado, ya formateado («18.500», «120,00»). Vacío = sin valor aún. */
  valor: string;
  moneda: Moneda;
  etiqueta?: string;
  /** Línea de equivalencia bajo el campo (dólares): «≈ 492.000 COP · TRM 4.100,00». */
  equivalencia?: string;
};

/**
 * C4 · Campo de monto. Vacío muestra un 0 en terciario y el cursor de marca;
 * con valor, la cifra va en tinta. Solo presenta: la captura vive en la pantalla.
 */
export function CampoMonto({ valor, moneda, etiqueta = "Monto", equivalencia }: Props) {
  const vacio = valor === "";

  return (
    <div role="group" aria-label={etiqueta} className="border-b border-raya pb-3 pt-2">
      <div className="mb-1 text-etiqueta text-secundario">{etiqueta}</div>
      <div className="flex items-baseline gap-2">
        <span
          className={`font-mono text-cifra-campo tabular-nums ${vacio ? "text-terciario" : ""}`}
        >
          {vacio ? "0" : valor}
        </span>
        {vacio && <span aria-hidden className="h-10 w-0.5 self-center bg-marca" />}
        <span className="ml-auto text-etiqueta text-secundario">{moneda}</span>
      </div>
      {equivalencia && (
        <div className="mt-1 font-mono text-cifra-xs tabular-nums text-secundario">
          {equivalencia}
        </div>
      )}
    </div>
  );
}
