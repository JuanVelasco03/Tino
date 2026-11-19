import type { ReactNode } from "react";
import type { Naturaleza } from "@/services/cuentas";
import { pesos } from "./fila-cuenta";

type Props = {
  naturaleza: Naturaleza;
  /** Total del grupo tal como lo da la API; en pasivos, la deuda positiva. */
  total: bigint;
  vacio: boolean;
  /** Las `<FilaCuenta>` del grupo, en el orden del arreglo. */
  children: ReactNode;
};

const TEXTOS = {
  activo: { titulo: "Activos", subtitulo: "Lo que tienes", vacio: "Sin activos" },
  pasivo: { titulo: "Pasivos", subtitulo: "Lo que debes", vacio: "Sin pasivos" },
} as const;

/** Grupo de cuentas. Activos: hoja con superficie. Pasivos: sobre el fondo, sin hoja. */
export function GrupoCuentas({ naturaleza, total, vacio, children }: Props) {
  const textos = TEXTOS[naturaleza];
  const esPasivo = naturaleza === "pasivo";
  const idTitulo = `grupo-${naturaleza}`;

  return (
    <section
      aria-labelledby={idTitulo}
      className={`rounded-hoja border pb-1 md:px-6 ${
        esPasivo ? "border-transparent px-0" : "border-linea bg-superficie px-3.5"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3 border-b border-raya pt-3.5 pb-2 md:grid md:grid-cols-[28px_24px_minmax(0,1.1fr)_minmax(0,1.6fr)_200px] md:pt-[18px] md:pb-2.5">
        <span className="hidden md:block" />
        <h2 id={idTitulo} className="flex min-w-0 items-baseline gap-2 md:col-span-2 md:gap-2.5">
          <span className="text-rotulo uppercase">{textos.titulo}</span>
          <span className="truncate text-etiqueta font-normal text-secundario">{textos.subtitulo}</span>
        </h2>
        <span className="hidden text-rotulo uppercase text-secundario md:block">Detalle</span>
        <span
          className={`whitespace-nowrap text-right font-mono text-cifra-s tabular-nums md:text-cifra-m ${
            esPasivo ? "text-salida-texto" : "text-texto"
          }`}
        >
          {pesos(esPasivo ? -total : total)}
        </span>
      </div>

      {vacio ? (
        <p className="flex min-h-15 items-center text-cuerpo text-secundario md:min-h-16 md:pl-[76px]">{textos.vacio}</p>
      ) : (
        <ul className="divide-y divide-linea">{children}</ul>
      )}
    </section>
  );
}
