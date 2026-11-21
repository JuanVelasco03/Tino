/**
 * Formulario de captura: valores tecleados y cuerpo de `POST /movimientos`.
 * Funciones puras, sin `number` para los montos (REGLAS §6). Los tipos tienen
 * la forma del contrato de Tino API (docs/api/movimientos.md, captura.md);
 * el dominio no importa `repositories/`.
 */
import { aDigitos } from "../dinero/entrada";
import { errorPartes, type ValorParte } from "./partes";

export type { ValorParte };

export type TipoMovimiento = "gasto" | "ingreso" | "transferencia";

/** `CategoriaDto` del contrato. La transferencia no tiene categorías (RN-05). */
export type Categoria = { id: string; nombre: string; tipo: "gasto" | "ingreso" };

/** `SugerenciasDto["propuesta"]`: la regla de texto que coincide con la descripción (RN-11). */
export type Propuesta = { categoria: Categoria; regla: { id: string; palabraClave: string } };

/** Lo que decidió el usuario sobre la categoría. */
export type DecisionCategoria =
  /** Sin tocar: vale la propuesta de la regla, si hay. */
  | { modo: "propuesta" }
  | { modo: "elegida"; id: string }
  /** Tocó la propuesta para quitarla: se registra sin clasificar. */
  | { modo: "quitada" };

/** Estado del formulario, en el cliente. */
export type ValoresCaptura = {
  tipo: TipoMovimiento;
  /** Lo tecleado ya formateado: `"15.000"`. */
  monto: string;
  descripcion: string;
  categoria: DecisionCategoria;
  /** Gasto: origen · ingreso: destino · transferencia: origen. */
  cuentaId: string | null;
  /** Solo transferencia. */
  destinoId: string | null;
  /** `"YYYY-MM-DD"`; por defecto `captura.fechaHoy`. `""` mientras no llega: la API pone hoy. */
  fecha: string;
  nota: string;
  /** `null` = sin dividir. Nunca en transferencia (RN-05). */
  partes: ValorParte[] | null;
};

export type CampoCaptura = "tipo" | "monto" | "descripcion" | "categoria" | "cuenta" | "destino" | "fecha" | "nota" | "partes";

/** `MovimientoCuerpo` del contrato. */
export type CuerpoMovimiento = {
  tipo: TipoMovimiento;
  /** `^\d{1,19}$`, > 0. */
  monto: string;
  fecha?: string;
  descripcion: string | null;
  nota: string | null;
  cuentaOrigenId?: string | null;
  cuentaDestinoId?: string | null;
  categoriaId?: string | null;
  partes?: { categoriaId: string; monto: string }[] | null;
};

/**
 * Categoría que se registrará: elegida > propuesta > ninguna. La propuesta
 * solo vale si es del tipo del movimiento; en transferencia, nunca hay.
 */
export function categoriaEfectiva(valores: Pick<ValoresCaptura, "tipo" | "categoria">, propuesta: Propuesta | null): string | null {
  if (valores.tipo === "transferencia") return null;
  switch (valores.categoria.modo) {
    case "elegida":
      return valores.categoria.id;
    case "quitada":
      return null;
    case "propuesta":
      return propuesta && propuesta.categoria.tipo === valores.tipo ? propuesta.categoria.id : null;
  }
}

/** Monto tecleado como string entero > 0, o `null`. */
export function montoValido(monto: string): string | null {
  const digitos = aDigitos(monto);
  return digitos === null || digitos === "0" ? null : digitos;
}

function textoONulo(texto: string): string | null {
  const recortado = texto.trim();
  return recortado === "" ? null : recortado;
}

/** Partes del cuerpo, o `null` si no son válidas (`errorPartes`): cada una con categoría y entero > 0. */
function partesDelCuerpo(total: string, partes: readonly ValorParte[]): { categoriaId: string; monto: string }[] | null {
  if (errorPartes(BigInt(total), partes) !== null) return null;
  const cuerpo: { categoriaId: string; monto: string }[] = [];
  for (const parte of partes) {
    const monto = montoValido(parte.monto);
    if (parte.categoriaId === null || monto === null) return null;
    cuerpo.push({ categoriaId: parte.categoriaId, monto });
  }
  return cuerpo;
}

/**
 * Cuerpo de `POST /movimientos` (o `PUT`) desde el formulario, o `null` si el
 * monto o las partes no son válidos. Gasto: `cuentaOrigenId`. Ingreso:
 * `cuentaDestinoId`. Transferencia: ambos, nunca `categoriaId` ni `partes`
 * (RN-03, RN-05). Con partes, nunca `categoriaId` (`PARTES_CON_CATEGORIA`).
 */
export function cuerpoDesdeValores(valores: ValoresCaptura, propuesta: Propuesta | null): CuerpoMovimiento | null {
  const monto = montoValido(valores.monto);
  if (monto === null) return null;

  const cuerpo: CuerpoMovimiento = {
    tipo: valores.tipo,
    monto,
    descripcion: textoONulo(valores.descripcion),
    nota: textoONulo(valores.nota),
  };
  if (valores.fecha !== "") cuerpo.fecha = valores.fecha;

  if (valores.tipo === "transferencia") {
    cuerpo.cuentaOrigenId = valores.cuentaId;
    cuerpo.cuentaDestinoId = valores.destinoId;
    return cuerpo;
  }

  if (valores.tipo === "gasto") cuerpo.cuentaOrigenId = valores.cuentaId;
  else cuerpo.cuentaDestinoId = valores.cuentaId;

  if (valores.partes !== null) {
    const partes = partesDelCuerpo(monto, valores.partes);
    if (partes === null) return null;
    cuerpo.partes = partes;
  } else {
    cuerpo.categoriaId = categoriaEfectiva(valores, propuesta);
  }
  return cuerpo;
}
