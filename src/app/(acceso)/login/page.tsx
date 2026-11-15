import { Suspense } from "react";
import { ColumnaAcceso } from "@/components/acceso/columna-acceso";
import { FormularioLogin } from "@/components/acceso/formulario-login";
import { MENSAJES } from "@/services/autenticacion";
import { entrar } from "../acciones";

/** Lee `searchParams` (dato de petición) aislado en Suspense para no bloquear el prerender. */
async function FormularioConAviso({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { error } = await searchParams;

  return (
    <FormularioLogin
      accion={entrar}
      mensajeInicial={error === "confirmacion" ? MENSAJES.enlaceInvalido : undefined}
    />
  );
}

export default function PaginaLogin({ searchParams }: PageProps<"/login">) {
  return (
    <ColumnaAcceso>
      <Suspense fallback={<FormularioLogin accion={entrar} />}>
        <FormularioConAviso searchParams={searchParams} />
      </Suspense>
    </ColumnaAcceso>
  );
}
