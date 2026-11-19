import type { DragEventHandler } from "react";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { formatearDinero } from "@/domain/dinero/formato";
import type { Cuenta } from "@/services/cuentas";
import { IconoCuenta, ROTULO_TIPO_CUENTA } from "../iconos";

/** Pesos sin «COP»: toda la pantalla está en pesos (la API aún no ofrece USD). */
export function pesos(monto: bigint): string {
  return formatearDinero({ monto, moneda: "COP" }, { omitirCOP: true });
}

/** Saldo como se muestra: un pasivo es deuda y lleva «−» (lo pone la web, N-15). */
export function saldoMostrado(cuenta: Cuenta): string {
  return pesos(cuenta.naturaleza === "pasivo" ? -cuenta.saldo : cuenta.saldo);
}

/** Subtítulo de móvil: `Banco · Ahorros ·· 4821`, `Banco`, `Tarjeta de crédito · cupo 4.000.000`. */
function subtituloMovil(cuenta: Cuenta): string {
  const tipo = ROTULO_TIPO_CUENTA[cuenta.tipo];
  if (cuenta.tarjeta) return `${tipo} · cupo ${pesos(cuenta.tarjeta.cupo)}`;
  return cuenta.detalle ? `${tipo} · ${cuenta.detalle}` : tipo;
}

export type ControlesOrden = {
  puedeSubir: boolean;
  puedeBajar: boolean;
  alSubir: () => void;
  alBajar: () => void;
  /** Fila destino de un arrastre válido. */
  resaltada: boolean;
  alEmpezarArrastre: DragEventHandler<HTMLLIElement>;
  alArrastrarEncima: DragEventHandler<HTMLLIElement>;
  alSoltar: DragEventHandler<HTMLLIElement>;
  alTerminarArrastre: DragEventHandler<HTMLLIElement>;
};

type Props = {
  cuenta: Cuenta;
  /** Presente solo en modo «Ordenar». */
  orden?: ControlesOrden;
};

/** Barra de cupo usado de la tarjeta. Porcentaje y disponible vienen de la API (N-16 a N-18). */
function BarraCupo({ tarjeta, conCupo }: { tarjeta: NonNullable<Cuenta["tarjeta"]>; conCupo: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        role="meter"
        aria-label="Cupo usado"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={tarjeta.porcentajeUsado}
        className="h-1 overflow-hidden rounded-muestra bg-linea"
      >
        <div className="h-1 bg-salida" style={{ width: `${tarjeta.porcentajeUsado}%` }} />
      </div>
      <div className="flex justify-between gap-3 font-mono text-cifra-xs tabular-nums text-secundario">
        <span className="whitespace-nowrap">Usado {tarjeta.porcentajeUsado} %</span>
        <span className="truncate">
          Disponible {pesos(tarjeta.disponible)}
          {conCupo && ` de ${pesos(tarjeta.cupo)}`}
        </span>
      </div>
    </div>
  );
}

const BOTON_ORDEN =
  "flex size-11 items-center justify-center rounded-campo border border-linea bg-superficie text-texto disabled:cursor-not-allowed disabled:text-terciario";

/**
 * Fila de cuenta. Escritorio (md+): agarre · ícono · nombre y tipo · detalle · saldo.
 * Móvil: ícono · nombre y subtítulo · saldo, con la barra de la tarjeta debajo.
 */
export function FilaCuenta({ cuenta, orden }: Props) {
  const ordenando = orden !== undefined;
  const esPasivo = cuenta.naturaleza === "pasivo";

  return (
    <li
      draggable={ordenando}
      onDragStart={orden?.alEmpezarArrastre}
      onDragOver={orden?.alArrastrarEncima}
      onDrop={orden?.alSoltar}
      onDragEnd={orden?.alTerminarArrastre}
      className={`grid min-h-15 items-center gap-3 py-2.5 md:min-h-16 md:grid-cols-[28px_24px_minmax(0,1.1fr)_minmax(0,1.6fr)_200px] ${
        ordenando ? "grid-cols-[18px_20px_minmax(0,1fr)_auto]" : "grid-cols-[20px_minmax(0,1fr)_auto]"
      } ${orden?.resaltada ? "bg-hundido" : ""}`}
    >
      <span className={`${ordenando ? "flex" : "hidden md:flex"} justify-center text-secundario ${ordenando ? "cursor-grab" : ""}`}>
        {ordenando && <GripVertical size={18} strokeWidth={1.5} aria-hidden />}
      </span>

      <span className="flex text-secundario">
        <IconoCuenta tipo={cuenta.tipo} />
      </span>

      <div className="min-w-0">
        <div className="truncate text-cuerpo font-semibold">{cuenta.nombre}</div>
        <div className="truncate text-etiqueta font-normal text-secundario">
          <span className="hidden md:inline">{ROTULO_TIPO_CUENTA[cuenta.tipo]}</span>
          <span className="md:hidden">{subtituloMovil(cuenta)}</span>
        </div>
      </div>

      <div className="hidden min-w-0 flex-col gap-1.5 text-etiqueta font-normal text-secundario md:flex">
        {cuenta.detalle && <span className="truncate">{cuenta.detalle}</span>}
        {cuenta.tarjeta && (
          <div className="max-w-[380px]">
            <BarraCupo tarjeta={cuenta.tarjeta} conCupo />
          </div>
        )}
      </div>

      {orden ? (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={orden.alSubir}
            disabled={!orden.puedeSubir}
            aria-label={`Subir ${cuenta.nombre}`}
            className={BOTON_ORDEN}
          >
            <ArrowUp size={18} strokeWidth={1.5} aria-hidden />
          </button>
          <button
            type="button"
            onClick={orden.alBajar}
            disabled={!orden.puedeBajar}
            aria-label={`Bajar ${cuenta.nombre}`}
            className={BOTON_ORDEN}
          >
            <ArrowDown size={18} strokeWidth={1.5} aria-hidden />
          </button>
        </div>
      ) : (
        <div className="text-right">
          <div
            className={`whitespace-nowrap font-mono text-[17px] leading-[22px] font-medium tabular-nums md:text-cifra-m md:leading-[26px] ${
              esPasivo ? "text-salida-texto" : "text-texto"
            }`}
          >
            {saldoMostrado(cuenta)}
          </div>
          {esPasivo && <div className="font-mono text-cifra-xs text-secundario">deuda</div>}
        </div>
      )}

      {cuenta.tarjeta && !ordenando && (
        <div className="col-[2/-1] pb-0.5 md:hidden">
          <BarraCupo tarjeta={cuenta.tarjeta} conCupo={false} />
        </div>
      )}
    </li>
  );
}
