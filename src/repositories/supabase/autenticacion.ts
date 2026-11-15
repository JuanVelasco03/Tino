/**
 * Acceso a Supabase Auth. Solo obtiene el cliente con `crearClienteServidor()`
 * y devuelve el código de error de Supabase sin traducir: traducir es del servicio.
 */
import { crearClienteServidor } from "./servidor";

/** `codigo` es el `error.code` de Supabase; `"desconocido"` si no trae uno (p. ej. fallo de red). */
export type ResultadoAuth = { error: null } | { error: { codigo: string } };

/** Tipos de enlace de correo que Tino acepta confirmar. */
export type TipoEnlace = "email" | "signup";

function aResultado(error: { code?: string } | null): ResultadoAuth {
  return error === null ? { error: null } : { error: { codigo: error.code ?? "desconocido" } };
}

export async function iniciarSesion(correo: string, contrasena: string): Promise<ResultadoAuth> {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email: correo, password: contrasena });
  return aResultado(error);
}

export async function registrar(
  correo: string,
  contrasena: string,
  urlConfirmacion: string,
): Promise<ResultadoAuth> {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signUp({
    email: correo,
    password: contrasena,
    options: { emailRedirectTo: urlConfirmacion },
  });
  return aResultado(error);
}

export async function verificarEnlace(
  tokenHash: string,
  tipo: TipoEnlace,
): Promise<ResultadoAuth> {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo });
  return aResultado(error);
}

/** `true` si la petición porta una sesión válida (cookies de Supabase). */
export async function haySesion(): Promise<boolean> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getClaims();
  return Boolean(data?.claims);
}

export async function cerrarSesion(): Promise<ResultadoAuth> {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signOut();
  return aResultado(error);
}
