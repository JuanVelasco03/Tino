"use client";

import { Boton } from "@/components/boton";

/**
 * Alterna el modo de toda la página fijando `data-theme` en <html>.
 * Parte del modo que tenga el sistema y, al primer clic, pasa al contrario.
 */
export function AlternarTema() {
  function alternar() {
    const raiz = document.documentElement;
    const actual =
      raiz.dataset.theme ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    raiz.dataset.theme = actual === "dark" ? "light" : "dark";
  }

  return (
    <Boton variante="secundario" onClick={alternar}>
      Alternar claro / oscuro
    </Boton>
  );
}
