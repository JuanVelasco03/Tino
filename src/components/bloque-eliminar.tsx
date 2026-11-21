import { Boton } from "./boton";
import { MensajeError } from "./mensaje-error";

/** Texto de cuentas (SPEC 04): su borrado se lleva el historial. */
export const DETALLE_ELIMINAR_CUENTA = "Se borra para siempre, con su historial de cambios. No se puede deshacer.";

type Props = {
  /** Lo que se elimina: va en el rótulo y en el botón («Eliminar Nequi», «Eliminar Almuerzo»). */
  nombre: string;
  /** La frase de irreversibilidad, propia de cada función. */
  detalle: string;
  alConfirmar: () => void;
  alCancelar: () => void;
  pendiente: boolean;
  error?: string | null;
};

/**
 * C26 · Confirmación de borrado en la misma página, sin modal. Reemplaza al
 * vínculo que la abrió (panel de una cuenta, fila de una archivada, edición
 * de un movimiento). El botón va en `salida-texto`: eliminar es irreversible
 * y debe distinguirse.
 */
export function BloqueEliminar({ nombre, detalle, alConfirmar, alCancelar, pendiente, error }: Props) {
  return (
    <div role="group" aria-label={`Eliminar ${nombre}`} className="flex flex-col gap-2">
      <p className="text-rotulo uppercase">Eliminar {nombre}</p>
      <p className="text-cuerpo">{detalle}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Boton variante="secundario" onClick={alConfirmar} disabled={pendiente} className="text-salida-texto">
          {pendiente ? "Eliminando…" : `Eliminar ${nombre}`}
        </Boton>
        <Boton variante="texto" onClick={alCancelar} disabled={pendiente}>
          Cancelar
        </Boton>
      </div>
      {error && <MensajeError mensaje={error} />}
    </div>
  );
}
