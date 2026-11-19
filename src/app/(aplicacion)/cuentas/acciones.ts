"use server";

import { revalidatePath } from "next/cache";
import * as cuentas from "@/services/cuentas";
import type { CambioOrden, ResultadoOrden } from "@/services/cuentas";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MENSAJE_FALLO = "No pudimos guardar el orden. Intenta de nuevo.";

/** Valida la forma de la entrada (viene del navegador). El contenido lo valida la API. */
function esCambiosValidos(entrada: unknown): entrada is CambioOrden[] {
  if (!Array.isArray(entrada) || entrada.length < 1 || entrada.length > 2) return false;

  const vistas = new Set<string>();
  for (const cambio of entrada as unknown[]) {
    if (!cambio || typeof cambio !== "object") return false;
    const { naturaleza, ids } = cambio as Record<string, unknown>;
    if (naturaleza !== "activo" && naturaleza !== "pasivo") return false;
    if (vistas.has(naturaleza)) return false;
    vistas.add(naturaleza);
    if (!Array.isArray(ids) || !ids.every((id) => typeof id === "string" && UUID.test(id))) return false;
  }
  return true;
}

/**
 * Guarda el orden de uno o dos grupos (`PUT /cuentas/orden` por grupo).
 * Nunca lanza al cliente: devuelve `ResultadoOrden`.
 */
export async function guardarOrden(cambios: CambioOrden[]): Promise<ResultadoOrden> {
  if (!esCambiosValidos(cambios)) {
    return { ok: false, codigo: "ENTRADA_INVALIDA", mensaje: MENSAJE_FALLO };
  }

  try {
    await cuentas.guardarOrden(cambios.map(({ naturaleza, ids }) => ({ naturaleza, ids: [...ids] })));
  } catch (error) {
    if (error instanceof cuentas.ErrorApi && error.codigo !== "SIN_CONEXION") {
      return { ok: false, codigo: error.codigo, mensaje: error.message };
    }
    return {
      ok: false,
      codigo: error instanceof cuentas.ErrorApi ? error.codigo : "ERROR_INTERNO",
      mensaje: MENSAJE_FALLO,
    };
  }

  revalidatePath("/cuentas");
  return { ok: true };
}
