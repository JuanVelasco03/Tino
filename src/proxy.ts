/**
 * Proxy (en Next.js 16 reemplaza a `middleware.ts`): refresca la sesión de
 * Supabase y protege las rutas privadas.
 *
 * Es solo una comprobación optimista. La autorización real son las
 * políticas a nivel de fila (RN-12), no este archivo.
 */
import { NextResponse, type NextRequest } from "next/server";
import { crearClienteProxy } from "@/repositories/supabase/servidor";

// Todo lo demás es privado. /estilos es la referencia viva del sistema de diseño: no toca datos.
const RUTAS_PUBLICAS = ["/login", "/registro", "/auth", "/estilos"];

// Con sesión iniciada no tienen sentido: se redirige a `/`.
const RUTAS_DE_ACCESO = ["/login", "/registro"];

function esPublica(ruta: string): boolean {
  return RUTAS_PUBLICAS.some((p) => ruta === p || ruta.startsWith(`${p}/`));
}

function esDeAcceso(ruta: string): boolean {
  return RUTAS_DE_ACCESO.includes(ruta);
}

/** Redirige conservando las cookies de sesión que el refresco haya escrito. */
function redirigir(destino: URL, cookies: ReturnType<typeof NextResponse.next>["cookies"]) {
  const redireccion = NextResponse.redirect(destino);
  for (const cookie of cookies.getAll()) {
    redireccion.cookies.set(cookie);
  }
  return redireccion;
}

export async function proxy(request: NextRequest) {
  const { supabase, obtenerRespuesta } = crearClienteProxy(request);

  // Debe llamarse antes de generar la respuesta: dispara el refresco del token.
  const { data } = await supabase.auth.getClaims();
  const autenticado = Boolean(data?.claims);

  const ruta = request.nextUrl.pathname;

  if (!autenticado && !esPublica(ruta)) {
    return redirigir(new URL("/login", request.url), obtenerRespuesta().cookies);
  }

  if (autenticado && esDeAcceso(ruta)) {
    return redirigir(new URL("/", request.url), obtenerRespuesta().cookies);
  }

  return obtenerRespuesta();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
