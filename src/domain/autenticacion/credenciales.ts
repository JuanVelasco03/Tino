/**
 * Validación de credenciales de acceso. Pura: sin HTTP ni Supabase.
 * Supabase aplica además sus propias reglas; esta es la primera barrera.
 */

export type ErrorCredenciales =
  | "correo_invalido"
  | "contrasena_corta" // < 8 caracteres
  | "contrasenas_distintas"; // solo registro

export type ResultadoValidacion =
  | { ok: true; correo: string } // correo normalizado: trim + minúsculas
  | { ok: false; errores: ErrorCredenciales[] };

export const LARGO_MINIMO_CONTRASENA = 8;

// Forma básica: algo@algo.algo, sin espacios. La verificación real es el correo de confirmación.
const FORMA_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizarCorreo(correo: string): string {
  return correo.trim().toLowerCase();
}

function errores(correo: string, contrasena: string): ErrorCredenciales[] {
  const lista: ErrorCredenciales[] = [];
  if (!FORMA_CORREO.test(correo)) lista.push("correo_invalido");
  if (contrasena.length < LARGO_MINIMO_CONTRASENA) lista.push("contrasena_corta");
  return lista;
}

export function validarCredenciales(correo: string, contrasena: string): ResultadoValidacion {
  const normalizado = normalizarCorreo(correo);
  const lista = errores(normalizado, contrasena);
  return lista.length === 0 ? { ok: true, correo: normalizado } : { ok: false, errores: lista };
}

export function validarRegistro(
  correo: string,
  contrasena: string,
  confirmacion: string,
): ResultadoValidacion {
  const normalizado = normalizarCorreo(correo);
  const lista = errores(normalizado, contrasena);
  if (contrasena !== confirmacion) lista.push("contrasenas_distintas");
  return lista.length === 0 ? { ok: true, correo: normalizado } : { ok: false, errores: lista };
}
