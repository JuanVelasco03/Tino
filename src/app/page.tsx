import { redirect } from "next/navigation";

/** Aún no hay Resumen: la portada de la aplicación es Cuentas. */
export default function Inicio() {
  redirect("/cuentas");
}
