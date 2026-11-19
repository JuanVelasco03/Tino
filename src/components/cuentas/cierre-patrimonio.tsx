import { pesos } from "./fila-cuenta";
import { SANGRIA_LISTA } from "./grupo-cuentas";

type Props = {
  /** Totales tal como los da la API; `pasivos` es la deuda positiva. */
  activos: bigint;
  pasivos: bigint;
  /** Ya con su signo (N-24): se muestra tal cual. */
  patrimonioNeto: bigint;
};

const FILA =
  "flex items-baseline justify-between gap-3 py-3 md:grid md:grid-cols-[minmax(0,1fr)_200px]";

/** Cierre de la lista: Activos, Pasivos y «Patrimonio neto» con doble raya. */
export function CierrePatrimonio({ activos, pasivos, patrimonioNeto }: Props) {
  return (
    <section aria-label="Patrimonio" className={SANGRIA_LISTA}>
      <div className={`${FILA} border-b border-linea`}>
        <span className="text-cuerpo text-secundario">Activos</span>
        <span className="text-right font-mono text-cifra-s tabular-nums">{pesos(activos)}</span>
      </div>
      <div className={`${FILA} border-b border-linea`}>
        <span className="text-cuerpo text-secundario">Pasivos</span>
        <span className="text-right font-mono text-cifra-s tabular-nums text-salida-texto">{pesos(-pasivos)}</span>
      </div>
      <div className={`${FILA} doble-raya pt-4`}>
        <span className="text-[17px]/[22px] font-semibold md:text-titulo-2">Patrimonio neto</span>
        <span className="whitespace-nowrap text-right font-mono text-[28px]/[32px] font-medium tracking-[-0.02em] tabular-nums md:text-cifra-l">
          {pesos(patrimonioNeto)}
        </span>
      </div>
    </section>
  );
}
