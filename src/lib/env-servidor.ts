/**
 * Variables de entorno SOLO de servidor. Separadas de `env.ts` porque este
 * archivo nunca debe importarse desde un componente de cliente: sus valores
 * no llevan prefijo `NEXT_PUBLIC_` y en el navegador no existirían.
 */

function requerida(nombre: string): string {
  const valor = process.env[nombre];
  if (valor === undefined || valor.trim() === "") {
    throw new Error(
      `Falta la variable de entorno ${nombre}. Copia .env.example a .env.local y complétala.`,
    );
  }
  return valor.trim();
}

/** URL base de Tino API, sin barra final. */
export function urlApi(): string {
  const valor = requerida("TINO_API_URL");
  try {
    new URL(valor);
  } catch {
    throw new Error(`La variable de entorno TINO_API_URL no es una URL válida: "${valor}".`);
  }
  return valor.replace(/\/+$/, "");
}
