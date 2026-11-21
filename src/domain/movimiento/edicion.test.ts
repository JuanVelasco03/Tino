import { describe, expect, it } from "vitest";
import type { ValoresCaptura } from "./cuerpo";
import { cuentaArchivada, hayCambios, valoresDesdeMovimiento, type Movimiento } from "./edicion";

const NEQUI = { id: "c-nequi", nombre: "Nequi" };
const VISA = { id: "c-visa", nombre: "Visa Oro" };
const BANCO = { id: "c-banco", nombre: "Bancolombia" };
const COMIDA = { id: "k-comida", nombre: "Comida" };
const MERCADO = { id: "k-mercado", nombre: "Mercado" };

const GASTO: Movimiento = {
  tipo: "gasto",
  monto: 15_000n,
  fecha: "2026-11-19",
  descripcion: "Almuerzo",
  nota: "con Ana",
  cuentaOrigen: NEQUI,
  cuentaDestino: null,
  categoria: COMIDA,
  partes: [],
};

describe("valoresDesdeMovimiento", () => {
  it("gasto con nota y fecha", () => {
    expect(valoresDesdeMovimiento(GASTO)).toEqual<ValoresCaptura>({
      tipo: "gasto",
      monto: "15.000",
      descripcion: "Almuerzo",
      categoria: { modo: "elegida", id: COMIDA.id },
      cuentaId: NEQUI.id,
      destinoId: null,
      fecha: "2026-11-19",
      nota: "con Ana",
      partes: null,
    });
  });

  it("dividido: partes formateadas", () => {
    const valores = valoresDesdeMovimiento({
      ...GASTO,
      monto: 30_000n,
      categoria: null,
      partes: [
        { categoria: COMIDA, monto: 20_000n },
        { categoria: MERCADO, monto: 10_000n },
      ],
    });
    expect(valores.partes).toEqual([
      { categoriaId: COMIDA.id, monto: "20.000" },
      { categoriaId: MERCADO.id, monto: "10.000" },
    ]);
  });

  it("sin descripción, nota ni categoría", () => {
    const valores = valoresDesdeMovimiento({ ...GASTO, descripcion: null, nota: null, categoria: null });
    expect(valores.descripcion).toBe("");
    expect(valores.nota).toBe("");
    expect(valores.categoria).toEqual({ modo: "quitada" });
  });

  it("ingreso: la cuenta es el destino", () => {
    const valores = valoresDesdeMovimiento({ ...GASTO, tipo: "ingreso", cuentaOrigen: null, cuentaDestino: BANCO });
    expect(valores.cuentaId).toBe(BANCO.id);
    expect(valores.destinoId).toBeNull();
  });

  it("transferencia: origen y destino, sin categoría ni partes", () => {
    const valores = valoresDesdeMovimiento({ ...GASTO, tipo: "transferencia", cuentaDestino: VISA, categoria: null });
    expect(valores.cuentaId).toBe(NEQUI.id);
    expect(valores.destinoId).toBe(VISA.id);
    expect(valores.partes).toBeNull();
  });
});

describe("hayCambios", () => {
  const original = valoresDesdeMovimiento(GASTO);

  it("sin cambios", () => {
    expect(hayCambios(original, { ...original })).toBe(false);
  });

  it("ignora espacios alrededor", () => {
    expect(hayCambios(original, { ...original, descripcion: " Almuerzo  ", nota: "con Ana " })).toBe(false);
  });

  it.each<[string, Partial<ValoresCaptura>]>([
    ["monto", { monto: "18.000" }],
    ["descripción", { descripcion: "Almuerzo largo" }],
    ["nota", { nota: "" }],
    ["tipo", { tipo: "ingreso" }],
    ["categoría", { categoria: { modo: "elegida", id: "otra" } }],
    ["cuenta", { cuentaId: "otra" }],
    ["fecha", { fecha: "2026-10-31" }],
    ["partes", { partes: [{ categoriaId: null, monto: "" }, { categoriaId: null, monto: "" }] }],
  ])("detecta el cambio de %s", (_campo, cambio) => {
    expect(hayCambios(original, { ...original, ...cambio })).toBe(true);
  });
});

describe("cuentaArchivada", () => {
  const activas = [NEQUI, VISA];

  it("gasto con su cuenta activa → null", () => {
    expect(cuentaArchivada(GASTO, activas)).toBeNull();
  });

  it("gasto con la cuenta archivada", () => {
    expect(cuentaArchivada(GASTO, [VISA])).toEqual(NEQUI);
  });

  it("ingreso con el destino archivado", () => {
    expect(cuentaArchivada({ cuentaOrigen: null, cuentaDestino: BANCO }, activas)).toEqual(BANCO);
  });

  it("transferencia: cualquiera de las dos, la primera que no esté", () => {
    expect(cuentaArchivada({ cuentaOrigen: NEQUI, cuentaDestino: VISA }, activas)).toBeNull();
    expect(cuentaArchivada({ cuentaOrigen: NEQUI, cuentaDestino: BANCO }, activas)).toEqual(BANCO);
    expect(cuentaArchivada({ cuentaOrigen: BANCO, cuentaDestino: VISA }, [NEQUI])).toEqual(BANCO);
  });
});
