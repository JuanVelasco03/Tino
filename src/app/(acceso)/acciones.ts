"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { EstadoAcceso } from "@/domain/autenticacion/estado";
import * as autenticacion from "@/services/autenticacion";

/** Valida la forma de FormData: solo cadenas. El contenido lo valida el dominio. */
function texto(datos: FormData, campo: string): string {
  const valor = datos.get(campo);
  return typeof valor === "string" ? valor : "";
}

export async function entrar(_estado: EstadoAcceso, datos: FormData): Promise<EstadoAcceso> {
  const resultado = await autenticacion.entrar(texto(datos, "correo"), texto(datos, "contrasena"));
  if (resultado.tipo === "error") return resultado;
  redirect("/");
}

export async function registrar(_estado: EstadoAcceso, datos: FormData): Promise<EstadoAcceso> {
  const cabeceras = await headers();
  const origen = cabeceras.get("origin") ?? `http://${cabeceras.get("host")}`;

  return autenticacion.registrar(
    texto(datos, "correo"),
    texto(datos, "contrasena"),
    texto(datos, "confirmacion"),
    `${origen}/auth/confirmar`,
  );
}

export async function salir(): Promise<void> {
  await autenticacion.salir();
  redirect("/login");
}
