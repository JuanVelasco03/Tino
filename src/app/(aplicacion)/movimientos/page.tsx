import { LibroMovimientos } from "@/components/movimientos/libro-movimientos";
import { formatearMes } from "@/domain/fecha/formato";
import { listarDelMes } from "@/services/movimientos";

export const metadata = { title: "Movimientos · Tino" };

/** Movimientos del mes actual, en solo lectura (`GET /movimientos` sin `mes`). */
export default async function PaginaMovimientos() {
  const { mes, movimientos } = await listarDelMes();
  const nombreMes = formatearMes(mes);

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h1 className="text-titulo-1">Movimientos</h1>
        <p className="text-etiqueta text-secundario">{nombreMes}</p>
      </header>
      <LibroMovimientos mes={mes} movimientos={movimientos} nombreMes={nombreMes.split(" ")[0].toLowerCase()} />
    </div>
  );
}
