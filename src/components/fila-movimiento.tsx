import { efectoEnPatrimonio, type TipoCuenta } from "@/domain/cuenta/naturaleza";
import { formatearDinero, type Dinero } from "@/domain/dinero/formato";

type Props = {
  /** Ya formateada, p. ej. "04 nov". */
  fecha: string;
  concepto: string;
  tipo: "gasto" | "ingreso" | "transferencia";
  /**
   * Tipo de la cuenta que mueve el patrimonio: el origen de un gasto o el
   * destino de un ingreso. Se ignora en una transferencia.
   */
  tipoCuenta?: TipoCuenta;
  monto: Dinero;
  /** Gasto o ingreso: categoría, o `null` si aún no está clasificado. */
  categoria?: string | null;
  /** Gasto o ingreso: nombre de la cuenta. */
  cuenta?: string;
  /** Transferencia: extremos. */
  transferencia?: { origen: string; destino: string };
  /** Dólares: equivalente en COP, que se muestra debajo en secundario. */
  equivalenteCOP?: bigint;
  /** Toda la columna está en pesos: se omite «COP». */
  omitirCOP?: boolean;
};

/**
 * C2 · Fila de movimiento, lista general. Sin icono.
 * Cada cifra se lee desde el patrimonio: salida −, terracota; entrada +, verde;
 * transferencia en tinta, sin signo. El signo lo decide `naturaleza.ts` (RN-02).
 */
export function FilaMovimiento({
  fecha,
  concepto,
  tipo,
  tipoCuenta,
  monto,
  categoria,
  cuenta,
  transferencia,
  equivalenteCOP,
  omitirCOP = false,
}: Props) {
  let cifra: string;
  let color = "";

  if (tipo === "transferencia") {
    cifra = formatearDinero(monto, { omitirCOP });
  } else {
    if (!tipoCuenta) {
      throw new Error("FilaMovimiento: un gasto o ingreso necesita `tipoCuenta`.");
    }
    const efecto = efectoEnPatrimonio(
      tipoCuenta,
      tipo === "gasto" ? "salida" : "entrada",
      monto.monto,
    );
    cifra = formatearDinero({ ...monto, monto: efecto }, { omitirCOP, signoMas: true });
    color = efecto < 0n ? "text-salida-texto" : "text-entrada-texto";
  }

  return (
    <div className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-baseline gap-3 border-b border-linea py-3">
      <span className="font-mono text-cifra-xs text-secundario">{fecha}</span>
      <div className="min-w-0">
        <div className="text-cuerpo">{concepto}</div>
        <div className="text-etiqueta text-secundario">
          {tipo === "transferencia" && transferencia ? (
            <>
              Transferencia · {transferencia.origen} → {transferencia.destino}
            </>
          ) : (
            <>
              {categoria ? (
                categoria
              ) : (
                <span className="punteada">Sin clasificar</span>
              )}
              {cuenta && <> · {cuenta}</>}
            </>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className={`font-mono text-cifra-s tabular-nums ${color}`}>{cifra}</div>
        {equivalenteCOP !== undefined && (
          <div className="font-mono text-cifra-xs tabular-nums text-secundario">
            ≈ {formatearDinero({ monto: equivalenteCOP, moneda: "COP" }, { omitirCOP: true })}
          </div>
        )}
      </div>
    </div>
  );
}
