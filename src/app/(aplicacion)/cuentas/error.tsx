"use client";

import { Boton } from "@/components/boton";

/**
 * Error al cargar /cuentas (API caída, 500…). `retry` vuelve a pedir los datos
 * al servidor y re-renderiza el segmento (Next 16.3+); `reset` no re-pide.
 */
export default function ErrorCuentas({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="flex flex-col gap-6 md:gap-9">
      <h1 className="text-titulo-1">Cuentas</h1>
      <div role="alert" className="flex flex-col items-start gap-4">
        <p className="text-cuerpo font-semibold">No pudimos cargar tus cuentas.</p>
        <Boton variante="secundario" onClick={() => retry()}>
          Reintentar
        </Boton>
      </div>
    </div>
  );
}
