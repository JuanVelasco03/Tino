import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatearMes, sumarMeses } from "@/domain/fecha/formato";
import { EnlaceTexto } from "../enlace-texto";

type Props = {
  /** `"YYYY-MM"` del mes listado. */
  mes: string;
  /** `"YYYY-MM"` del mes actual en la zona del usuario. */
  actual: string;
  /** Ruta base (`/movimientos`); cada mes va en `?mes=YYYY-MM`. */
  ruta?: string;
};

const FLECHA = "flex size-11 shrink-0 items-center justify-center text-secundario hover:text-texto";

/**
 * Navegación de meses: `‹` y `›` (44 px) junto al nombre del mes y «Este mes»
 * fuera del actual. Sin límite hacia adelante: la captura admite fechas
 * futuras. Cada mes es una URL (`?mes=`), así que se puede recargar o compartir.
 */
export function NavegacionMes({ mes, actual, ruta = "/movimientos" }: Props) {
  const anterior = sumarMeses(mes, -1);
  const siguiente = sumarMeses(mes, 1);
  return (
    <nav aria-label="Mes" className="flex min-h-11 items-center justify-between gap-3">
      <div className="-ml-3 flex items-center">
        <Link href={`${ruta}?mes=${anterior}`} aria-label={`Mes anterior: ${formatearMes(anterior)}`} className={FLECHA}>
          <ChevronLeft size={18} strokeWidth={1.5} aria-hidden />
        </Link>
        <span className="text-cuerpo font-semibold">
          {formatearMes(mes)}
        </span>
        <Link href={`${ruta}?mes=${siguiente}`} aria-label={`Mes siguiente: ${formatearMes(siguiente)}`} className={FLECHA}>
          <ChevronRight size={18} strokeWidth={1.5} aria-hidden />
        </Link>
      </div>
      {mes !== actual && <EnlaceTexto href={ruta}>Este mes</EnlaceTexto>}
    </nav>
  );
}
