import { describe, expect, it } from "vitest";
import type { Categoria, Propuesta } from "../movimiento/cuerpo";
import { ofertaDeRegla, type EntradaOferta } from "./oferta";

const COMIDA: Categoria = { id: "c-comida", nombre: "Comida", tipo: "gasto" };
const HOGAR: Categoria = { id: "c-hogar", nombre: "Hogar", tipo: "gasto" };
const OCIO: Categoria = { id: "c-ocio", nombre: "Ocio", tipo: "gasto" };
const SALARIO: Categoria = { id: "c-salario", nombre: "Salario", tipo: "ingreso" };
const CATEGORIAS = [COMIDA, HOGAR, OCIO, SALARIO];

const PROPUESTA: Propuesta = { categoria: COMIDA, regla: { id: "r-almuerzo", palabraClave: "almuerzo" } };

function entrada(cambios: Partial<EntradaOferta>): EntradaOferta {
  return {
    tipo: "gasto",
    descripcion: "Peluquería",
    categoria: { modo: "elegida", id: HOGAR.id },
    propuesta: null,
    categorias: CATEGORIAS,
    dividido: false,
    ...cambios,
  };
}

describe("ofertaDeRegla · edición", () => {
  it("corregir Comida (propuesta por «almuerzo») por Ocio ofrece cambiar la regla", () => {
    const oferta = ofertaDeRegla(
      entrada({ descripcion: "Almuerzo", propuesta: PROPUESTA, categoria: { modo: "elegida", id: OCIO.id }, categoriaAnterior: COMIDA.id }),
    );
    expect(oferta).toEqual({ tipo: "ajustar", reglaId: "r-almuerzo", palabraClave: "almuerzo", categoria: OCIO });
  });

  it("la categoría no cambió (solo el monto) → null", () => {
    expect(
      ofertaDeRegla(entrada({ descripcion: "Almuerzo", propuesta: PROPUESTA, categoria: { modo: "elegida", id: OCIO.id }, categoriaAnterior: OCIO.id })),
    ).toBeNull();
    expect(ofertaDeRegla(entrada({ categoriaAnterior: HOGAR.id }))).toBeNull();
  });

  it("sin categoría antes y elegida ahora → ofrece", () => {
    expect(ofertaDeRegla(entrada({ categoriaAnterior: null }))).toEqual({ tipo: "crear", palabraClave: "Peluquería", categoria: HOGAR });
  });
});

describe("ofertaDeRegla · partes", () => {
  it("dividido → null", () => {
    expect(ofertaDeRegla(entrada({ dividido: true }))).toBeNull();
    expect(ofertaDeRegla(entrada({ dividido: true, propuesta: PROPUESTA, categoria: { modo: "elegida", id: OCIO.id } }))).toBeNull();
  });
});

describe("ofertaDeRegla · crear", () => {
  it("sin propuesta y categoría elegida a mano: ofrece crear con la descripción", () => {
    expect(ofertaDeRegla(entrada({}))).toEqual({ tipo: "crear", palabraClave: "Peluquería", categoria: HOGAR });
  });

  it("recorta la descripción", () => {
    expect(ofertaDeRegla(entrada({ descripcion: "  Peluquería " }))).toMatchObject({ palabraClave: "Peluquería" });
  });

  it("también en ingreso", () => {
    const oferta = ofertaDeRegla(entrada({ tipo: "ingreso", descripcion: "Nómina", categoria: { modo: "elegida", id: SALARIO.id } }));
    expect(oferta).toEqual({ tipo: "crear", palabraClave: "Nómina", categoria: SALARIO });
  });

  it("acepta 60 caracteres", () => {
    expect(ofertaDeRegla(entrada({ descripcion: "a".repeat(60) }))).not.toBeNull();
  });
});

describe("ofertaDeRegla · ajustar", () => {
  it("propuesta corregida: ofrece ajustar la regla con su palabra clave", () => {
    const oferta = ofertaDeRegla(entrada({ descripcion: "Almuerzo", propuesta: PROPUESTA, categoria: { modo: "elegida", id: OCIO.id } }));
    expect(oferta).toEqual({ tipo: "ajustar", reglaId: "r-almuerzo", palabraClave: "almuerzo", categoria: OCIO });
  });

  it("no depende del largo de la descripción", () => {
    const oferta = ofertaDeRegla(
      entrada({ descripcion: `almuerzo ${"x".repeat(80)}`, propuesta: PROPUESTA, categoria: { modo: "elegida", id: OCIO.id } }),
    );
    expect(oferta?.tipo).toBe("ajustar");
  });
});

describe("ofertaDeRegla · null", () => {
  it("transferencia", () => {
    expect(ofertaDeRegla(entrada({ tipo: "transferencia" }))).toBeNull();
  });

  it("sin descripción", () => {
    expect(ofertaDeRegla(entrada({ descripcion: "   " }))).toBeNull();
  });

  it("descripción de más de 60 caracteres", () => {
    expect(ofertaDeRegla(entrada({ descripcion: "a".repeat(61) }))).toBeNull();
  });

  it("elegida igual a la propuesta", () => {
    expect(ofertaDeRegla(entrada({ propuesta: PROPUESTA, categoria: { modo: "elegida", id: COMIDA.id } }))).toBeNull();
  });

  it("la propuesta sin tocar", () => {
    expect(ofertaDeRegla(entrada({ propuesta: PROPUESTA, categoria: { modo: "propuesta" } }))).toBeNull();
  });

  it("la propuesta quitada", () => {
    expect(ofertaDeRegla(entrada({ propuesta: PROPUESTA, categoria: { modo: "quitada" } }))).toBeNull();
  });

  it("sin propuesta ni elección", () => {
    expect(ofertaDeRegla(entrada({ categoria: { modo: "propuesta" } }))).toBeNull();
  });

  it("categoría elegida que no existe o es de otro tipo", () => {
    expect(ofertaDeRegla(entrada({ categoria: { modo: "elegida", id: "otra" } }))).toBeNull();
    expect(ofertaDeRegla(entrada({ categoria: { modo: "elegida", id: SALARIO.id } }))).toBeNull();
  });
});
