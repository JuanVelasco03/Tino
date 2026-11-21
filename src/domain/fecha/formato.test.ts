import { describe, expect, it } from "vitest";
import { formatearDiaSemana, formatearFecha, formatearFechaSinAnio, formatearMes, sumarDias } from "./formato";

describe("sumarDias", () => {
  it.each<[string, number, string]>([
    ["2026-11-19", -1, "2026-11-18"],
    ["2026-11-19", -2, "2026-11-17"],
    ["2026-11-19", 0, "2026-11-19"],
    ["2026-11-01", -1, "2026-10-31"], // cambio de mes
    ["2026-10-31", 1, "2026-11-01"],
    ["2026-01-01", -1, "2025-12-31"], // cambio de año
    ["2025-12-31", 1, "2026-01-01"],
    ["2028-03-01", -1, "2028-02-29"], // bisiesto
    ["2028-02-28", 1, "2028-02-29"],
    ["2027-03-01", -1, "2027-02-28"], // no bisiesto
    ["2026-11-19", 45, "2027-01-03"],
  ])("%s %+d → %s", (fecha, dias, esperado) => {
    expect(sumarDias(fecha, dias)).toBe(esperado);
  });

  it.each(["2026-02-30", "2027-02-29", "2026-11", ""])("lanza error con fecha inválida: %j", (fecha) => {
    expect(() => sumarDias(fecha, 1)).toThrow();
  });
});

describe("formatearDiaSemana", () => {
  it.each<[string, string]>([
    ["2026-11-19", "jue 19 nov"],
    ["2026-11-18", "mié 18 nov"],
    ["2026-11-22", "dom 22 nov"],
    ["2026-11-21", "sáb 21 nov"],
    ["2028-02-29", "mar 29 feb"],
    ["2026-01-01", "jue 1 ene"],
  ])("%s → %s", (fecha, esperado) => {
    expect(formatearDiaSemana(fecha)).toBe(esperado);
  });
});

describe("formatearMes", () => {
  it.each<[string, string]>([
    ["2026-11", "Noviembre 2026"],
    ["2026-01", "Enero 2026"],
    ["2027-12", "Diciembre 2027"],
  ])("%s → %s", (mes, esperado) => {
    expect(formatearMes(mes)).toBe(esperado);
  });

  it.each(["2026-13", "2026-00", "2026-11-19", "nov 2026", ""])("lanza error con mes mal formado: %j", (mes) => {
    expect(() => formatearMes(mes)).toThrow();
  });
});

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
