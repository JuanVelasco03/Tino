import { SANGRIA_LISTA } from "@/components/cuentas/grupo-cuentas";

/** Carga de /cuentas: cabecera y renglones vacíos, sin cifras inventadas. */
export default function CargandoCuentas() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-6 md:gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-titulo-1">Cuentas</h1>
        <p className="text-etiqueta font-normal text-secundario">Cargando saldos…</p>
      </header>
      <div aria-hidden className="rounded-hoja border border-linea bg-superficie px-4 pb-1 md:px-6">
        <div className="h-12 border-b border-raya" />
        <div className="h-16 border-b border-linea" />
        <div className="h-16 border-b border-linea" />
        <div className="h-16" />
      </div>
      <div aria-hidden className={SANGRIA_LISTA}>
        <div className="h-12 border-b border-raya" />
        <div className="h-16" />
      </div>
    </div>
  );
}
