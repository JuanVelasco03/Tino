import { redirect } from "next/navigation";
import { ErrorApi } from "@/repositories/api/cliente";
import {
  guardarOrdenGrupo,
  listarCuentas,
  type Cuenta,
  type GrupoCuentas,
  type ListaCuentas,
  type Naturaleza,
  type TipoCuenta,
} from "@/repositories/api/cuentas";

export type { Cuenta, GrupoCuentas, ListaCuentas, Naturaleza, TipoCuenta };
export { ErrorApi };

/** Nuevo orden de un grupo. La server action recibe uno o dos, solo los que cambiaron. */
export type CambioOrden = { naturaleza: Naturaleza; ids: string[] };

export type ResultadoOrden = { ok: true } | { ok: false; codigo: string; mensaje: string };

/** Lista de cuentas del usuario. Token vencido entre el proxy y la API → `/login`. */
export async function obtenerCuentas(): Promise<ListaCuentas> {
  try {
    return await listarCuentas();
  } catch (error) {
    if (error instanceof ErrorApi && error.estado === 401) redirect("/login");
    throw error;
  }
}

/**
 * Un `PUT /cuentas/orden` por cambio, en orden. Se detiene en el primer error
 * y lo relanza. Cada `PUT` es atómico e idempotente en la API: reintentar es seguro.
 */
export async function guardarOrden(cambios: readonly CambioOrden[]): Promise<void> {
  for (const { naturaleza, ids } of cambios) {
    await guardarOrdenGrupo(naturaleza, ids);
  }
}
