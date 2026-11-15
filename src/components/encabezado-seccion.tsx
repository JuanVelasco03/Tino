import type { ReactNode } from "react";

type Props = {
  titulo: string;
  /** Cifra de la sección (ya formateada), p. ej. el total del grupo. Va en mono. */
  total?: ReactNode;
  /** Separa el grupo del anterior con espacio (entre grupos), no con línea. */
  separado?: boolean;
};

/** C1 · Encabezado de sección: rótulo + cifra, bajo una raya. */
export function EncabezadoSeccion({ titulo, total, separado = false }: Props) {
  return (
    <div
      className={`flex items-baseline justify-between border-b border-raya pb-2 ${separado ? "pt-6" : ""}`}
    >
      <h2 className="text-rotulo uppercase">{titulo}</h2>
      {total !== undefined && <span className="font-mono text-cifra-s tabular-nums">{total}</span>}
    </div>
  );
}
