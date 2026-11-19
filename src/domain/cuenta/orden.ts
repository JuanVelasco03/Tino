/**
 * Orden de las cuentas dentro de un grupo, para el modo «Ordenar».
 * Funciones puras: nunca mutan la entrada.
 */

/**
 * Devuelve un arreglo nuevo con `id` en la posición `destino`, acotada a los
 * límites del arreglo. Si `id` no está, devuelve una copia igual.
 */
export function moverA(ids: readonly string[], id: string, destino: number): string[] {
  const origen = ids.indexOf(id);
  if (origen === -1) return [...ids];

  const resto = ids.filter((_, i) => i !== origen);
  const posicion = Math.max(0, Math.min(destino, resto.length));
  resto.splice(posicion, 0, id);
  return resto;
}

/** `true` si `actual` tiene otro orden (o elementos) que `original`. */
export function ordenCambio(original: readonly string[], actual: readonly string[]): boolean {
  if (original.length !== actual.length) return true;
  return original.some((id, i) => id !== actual[i]);
}
