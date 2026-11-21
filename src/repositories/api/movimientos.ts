import { enviar, ErrorApi, obtener } from "./cliente";

/*
 * Contrato de Tino API (docs/api/movimientos.md, Tino-API SPEC 04). Se copia,
 * no se redefine. Montos como string con un entero en unidades menores.
 */
export type TipoMovimiento = "gasto" | "ingreso" | "transferencia";

export type Ref = { id: string; nombre: string };

export type MovimientoDto = {
  id: string;
  tipo: TipoMovimiento;
  /** SIEMPRE positivo; el signo lo pone el cliente según `tipo`. */
  monto: string;
  moneda: "COP";
  /** Decimal como texto; hoy `"1"`. */
  tasa: string;
  /** `"YYYY-MM-DD"`, día contable del usuario. */
  fecha: string;
  descripcion: string | null;
  nota: string | null;
  cuentaOrigen: Ref | null;
  cuentaDestino: Ref | null;
  /** `null` y `partes` vacío = «sin clasificar». */
  categoria: Ref | null;
  partes: { categoria: Ref; monto: string }[];
  creadoEn: string;
  actualizadoEn: string;
};

export type ListaMovimientosDto = { mes: string; movimientos: MovimientoDto[] };

/** Cuerpo de `POST /movimientos`. */
export type MovimientoCuerpo = {
  tipo: TipoMovimiento;
  /** `^\d{1,19}$`, > 0. */
  monto: string;
  /** `"YYYY-MM-DD"`. Opcional en POST: hoy en la zona del usuario. */
  fecha?: string;
  /** ≤ 80; `""` = sin descripción. */
  descripcion?: string | null;
  /** ≤ 500; `""` = sin nota. */
  nota?: string | null;
  cuentaOrigenId?: string | null;
  cuentaDestinoId?: string | null;
  /** `null` o ausente = sin clasificar. */
  categoriaId?: string | null;
  partes?: { categoriaId: string; monto: string }[] | null;
};

/*
 * Modelo de la web. Monto en `bigint` (REGLAS §6). `dividido` = tiene partes;
 * el detalle de las partes llega con SPEC 06.
 */
export type Movimiento = {
  id: string;
  tipo: TipoMovimiento;
  /** Siempre positivo. */
  monto: bigint;
  /** `"YYYY-MM-DD"`. */
  fecha: string;
  descripcion: string | null;
  cuentaOrigen: Ref | null;
  cuentaDestino: Ref | null;
  categoria: Ref | null;
  dividido: boolean;
};

export type ListaMovimientos = {
  /** `"YYYY-MM"`, tal cual llega. */
  mes: string;
  /** En el orden de la API: fecha desc, el último registrado primero (N-06). */
  movimientos: Movimiento[];
};

/** String entero de la API → `bigint`. Sin pasar nunca por `number`. */
export function aMovimiento(dto: MovimientoDto): Movimiento {
  return {
    id: dto.id,
    tipo: dto.tipo,
    monto: BigInt(dto.monto),
    fecha: dto.fecha,
    descripcion: dto.descripcion,
    cuentaOrigen: dto.cuentaOrigen,
    cuentaDestino: dto.cuentaDestino,
    categoria: dto.categoria,
    dividido: dto.partes.length > 0,
  };
}

export function aListaMovimientos(dto: ListaMovimientosDto): ListaMovimientos {
  return { mes: dto.mes, movimientos: dto.movimientos.map(aMovimiento) };
}

/** `GET /movimientos`: sin `mes`, el mes actual en la zona del usuario. */
export async function listarMovimientos(mes?: string): Promise<ListaMovimientos> {
  const ruta = mes === undefined ? "/movimientos" : `/movimientos?mes=${encodeURIComponent(mes)}`;
  const dto = await obtener<ListaMovimientosDto>(ruta);
  if (!dto) throw new ErrorApi(404, "ERROR_INTERNO", "Tino API no encontró /movimientos.");
  return aListaMovimientos(dto);
}

/** `POST /movimientos` → `201 MovimientoDto`. */
export async function crearMovimiento(cuerpo: MovimientoCuerpo): Promise<Movimiento> {
  const dto = await enviar<MovimientoDto>("POST", "/movimientos", cuerpo);
  if (!dto) throw new ErrorApi(500, "ERROR_INTERNO", "Tino API no devolvió el movimiento.");
  return aMovimiento(dto);
}

/** `DELETE /movimientos/:id`. «Deshacer» un registro es esta misma llamada (RN-13). */
export async function eliminarMovimiento(id: string): Promise<void> {
  await enviar<null>("DELETE", `/movimientos/${encodeURIComponent(id)}`);
}
