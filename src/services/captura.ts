import { redirect } from "next/navigation";
import type { Oferta } from "@/domain/categorizacion/oferta";
import type { Propuesta } from "@/domain/movimiento/cuerpo";
import * as apiCaptura from "@/repositories/api/captura";
import type { Captura, Categoria, Sugerencias } from "@/repositories/api/captura";
import { ErrorApi } from "@/repositories/api/cliente";
import { listarCuentas, type Cuenta } from "@/repositories/api/cuentas";
import type { TipoMovimiento } from "@/repositories/api/movimientos";
import * as apiReglas from "@/repositories/api/reglas";

export type { Captura, Categoria, Cuenta, Oferta, Propuesta, Sugerencias };
export { ErrorApi };

/** Lo que el formulario necesita al abrir: la captura y las cuentas activas (activos, luego pasivos). */
export type DatosCaptura = { captura: Captura; cuentas: Cuenta[] };

export type ResultadoCarga = ({ ok: true } & DatosCaptura) | { ok: false; codigo: string; mensaje: string };

export type ResultadoSugerencias = { ok: true; sugerencias: Sugerencias } | { ok: false; codigo: string; mensaje: string };

/** Token vencido entre el proxy y la API → `/login`. Cualquier otro error se relanza. */
async function conSesion<T>(llamada: () => Promise<T>): Promise<T> {
  try {
    return await llamada();
  } catch (error) {
    if (error instanceof ErrorApi && error.estado === 401) redirect("/login");
    throw error;
  }
}

/** `GET /captura` y `GET /cuentas` en paralelo, al abrir: saldos y gastos de hoy frescos. */
export async function cargar(): Promise<DatosCaptura> {
  return conSesion(async () => {
    const [captura, lista] = await Promise.all([apiCaptura.leerCaptura(), listarCuentas()]);
    return { captura, cuentas: [...lista.activos.cuentas, ...lista.pasivos.cuentas] };
  });
}

export async function sugerir(tipo: TipoMovimiento, texto: string): Promise<Sugerencias> {
  return conSesion(() => apiCaptura.leerSugerencias(tipo, texto));
}

export async function crearRegla(palabraClave: string, categoriaId: string): Promise<void> {
  await conSesion(() => apiReglas.crearRegla(palabraClave, categoriaId));
}

export async function ajustarRegla(id: string, categoriaId: string): Promise<void> {
  await conSesion(() => apiReglas.ajustarRegla(id, categoriaId));
}
