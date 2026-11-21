import { describe, expect, it } from "vitest";
import { ERRORES_PARTES, errorPartes, restante, type ValorParte } from "./partes";

const COMIDA = "c-comida";
const MERCADO = "c-mercado";
const OCIO = "c-ocio";

function parte(categoriaId: string | null, monto: string): ValorParte {
  return { categoriaId, monto };
}

describe("restante", () => {
  it("falta: positivo", () => {
    expect(restante(30_000n, [parte(COMIDA, "20.000"), parte(MERCADO, "")])).toBe(10_000n);
  });

  it("sobra: negativo", () => {
    expect(restante(30_000n, [parte(COMIDA, "20.000"), parte(MERCADO, "12.000")])).toBe(-2_000n);
  });

  it("cuadra: cero", () => {
    expect(restante(30_000n, [parte(COMIDA, "20.000"), parte(MERCADO, "10.000")])).toBe(0n);
  });

  it("una parte sin monto o mal escrita cuenta como 0", () => {
    expect(restante(30_000n, [parte(COMIDA, ""), parte(MERCADO, "abc")])).toBe(30_000n);
  });

  it("montos por encima de 2^53 sin perder precisión", () => {
    expect(restante(9_007_199_254_740_993n, [parte(COMIDA, "9.007.199.254.740.992"), parte(MERCADO, "")])).toBe(1n);
  });
});

describe("errorPartes", () => {
  it("válidas → null", () => {
    expect(errorPartes(30_000n, [parte(COMIDA, "20.000"), parte(MERCADO, "10.000")])).toBeNull();
  });

  it.each<[string, bigint, ValorParte[], string]>([
    ["una sola parte", 30_000n, [parte(COMIDA, "30.000")], ERRORES_PARTES.insuficientes],
    ["ninguna", 30_000n, [], ERRORES_PARTES.insuficientes],
    ["sin categoría", 30_000n, [parte(COMIDA, "20.000"), parte(null, "10.000")], ERRORES_PARTES.sinCategoria],
    ["monto vacío", 30_000n, [parte(COMIDA, "30.000"), parte(MERCADO, "")], ERRORES_PARTES.monto],
    ["monto cero", 30_000n, [parte(COMIDA, "30.000"), parte(MERCADO, "0")], ERRORES_PARTES.monto],
    ["categoría repetida", 30_000n, [parte(COMIDA, "20.000"), parte(COMIDA, "10.000")], ERRORES_PARTES.repetidas],
    ["no suman", 30_000n, [parte(COMIDA, "20.000"), parte(MERCADO, "5.000")], ERRORES_PARTES.noSuman],
    ["sobran", 30_000n, [parte(COMIDA, "20.000"), parte(MERCADO, "12.000")], ERRORES_PARTES.noSuman],
  ])("%s", (_caso, total, partes, esperado) => {
    expect(errorPartes(total, partes)).toBe(esperado);
  });

  it("orden de la API: la cantidad antes que todo", () => {
    expect(errorPartes(30_000n, [parte(null, "")])).toBe(ERRORES_PARTES.insuficientes);
  });

  it("orden de la API: parte por parte (la primera con monto en cero antes que una repetida después)", () => {
    expect(errorPartes(30_000n, [parte(COMIDA, ""), parte(COMIDA, "10.000")])).toBe(ERRORES_PARTES.monto);
    expect(errorPartes(30_000n, [parte(COMIDA, "1"), parte(COMIDA, "")])).toBe(ERRORES_PARTES.monto);
    expect(errorPartes(30_000n, [parte(COMIDA, "1"), parte(COMIDA, "2"), parte(OCIO, "")])).toBe(ERRORES_PARTES.repetidas);
  });

  it("orden de la API: la suma al final", () => {
    expect(errorPartes(1n, [parte(COMIDA, "20.000"), parte(null, "10.000")])).toBe(ERRORES_PARTES.sinCategoria);
  });
});
