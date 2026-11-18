/**
 * Cliente HTTP de Tino API. ÚNICO punto de la web que habla con la API.
 *
 * Toma el token de la sesión de Supabase (cookies) y lo envía en
 * `Authorization: Bearer`. La API verifica el token y las políticas RLS
 * evalúan al usuario real (RN-12, RN-19). La web no toca tablas.
 */
import { urlApi } from "@/lib/env-servidor";
import { crearClienteServidor } from "../supabase/servidor";

export class ErrorApi extends Error {
  constructor(
    readonly estado: number,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

/** Token de la sesión actual, o `null` si no hay sesión. La API lo verifica; aquí solo se reenvía. */
async function tokenDeSesion(): Promise<string | null> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * GET autenticado. Devuelve `null` si la API responde 404.
 * Lanza `ErrorApi` ante cualquier otro estado no exitoso.
 */
export async function obtener<T>(ruta: string): Promise<T | null> {
  const token = await tokenDeSesion();
  if (!token) throw new ErrorApi(401, "Sin sesión.");

  const respuesta = await fetch(`${urlApi()}${ruta}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store", // datos financieros por usuario: nunca en caché compartida
  });

  if (respuesta.status === 404) return null;
  if (!respuesta.ok) throw new ErrorApi(respuesta.status, `Tino API respondió ${respuesta.status}.`);
  return (await respuesta.json()) as T;
}
