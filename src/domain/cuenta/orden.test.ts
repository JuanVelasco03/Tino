import { describe, expect, it } from "vitest";
import { moverA, ordenCambio } from "./orden";

const IDS = ["a", "b", "c", "d"] as const;

describe("moverA", () => {
  it("subir el primero no cambia", () => {
    expect(moverA(IDS, "a", -1)).toEqual(["a", "b", "c", "d"]);
  });

  it("bajar el último no cambia", () => {
    expect(moverA(IDS, "d", 4)).toEqual(["a", "b", "c", "d"]);
  });

  it("mueve al medio", () => {
    expect(moverA(IDS, "a", 2)).toEqual(["b", "c", "a", "d"]);
    expect(moverA(IDS, "d", 1)).toEqual(["a", "d", "b", "c"]);
  });

  it("sube y baja una posición", () => {
    expect(moverA(IDS, "c", 1)).toEqual(["a", "c", "b", "d"]);
    expect(moverA(IDS, "b", 2)).toEqual(["a", "c", "b", "d"]);
  });

  it("acota destinos fuera de rango", () => {
    expect(moverA(IDS, "b", -10)).toEqual(["b", "a", "c", "d"]);
    expect(moverA(IDS, "b", 99)).toEqual(["a", "c", "d", "b"]);
  });

  it("arreglo de uno", () => {
    expect(moverA(["a"], "a", 0)).toEqual(["a"]);
    expect(moverA(["a"], "a", 1)).toEqual(["a"]);
    expect(moverA(["a"], "a", -1)).toEqual(["a"]);
  });

  it("id ausente devuelve copia igual", () => {
    const resultado = moverA(IDS, "z", 1);
    expect(resultado).toEqual([...IDS]);
    expect(resultado).not.toBe(IDS);
  });

  it("no muta la entrada", () => {
    const entrada = ["a", "b", "c"];
    const resultado = moverA(entrada, "a", 2);
    expect(entrada).toEqual(["a", "b", "c"]);
    expect(resultado).not.toBe(entrada);
  });
});

describe("ordenCambio", () => {
  it("mismo orden → false", () => {
    expect(ordenCambio(["a", "b"], ["a", "b"])).toBe(false);
    expect(ordenCambio([], [])).toBe(false);
  });

  it("otro orden → true", () => {
    expect(ordenCambio(["a", "b"], ["b", "a"])).toBe(true);
  });

  it("distinta longitud → true", () => {
    expect(ordenCambio(["a", "b"], ["a"])).toBe(true);
  });
});
