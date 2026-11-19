import { describe, expect, it } from "vitest";
import { formatearFecha, formatearFechaSinAnio } from "./formato";

describe("formatearFecha", () => {
  it.each<[string, string]>([
    ["2026-01-15", "15 ene 2026"],
    ["2026-02-15", "15 feb 2026"],
    ["2026-03-15", "15 mar 2026"],
    ["2026-04-15", "15 abr 2026"],
    ["2026-05-15", "15 may 2026"],
    ["2026-06-15", "15 jun 2026"],
    ["2026-07-15", "15 jul 2026"],
    ["2026-08-15", "15 ago 2026"],
    ["2026-09-15", "15 sep 2026"],
    ["2026-10-15", "15 oct 2026"],
    ["2026-11-18", "18 nov 2026"],
    ["2026-12-15", "15 dic 2026"],
  ])("%s → %s", (entrada, esperado) => {
    expect(formatearFecha(entrada)).toBe(esperado);
  });

  it("quita el cero a la izquierda del día", () => {
    expect(formatearFecha("2026-01-05")).toBe("5 ene 2026");
  });

  it.each(["", "2026-11", "18/11/2026", "2026-13-01", "2026-00-10", "2026-11-00", "2026-11-18T00:00:00Z"])(
    "lanza error con entrada mal formada: %j",
    (entrada) => {
      expect(() => formatearFecha(entrada)).toThrow();
    },
  );
});

describe("formatearFechaSinAnio", () => {
  it("omite el año", () => {
    expect(formatearFechaSinAnio("2026-11-18")).toBe("18 nov");
    expect(formatearFechaSinAnio("2026-01-05")).toBe("5 ene");
  });

  it("lanza error con entrada mal formada", () => {
    expect(() => formatearFechaSinAnio("nov 18")).toThrow();
  });
});
