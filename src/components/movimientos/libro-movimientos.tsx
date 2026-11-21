"use client";

import { formatearDinero } from "@/domain/dinero/formato";
import { formatearFechaSinAnio } from "@/domain/fecha/formato";
import { importeEnPatrimonio } from "@/domain/movimiento/vista-previa";
import type { Movimiento, TipoMovimiento } from "@/services/movimientos";
import { useContextoCaptura } from "../captura/proveedor-captura";
import { EstadoVacio } from "../estado-vacio";
import { FilaMovimiento } from "../fila-movimiento";

type Props = {
  /** `"YYYY-MM"` del mes listado. */
  mes: string;
  /** En el orden de la API: fecha desc, el último registrado primero. */
  movimientos: Movimiento[];
  /** Nombre del mes en minúsculas para el estado vacío («noviembre»). */
  nombreMes: string;
};

const ROTULO_TIPO: Record<TipoMovimiento, string> = { gasto: "Gasto", ingreso: "Ingreso", transferencia: "Transferencia" };

/** Concepto de la fila: la descripción o, si no tiene, el tipo. */
function concepto(m: Movimiento): string {
  return m.descripcion ?? ROTULO_TIPO[m.tipo];
}

/** Categoría como se lee: «Dividido» con partes; `null` = sin clasificar. Una transferencia no lleva. */
function categoria(m: Movimiento): string | null {
  if (m.dividido) return "Dividido";
  return m.categoria?.nombre ?? null;
}

function cuenta(m: Movimiento): string {
  const origen = m.cuentaOrigen?.nombre ?? "";
  const destino = m.cuentaDestino?.nombre ?? "";
  if (m.tipo === "transferencia") return `${origen} → ${destino}`;
  return m.tipo === "gasto" ? origen : destino;
}

/** Importe con signo y color desde el patrimonio: gasto −, ingreso +, transferencia sin signo. */
function Importe({ m, peso }: { m: Movimiento; peso: string }) {
  const efecto = importeEnPatrimonio(m.tipo, m.monto);
  const cifra = formatearDinero({ monto: efecto ?? m.monto, moneda: "COP" }, { omitirCOP: true, signoMas: efecto !== null });
  const color = efecto === null ? "" : efecto < 0n ? "text-salida-texto" : "text-entrada-texto";
  return <span className={`text-right font-mono text-cifra-s tabular-nums ${color} ${peso}`}>{cifra}</span>;
}

const COLUMNAS = "grid-cols-[52px_minmax(0,1fr)_minmax(0,176px)_128px]";

/**
 * Lista del mes en solo lectura. Escritorio: rejilla de cuatro columnas.
 * Móvil: C2. El recién registrado va arriba (orden de la API) y se resalta
 * mientras dura su aviso.
 */
export function LibroMovimientos({ mes, movimientos, nombreMes }: Props) {
  const { abrir, resaltadoId } = useContextoCaptura();

  if (movimientos.length === 0) {
    return (
      <EstadoVacio
        rotulo={`Movimientos · ${nombreMes}`}
        titulo="Aún no registras movimientos este mes."
        detalle="Registra tu primer gasto."
        accion={{ etiqueta: "Registrar", alPulsar: abrir }}
      />
    );
  }

  return (
    <section aria-label={`Movimientos de ${mes}`}>
      {/* Escritorio */}
      <div role="table" className="hidden md:block">
        <div role="row" className={`grid ${COLUMNAS} gap-3 border-b border-raya pb-2 text-rotulo uppercase text-secundario`}>
          <span role="columnheader">Fecha</span>
          <span role="columnheader">Descripción</span>
          <span role="columnheader">Cuenta</span>
          <span role="columnheader" className="text-right">
            Importe
          </span>
        </div>
        {movimientos.map((m) => {
          const resaltada = m.id === resaltadoId;
          const peso = resaltada ? "font-semibold" : "";
          const cat = categoria(m);
          return (
            <div
              key={m.id}
              role="row"
              className={`grid ${COLUMNAS} items-baseline gap-3 border-b border-linea py-3 ${resaltada ? "bg-hundido" : ""}`}
            >
              <span role="cell" className="font-mono text-cifra-xs text-secundario">
                {formatearFechaSinAnio(m.fecha)}
              </span>
              <span role="cell" className="flex min-w-0 flex-col">
                <span className={`truncate text-cuerpo ${peso}`}>{concepto(m)}</span>
                <span className="text-etiqueta text-secundario">
                  {m.tipo === "transferencia" ? "Transferencia" : cat ?? <span className="punteada">Sin clasificar</span>}
                </span>
              </span>
              <span role="cell" className="truncate text-etiqueta text-secundario">
                {cuenta(m)}
              </span>
              <span role="cell" className="text-right">
                <Importe m={m} peso={peso} />
              </span>
            </div>
          );
        })}
      </div>

      {/* Móvil */}
      <div className="md:hidden">
        {movimientos.map((m) => (
          <FilaMovimiento
            key={m.id}
            fecha={formatearFechaSinAnio(m.fecha)}
            concepto={concepto(m)}
            tipo={m.tipo}
            monto={{ monto: m.monto, moneda: "COP" }}
            categoria={categoria(m)}
            cuenta={m.tipo === "transferencia" ? undefined : cuenta(m)}
            transferencia={
              m.tipo === "transferencia" ? { origen: m.cuentaOrigen?.nombre ?? "", destino: m.cuentaDestino?.nombre ?? "" } : undefined
            }
            omitirCOP
            resaltada={m.id === resaltadoId}
          />
        ))}
      </div>
    </section>
  );
}
