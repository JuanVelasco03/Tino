import { enviar, ErrorApi, obtener } from "./cliente";

/*
 * Contrato de Tino API (docs/api/cuentas.md, Tino-API SPEC 03). Se copia, no se
 * redefine. Montos como string con un entero en unidades menores.
 */
export type TipoCuenta = "efectivo" | "banco" | "tarjeta_credito";
export type Naturaleza = "activo" | "pasivo";

export type CuentaDto = {
  id: string;
  nombre: string;
  tipo: TipoCuenta;
  naturaleza: Naturaleza;
  detalle: string | null;
  saldo: string;
  saldoInicial: string;
  tarjeta: { cupo: string; disponible: string; porcentajeUsado: number } | null;
  archivadaEn: string | null;
};

export type GrupoCuentasDto = {
  total: string;
  cuentas: CuentaDto[];
};

export type ListaCuentasDto = {
  fechaSaldos: string;
  activos: GrupoCuentasDto;
  pasivos: GrupoCuentasDto;
  patrimonioNeto: string;
};

/*
 * Modelo de la web. Todo monto en `bigint` (REGLAS §6). No se recalcula nada:
 * totales, disponible, porcentaje y patrimonio vienen de la API (REGLAS §5).
 */
export type Cuenta = {
  id: string;
  nombre: string;
  tipo: TipoCuenta;
  naturaleza: Naturaleza;
  detalle: string | null;
  /** En un pasivo, la deuda, positiva. */
  saldo: bigint;
  tarjeta: { cupo: bigint; disponible: bigint; porcentajeUsado: number } | null;
};

export type GrupoCuentas = { total: bigint; cuentas: Cuenta[] };

export type ListaCuentas = {
  /** `"YYYY-MM-DD"`, tal cual llega. */
  fechaSaldos: string;
  activos: GrupoCuentas;
  pasivos: GrupoCuentas;
  /** Ya con su signo. */
  patrimonioNeto: bigint;
};

/** String entero de la API → `bigint`. Sin pasar nunca por `number`. */
function aMonto(valor: string): bigint {
  return BigInt(valor);
}

function aCuenta(dto: CuentaDto): Cuenta {
  return {
    id: dto.id,
    nombre: dto.nombre,
    tipo: dto.tipo,
    naturaleza: dto.naturaleza,
    detalle: dto.detalle,
    saldo: aMonto(dto.saldo),
    tarjeta: dto.tarjeta && {
      cupo: aMonto(dto.tarjeta.cupo),
      disponible: aMonto(dto.tarjeta.disponible),
      porcentajeUsado: dto.tarjeta.porcentajeUsado,
    },
  };
}

function aGrupo(dto: GrupoCuentasDto): GrupoCuentas {
  // El orden del arreglo es el del usuario: no se reordena (N-25, N-28).
  return { total: aMonto(dto.total), cuentas: dto.cuentas.map(aCuenta) };
}

export function aListaCuentas(dto: ListaCuentasDto): ListaCuentas {
  return {
    fechaSaldos: dto.fechaSaldos,
    activos: aGrupo(dto.activos),
    pasivos: aGrupo(dto.pasivos),
    patrimonioNeto: aMonto(dto.patrimonioNeto),
  };
}

/** `GET /cuentas`: cuentas no archivadas, agrupadas, con totales y patrimonio. */
export async function listarCuentas(): Promise<ListaCuentas> {
  const dto = await obtener<ListaCuentasDto>("/cuentas");
  if (!dto) throw new ErrorApi(404, "ERROR_INTERNO", "Tino API no encontró /cuentas.");
  return aListaCuentas(dto);
}

/** `PUT /cuentas/orden`: guarda el orden completo de un grupo. Atómico en la API. */
export async function guardarOrdenGrupo(naturaleza: Naturaleza, ids: string[]): Promise<void> {
  await enviar<null>("PUT", "/cuentas/orden", { naturaleza, ids });
}
