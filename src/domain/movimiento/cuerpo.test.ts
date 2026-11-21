import { describe, expect, it } from "vitest";
import { cuerpoDesdeValores, type Propuesta, type ValoresCaptura } from "./cuerpo";

const NEQUI = "0f9c6c1e-3a52-4c51-9a7e-2b1f0d6f5a11";
const VISA = "7d2b8e40-91c3-4f0e-8b6a-5c4d3e2f1a09";
const COMIDA = { id: "bb9f0000-0000-4000-8000-000000000001", nombre: "Comida", tipo: "gasto" as const };
const OCIO = "bb9f0000-0000-4000-8000-000000000002";
const SALARIO = { id: "a7e30000-0000-4000-8000-000000000003", nombre: "Salario", tipo: "ingreso" as const };

const PROPUESTA: Propuesta = { categoria: COMIDA, regla: { id: "e4c10000-0000-4000-8000-000000000004", palabraClave: "almuerzo" } };

const BASE: ValoresCaptura = {
  tipo: "gasto",
  monto: "15.000",
  descripcion: "Almuerzo",
  categoria: { modo: "propuesta" },
  cuentaId: NEQUI,
  destinoId: null,
  fecha: "2026-11-19",
  nota: "",
};

describe("cuerpoDesdeValores · forma por tipo", () => {
  it("gasto: cuenta de origen y categoría propuesta", () => {
    expect(cuerpoDesdeValores(BASE, PROPUESTA)).toEqual({
      tipo: "gasto",
      monto: "15000",
      fecha: "2026-11-19",
      descripcion: "Almuerzo",
      nota: null,
      cuentaOrigenId: NEQUI,
      categoriaId: COMIDA.id,
    });
  });

  it("ingreso: la cuenta es el destino", () => {
    const cuerpo = cuerpoDesdeValores({ ...BASE, tipo: "ingreso", categoria: { modo: "elegida", id: SALARIO.id } }, null);
    expect(cuerpo).toEqual({
      tipo: "ingreso",
      monto: "15000",
      fecha: "2026-11-19",
      descripcion: "Almuerzo",
      nota: null,
      cuentaDestinoId: NEQUI,
      categoriaId: SALARIO.id,
    });
  });

  it("transferencia: origen y destino, nunca categoría", () => {
    const cuerpo = cuerpoDesdeValores(
      { ...BASE, tipo: "transferencia", destinoId: VISA, categoria: { modo: "elegida", id: OCIO } },
      PROPUESTA,
    );
    expect(cuerpo).toEqual({
      tipo: "transferencia",
      monto: "15000",
      fecha: "2026-11-19",
      descripcion: "Almuerzo",
      nota: null,
      cuentaOrigenId: NEQUI,
      cuentaDestinoId: VISA,
    });
    expect(cuerpo).not.toHaveProperty("categoriaId");
  });

  it("sin fecha aún (la captura no ha cargado): no la envía", () => {
    expect(cuerpoDesdeValores({ ...BASE, fecha: "" }, null)).not.toHaveProperty("fecha");
  });
});

describe("cuerpoDesdeValores · categoría", () => {
  it("la elegida gana a la propuesta", () => {
    expect(cuerpoDesdeValores({ ...BASE, categoria: { modo: "elegida", id: OCIO } }, PROPUESTA)?.categoriaId).toBe(OCIO);
  });

  it("quitada: sin categoría aunque haya propuesta", () => {
    expect(cuerpoDesdeValores({ ...BASE, categoria: { modo: "quitada" } }, PROPUESTA)?.categoriaId).toBeNull();
  });

  it("sin propuesta ni elección: sin categoría", () => {
    expect(cuerpoDesdeValores(BASE, null)?.categoriaId).toBeNull();
  });

  it("una propuesta de otro tipo no vale", () => {
    expect(cuerpoDesdeValores({ ...BASE, tipo: "ingreso" }, PROPUESTA)?.categoriaId).toBeNull();
  });
});

describe("cuerpoDesdeValores · monto", () => {
  it.each(["", "0", "000", "0.000", "1,5", "-100", "abc", "12345678901234567890"])("%j → null", (monto) => {
    expect(cuerpoDesdeValores({ ...BASE, monto }, null)).toBeNull();
  });

  it("quita los puntos de miles y no pasa por number", () => {
    expect(cuerpoDesdeValores({ ...BASE, monto: "9.007.199.254.740.993" }, null)?.monto).toBe("9007199254740993");
  });
});

describe("cuerpoDesdeValores · textos", () => {
  it("descripción y nota vacías → null", () => {
    const cuerpo = cuerpoDesdeValores({ ...BASE, descripcion: "   ", nota: "" }, null);
    expect(cuerpo?.descripcion).toBeNull();
    expect(cuerpo?.nota).toBeNull();
  });

  it("recorta espacios y conserva la nota", () => {
    const cuerpo = cuerpoDesdeValores({ ...BASE, descripcion: "  Almuerzo ", nota: " con Ana " }, null);
    expect(cuerpo?.descripcion).toBe("Almuerzo");
    expect(cuerpo?.nota).toBe("con Ana");
  });
});
