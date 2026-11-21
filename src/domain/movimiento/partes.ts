/**
 * Dividir un movimiento entre categorías (N-41, N-42, N-43). Misma regla que
 * la API, para no enviar una petición que se sabe fallida; la API sigue
 * validando. Montos con strings y `bigint`, nunca `number` (REGLAS §6).
 */
import { aDigitos } from "../dinero/entrada";

/** Una parte en el formulario. */
export type ValorParte = {
  /** `null` mientras no se elige. */
  categoriaId: string | null;
  /** Lo tecleado ya formateado: `"20.000"`. */
  monto: string;
};

/** Monto de una parte; sin monto (o mal escrito) cuenta como 0. */
export function montoParte(parte: ValorParte): bigint {
  const digitos = aDigitos(parte.monto);
  return digitos === null ? 0n : BigInt(digitos);
}

/** Lo que falta por asignar: `> 0` falta, `< 0` sobra, `0` cuadra. */
export function restante(total: bigint, partes: readonly ValorParte[]): bigint {
  return partes.reduce((resto, parte) => resto - montoParte(parte), total);
}

/** Textos del catálogo de la API (docs/api/movimientos.md). */
export const ERRORES_PARTES = {
  insuficientes: "Divide en al menos dos partes.",
  sinCategoria: "Elige la categoría de cada parte.",
  repetidas: "Cada parte debe tener una categoría distinta.",
  monto: "Escribe un monto mayor que cero.",
  noSuman: "Las partes deben sumar el monto total.",
} as const;

/**
 * Primer error de las partes, en el orden de la API: al menos dos; después,
 * parte por parte, categoría, monto > 0 y categoría no repetida; al final,
 * que sumen el total. `null` si son válidas.
 */
export function errorPartes(total: bigint, partes: readonly ValorParte[]): string | null {
  if (partes.length < 2) return ERRORES_PARTES.insuficientes;

  const vistas = new Set<string>();
  for (const parte of partes) {
    if (parte.categoriaId === null) return ERRORES_PARTES.sinCategoria;
    if (montoParte(parte) <= 0n) return ERRORES_PARTES.monto;
    if (vistas.has(parte.categoriaId)) return ERRORES_PARTES.repetidas;
    vistas.add(parte.categoriaId);
  }

  return restante(total, partes) === 0n ? null : ERRORES_PARTES.noSuman;
}
