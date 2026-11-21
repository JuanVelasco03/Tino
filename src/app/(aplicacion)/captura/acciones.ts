"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import * as captura from "@/services/captura";
import type { ResultadoCarga, ResultadoSugerencias } from "@/services/captura";
import * as movimientos from "@/services/movimientos";
import type {
  CampoCaptura,
  MovimientoCuerpo,
  ResultadoRegistro,
  ResultadoSimple,
  TipoMovimiento,
} from "@/services/movimientos";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MONTO = /^\d{1,19}$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const TIPOS: readonly TipoMovimiento[] = ["gasto", "ingreso", "transferencia"];

const MENSAJE_SIN_CONEXION = "No pudimos conectar. Intenta de nuevo.";
const MENSAJE_ENTRADA = "No pudimos procesar los datos. Intenta de nuevo.";
const MENSAJE_CARGA = "No pudimos cargar el formulario.";

/** Lo que registrar y deshacer cambian: la lista del mes y los saldos. */
const RUTAS_AFECTADAS = ["/movimientos", "/cuentas"] as const;

type Fallo = { ok: false; codigo: string; mensaje: string; campo?: CampoCaptura };

const ENTRADA_INVALIDA: Fallo = { ok: false, codigo: "ENTRADA_INVALIDA", mensaje: MENSAJE_ENTRADA };

/** Campo de la API → campo del formulario. `cuentaDestinoId` depende del tipo. */
function campoFormulario(campo: string | undefined, tipo: TipoMovimiento | null): CampoCaptura | undefined {
  switch (campo) {
    case "tipo":
    case "monto":
    case "fecha":
    case "descripcion":
    case "nota":
      return campo;
    case "categoriaId":
      return "categoria";
    case "cuentaOrigenId":
      return "cuenta";
    case "cuentaDestinoId":
      return tipo === "transferencia" ? "destino" : "cuenta";
    default:
      return undefined;
  }
}

/**
 * Traduce un error a un fallo: el `mensaje` de la API bajo su campo, o
 * general si no trae campo. Sin conexión o error desconocido, texto local.
 * Las redirecciones de Next (sesión vencida) se relanzan.
 */
function fallo(error: unknown, tipo: TipoMovimiento | null = null, sinConexion = MENSAJE_SIN_CONEXION): Fallo {
  unstable_rethrow(error);
  if (!(error instanceof movimientos.ErrorApi) || error.codigo === "SIN_CONEXION") {
    return { ok: false, codigo: error instanceof movimientos.ErrorApi ? error.codigo : "ERROR_INTERNO", mensaje: sinConexion };
  }
  const campo = campoFormulario(error.campo, tipo);
  return campo
    ? { ok: false, codigo: error.codigo, mensaje: error.message, campo }
    : { ok: false, codigo: error.codigo, mensaje: error.message };
}

function esTipo(valor: unknown): valor is TipoMovimiento {
  return typeof valor === "string" && (TIPOS as readonly string[]).includes(valor);
}

function esId(valor: unknown): valor is string {
  return typeof valor === "string" && UUID.test(valor);
}

function esTextoOpcional(valor: unknown): valor is string | null | undefined {
  return valor === undefined || valor === null || typeof valor === "string";
}

function esIdOpcional(valor: unknown): valor is string | null | undefined {
  return valor === undefined || valor === null || esId(valor);
}

/** Valida la forma del cuerpo (viene del navegador). El contenido lo valida la API. */
function cuerpoValido(entrada: unknown): MovimientoCuerpo | null {
  if (!entrada || typeof entrada !== "object") return null;
  const { tipo, monto, fecha, descripcion, nota, cuentaOrigenId, cuentaDestinoId, categoriaId } = entrada as Record<string, unknown>;
  if (!esTipo(tipo) || typeof monto !== "string" || !MONTO.test(monto)) return null;
  if (fecha !== undefined && (typeof fecha !== "string" || !FECHA.test(fecha))) return null;
  if (!esTextoOpcional(descripcion) || !esTextoOpcional(nota)) return null;
  if (!esIdOpcional(cuentaOrigenId) || !esIdOpcional(cuentaDestinoId) || !esIdOpcional(categoriaId)) return null;

  // Se copian solo los campos conocidos: dividir (`partes`) llega en SPEC 06.
  const cuerpo: MovimientoCuerpo = { tipo, monto, descripcion, nota };
  if (fecha !== undefined) cuerpo.fecha = fecha;
  if (cuentaOrigenId !== undefined) cuerpo.cuentaOrigenId = cuentaOrigenId;
  if (cuentaDestinoId !== undefined) cuerpo.cuentaDestinoId = cuentaDestinoId;
  if (categoriaId !== undefined) cuerpo.categoriaId = categoriaId;
  return cuerpo;
}

/** `GET /captura` y `GET /cuentas` al abrir el formulario. */
export async function cargarCaptura(): Promise<ResultadoCarga> {
  try {
    return { ok: true, ...(await captura.cargar()) };
  } catch (error) {
    const { codigo } = fallo(error);
    return { ok: false, codigo, mensaje: MENSAJE_CARGA };
  }
}

/** `GET /sugerencias` mientras se escribe la descripción. */
export async function sugerir(tipo: TipoMovimiento, texto: string): Promise<ResultadoSugerencias> {
  if (!esTipo(tipo) || typeof texto !== "string") return ENTRADA_INVALIDA;
  try {
    return { ok: true, sugerencias: await captura.sugerir(tipo, texto) };
  } catch (error) {
    const { codigo, mensaje } = fallo(error, tipo);
    return { ok: false, codigo, mensaje };
  }
}

/** `POST /movimientos`. Revalida la lista del mes y los saldos. */
export async function registrarMovimiento(entrada: MovimientoCuerpo): Promise<ResultadoRegistro> {
  const cuerpo = cuerpoValido(entrada);
  if (!cuerpo) return ENTRADA_INVALIDA;

  let movimiento: movimientos.Movimiento;
  try {
    movimiento = await movimientos.registrar(cuerpo);
  } catch (error) {
    return fallo(error, cuerpo.tipo);
  }
  for (const ruta of RUTAS_AFECTADAS) revalidatePath(ruta);
  return { ok: true, movimiento };
}

/** «Deshacer»: `DELETE /movimientos/:id`, registrado en la API (RN-13). */
export async function deshacerRegistro(id: string): Promise<ResultadoSimple> {
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

/** `POST /reglas`: el usuario aceptó la oferta de crear la regla (RN-11). */
export async function crearRegla(palabraClave: string, categoriaId: string): Promise<ResultadoSimple> {
  if (typeof palabraClave !== "string" || !esId(categoriaId)) return ENTRADA_INVALIDA;
  try {
    await captura.crearRegla(palabraClave, categoriaId);
  } catch (error) {
    const { codigo, mensaje } = fallo(error);
    return { ok: false, codigo, mensaje };
  }
  return { ok: true };
}

/** `PATCH /reglas/:id`: el usuario aceptó cambiar la regla que propuso. */
export async function ajustarRegla(id: string, categoriaId: string): Promise<ResultadoSimple> {
  if (!esId(id) || !esId(categoriaId)) return ENTRADA_INVALIDA;
  try {
    await captura.ajustarRegla(id, categoriaId);
  } catch (error) {
    const { codigo, mensaje } = fallo(error);
    return { ok: false, codigo, mensaje };
  }
  return { ok: true };
}
