import { describe, expect, it } from "vitest";
import { aDigitos, aplicarTecla, desdeMonto, formatearEntradaPesos, type TeclaNumerica } from "./entrada";

describe("formatearEntradaPesos", () => {
  it.each<[string, string]>([
    ["1284300", "1.284.300"],
    ["999", "999"],
    ["1000", "1.000"],
    ["0", "0"],
    ["", ""],
  ])("%j → %j", (texto, esperado) => {
    expect(formatearEntradaPesos(texto)).toBe(esperado);
  });

  it("descarta letras, comas y signos", () => {
    expect(formatearEntradaPesos("-1.234,5")).toBe("12.345");
    expect(formatearEntradaPesos("abc")).toBe("");
    expect(formatearEntradaPesos("12a3")).toBe("123");
  });

  it("quita los ceros a la izquierda", () => {
    expect(formatearEntradaPesos("007")).toBe("7");
    expect(formatearEntradaPesos("000")).toBe("0");
  });

  it("reformatea lo que ya traía puntos", () => {
    expect(formatearEntradaPesos("15.284.300")).toBe("15.284.300");
    expect(formatearEntradaPesos("1.2843")).toBe("12.843");
  });
});

describe("aDigitos", () => {
  it.each<[string, string]>([
    ["1.284.300", "1284300"],
    ["1284300", "1284300"],
    ["0", "0"],
    ["007", "7"],
    ["9.999.999.999.999.999.999", "9999999999999999999"],
  ])("%j → %j", (texto, esperado) => {
    expect(aDigitos(texto)).toBe(esperado);
  });

  it("vacío → null", () => {
    expect(aDigitos("")).toBeNull();
    expect(aDigitos("   ")).toBeNull();
  });

  it("más de 19 dígitos → null", () => {
    expect(aDigitos("12345678901234567890")).toBeNull();
  });

  it("decimales, signos o letras → null", () => {
    expect(aDigitos("12,5")).toBeNull();
    expect(aDigitos("-1")).toBeNull();
    expect(aDigitos("1e3")).toBeNull();
  });
});

describe("desdeMonto", () => {
  it.each<[bigint, string]>([
    [1_284_300n, "1.284.300"],
    [20_321n, "20.321"],
    [0n, "0"],
    [9_007_199_254_740_993n, "9.007.199.254.740.993"],
  ])("%s → %j", (monto, esperado) => {
    expect(desdeMonto(monto)).toBe(esperado);
  });
});

describe("aplicarTecla", () => {
  function teclear(teclas: TeclaNumerica[], inicial = ""): string {
    return teclas.reduce(aplicarTecla, inicial);
  }

  it("1, 5, 000 → 15.000", () => {
    expect(teclear(["1", "5", "000"])).toBe("15.000");
  });

  it("0 o 000 como primera tecla no escriben nada", () => {
    expect(teclear(["0"])).toBe("");
    expect(teclear(["000"])).toBe("");
    expect(teclear(["0", "0", "7"])).toBe("7");
  });

  it("los ceros después de otro dígito sí cuentan", () => {
    expect(teclear(["1", "0", "0"])).toBe("100");
  });

  it("borrar quita un dígito y reagrupa", () => {
    expect(aplicarTecla("15.000", "borrar")).toBe("1.500");
    expect(aplicarTecla("5", "borrar")).toBe("");
    expect(aplicarTecla("", "borrar")).toBe("");
  });

  it("no pasa de 19 dígitos", () => {
    const lleno = teclear(Array<TeclaNumerica>(19).fill("9"));
    expect(lleno.replace(/\./g, "")).toHaveLength(19);
    expect(aplicarTecla(lleno, "1")).toBe(lleno);
    expect(aplicarTecla(teclear(Array<TeclaNumerica>(17).fill("9")), "000").replace(/\./g, "")).toHaveLength(17);
  });
});
