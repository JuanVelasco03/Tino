import { ListaArchivadas } from "@/components/cuentas/lista-archivadas";
import { listarArchivadas } from "@/services/cuentas";
import { eliminarArchivada, restaurarCuenta } from "./acciones";

export const metadata = { title: "Cuentas archivadas · Tino" };

export default async function PaginaArchivadas() {
  const cuentas = await listarArchivadas();
  return <ListaArchivadas cuentas={cuentas} restaurar={restaurarCuenta} eliminar={eliminarArchivada} />;
}
