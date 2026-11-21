"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatearDinero } from "@/domain/dinero/formato";
import { importeEnPatrimonio } from "@/domain/movimiento/vista-previa";
import type { Cuenta } from "@/services/captura";
import { Boton } from "../boton";
import { CampoMonto } from "../campo-monto";
import { ChipCategoria } from "../chip-categoria";
import { EnlaceTexto } from "../enlace-texto";
import { MensajeError } from "../mensaje-error";
import { PanelLateral, type ControlPanel } from "../panel-lateral";
import { AvisoRegistro } from "./aviso-registro";
import { FichaCuenta } from "./ficha-cuenta";
import { SelectorFecha } from "./selector-fecha";
import { SelectorTipo } from "./selector-tipo";
import {
  datosAviso,
  datosOferta,
  etiquetaRegistrar,
  MAX_DESCRIPCION,
  MAX_NOTA,
  normalizar,
  type EstadoCaptura,
  type RolCuenta,
} from "./usar-captura";

export const ID_MONTO = "captura-monto";
const ID_FORMULARIO = "captura-formulario";

/** Pesos sin «COP»: toda la captura está en pesos. */
function pesos(monto: bigint): string {
  return formatearDinero({ monto, moneda: "COP" }, { omitirCOP: true });
}

/** Monto del botón con su signo: «−15.000», «+15.000» o «15.000» en transferencia. */
export function montoConSigno(c: EstadoCaptura): string | undefined {
  if (c.montoNumero === null) return undefined;
  const efecto = importeEnPatrimonio(c.valores.tipo, c.montoNumero);
  return formatearDinero({ monto: efecto ?? c.montoNumero, moneda: "COP" }, { omitirCOP: true, signoMas: efecto !== null });
}

/** «Nequi quedará en 5.321»; en un pasivo, «Visa Oro quedará en debe 1.299.300». */
function textoVistaPrevia(c: EstadoCaptura): { cuenta: string; saldo: string } | null {
  const cuenta = c.cuentaElegida;
  if (!cuenta) return null;
  const resultante = c.vistaPrevia(cuenta, "cuenta");
  if (resultante === null) return null;
  return { cuenta: cuenta.nombre, saldo: cuenta.naturaleza === "pasivo" ? `debe ${pesos(resultante)}` : pesos(resultante) };
}

/** Sin cuentas activas: no hay dónde registrar. «+ Nueva cuenta» cierra la captura y abre el alta. */
export function SinCuentas({ alIr }: { alIr: () => void }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <p className="text-cuerpo font-semibold">Para registrar necesitas una cuenta.</p>
      <EnlaceTexto href="/cuentas?cuenta=nueva" scroll={false} onClick={alIr}>
        + Nueva cuenta
      </EnlaceTexto>
    </div>
  );
}

/** `GET /captura` o `GET /cuentas` fallaron al abrir. */
export function ErrorCarga({ alReintentar }: { alReintentar: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-4">
      <p className="text-cuerpo font-semibold">No pudimos cargar el formulario.</p>
      <Boton variante="secundario" onClick={alReintentar}>
        Reintentar
      </Boton>
    </div>
  );
}

/** Renglones vacíos mientras llegan categorías y cuentas: sin datos inventados. */
function Cargando({ etiqueta }: { etiqueta: string }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-2">
      <span className="text-etiqueta text-secundario">{etiqueta}</span>
      <div aria-hidden className="h-12 rounded-campo border border-linea" />
    </div>
  );
}

function Descripcion({ c }: { c: EstadoCaptura }) {
  const { descripcion } = c.valores;
  const error = c.errores.descripcion;
  const primero = c.conceptos[0];
  // La lista sobra si su único concepto ya es lo escrito.
  const mostrarLista =
    c.conceptos.length > 0 && !(c.conceptos.length === 1 && normalizar(primero.descripcion) === normalizar(descripcion));

  function alTeclear(evento: KeyboardEvent<HTMLInputElement>) {
    // Tab acepta el primer concepto; si no hay nada que completar, Tab avanza como siempre.
    if (evento.key === "Tab" && !evento.shiftKey && primero && primero.descripcion !== descripcion) {
      evento.preventDefault();
      c.aceptarConcepto(primero.descripcion);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="captura-descripcion" className="text-etiqueta text-secundario">
        Descripción
      </label>
      <div className={`relative h-11 border-b ${error ? "border-salida" : "border-linea focus-within:border-raya"}`}>
        {/* Texto fantasma: lo escrito, invisible, y en tenue lo que completaría Tab. */}
        <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-pre text-cuerpo">
          <span className="invisible">{descripcion}</span>
          <span className="text-terciario">{c.fantasma}</span>
        </span>
        <input
          id="captura-descripcion"
          value={descripcion}
          onChange={(e) => c.cambiarDescripcion(e.target.value)}
          onKeyDown={alTeclear}
          maxLength={MAX_DESCRIPCION}
          autoComplete="off"
          placeholder="Almuerzo, taxi, recarga…"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "captura-descripcion-error" : undefined}
          className="absolute inset-0 h-11 w-full border-0 bg-transparent p-0 text-cuerpo text-texto placeholder:text-terciario"
        />
      </div>
      {mostrarLista && (
        <ul aria-label="Sugerencias" className="flex flex-col rounded-b-campo border border-t-0 border-linea">
          {c.conceptos.map((concepto, i) => (
            <li key={concepto.descripcion} className={i > 0 ? "border-t border-linea" : ""}>
              <button
                type="button"
                onClick={() => c.aceptarConcepto(concepto.descripcion)}
                className={`grid min-h-10 w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-3 text-left ${
                  i === 0 ? "bg-hundido" : "hover:bg-hundido"
                }`}
              >
                <span className="truncate text-cuerpo">{concepto.descripcion}</span>
                <span className="text-etiqueta text-secundario">{concepto.categoria?.nombre}</span>
                <kbd
                  className={`rounded-muestra border px-1 font-mono text-cifra-xs text-secundario ${
                    i === 0 ? "border-linea" : "invisible border-transparent"
                  }`}
                >
                  Tab
                </kbd>
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <MensajeError id="captura-descripcion-error" mensaje={error} />}
    </div>
  );
}

function Categorias({ c }: { c: EstadoCaptura }) {
  const { categoria } = c.valores;
  const propuestaActiva = categoria.modo === "propuesta" ? c.propuesta : null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between gap-3 text-etiqueta text-secundario">
        <span>Categoría</span>
        {propuestaActiva && <span className="text-marca-texto">Sugerida por «{propuestaActiva.regla.palabraClave}»</span>}
      </div>
      <div role="group" aria-label="Categoría" className="flex flex-wrap gap-2">
        {c.categorias.map((cat) => (
          <ChipCategoria
            key={cat.id}
            etiqueta={cat.nombre}
            estado={propuestaActiva?.categoria.id === cat.id ? "sugerida" : "normal"}
            seleccionada={categoria.modo === "elegida" && categoria.id === cat.id}
            onClick={() => c.tocarCategoria(cat.id)}
          />
        ))}
      </div>
      {c.errores.categoria && <MensajeError mensaje={c.errores.categoria} />}
    </div>
  );
}

function GrupoFichas({ c, rol, etiqueta }: { c: EstadoCaptura; rol: RolCuenta; etiqueta: string }) {
  const elegida = rol === "cuenta" ? c.valores.cuentaId : c.valores.destinoId;
  const error = rol === "cuenta" ? c.errores.cuenta : c.errores.destino;
  const elegir = (cuenta: Cuenta) => c.cambiar(rol === "cuenta" ? "cuentaId" : "destinoId", cuenta.id);
  return (
    <div className="flex flex-col gap-2">
      <span className="text-etiqueta text-secundario">{etiqueta}</span>
      <div role="group" aria-label={etiqueta} className="grid grid-cols-2 gap-2">
        {c.cuentas.map((cuenta) => (
          <FichaCuenta
            key={cuenta.id}
            cuenta={cuenta}
            elegida={cuenta.id === elegida}
            resultante={c.vistaPrevia(cuenta, rol)}
            alPulsar={() => elegir(cuenta)}
          />
        ))}
      </div>
      {error && <MensajeError mensaje={error} />}
    </div>
  );
}

/**
 * Captura rápida en escritorio (≥ 768 px): panel lateral de 480 px sobre la
 * página actual, sin cambiar la URL. Enter registra desde cualquier campo
 * salvo la nota; Escape cierra y conserva el borrador.
 */
export function PanelCaptura({ c }: { c: EstadoCaptura }) {
  const panel = useRef<ControlPanel>(null);
  const [masOpciones, setMasOpciones] = useState(() => c.valores.nota !== "");
  const { valores } = c;
  const esTransferencia = valores.tipo === "transferencia";

  // Al abrir y tras cada registro, el foco vuelve al monto.
  useEffect(() => {
    document.getElementById(ID_MONTO)?.focus();
  }, [c.registros]);

  async function cerrar() {
    await panel.current?.cerrar();
    c.cerrar();
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    void c.registrar();
  }

  const listo = c.estadoCarga === "lista" && c.captura !== null;
  const errorCarga = c.estadoCarga === "error" && c.captura === null;
  const vista = textoVistaPrevia(c);
  const predeterminada = c.predeterminada ? `Cuenta · ${c.predeterminada.nombre} es la predeterminada` : "Cuenta";

  const pie =
    errorCarga || c.sinCuentas ? undefined : (
      <div className="flex flex-col gap-2">
        {c.errorGeneral && <MensajeError mensaje={c.errorGeneral} />}
        <Boton
          type="submit"
          form={ID_FORMULARIO}
          disabled={!c.puedeRegistrar}
          monto={montoConSigno(c)}
          className="w-full justify-center"
        >
          {etiquetaRegistrar(c)}
        </Boton>
        <p className="text-etiqueta font-normal text-secundario">
          <kbd className="rounded-muestra border border-linea px-1 font-mono text-cifra-xs">↵</kbd> registra y deja el panel listo para otro
        </p>
        {vista && (
          <p className="text-right text-etiqueta font-normal text-secundario">
            {vista.cuenta} quedará en <span className="font-mono tabular-nums">{vista.saldo}</span>
          </p>
        )}
      </div>
    );

  return (
    <PanelLateral ref={panel} titulo="Registrar" ancho="amplio" alSolicitarCierre={() => void cerrar()} pie={pie}>
      <form id={ID_FORMULARIO} onSubmit={enviar} noValidate className="flex flex-col gap-6">
        <AvisoRegistro aviso={datosAviso(c)} oferta={datosOferta(c)} />

        {errorCarga ? (
          <ErrorCarga alReintentar={c.reintentar} />
        ) : c.sinCuentas ? (
          <SinCuentas alIr={c.cerrar} />
        ) : (
          <>
            <SelectorTipo valor={valores.tipo} alCambiar={c.cambiarTipo} />
            {c.errores.tipo && <MensajeError mensaje={c.errores.tipo} />}

            <CampoMonto
              valor={valores.monto}
              moneda="COP"
              signo={valores.tipo === "gasto" ? "salida" : valores.tipo === "ingreso" ? "entrada" : undefined}
              editable={{ nombre: ID_MONTO, alCambiar: (v) => c.cambiar("monto", v), error: c.errores.monto }}
            />

            <Descripcion c={c} />

            {!esTransferencia && (listo ? <Categorias c={c} /> : <Cargando etiqueta="Categoría" />)}

            {listo ? (
              esTransferencia ? (
                <>
                  <GrupoFichas c={c} rol="cuenta" etiqueta="Desde" />
                  <GrupoFichas c={c} rol="destino" etiqueta="Hacia" />
                </>
              ) : (
                <GrupoFichas c={c} rol="cuenta" etiqueta={predeterminada} />
              )
            ) : (
              <Cargando etiqueta="Cuenta" />
            )}

            <SelectorFecha
              fechaHoy={c.captura?.fechaHoy ?? null}
              valor={valores.fecha}
              alCambiar={(fecha) => c.cambiar("fecha", fecha)}
              error={c.errores.fecha}
            />

            <div className="flex flex-col">
              <button
                type="button"
                aria-expanded={masOpciones}
                onClick={() => setMasOpciones((m) => !m)}
                className="flex min-h-11 items-center justify-between border-b border-linea text-left text-cuerpo"
              >
                <span>
                  Más opciones <span className="text-secundario">· nota</span>
                </span>
                <span className="flex text-secundario">
                  {masOpciones ? (
                    <ChevronUp size={18} strokeWidth={1.5} aria-hidden />
                  ) : (
                    <ChevronDown size={18} strokeWidth={1.5} aria-hidden />
                  )}
                </span>
              </button>
              {masOpciones && (
                <label className="flex flex-col gap-1 pt-4">
                  <span className="text-etiqueta text-secundario">Nota</span>
                  <textarea
                    value={valores.nota}
                    onChange={(e) => c.cambiar("nota", e.target.value)}
                    maxLength={MAX_NOTA}
                    rows={3}
                    aria-invalid={c.errores.nota ? true : undefined}
                    className={`resize-none rounded-none border-0 border-b bg-transparent p-0 py-2 text-cuerpo text-texto ${
                      c.errores.nota ? "border-salida" : "border-linea focus:border-raya"
                    }`}
                  />
                  {c.errores.nota && <MensajeError mensaje={c.errores.nota} />}
                </label>
              )}
            </div>
          </>
        )}
      </form>
    </PanelLateral>
  );
}
