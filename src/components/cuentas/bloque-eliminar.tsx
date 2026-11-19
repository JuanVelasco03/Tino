import { Boton } from "../boton";

type Props = {
  /** Nombre de la cuenta: va en el rótulo y en el botón («Eliminar Nequi»). */
  nombre: string;
  alConfirmar: () => void;
  alCancelar: () => void;
  pendiente: boolean;
  error?: string | null;
};

/**
 * C26 · Confirmación de borrado en la misma página, sin modal. Se usa en el
 * panel de edición y en la fila de una archivada. El botón va en
 * `salida-texto`: eliminar es irreversible y debe distinguirse.
 */
export function BloqueEliminar({ nombre, alConfirmar, alCancelar, pendiente, error }: Props) {
  return (
    <div role="group" aria-label={`Eliminar ${nombre}`} className="flex flex-col gap-2">
      <p className="text-rotulo uppercase">Eliminar {nombre}</p>
      <p className="text-cuerpo">Se borra para siempre, con su historial de cambios. No se puede deshacer.</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Boton variante="secundario" onClick={alConfirmar} disabled={pendiente} className="text-salida-texto">
          {pendiente ? "Eliminando…" : `Eliminar ${nombre}`}
        </Boton>
        <Boton variante="texto" onClick={alCancelar} disabled={pendiente}>
          Cancelar
        </Boton>
      </div>
      {error && (
        <p role="alert" className="text-etiqueta font-normal text-salida-texto">
          {error}
        </p>
      )}
    </div>
  );
}
