/**
 * Montos tecleados en pesos con formato colombiano (`1.284.300`). La API los
 * recibe como string entero (`"1284300"`). Todo con strings y `bigint`: nunca
 * pasa por `number` (REGLAS §6).
 */
import { formatearDinero } from "./formato";

/** Máximo de dígitos que admite la API (`^\d{1,19}$`). */
const MAX_DIGITOS = 19;

function sinCerosIzquierda(digitos: string): string {
  return digitos.replace(/^0+(?=\d)/, "");
}

function agruparMiles(digitos: string): string {
  return digitos.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Formatea lo tecleado: `"1284300"` → `"1.284.300"`. Descarta lo que no es dígito; `""` sigue vacío. */
export function formatearEntradaPesos(texto: string): string {
  const digitos = texto.replace(/\D/g, "");
  if (digitos === "") return "";
  return agruparMiles(sinCerosIzquierda(digitos));
}

/**
 * Lo tecleado como string entero para la API: `"1.284.300"` → `"1284300"`.
 * Solo admite dígitos y puntos de miles. `""`, decimales, signos o más de
 * 19 dígitos → `null`.
 */
export function aDigitos(texto: string): string | null {
  const sinPuntos = texto.trim().replace(/\./g, "");
  if (!/^\d+$/.test(sinPuntos)) return null;
  const digitos = sinCerosIzquierda(sinPuntos);
  return digitos.length > MAX_DIGITOS ? null : digitos;
}

/** Monto para precargar un campo: `1284300n` → `"1.284.300"`. */
export function desdeMonto(monto: bigint): string {
  return formatearDinero({ monto, moneda: "COP" }, { omitirCOP: true });
}

/** Tecla del teclado numérico propio (móvil). */
export type TeclaNumerica = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "000" | "borrar";

/**
 * Aplica una tecla a lo tecleado (`"1.500"`) y devuelve el nuevo valor
 * formateado. Ignora los ceros a la izquierda (`0` o `000` sobre vacío no
 * escriben nada) y no pasa de 19 dígitos. `borrar` quita el último dígito.
 */
export function aplicarTecla(valor: string, tecla: TeclaNumerica): string {
  const digitos = valor.replace(/\D/g, "");
  if (tecla === "borrar") return formatearEntradaPesos(digitos.slice(0, -1));

  const siguiente = sinCerosIzquierda(`${digitos}${tecla}`).replace(/^0+$/, "");
  if (siguiente.length > MAX_DIGITOS) return valor;
  return formatearEntradaPesos(siguiente);
}
