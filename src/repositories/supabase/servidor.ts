/**
 * ÚNICO archivo del proyecto que construye un cliente de Supabase con
 * credenciales de usuario (RN-19).
 *
 * El cliente porta el token del usuario (cookies de sesión) y usa solo la
 * clave publicable, de modo que las políticas a nivel de fila evalúan al
 * usuario real (RN-12). La clave `service_role` jamás se usa aquí ni en
 * ningún punto del ciclo de petición (REGLAS §4).
 *
 * Dos variantes, mismo principio:
 * - `crearClienteServidor`: Server Components, server actions, route handlers.
 * - `crearClienteProxy`: el proxy (antes "middleware"), que opera sobre
 *   NextRequest/NextResponse en vez de `next/headers`.
 *
 * Si necesitas otro cliente con credenciales, se agrega aquí, no en otro archivo.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

export async function crearClienteServidor() {
  const almacen = await cookies();

  return createServerClient(env.supabaseUrl, env.supabasePublishableKey, {
    cookies: {
      getAll() {
        return almacen.getAll();
      },
      setAll(cookiesAEscribir) {
        try {
          for (const { name, value, options } of cookiesAEscribir) {
            almacen.set(name, value, options);
          }
        } catch {
          // Llamado desde un Server Component: no puede escribir cookies.
          // Es seguro ignorarlo porque el proxy refresca la sesión.
        }
      },
    },
  });
}

export function crearClienteProxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient(env.supabaseUrl, env.supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesAEscribir, headers) {
        for (const { name, value } of cookiesAEscribir) {
          request.cookies.set(name, value);
        }
        respuesta = NextResponse.next({ request });
        for (const { name, value, options } of cookiesAEscribir) {
          respuesta.cookies.set(name, value, options);
        }
        for (const [clave, valor] of Object.entries(headers)) {
          respuesta.headers.set(clave, valor);
        }
      },
    },
  });

  // La respuesta cambia cuando se refresca el token: se lee mediante función.
  return { supabase, obtenerRespuesta: () => respuesta };
}
