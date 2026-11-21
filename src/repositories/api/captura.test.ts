import { beforeEach, describe, expect, it, vi } from "vitest";

// La conversión es pura: el cliente HTTP (cookies, entorno) no participa.
vi.mock("./cliente", () => ({
  obtener: vi.fn(),
  enviar: vi.fn(),
  ErrorApi: class extends Error {},
}));

import { obtener } from "./cliente";
import { aCaptura, leerSugerencias, type CapturaDto } from "./captura";

// Ejemplo JSON de `GET /captura` en Tino-API docs/api/captura.md.
const CAPTURA: CapturaDto = {
  fechaHoy: "2026-11-19",
  cuentaPredeterminadaId: "8f0e0000-0000-4000-8000-000000000002",
  categorias: {
    gasto: [
      { id: "bb9f", nombre: "Comida", tipo: "gasto" },
      { id: "c1d2", nombre: "Transporte", tipo: "gasto" },
    ],
    ingreso: [{ id: "a7e3", nombre: "Salario", tipo: "ingreso" }],
  },
  gastosHoy: "45000",
  conceptosFrecuentes: { gasto: ["Almuerzo", "Tinto", "Pasaje"], ingreso: [], transferencia: [] },
};

beforeEach(() => {
  vi.mocked(obtener).mockReset();
});

describe("aCaptura", () => {
  it("convierte gastosHoy a bigint y conserva el resto", () => {
    expect(aCaptura(CAPTURA)).toEqual({ ...CAPTURA, gastosHoy: 45000n });
  });

  it("conserva el orden de categorías y conceptos", () => {
    const captura = aCaptura(CAPTURA);
    expect(captura.categorias.gasto.map((c) => c.nombre)).toEqual(["Comida", "Transporte"]);
    expect(captura.conceptosFrecuentes.gasto).toEqual(["Almuerzo", "Tinto", "Pasaje"]);
  });

  it("usuario sin cuentas ni movimientos", () => {
    const vacia: CapturaDto = {
      ...CAPTURA,
      cuentaPredeterminadaId: null,
      gastosHoy: "0",
      conceptosFrecuentes: { gasto: [], ingreso: [], transferencia: [] },
    };
    expect(aCaptura(vacia)).toMatchObject({ cuentaPredeterminadaId: null, gastosHoy: 0n });
  });
});

describe("leerSugerencias", () => {
  it("codifica tipo y texto en la consulta", async () => {
    vi.mocked(obtener).mockResolvedValue({ conceptos: [], propuesta: null });
    await leerSugerencias("gasto", "café & pan");
    expect(obtener).toHaveBeenCalledWith("/sugerencias?tipo=gasto&texto=caf%C3%A9+%26+pan");
  });
});
