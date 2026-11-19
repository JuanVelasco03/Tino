import { describe, expect, it } from "vitest";
import { aDigitos, desdeMonto, formatearEntradaPesos } from "./entrada";

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
