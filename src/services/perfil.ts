import type { Perfil } from "@/domain/perfil/perfil";
import { leerPerfilPropio } from "@/repositories/supabase/perfiles";

export async function obtenerPerfil(): Promise<Perfil | null> {
  return leerPerfilPropio();
}
