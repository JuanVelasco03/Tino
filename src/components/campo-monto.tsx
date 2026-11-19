"use client";

import type { ChangeEvent } from "react";
import type { Moneda } from "@/domain/dinero/formato";
import { formatearEntradaPesos } from "@/domain/dinero/entrada";

export type MontoEditable = {
  alCambiar: (valor: string) => void;
  /** `name` e `id` del input. */
  nombre: string;
  /** Mensaje bajo el campo; marca el input como inválido. */
  error?: string;
  /** Nota secundaria bajo el campo («Cambiarlo queda registrado.»). */
  nota?: string;
  deshabilitado?: boolean;
};

type Props = {
  /** Lo tecleado, ya formateado («18.500», «120,00»). Vacío = sin valor aún. */
  valor: string;
  moneda: Moneda;
  etiqueta?: string;
  /** Línea de equivalencia bajo el campo (dólares): «≈ 492.000 COP · TRM 4.100,00». */
  equivalencia?: string;
  /** Con ella, el campo es un input real que formatea pesos al teclear. Sin ella, solo presenta. */
  editable?: MontoEditable;
};

/**
 * Posición del cursor tras formatear: la misma cantidad de dígitos a su
 * izquierda que antes. Los ceros a la izquierda que se quitan no cuentan.
 */
function cursorTrasFormato(crudo: string, cursor: number, formateado: string): number {
  const digitosAntes = crudo.slice(0, cursor).replace(/\D/g, "").replace(/^0+/, "").length;
  if (digitosAntes === 0) return formateado === "0" ? formateado.length : 0;

  let vistos = 0;
  for (let i = 0; i < formateado.length; i++) {
    if (/\d/.test(formateado[i])) vistos++;
    if (vistos === digitosAntes) return i + 1;
  }
  return formateado.length;
}

function CampoEditable({ valor, moneda, etiqueta, editable }: Required<Pick<Props, "valor" | "moneda" | "etiqueta" | "editable">>) {
  const { alCambiar, nombre, error, nota, deshabilitado } = editable;
  const idError = `${nombre}-error`;
  const idNota = `${nombre}-nota`;
  const descritoPor = [error && idError, nota && idNota].filter(Boolean).join(" ") || undefined;

  function alEscribir(evento: ChangeEvent<HTMLInputElement>) {
    const input = evento.currentTarget;
    const crudo = input.value;
    const formateado = formatearEntradaPesos(crudo);
    const cursor = cursorTrasFormato(crudo, input.selectionStart ?? crudo.length, formateado);

    // Se escribe en el DOM antes de avisar: React encuentra el mismo valor y no mueve el cursor.
    input.value = formateado;
    input.setSelectionRange(cursor, cursor);
    alCambiar(formateado);
  }

  return (
    <div className="flex flex-col gap-1">
      <div className={`border-b pb-3 pt-2 ${error ? "border-salida" : "border-raya"}`}>
        <label htmlFor={nombre} className="mb-1 block text-etiqueta text-secundario">
          {etiqueta}
        </label>
        <div className="flex items-baseline gap-2">
          <input
            id={nombre}
            name={nombre}
            value={valor}
            onChange={alEscribir}
            inputMode="numeric"
            autoComplete="off"
            placeholder="0"
            disabled={deshabilitado}
            aria-invalid={error ? true : undefined}
            aria-describedby={descritoPor}
            className="min-w-0 flex-1 border-0 bg-transparent p-0 font-mono text-cifra-campo tabular-nums text-texto caret-marca outline-none placeholder:text-terciario disabled:text-terciario"
          />
          <span className="text-etiqueta text-secundario">{moneda}</span>
        </div>
      </div>
      {nota && (
        <p id={idNota} className="text-etiqueta font-normal text-secundario">
          {nota}
        </p>
      )}
      {error && (
        <p id={idError} role="alert" className="text-etiqueta font-normal text-salida-texto">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * C4 · Campo de monto. Vacío muestra un 0 en terciario y el cursor de marca;
 * con valor, la cifra va en tinta. Con `editable` es un input real (pesos).
 */
export function CampoMonto({ valor, moneda, etiqueta = "Monto", equivalencia, editable }: Props) {
  if (editable) return <CampoEditable valor={valor} moneda={moneda} etiqueta={etiqueta} editable={editable} />;

  const vacio = valor === "";

  return (
    <div role="group" aria-label={etiqueta} className="border-b border-raya pb-3 pt-2">
      <div className="mb-1 text-etiqueta text-secundario">{etiqueta}</div>
      <div className="flex items-baseline gap-2">
        <span
          className={`font-mono text-cifra-campo tabular-nums ${vacio ? "text-terciario" : ""}`}
        >
          {vacio ? "0" : valor}
        </span>
        {vacio && <span aria-hidden className="h-10 w-0.5 self-center bg-marca" />}
        <span className="ml-auto text-etiqueta text-secundario">{moneda}</span>
      </div>
      {equivalencia && (
        <div className="mt-1 font-mono text-cifra-xs tabular-nums text-secundario">
          {equivalencia}
        </div>
      )}
    </div>
  );
}
