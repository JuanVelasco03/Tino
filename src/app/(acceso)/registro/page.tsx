import { ColumnaAcceso } from "@/components/acceso/columna-acceso";
import { FormularioRegistro } from "@/components/acceso/formulario-registro";
import { registrar } from "../acciones";

export default function PaginaRegistro() {
  return (
    <ColumnaAcceso>
      <FormularioRegistro accion={registrar} />
    </ColumnaAcceso>
  );
}
