import { redirect } from "next/navigation";
import { ErrorApi } from "@/repositories/api/cliente";
import { actualizarPerfil, leerPerfilPropio, type EdicionPerfil, type Perfil } from "@/repositories/api/perfil";

export type { EdicionPerfil, Perfil };

export async function obtenerPerfil(): Promise<Perfil | null> {
  return leerPerfilPropio();
}

/** Cuenta predeterminada de la captura (`PATCH /perfil`). Token vencido → `/login`. */
export async function elegirPredeterminada(cuentaId: string): Promise<Perfil> {
  try {
    return await actualizarPerfil({ cuentaPredeterminadaId: cuentaId });
  } catch (error) {
    if (error instanceof ErrorApi && error.estado === 401) redirect("/login");
    throw error;
  }
}
