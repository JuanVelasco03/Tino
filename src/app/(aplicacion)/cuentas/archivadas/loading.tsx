import { CabeceraArchivadas } from "@/components/cuentas/lista-archivadas";

/** Carga de /cuentas/archivadas: cabecera y renglones vacíos, sin datos inventados. */
export default function CargandoArchivadas() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-6 md:gap-9">
      <CabeceraArchivadas />
      <div aria-hidden className="border-t border-raya">
        <div className="h-15 border-b border-linea" />
        <div className="h-15 border-b border-linea" />
        <div className="h-15" />
      </div>
    </div>
  );
}
