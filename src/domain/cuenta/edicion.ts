/**
 * Formulario de alta y edición de cuentas: valores tecleados y cálculo de lo
 * que cambió. Funciones puras, sin `number` para los montos.
 */
import { aDigitos } from "../dinero/entrada";

/** Tipos que la API acepta hoy en el alta y la edición. */
export type TipoEditable = "efectivo" | "banco" | "tarjeta_credito";

/** Valores del formulario, controlados en el cliente. Los montos son lo tecleado, ya formateado. */
export type ValoresCuenta = {
  nombre: string;
  tipo: TipoEditable;
  detalle: string;
  /** `"1.284.300"`. */
  saldo: string;
  /** `""` si no es tarjeta. */
  cupo: string;
};

export type CampoCuenta = "nombre" | "tipo" | "detalle" | "saldo" | "cupo";

/** Lo que `cambiosEdicion` lee de una cuenta. `Cuenta` de la web lo cumple. */
export type CuentaEditable = {
  nombre: string;
  tipo: TipoEditable;
  detalle: string | null;
  saldoInicial: bigint;
  tarjeta: { cupo: bigint } | null;
};

/**
 * Cambios para `PATCH /cuentas/:id`, con la forma de `EdicionCuenta` del
 * contrato (montos como string entero).
 */
export type CambiosCuenta = {
  nombre?: string;
  tipo?: TipoEditable;
  detalle?: string | null;
  saldoInicial?: string;
  cupo?: string;
};

/**
 * Monto tecleado frente al guardado. Un campo vacío vale 0 (C4 lo muestra
 * como «0»). Si no es un monto válido, se devuelve tal cual: la server
 * action lo rechaza bajo su campo.
 */
function montoCambiado(tecleado: string, guardado: bigint): string | null {
  const digitos = tecleado.trim() === "" ? "0" : aDigitos(tecleado);
  if (digitos === null) return tecleado;
  return digitos === guardado.toString() ? null : digitos;
}

/**
 * Solo los campos que cambiaron respecto a `cuenta`; `null` si nada cambió.
 * Nombre y detalle se comparan recortados; un detalle vacío equivale a `null`.
 * `cupo` solo cuenta si la cuenta es tarjeta.
 */
export function cambiosEdicion(cuenta: CuentaEditable, valores: ValoresCuenta): CambiosCuenta | null {
  const cambios: CambiosCuenta = {};

  const nombre = valores.nombre.trim();
  if (nombre !== cuenta.nombre) cambios.nombre = nombre;

  if (valores.tipo !== cuenta.tipo) cambios.tipo = valores.tipo;

  const detalle = valores.detalle.trim() === "" ? null : valores.detalle.trim();
  if (detalle !== cuenta.detalle) cambios.detalle = detalle;

  const saldoInicial = montoCambiado(valores.saldo, cuenta.saldoInicial);
  if (saldoInicial !== null) cambios.saldoInicial = saldoInicial;

  if (cuenta.tarjeta) {
    const cupo = montoCambiado(valores.cupo, cuenta.tarjeta.cupo);
    if (cupo !== null) cambios.cupo = cupo;
  }

  return Object.keys(cambios).length === 0 ? null : cambios;
}
