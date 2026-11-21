import { formatearDinero, type Dinero } from "@/domain/dinero/formato";
import { importeEnPatrimonio } from "@/domain/movimiento/vista-previa";

type Props = {
  /** Ya formateada, p. ej. "04 nov". */
  fecha: string;
  concepto: string;
  tipo: "gasto" | "ingreso" | "transferencia";
  monto: Dinero;
  /** Gasto o ingreso: categoría («Dividido» si tiene partes), o `null` si aún no está clasificado. */
  categoria?: string | null;
  /** Gasto o ingreso: nombre de la cuenta. */
  cuenta?: string;
  /** Transferencia: extremos. */
  transferencia?: { origen: string; destino: string };
  /** Dólares: equivalente en COP, que se muestra debajo en secundario. */
  equivalenteCOP?: bigint;
  /** Toda la columna está en pesos: se omite «COP». */
  omitirCOP?: boolean;
  /** El recién registrado, mientras dura su aviso: fondo hundido y peso 600. */
  resaltada?: boolean;
};

/**
 * C2 · Fila de movimiento, lista general. Sin icono.
 * Cada cifra se lee desde el patrimonio: gasto −, terracota; ingreso +, verde;
 * transferencia en tinta, sin signo. El signo sale del tipo
 * (`importeEnPatrimonio`, que coincide con `efectoEnPatrimonio`, RN-02).
 */
export function FilaMovimiento({
  fecha,
  concepto,
  tipo,
  monto,
  categoria,
  cuenta,
  transferencia,
  equivalenteCOP,
  omitirCOP = false,
  resaltada = false,
}: Props) {
  const efecto = importeEnPatrimonio(tipo, monto.monto);
  const cifra =
    efecto === null
      ? formatearDinero(monto, { omitirCOP })
      : formatearDinero({ ...monto, monto: efecto }, { omitirCOP, signoMas: true });
  const color = efecto === null ? "" : efecto < 0n ? "text-salida-texto" : "text-entrada-texto";
  // El peso va en cada texto: los tokens de tamaño fijan el suyo y no heredan.
  const peso = resaltada ? "font-semibold" : "";

  return (
    <div
      className={`grid grid-cols-[52px_minmax(0,1fr)_auto] items-baseline gap-3 border-b border-linea py-3 ${
        resaltada ? "bg-hundido" : ""
      }`}
    >
      <span className="font-mono text-cifra-xs text-secundario">{fecha}</span>
      <div className="min-w-0">
        <div className={`text-cuerpo ${peso}`}>{concepto}</div>
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
        <div className={`font-mono text-cifra-s tabular-nums ${color} ${peso}`}>{cifra}</div>
        {equivalenteCOP !== undefined && (
          <div className="font-mono text-cifra-xs tabular-nums text-secundario">
            ≈ {formatearDinero({ monto: equivalenteCOP, moneda: "COP" }, { omitirCOP: true })}
          </div>
        )}
      </div>
    </div>
  );
}
