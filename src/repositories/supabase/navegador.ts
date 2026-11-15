/**
 * Cliente de Supabase para componentes de cliente.
 *
 * Solo la clave publicable; no porta credenciales de servicio. Su uso
 * previsto es acotado (p. ej. iniciar sesión con Google). Los componentes
 * NO leen ni escriben datos financieros con este cliente: eso pasa por
 * servicios → repositorios en el servidor (REGLAS §5).
 */
import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export function crearClienteNavegador() {
  return createBrowserClient(env.supabaseUrl, env.supabasePublishableKey);
}
