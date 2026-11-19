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

/**
 * Sangría de la lista: borde de 1 px más el relleno de la hoja. Pasivos, cierre
 * y enlaces la repiten (con borde transparente) para que todas las cifras caigan
 * en la misma columna, también en móvil.
 */
export const SANGRIA_LISTA = "border-x border-transparent px-4 md:px-6";

/** Grupo de cuentas. Activos: hoja con superficie. Pasivos: sobre el fondo, sin hoja. */
export function GrupoCuentas({ naturaleza, total, vacio, children }: Props) {
  const textos = TEXTOS[naturaleza];
  const esPasivo = naturaleza === "pasivo";
  const idTitulo = `grupo-${naturaleza}`;

  return (
    <section
      aria-labelledby={idTitulo}
      className={`rounded-hoja border px-4 pb-1 md:px-6 ${esPasivo ? "border-transparent" : "border-linea bg-superficie"}`}
    >
      <div className="flex items-baseline justify-between gap-3 border-b border-raya pt-4 pb-2 md:grid md:grid-cols-[28px_24px_minmax(0,1.1fr)_minmax(0,1.6fr)_200px]">
        <span className="hidden md:block" />
        <h2 id={idTitulo} className="flex min-w-0 items-baseline gap-2 md:col-span-2">
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
        // Alineado con la columna del nombre: 20 + 12 en móvil; 28 + 12 + 24 + 12 en escritorio.
        <p className="flex min-h-16 items-center pl-8 text-cuerpo text-secundario md:pl-[76px]">{textos.vacio}</p>
      ) : (
        <ul className="divide-y divide-linea">{children}</ul>
      )}
    </section>
  );
}
