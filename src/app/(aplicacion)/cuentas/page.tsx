import { ListaCuentas } from "@/components/cuentas/lista-cuentas";
import { obtenerCuentas } from "@/services/cuentas";
import { guardarOrden } from "./acciones";

export const metadata = { title: "Cuentas · Tino" };

export default async function PaginaCuentas() {
  const lista = await obtenerCuentas();
  return <ListaCuentas lista={lista} guardarOrden={guardarOrden} />;
}
