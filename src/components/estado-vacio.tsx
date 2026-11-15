import Link from "next/link";
import { Plus } from "lucide-react";

type Props = {
  /** Rótulo de la sección: «Movimientos · noviembre». */
  rotulo: string;
  titulo: string;
  detalle: string;
  accion: { etiqueta: string; href: string };
};

/** C7 · Estado vacío, primer día: la página en blanco, con renglones. */
export function EstadoVacio({ rotulo, titulo, detalle, accion }: Props) {
  return (
    <section>
      <div className="flex items-baseline justify-between border-b border-raya pb-2">
        <h2 className="text-rotulo uppercase">{rotulo}</h2>
        <span className="font-mono text-cifra-s text-terciario">0</span>
      </div>
      <div aria-hidden>
        <div className="h-11 border-b border-linea" />
        <div className="h-11 border-b border-linea" />
        <div className="h-11 border-b border-linea" />
      </div>
      <div className="flex flex-col items-start gap-1 pt-6">
        <p className="text-cuerpo font-semibold">{titulo}</p>
        <p className="text-etiqueta font-normal text-secundario">{detalle}</p>
        <Link
          href={accion.href}
          className="mt-3 inline-flex items-center gap-2 text-cuerpo font-semibold text-marca-texto"
        >
          <Plus size={16} strokeWidth={1.5} aria-hidden />
          {accion.etiqueta}
        </Link>
      </div>
    </section>
  );
}
