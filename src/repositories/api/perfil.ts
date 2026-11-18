import { obtener } from "./cliente";

/** Contrato de `GET /perfil` en Tino API. El modelo vive en la API. */
export type Perfil = {
  id: string;
  nombre: string | null;
  monedaBase: "COP" | "USD";
  zonaHoraria: string;
  primerUsoCompletado: boolean;
};

/** Perfil del usuario con sesión, o `null` si no tiene fila (p. ej. anterior a SPEC 02). */
export function leerPerfilPropio(): Promise<Perfil | null> {
  return obtener<Perfil>("/perfil");
}
