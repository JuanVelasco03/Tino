"use client";

import { useMemo, useState, useTransition, type DragEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDownUp, Check, Plus } from "lucide-react";
import { moverA, ordenCambio } from "@/domain/cuenta/orden";
import { formatearFecha, formatearFechaSinAnio } from "@/domain/fecha/formato";
import type { CambioOrden, Cuenta, ListaCuentas as Lista, Naturaleza, ResultadoOrden } from "@/services/cuentas";
import { EstadoVacio } from "../estado-vacio";
import { CierrePatrimonio } from "./cierre-patrimonio";
import { FilaCuenta } from "./fila-cuenta";
import { GrupoCuentas } from "./grupo-cuentas";

type Props = {
  lista: Lista;
  /** Server action; llega por prop desde la página (los componentes no importan `app/`). */
  guardarOrden: (cambios: CambioOrden[]) => Promise<ResultadoOrden>;
};

type Orden = Record<Naturaleza, string[]>;

const NATURALEZAS: readonly Naturaleza[] = ["activo", "pasivo"];

const RUTA_NUEVA = "/cuentas?cuenta=nueva";

const AVISO_ORDEN_INVALIDO = "Tu lista cambió. La recargamos; vuelve a ordenar.";

function ordenDe(lista: Lista): Orden {
  return {
    activo: lista.activos.cuentas.map((c) => c.id),
    pasivo: lista.pasivos.cuentas.map((c) => c.id),
  };
}

/**
 * Lista de cuentas: cabecera, Activos, Pasivos y cierre. Dibuja el arreglo de
 * la API tal como llega (N-25). En modo «Ordenar» el orden es local hasta «Listo».
 */
export function ListaCuentas({ lista, guardarOrden }: Props) {
  const router = useRouter();
  const [ordenando, setOrdenando] = useState(false);
  const [orden, setOrden] = useState<Orden>(() => ordenDe(lista));
  const [arrastre, setArrastre] = useState<{ id: string; naturaleza: Naturaleza } | null>(null);
  const [destino, setDestino] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, iniciarGuardado] = useTransition();

  const original = useMemo(() => ordenDe(lista), [lista]);
  const porId = useMemo(
    () => new Map<string, Cuenta>([...lista.activos.cuentas, ...lista.pasivos.cuentas].map((c) => [c.id, c])),
    [lista],
  );

  const sinCuentas = lista.activos.cuentas.length === 0 && lista.pasivos.cuentas.length === 0;
  const grupos = { activo: lista.activos, pasivo: lista.pasivos };

  function empezarAOrdenar() {
    setOrden(original);
    setAviso(null);
    setOrdenando(true);
  }

  function mover(naturaleza: Naturaleza, id: string, posicion: number) {
    setOrden((actual) => ({ ...actual, [naturaleza]: moverA(actual[naturaleza], id, posicion) }));
  }

  function terminar() {
    setAviso(null);
    const cambios: CambioOrden[] = NATURALEZAS.filter((n) => ordenCambio(original[n], orden[n])).map((n) => ({
      naturaleza: n,
      ids: orden[n],
    }));

    // Nada cambió: sin petición.
    if (cambios.length === 0) {
      setOrdenando(false);
      return;
    }

    iniciarGuardado(async () => {
      const resultado = await guardarOrden(cambios);
      if (resultado.ok) {
        setOrdenando(false);
        return;
      }
      if (resultado.codigo === "ORDEN_INVALIDO") {
        // La lista local está desactualizada: se descarta y se recarga.
        setOrdenando(false);
        setAviso(AVISO_ORDEN_INVALIDO);
        router.refresh();
        return;
      }
      // Otro fallo: se conserva el orden local para reintentar.
      setAviso(resultado.mensaje);
    });
  }

  function alternarOrden() {
    if (ordenando) terminar();
    else empezarAOrdenar();
  }

  function limpiarArrastre() {
    setArrastre(null);
    setDestino(null);
  }

  function filas(naturaleza: Naturaleza) {
    if (!ordenando) {
      return grupos[naturaleza].cuentas.map((cuenta) => <FilaCuenta key={cuenta.id} cuenta={cuenta} />);
    }

    const ids = orden[naturaleza].filter((id) => porId.has(id));
    return ids.map((id, i) => {
      const cuenta = porId.get(id) as Cuenta;
      const mismoGrupo = arrastre !== null && arrastre.naturaleza === naturaleza;

      return (
        <FilaCuenta
          key={id}
          cuenta={cuenta}
          orden={{
            puedeSubir: i > 0 && !guardando,
            puedeBajar: i < ids.length - 1 && !guardando,
            alSubir: () => mover(naturaleza, id, i - 1),
            alBajar: () => mover(naturaleza, id, i + 1),
            resaltada: mismoGrupo && destino === id && arrastre.id !== id,
            alEmpezarArrastre: (e: DragEvent<HTMLLIElement>) => {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", id);
              setArrastre({ id, naturaleza });
            },
            alArrastrarEncima: (e: DragEvent<HTMLLIElement>) => {
              // Solo dentro del grupo: sin `preventDefault` el navegador no permite soltar.
              if (!mismoGrupo) {
                if (destino !== null) setDestino(null);
                return;
              }
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (destino !== id) setDestino(id);
            },
            alSoltar: (e: DragEvent<HTMLLIElement>) => {
              e.preventDefault();
              if (mismoGrupo) mover(naturaleza, arrastre.id, i);
              limpiarArrastre();
            },
            alTerminarArrastre: limpiarArrastre,
          }}
        />
      );
    });
  }

  const etiquetaOrden = guardando ? "Guardando…" : ordenando ? "Listo" : "Ordenar";

  return (
    <div className="flex flex-col gap-6 md:gap-9">
      <header className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between md:gap-6">
        <div className="flex flex-col gap-1 md:gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-titulo-1">Cuentas</h1>
            <button
              type="button"
              onClick={alternarOrden}
              disabled={sinCuentas || guardando}
              className="h-11 px-1 text-cuerpo font-semibold text-marca-texto disabled:cursor-not-allowed disabled:text-terciario md:hidden"
            >
              {etiquetaOrden}
            </button>
          </div>
          <p className="text-etiqueta font-normal text-secundario">
            <span className="hidden md:inline">Saldos al {formatearFecha(lista.fechaSaldos)}</span>
            <span className="md:hidden">Al {formatearFechaSinAnio(lista.fechaSaldos)}</span>
          </p>
        </div>

        <div className="hidden gap-3 md:flex">
          <button
            type="button"
            onClick={alternarOrden}
            disabled={sinCuentas || guardando}
            className={`flex h-11 items-center gap-2 rounded-campo border bg-superficie px-4 text-cuerpo font-medium text-texto disabled:cursor-not-allowed disabled:text-terciario ${
              ordenando ? "border-texto" : "border-linea"
            }`}
          >
            {ordenando ? (
              <Check size={18} strokeWidth={1.5} aria-hidden />
            ) : (
              <ArrowDownUp size={18} strokeWidth={1.5} aria-hidden />
            )}
            {etiquetaOrden}
          </button>
          <Link
            href={RUTA_NUEVA}
            scroll={false}
            className="flex h-11 items-center gap-2 rounded-campo bg-texto px-4 text-cuerpo font-semibold text-fondo"
          >
            <Plus size={18} strokeWidth={1.5} aria-hidden />
            Nueva cuenta
          </Link>
        </div>
      </header>

      {aviso && (
        <p role="alert" className="-mt-3 text-etiqueta font-normal text-salida-texto md:-mt-6">
          {aviso}
        </p>
      )}

      {sinCuentas ? (
        <EstadoVacio
          rotulo="Cuentas"
          titulo="Aún no tienes cuentas."
          detalle="Crea tu primera cuenta para ver tu patrimonio."
          accion={{ etiqueta: "Nueva cuenta", href: RUTA_NUEVA, scroll: false }}
        />
      ) : (
        <>
          <div className="flex flex-col gap-6 md:gap-9">
            {NATURALEZAS.map((naturaleza) => (
              <GrupoCuentas
                key={naturaleza}
                naturaleza={naturaleza}
                total={grupos[naturaleza].total}
                vacio={grupos[naturaleza].cuentas.length === 0}
              >
                {filas(naturaleza)}
              </GrupoCuentas>
            ))}
          </div>
          <Link
            href={RUTA_NUEVA}
            scroll={false}
            className="-my-3 flex h-11 items-center self-start text-cuerpo font-semibold text-marca-texto md:hidden"
          >
            + Nueva cuenta
          </Link>
          <CierrePatrimonio
            activos={lista.activos.total}
            pasivos={lista.pasivos.total}
            patrimonioNeto={lista.patrimonioNeto}
          />
        </>
      )}

      <Link
        href="/cuentas/archivadas"
        className={`flex h-11 items-center self-start text-cuerpo font-semibold text-marca-texto ${sinCuentas ? "" : "-mt-3 md:-mt-6 md:px-6"}`}
      >
        Ver archivadas
      </Link>
    </div>
  );
}
