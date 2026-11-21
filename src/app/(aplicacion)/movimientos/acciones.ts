"use server";

import { revalidatePath } from "next/cache";
import * as movimientos from "@/services/movimientos";
import type { MovimientoCuerpo, ResultadoGuardado, ResultadoSimple } from "@/services/movimientos";
import { cuerpoValido, ENTRADA_INVALIDA, esId, fallo, RUTAS_AFECTADAS } from "../captura/entrada";

/** `PUT /movimientos/:id` con el cuerpo completo (`fecha` obligatoria). Revalida la lista y los saldos. */
export async function guardarMovimiento(id: string, entrada: MovimientoCuerpo): Promise<ResultadoGuardado> {
  const cuerpo = cuerpoValido(entrada);
  if (!esId(id) || !cuerpo || cuerpo.fecha === undefined) return ENTRADA_INVALIDA;

  let movimiento: movimientos.Movimiento;
  try {
    movimiento = await movimientos.editar(id, cuerpo);
  } catch (error) {
    return fallo(error, cuerpo.tipo);
  }
  for (const ruta of RUTAS_AFECTADAS) revalidatePath(ruta);
  return { ok: true, movimiento };
}

/** `DELETE /movimientos/:id` (N-18). La confirmación la pidió el cliente. */
export async function eliminarMovimiento(id: string): Promise<ResultadoSimple> {
  if (!esId(id)) return ENTRADA_INVALIDA;
  try {
    await movimientos.eliminar(id);
  } catch (error) {
    const { codigo, mensaje } = fallo(error);
    return { ok: false, codigo, mensaje };
  }
  for (const ruta of RUTAS_AFECTADAS) revalidatePath(ruta);
  return { ok: true };
}
