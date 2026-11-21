import { enviar, ErrorApi } from "./cliente";
import type { CategoriaDto } from "./captura";

/* Contrato de Tino API (docs/api/reglas.md, Tino-API SPEC 04). */
export type ReglaDto = {
  id: string;
  /** Normalizada: minúsculas, sin tildes, espacios colapsados. */
  palabraClave: string;
  categoria: CategoriaDto;
};

function reglaDe(dto: ReglaDto | null): ReglaDto {
  if (!dto) throw new ErrorApi(500, "ERROR_INTERNO", "Tino API no devolvió la regla.");
  return dto;
}

/** `POST /reglas`: la que se ofreció cuando no hubo propuesta (RN-11). */
export async function crearRegla(palabraClave: string, categoriaId: string): Promise<ReglaDto> {
  return reglaDe(await enviar<ReglaDto>("POST", "/reglas", { palabraClave, categoriaId }));
}

/** `PATCH /reglas/:id`: cambia la categoría de la regla que propuso (`propuesta.regla.id`). */
export async function ajustarRegla(id: string, categoriaId: string): Promise<ReglaDto> {
  return reglaDe(await enviar<ReglaDto>("PATCH", `/reglas/${encodeURIComponent(id)}`, { categoriaId }));
}
