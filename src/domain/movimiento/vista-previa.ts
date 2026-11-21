/**
 * Presentación de un movimiento: vista previa del saldo y signo en la lista.
 * Es solo presentación; el saldo vigente lo da `GET /cuentas` (RN-01).
 */
import { efectoEnSaldo, type Sentido, type TipoCuenta } from "../cuenta/naturaleza";
import type { TipoMovimiento } from "./cuerpo";

/**
 * Saldo de la cuenta tras el movimiento: `saldo + efectoEnSaldo` (RN-02).
 * En un pasivo, el saldo es la deuda: un gasto la sube, un ingreso la baja.
 */
export function saldoResultante(cuenta: { tipo: TipoCuenta; saldo: bigint }, sentido: Sentido, monto: bigint): bigint {
  return cuenta.saldo + efectoEnSaldo(cuenta.tipo, sentido, monto);
}

/**
 * Importe con signo leído desde el patrimonio: gasto negativo, ingreso
 * positivo; transferencia `null` (sin signo, no cambia el patrimonio). Coincide
 * con `efectoEnPatrimonio` para cualquier tipo de cuenta, así que la fila no
 * necesita saber de qué cuenta sale.
 */
export function importeEnPatrimonio(tipo: TipoMovimiento, monto: bigint): bigint | null {
  switch (tipo) {
    case "gasto":
      return -monto;
    case "ingreso":
      return monto;
    case "transferencia":
      return null;
  }
}
