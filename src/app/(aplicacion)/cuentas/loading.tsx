/** Carga de /cuentas: cabecera y renglones vacíos, sin cifras inventadas. */
export default function CargandoCuentas() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-6 md:gap-9">
      <header className="flex flex-col gap-1 md:gap-1.5">
        <h1 className="text-titulo-1">Cuentas</h1>
        <p className="text-etiqueta font-normal text-secundario">Cargando saldos…</p>
      </header>
      <div aria-hidden className="rounded-hoja border border-linea bg-superficie px-3.5 pb-1 md:px-6">
        <div className="h-12 border-b border-raya" />
        <div className="h-15 border-b border-linea md:h-16" />
        <div className="h-15 border-b border-linea md:h-16" />
        <div className="h-15 md:h-16" />
      </div>
      <div aria-hidden className="md:px-6">
        <div className="h-12 border-b border-raya" />
        <div className="h-15 md:h-16" />
      </div>
    </div>
  );
}
