/**
 * Acceso a la tabla `perfiles`. Usa `crearClienteServidor()`: la política RLS
 * `perfiles_select_propio` garantiza que solo se lee el perfil del usuario
 * autenticado (RN-12).
 */
import type { Perfil } from "@/domain/perfil/perfil";
import { crearClienteServidor } from "./servidor";
import type { Tables } from "./tipos";

function aPerfil(fila: Tables<"perfiles">): Perfil {
  return {
    id: fila.id,
    nombre: fila.nombre,
    monedaBase: fila.moneda_base === "USD" ? "USD" : "COP",
    zonaHoraria: fila.zona_horaria,
    primerUsoCompletado: fila.primer_uso_completado,
  };
}

/** Perfil del usuario con sesión, o `null` si no tiene fila (p. ej. anterior a SPEC 02). */
export async function leerPerfilPropio(): Promise<Perfil | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("perfiles").select("*").maybeSingle();
  if (error || data === null) return null;
  return aPerfil(data as Tables<"perfiles">);
}
