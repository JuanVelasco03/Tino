import type { ReactNode } from "react";
import { BotonTema } from "@/components/boton-tema";

/** Pantallas de acceso: el tema se cambia con el botón fijo (en la aplicación va en el menú). */
export default function LayoutAcceso({ children }: { children: ReactNode }) {
  return (
    <>
      <BotonTema />
      {children}
    </>
  );
}
