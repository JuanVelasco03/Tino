import { redirect } from "next/navigation";
import { ListaCuentas } from "@/components/cuentas/lista-cuentas";
import { PanelCuenta } from "@/components/cuentas/panel-cuenta";
import { obtenerCuentas } from "@/services/cuentas";
import { archivarCuenta, crearCuenta, editarCuenta, eliminarCuenta, guardarOrden } from "./acciones";

export const metadata = { title: "Cuentas · Tino" };

const ACCIONES = { crear: crearCuenta, editar: editarCuenta, archivar: archivarCuenta, eliminar: eliminarCuenta };

/**
 * `?cuenta=nueva` abre el panel de alta; `?cuenta=<id>`, la edición de una
 * cuenta no archivada. Un id que no está en la lista vuelve a `/cuentas`.
 */
export default async function PaginaCuentas({ searchParams }: PageProps<"/cuentas">) {
  const [lista, { cuenta: parametro }] = await Promise.all([obtenerCuentas(), searchParams]);
  const valor = typeof parametro === "string" ? parametro : undefined;

  let panel = null;
  if (valor === "nueva") {
    panel = <PanelCuenta key="nueva" cuenta={null} acciones={ACCIONES} />;
  } else if (valor !== undefined) {
    const cuenta = [...lista.activos.cuentas, ...lista.pasivos.cuentas].find((c) => c.id === valor);
    if (!cuenta) redirect("/cuentas");
    panel = <PanelCuenta key={cuenta.id} cuenta={cuenta} acciones={ACCIONES} />;
  }

  return (
    <>
      <ListaCuentas lista={lista} guardarOrden={guardarOrden} />
      {panel}
    </>
  );
}
