import { beforeEach, describe, expect, it, vi } from "vitest";

// La conversión es pura: el cliente HTTP (cookies, entorno) no participa.
vi.mock("./cliente", () => ({
  obtener: vi.fn(),
  enviar: vi.fn(),
  ErrorApi: class extends Error {},
}));

import { enviar, obtener } from "./cliente";
import {
  aListaMovimientos,
  aMovimiento,
  crearMovimiento,
  eliminarMovimiento,
  listarMovimientos,
  type ListaMovimientosDto,
  type MovimientoDto,
} from "./movimientos";

// Ejemplo JSON de `GET /movimientos` en Tino-API docs/api/movimientos.md.
const DIVIDIDO: MovimientoDto = {
  id: "3c2a0000-0000-4000-8000-000000000001",
  tipo: "gasto",
  monto: "30000",
  moneda: "COP",
  tasa: "1",
  fecha: "2026-11-19",
  descripcion: "Almuerzo y mercado",
  nota: null,
  cuentaOrigen: { id: "8f0e0000-0000-4000-8000-000000000002", nombre: "Nequi" },
  cuentaDestino: null,
  categoria: null,
  partes: [
    { categoria: { id: "bb9f", nombre: "Comida" }, monto: "20000" },
    { categoria: { id: "bb4e", nombre: "Mercado" }, monto: "10000" },
  ],
  creadoEn: "2026-11-19T17:02:11.104Z",
  actualizadoEn: "2026-11-19T17:02:11.104Z",
};

const TRANSFERENCIA: MovimientoDto = {
  ...DIVIDIDO,
  id: "3c2a0000-0000-4000-8000-000000000003",
  tipo: "transferencia",
  monto: "1200000",
  descripcion: "Pago tarjeta",
  cuentaDestino: { id: "7d2b", nombre: "Visa Oro" },
  partes: [],
};

beforeEach(() => {
  vi.mocked(obtener).mockReset();
  vi.mocked(enviar).mockReset();
});

describe("aMovimiento", () => {
  it("convierte el monto a bigint y marca el dividido", () => {
    expect(aMovimiento(DIVIDIDO)).toEqual({
      id: DIVIDIDO.id,
      tipo: "gasto",
      monto: 30000n,
      fecha: "2026-11-19",
      descripcion: "Almuerzo y mercado",
      cuentaOrigen: { id: "8f0e0000-0000-4000-8000-000000000002", nombre: "Nequi" },
      cuentaDestino: null,
      categoria: null,
      dividido: true,
    });
  });

  it("sin partes no está dividido; conserva ambos extremos de la transferencia", () => {
    const movimiento = aMovimiento(TRANSFERENCIA);
    expect(movimiento.dividido).toBe(false);
    expect(movimiento.cuentaOrigen?.nombre).toBe("Nequi");
    expect(movimiento.cuentaDestino?.nombre).toBe("Visa Oro");
  });

  it("montos por encima de 2^53 no pierden precisión", () => {
    expect(aMovimiento({ ...DIVIDIDO, monto: "9007199254740993" }).monto).toBe(9007199254740993n);
  });
});

describe("aListaMovimientos", () => {
  it("conserva el mes y el orden de la API", () => {
    const dto: ListaMovimientosDto = { mes: "2026-11", movimientos: [TRANSFERENCIA, DIVIDIDO] };
    const lista = aListaMovimientos(dto);
    expect(lista.mes).toBe("2026-11");
    expect(lista.movimientos.map((m) => m.id)).toEqual([TRANSFERENCIA.id, DIVIDIDO.id]);
  });

  it("mes vacío", () => {
    expect(aListaMovimientos({ mes: "2026-11", movimientos: [] })).toEqual({ mes: "2026-11", movimientos: [] });
  });
});

describe("llamadas", () => {
  it("listarMovimientos sin mes pide el mes actual", async () => {
    vi.mocked(obtener).mockResolvedValue({ mes: "2026-11", movimientos: [] });
    await listarMovimientos();
    expect(obtener).toHaveBeenCalledWith("/movimientos");
  });

  it("listarMovimientos con mes lo envía en la consulta", async () => {
    vi.mocked(obtener).mockResolvedValue({ mes: "2026-10", movimientos: [] });
    await listarMovimientos("2026-10");
    expect(obtener).toHaveBeenCalledWith("/movimientos?mes=2026-10");
  });

  it("crearMovimiento envía el cuerpo tal cual y convierte la respuesta", async () => {
    vi.mocked(enviar).mockResolvedValue(TRANSFERENCIA);
    const cuerpo = { tipo: "transferencia" as const, monto: "1200000", cuentaOrigenId: "a", cuentaDestinoId: "b" };
    const movimiento = await crearMovimiento(cuerpo);
    expect(enviar).toHaveBeenCalledWith("POST", "/movimientos", cuerpo);
    expect(movimiento.monto).toBe(1200000n);
  });

  it("eliminarMovimiento codifica el id", async () => {
    vi.mocked(enviar).mockResolvedValue(null);
    await eliminarMovimiento("3c2a/x");
    expect(enviar).toHaveBeenCalledWith("DELETE", "/movimientos/3c2a%2Fx");
  });
});
