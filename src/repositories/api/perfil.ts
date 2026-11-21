import { enviar, ErrorApi, obtener } from "./cliente";

/** Contrato de `GET /perfil` en Tino API (docs/api/perfil.md). El modelo vive en la API. */
export type Perfil = {
  id: string;
  nombre: string | null;
  monedaBase: "COP" | "USD";
  /** IANA. */
  zonaHoraria: string;
  primerUsoCompletado: boolean;
  /** La elegida, tal cual (puede estar archivada). La que va al formulario la resuelve `GET /captura`. */
  cuentaPredeterminadaId: string | null;
};

/** Cuerpo de `PATCH /perfil`. `null` quita la predeterminada. */
export type EdicionPerfil = { cuentaPredeterminadaId: string | null };

/** Perfil del usuario con sesión, o `null` si no tiene fila (p. ej. anterior a SPEC 02). */
export function leerPerfilPropio(): Promise<Perfil | null> {
  return obtener<Perfil>("/perfil");
}

/** `PATCH /perfil` → `200 Perfil`. */
export async function actualizarPerfil(edicion: EdicionPerfil): Promise<Perfil> {
  const perfil = await enviar<Perfil>("PATCH", "/perfil", edicion);
  if (!perfil) throw new ErrorApi(500, "ERROR_INTERNO", "Tino API no devolvió el perfil.");
  return perfil;
}
