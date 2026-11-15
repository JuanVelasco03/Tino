/**
 * Lectura y validación de variables de entorno.
 *
 * Falla ruidosamente al importarse si falta alguna. Las referencias a
 * `process.env.NEXT_PUBLIC_*` son literales a propósito: Next solo las
 * sustituye en el bundle del navegador cuando se escriben así.
 *
 * REGLAS §4: ninguna variable con secreto lleva prefijo público. Hoy no hay
 * secretos; si aparece uno (p. ej. para mantenimiento), va SIN `NEXT_PUBLIC_`
 * y se lee solo en código de servidor.
 */

function requerida(nombre: string, valor: string | undefined): string {
  if (valor === undefined || valor.trim() === "") {
    throw new Error(
      `Falta la variable de entorno ${nombre}. Copia .env.example a .env.local y complétala.`,
    );
  }
  return valor.trim();
}

function urlValida(nombre: string, valor: string): string {
  try {
    new URL(valor);
  } catch {
    throw new Error(`La variable de entorno ${nombre} no es una URL válida: "${valor}".`);
  }
  return valor;
}

// Un secreto con prefijo público terminaría en el bundle del navegador.
// Solo se puede comprobar en el servidor (en el navegador `process.env` no se enumera).
if (typeof window === "undefined") {
  const filtradas = Object.keys(process.env).filter(
    (nombre) =>
      nombre.startsWith("NEXT_PUBLIC_") && /SERVICE_ROLE|SECRET|PRIVATE/i.test(nombre),
  );
  if (filtradas.length > 0) {
    throw new Error(
      `Secreto con prefijo público (se filtraría al navegador): ${filtradas.join(", ")}. Quita el prefijo NEXT_PUBLIC_.`,
    );
  }
}

export const env = {
  supabaseUrl: urlValida(
    "NEXT_PUBLIC_SUPABASE_URL",
    requerida("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  ),
  supabasePublishableKey: requerida(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ),
} as const;
