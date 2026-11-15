import { ColumnaAcceso } from "@/components/acceso/columna-acceso";
import { FormularioLogin } from "@/components/acceso/formulario-login";
import { MENSAJES } from "@/services/autenticacion";
import { entrar } from "../acciones";

export default async function PaginaLogin({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;

  return (
    <ColumnaAcceso>
      <FormularioLogin
        accion={entrar}
        mensajeInicial={error === "confirmacion" ? MENSAJES.enlaceInvalido : undefined}
      />
    </ColumnaAcceso>
  );
}
