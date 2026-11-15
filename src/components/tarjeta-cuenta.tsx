import { naturalezaDe, type TipoCuenta } from "@/domain/cuenta/naturaleza";
import { cupoDisponible, porcentajeUsado } from "@/domain/cuenta/cupo";
import { formatearDinero, formatearTasa, type Dinero } from "@/domain/dinero/formato";
import { IconoCuenta, ROTULO_TIPO_CUENTA } from "./iconos";

type Plazo = { fecha: string; enDias: number };

type Props = {
  nombre: string;
  tipo: TipoCuenta;
  /** Saldo del activo, o deuda vigente del pasivo. */
  saldo: Dinero;
  /** Activo en dólares: equivalente en COP, tasa y fecha de la tasa («hoy»). */
  equivalente?: { cop: bigint; tasa: bigint; fecha: string };
  /** Pasivo con cupo: el disponible se calcula, no se guarda (RN-18). */
  cupoTotal?: bigint;
  corte?: Plazo;
  pagoLimite?: Plazo;
};

function FilaPlazo({ rotulo, plazo }: { rotulo: string; plazo: Plazo }) {
  return (
    <div>
      <div className="text-etiqueta text-secundario">{rotulo}</div>
      <div className="text-cuerpo font-medium">
        {plazo.fecha}{" "}
        <span className="font-mono text-cifra-xs text-secundario">· en {plazo.enDias} días</span>
      </div>
    </div>
  );
}

/**
 * C3 · Tarjeta de cuenta. Un activo es una hoja (superficie). Un pasivo no
 * tiene hoja: va sobre el fondo, con «Debes» sobre la cifra y el cupo como barra.
 */
export function TarjetaCuenta({
  nombre,
  tipo,
  saldo,
  equivalente,
  cupoTotal,
  corte,
  pagoLimite,
}: Props) {
  const naturaleza = naturalezaDe(tipo);
  const esPasivo = naturaleza === "pasivo";
  const enDolares = saldo.moneda === "USD";
  const subtitulo = `${ROTULO_TIPO_CUENTA[tipo]} · ${naturaleza}${enDolares && !esPasivo ? " en USD" : ""}`;
  const cifra = formatearDinero(saldo, { omitirCOP: true });

  const cabecera = (
    <div className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-start gap-3">
      <span className="flex pt-px text-secundario">
        <IconoCuenta tipo={tipo} />
      </span>
      <div>
        <div className="text-cuerpo font-semibold">{nombre}</div>
        <div className="text-etiqueta text-secundario">{subtitulo}</div>
      </div>
      <div className="text-right">
        {esPasivo && <div className="text-rotulo uppercase text-secundario">Debes</div>}
        <div className="font-mono text-cifra-m tabular-nums">{cifra}</div>
        {equivalente && (
          <>
            <div className="font-mono text-cifra-xs tabular-nums text-secundario">
              ≈ {formatearDinero({ monto: equivalente.cop, moneda: "COP" })}
            </div>
            <div className="font-mono text-cifra-xs tabular-nums text-secundario">
              TRM {formatearTasa(equivalente.tasa)} · {equivalente.fecha}
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (!esPasivo) {
    return (
      <article className="rounded-hoja border border-linea bg-superficie p-4">{cabecera}</article>
    );
  }

  const usado = cupoTotal !== undefined ? porcentajeUsado(cupoTotal, saldo.monto) : null;
  const enMoneda = (monto: bigint) =>
    formatearDinero({ monto, moneda: saldo.moneda }, { omitirCOP: true });

  return (
    <article className="flex flex-col gap-4 rounded-hoja border border-linea p-4">
      {cabecera}

      {cupoTotal !== undefined && usado !== null && (
        <div className="flex flex-col gap-2 pl-8">
          <div
            role="meter"
            aria-label="Cupo usado"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={usado}
            className="h-1 overflow-hidden rounded-muestra bg-linea"
          >
            <div className="h-1 bg-texto" style={{ width: `${usado}%` }} />
          </div>
          <div className="flex justify-between font-mono text-cifra-xs tabular-nums text-secundario">
            <span>Usado {usado} %</span>
            <span>
              Disponible {enMoneda(cupoDisponible(cupoTotal, saldo.monto))} de {enMoneda(cupoTotal)}
            </span>
          </div>
        </div>
      )}

      {(corte || pagoLimite) && (
        <div className="grid grid-cols-2 gap-3 border-t border-linea pl-8 pt-3">
          {corte && <FilaPlazo rotulo="Corte" plazo={corte} />}
          {pagoLimite && <FilaPlazo rotulo="Pago límite" plazo={pagoLimite} />}
        </div>
      )}
    </article>
  );
}
