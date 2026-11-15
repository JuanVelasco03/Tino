"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Boton } from "@/components/boton";
import { BotonGoogle } from "./boton-google";
import { CampoSubrayado } from "./campo-subrayado";
import { MensajeError } from "./mensaje-error";
import { SeparadorCorreo } from "./separador-correo";
import type { AccionAcceso } from "./tipos";

type Props = {
  accion: AccionAcceso;
  /** Mensaje a mostrar al cargar (p. ej. enlace de confirmación inválido). */
  mensajeInicial?: string;
};

export function FormularioLogin({ accion, mensajeInicial }: Props) {
  const [estado, enviar, pendiente] = useActionState(accion, { tipo: "inicial" });
  const mensaje = estado.tipo === "error" ? estado.mensaje : mensajeInicial;

  return (
    <>
      <BotonGoogle />
      <SeparadorCorreo />
      <form action={enviar} className="flex flex-col gap-4">
        <CampoSubrayado
          etiqueta="Correo"
          name="correo"
          type="email"
          autoComplete="email"
          placeholder="nombre@correo.com"
          defaultValue={estado.tipo === "error" ? estado.correo : ""}
          required
        />
        <CampoSubrayado
          etiqueta="Contraseña"
          extra={<span className="font-semibold text-marca-texto">¿La olvidaste?</span>}
          name="contrasena"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
        {mensaje && <MensajeError mensaje={mensaje} />}
        <Boton
          type="submit"
          disabled={pendiente}
          className="mt-2 h-[52px]! w-full justify-center font-semibold"
        >
          {pendiente ? "Entrando…" : "Entrar"}
        </Boton>
      </form>
      <span className="text-center text-etiqueta font-normal text-secundario">
        ¿Primera vez?{" "}
        <Link href="/registro" className="font-semibold text-marca-texto">
          Crear cuenta con correo
        </Link>
      </span>
    </>
  );
}
