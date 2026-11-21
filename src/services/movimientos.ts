import { redirect } from "next/navigation";
import type { CampoCaptura, CuerpoMovimiento, ValoresCaptura } from "@/domain/movimiento/cuerpo";
import { ErrorApi } from "@/repositories/api/cliente";
import * as api from "@/repositories/api/movimientos";
import type { ListaMovimientos, Movimiento, MovimientoCuerpo, Ref, TipoMovimiento } from "@/repositories/api/movimientos";

export type { CampoCaptura, CuerpoMovimiento, ListaMovimientos, Movimiento, MovimientoCuerpo, Ref, TipoMovimiento, ValoresCaptura };
export { ErrorApi };

/** Resultado de registrar. Nunca lanza al cliente. */
export type ResultadoRegistro =
  | { ok: true; movimiento: Movimiento }
  | { ok: false; codigo: string; mensaje: string; campo?: CampoCaptura };

export type ResultadoSimple = { ok: true } | { ok: false; codigo: string; mensaje: string };

/** Token vencido entre el proxy y la API → `/login`. Cualquier otro error se relanza. */
async function conSesion<T>(llamada: () => Promise<T>): Promise<T> {
  try {
    return await llamada();
  } catch (error) {
    if (error instanceof ErrorApi && error.estado === 401) redirect("/login");
    throw error;
  }
}

/** Movimientos del mes actual en la zona del usuario (N-04). */
export async function listarDelMes(): Promise<ListaMovimientos> {
  return conSesion(() => api.listarMovimientos());
}

/** `POST /movimientos`. El dominio arma el cuerpo con la forma del contrato. */
export async function registrar(cuerpo: MovimientoCuerpo): Promise<Movimiento> {
  return conSesion(() => api.crearMovimiento(cuerpo));
}

export async function eliminar(id: string): Promise<void> {
  return conSesion(() => api.eliminarMovimiento(id));
}
