"use client";

import { useState } from "react";
import { formatearDiaSemana, sumarDias } from "@/domain/fecha/formato";
import { ChipCategoria } from "../chip-categoria";
import { MensajeError } from "../mensaje-error";

export type OpcionFecha = { rotulo: "Hoy" | "Ayer" | "Anteayer"; fecha: string };

/** Hoy, ayer y anteayer según `fechaHoy` de la API, nunca según el reloj del navegador. */
export function opcionesFecha(fechaHoy: string): OpcionFecha[] {
  return [
    { rotulo: "Hoy", fecha: fechaHoy },
    { rotulo: "Ayer", fecha: sumarDias(fechaHoy, -1) },
    { rotulo: "Anteayer", fecha: sumarDias(fechaHoy, -2) },
  ];
}

/** «Hoy · jue 19 nov», «Ayer · mié 18 nov» o «lun 2 nov». Sin `fechaHoy` aún, «Hoy». */
export function rotuloFecha(fecha: string, fechaHoy: string | null): string {
  if (!fechaHoy || fecha === "") return "Hoy";
  const cercana = opcionesFecha(fechaHoy).find((o) => o.fecha === fecha);
  return cercana ? `${cercana.rotulo} · ${formatearDiaSemana(fecha)}` : formatearDiaSemana(fecha);
}

type Props = {
  /** `null` mientras la captura carga. */
  fechaHoy: string | null;
  valor: string;
  alCambiar: (fecha: string) => void;
  error?: string;
};

/**
 * Fecha del movimiento en el panel de escritorio: una fila con la elegida y
 * «Cambiar», que despliega Hoy · Ayer · Anteayer · Otra fecha. «Otra fecha»
 * es un `<input type="date">` y acepta cualquier día, también futuro.
 */
export function SelectorFecha({ fechaHoy, valor, alCambiar, error }: Props) {
  const [abierto, setAbierto] = useState(false);
  const opciones = fechaHoy ? opcionesFecha(fechaHoy) : [];
  const cercana = opciones.some((o) => o.fecha === valor);
  const [otra, setOtra] = useState(valor !== "" && fechaHoy !== null && !cercana);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-h-11 items-center justify-between gap-3 border-y border-linea">
        <span className="text-etiqueta text-secundario">Fecha</span>
        <span className="flex items-center gap-3">
          <span className="text-cuerpo">{rotuloFecha(valor, fechaHoy)}</span>
          <button
            type="button"
            aria-expanded={abierto}
            onClick={() => setAbierto((a) => !a)}
            disabled={!fechaHoy}
            className="h-11 text-etiqueta font-semibold text-marca-texto disabled:text-terciario"
          >
            Cambiar
          </button>
        </span>
      </div>
      {abierto && fechaHoy && (
        <div className="flex flex-col gap-2">
          <div role="group" aria-label="Fecha" className="flex flex-wrap gap-2">
            {opciones.map((opcion) => (
              <ChipCategoria
                key={opcion.rotulo}
                etiqueta={opcion.rotulo}
                seleccionada={!otra && opcion.fecha === valor}
                onClick={() => {
                  setOtra(false);
                  alCambiar(opcion.fecha);
                }}
              />
            ))}
            <ChipCategoria etiqueta="Otra fecha" seleccionada={otra} onClick={() => setOtra(true)} />
          </div>
          {otra && (
            <input
              type="date"
              aria-label="Otra fecha"
              value={valor}
              onChange={(e) => {
                if (e.target.value !== "") alCambiar(e.target.value);
              }}
              className="h-11 rounded-none border-0 border-b border-linea bg-transparent p-0 text-cuerpo text-texto focus:border-raya"
            />
          )}
        </div>
      )}
      {error && <MensajeError mensaje={error} />}
    </div>
  );
}
