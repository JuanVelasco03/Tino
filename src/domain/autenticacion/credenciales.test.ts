import { describe, expect, it } from "vitest";
import { validarCredenciales, validarRegistro } from "./credenciales";

describe("validarCredenciales", () => {
  it("acepta credenciales válidas", () => {
    expect(validarCredenciales("ana@correo.com", "12345678")).toEqual({
      ok: true,
      correo: "ana@correo.com",
    });
  });

  it("rechaza correo vacío", () => {
    expect(validarCredenciales("", "12345678")).toEqual({
      ok: false,
      errores: ["correo_invalido"],
    });
  });

  it("rechaza correo sin @", () => {
    expect(validarCredenciales("ana.correo.com", "12345678")).toEqual({
      ok: false,
      errores: ["correo_invalido"],
    });
  });

  it("rechaza espacios dentro del correo", () => {
    const r = validarCredenciales("a na@correo.com", "12345678");
    expect(r.ok).toBe(false);
  });

  it("normaliza: trim y minúsculas", () => {
    expect(validarCredenciales("  Ana@Correo.COM  ", "12345678")).toEqual({
      ok: true,
      correo: "ana@correo.com",
    });
  });

  it("rechaza contraseña de 7 caracteres", () => {
    expect(validarCredenciales("ana@correo.com", "1234567")).toEqual({
      ok: false,
      errores: ["contrasena_corta"],
    });
  });

  it("acepta contraseña de 8 caracteres", () => {
    expect(validarCredenciales("ana@correo.com", "12345678").ok).toBe(true);
  });

  it("acumula errores", () => {
    expect(validarCredenciales("x", "1")).toEqual({
      ok: false,
      errores: ["correo_invalido", "contrasena_corta"],
    });
  });
});

describe("validarRegistro", () => {
  it("acepta registro válido", () => {
    expect(validarRegistro("Ana@correo.com", "12345678", "12345678")).toEqual({
      ok: true,
      correo: "ana@correo.com",
    });
  });

  it("rechaza confirmación distinta", () => {
    expect(validarRegistro("ana@correo.com", "12345678", "12345679")).toEqual({
      ok: false,
      errores: ["contrasenas_distintas"],
    });
  });

  it("reporta contraseña corta y confirmación distinta a la vez", () => {
    expect(validarRegistro("ana@correo.com", "1234567", "otra")).toEqual({
      ok: false,
      errores: ["contrasena_corta", "contrasenas_distintas"],
    });
  });

  it("rechaza correo inválido", () => {
    expect(validarRegistro("", "12345678", "12345678")).toEqual({
      ok: false,
      errores: ["correo_invalido"],
    });
  });
});
