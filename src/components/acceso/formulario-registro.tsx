"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Boton } from "@/components/boton";
import { BotonGoogle } from "./boton-google";
import { CampoSubrayado } from "./campo-subrayado";
import { MensajeError } from "./mensaje-error";
import { SeparadorCorreo } from "./separador-correo";
import type { AccionAcceso } from "./tipos";

export function FormularioRegistro({ accion }: { accion: AccionAcceso }) {
  const [estado, enviar, pendiente] = useActionState(accion, { tipo: "inicial" });

  if (estado.tipo === "revisa_correo") {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-2">Revisa tu correo</h1>
        <p className="text-cuerpo text-secundario">
          Enviamos un enlace de confirmación a{" "}
          <span className="font-semibold text-texto">{estado.correo}</span>. Ábrelo para entrar.
        </p>
        <Link href="/login" className="mt-2 text-etiqueta font-semibold text-marca-texto">
          Volver a entrar
        </Link>
      </div>
    );
  }

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
          name="contrasena"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          required
        />
        <CampoSubrayado
          etiqueta="Confirmar contraseña"
          name="confirmacion"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          required
        />
        {estado.tipo === "error" && <MensajeError mensaje={estado.mensaje} />}
        <Boton
          type="submit"
          disabled={pendiente}
          className="mt-2 h-[52px]! w-full justify-center font-semibold"
        >
          {pendiente ? "Creando cuenta…" : "Crear cuenta"}
        </Boton>
      </form>
      <span className="text-center text-etiqueta font-normal text-secundario">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-marca-texto">
          Entrar
        </Link>
      </span>
    </>
  );
}
