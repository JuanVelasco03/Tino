import { leerPerfilPropio, type Perfil } from "@/repositories/api/perfil";

export type { Perfil };

export async function obtenerPerfil(): Promise<Perfil | null> {
  return leerPerfilPropio();
}
