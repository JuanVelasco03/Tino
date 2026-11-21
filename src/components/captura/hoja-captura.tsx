"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode, type SyntheticEvent } from "react";
import { Check, X } from "lucide-react";
import { formatearDinero } from "@/domain/dinero/formato";
import { formatearDiaSemana, formatearFechaSinAnio } from "@/domain/fecha/formato";
import type { Cuenta } from "@/services/captura";
import { Boton } from "../boton";
import { ChipCategoria } from "../chip-categoria";
import { IconoCuenta, ROTULO_TIPO_CUENTA } from "../iconos";
import { MensajeError } from "../mensaje-error";
import { AvisoRegistro } from "./aviso-registro";
import { ErrorCarga, SinCuentas } from "./panel-captura";
import { opcionesFecha } from "./selector-fecha";
import { SelectorTipo } from "./selector-tipo";
import { TecladoNumerico } from "./teclado-numerico";
import { datosAviso, datosOferta, etiquetaRegistrar, MAX_DESCRIPCION, type EstadoCaptura, type RolCuenta } from "./usar-captura";

type Hoja = "categoria" | "cuenta" | "destino" | "fecha";

/** Pesos sin «COP». */
function pesos(monto: bigint): string {
  return formatearDinero({ monto, moneda: "COP" }, { omitirCOP: true });
}

/** Curva de `globals.css`: WAAPI no acepta `var()`. */
function curva(nombre: "llegada" | "retirada"): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${nombre}`).trim() || "ease-out";
}

/** Sube desde abajo (380 ms) y baja más rápido (200 ms). Con movimiento reducido, solo se funde. */
function recorrido(): { cuadros: Keyframe[]; entrada: number; salida: number } {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return { cuadros: [{ opacity: 0 }, { opacity: 1 }], entrada: 150, salida: 120 };
  }
  return { cuadros: [{ transform: "translateY(100%)" }, { transform: "none" }], entrada: 380, salida: 200 };
}

/** Hoja inferior dentro de la captura (categoría, cuenta, fecha), con velo y «Listo». */
function HojaInferior({ titulo, alCerrar, children }: { titulo: string; alCerrar: () => void; children: ReactNode }) {
  const listo = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    listo.current?.focus();
  }, []);

  return (
    <>
      <div aria-hidden className="absolute inset-0 z-10 bg-fondo opacity-60" onClick={alCerrar} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="absolute inset-x-0 bottom-0 z-10 flex max-h-[80dvh] flex-col rounded-t-hoja border-t border-raya bg-superficie px-4 pb-[max(24px,env(safe-area-inset-bottom))]"
      >
        <div className="flex h-14 shrink-0 items-center justify-between">
          <span className="text-cuerpo font-semibold">{titulo}</span>
          <button ref={listo} type="button" onClick={alCerrar} className="h-11 px-1 text-cuerpo font-semibold text-marca-texto">
            Listo
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto">{children}</div>
      </div>
    </>
  );
}

/** Fila de lista en una hoja inferior: icono, nombre y detalle, cifra a la derecha y marca en la elegida. */
function FilaHoja({
  icono,
  nombre,
  detalle,
  previo,
  cifra,
  elegida,
  alPulsar,
}: {
  icono?: ReactNode;
  nombre: string;
  detalle?: string;
  previo?: string;
  cifra?: string;
  elegida: boolean;
  alPulsar: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={elegida}
      onClick={alPulsar}
      className="grid min-h-14 w-full grid-cols-[20px_minmax(0,1fr)_auto_20px] items-center gap-3 border-b border-linea px-1 text-left"
    >
      <span className="flex text-secundario">{icono}</span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-cuerpo font-medium">{nombre}</span>
        {detalle && <span className="truncate text-etiqueta text-secundario">{detalle}</span>}
      </span>
      <span className="flex flex-col items-end">
        {previo && <span className="text-rotulo uppercase text-secundario">{previo}</span>}
        {cifra && <span className="font-mono text-cifra-s tabular-nums">{cifra}</span>}
      </span>
      <span className="flex">{elegida && <Check size={18} strokeWidth={1.5} aria-hidden />}</span>
    </button>
  );
}

/** Celda de la fila Categoría │ Cuenta │ Fecha: rótulo arriba y valor; abre su hoja. */
function Celda({
  rotulo,
  valor,
  vacio = false,
  etiqueta,
  primera = false,
  alPulsar,
}: {
  rotulo: string;
  valor: string;
  vacio?: boolean;
  etiqueta?: string;
  primera?: boolean;
  alPulsar: () => void;
}) {
  return (
    <button
      type="button"
      onClick={alPulsar}
      className={`flex h-14 min-w-0 flex-col items-start justify-center pl-4 text-left ${primera ? "" : "border-l border-linea"}`}
    >
      <span className="text-rotulo uppercase text-secundario">{rotulo}</span>
      <span className="flex max-w-full items-baseline gap-2 text-cuerpo font-medium">
        <span className={`truncate ${vacio ? "punteada text-secundario" : ""}`}>{valor}</span>
        {etiqueta && <span className="font-mono text-rotulo font-normal text-marca-texto">{etiqueta}</span>}
      </span>
    </button>
  );
}

function rotuloFechaCorto(fecha: string, fechaHoy: string | null): string {
  if (!fechaHoy || fecha === "") return "Hoy";
  return opcionesFecha(fechaHoy).find((o) => o.fecha === fecha)?.rotulo ?? formatearFechaSinAnio(fecha);
}

/**
 * Captura rápida en móvil (< 768 px): `<dialog>` a pantalla completa, sobre
 * la barra de pestañas, con teclado numérico propio. Misma lógica que el
 * panel de escritorio (`useCaptura`).
 */
export function HojaCaptura({ c }: { c: EstadoCaptura }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const saliendo = useRef<Promise<void> | null>(null);
  const [hoja, setHoja] = useState<Hoja | null>(null);
  const { valores } = c;
  const esTransferencia = valores.tipo === "transferencia";

  useEffect(() => {
    const el = dialogo.current;
    if (!el) return;
    if (!el.open) el.showModal();
    const { cuadros, entrada } = recorrido();
    const animacion = el.animate(cuadros, { duration: entrada, easing: curva("llegada") });
    return () => {
      animacion.cancel();
      el.close();
    };
  }, []);

  async function cerrar() {
    const el = dialogo.current;
    if (!el) return c.cerrar();
    if (!saliendo.current) {
      el.inert = true;
      const { cuadros, salida } = recorrido();
      const animacion = el.animate(cuadros, { duration: salida, easing: curva("retirada"), direction: "reverse", fill: "forwards" });
      saliendo.current = animacion.finished.then(
        () => undefined,
        () => undefined,
      );
    }
    await saliendo.current;
    c.cerrar();
  }

  function alCancelar(evento: SyntheticEvent<HTMLDialogElement>) {
    // Escape cierra primero la hoja inferior; después, la captura.
    evento.preventDefault();
    if (hoja) setHoja(null);
    else void cerrar();
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    void c.registrar();
  }

  const fechaHoy = c.captura?.fechaHoy ?? null;
  const gastosHoy = c.captura?.gastosHoy ?? 0n;
  const errorCarga = c.estadoCarga === "error" && c.captura === null;
  const listo = c.captura !== null;

  // Monto: «0» tenue vacío; cifra-campo si pasa de 9 caracteres.
  const montoTexto = valores.monto === "" ? "0" : valores.monto;
  const tamano = montoTexto.length > 9 ? "text-cifra-campo" : "text-cifra-xl";
  const signo = valores.monto === "" ? "" : valores.tipo === "gasto" ? "−" : valores.tipo === "ingreso" ? "+" : "";

  const propuestaActiva = valores.categoria.modo === "propuesta" ? c.propuesta : null;
  const categoriaElegida =
    valores.categoria.modo === "elegida"
      ? (c.categorias.find((cat) => valores.categoria.modo === "elegida" && cat.id === valores.categoria.id) ?? null)
      : (propuestaActiva?.categoria ?? null);

  // Sin texto: los frecuentes del tipo. Al escribir: las sugerencias.
  const conTexto = valores.descripcion.trim() !== "";
  const chips = conTexto ? c.conceptos.map((co) => co.descripcion) : (c.captura?.conceptosFrecuentes[valores.tipo] ?? []);

  const nombreCuenta = (id: string | null) => c.cuentas.find((cu) => cu.id === id)?.nombre ?? null;

  const erroresPie = [c.errores.tipo, c.errores.categoria, c.errores.cuenta, c.errores.destino, c.errores.fecha, c.errores.nota, c.errorGeneral].filter(
    (e): e is string => Boolean(e),
  );

  function listaCuentas(rol: RolCuenta) {
    const elegida = rol === "cuenta" ? valores.cuentaId : valores.destinoId;
    return c.cuentas.map((cuenta: Cuenta) => (
      <FilaHoja
        key={cuenta.id}
        icono={<IconoCuenta tipo={cuenta.tipo} />}
        nombre={cuenta.nombre}
        detalle={cuenta.naturaleza === "pasivo" ? `${ROTULO_TIPO_CUENTA[cuenta.tipo]} · pasivo` : ROTULO_TIPO_CUENTA[cuenta.tipo]}
        previo={cuenta.naturaleza === "pasivo" ? "Debes" : undefined}
        cifra={pesos(cuenta.saldo)}
        elegida={cuenta.id === elegida}
        alPulsar={() => {
          c.cambiar(rol === "cuenta" ? "cuentaId" : "destinoId", cuenta.id);
          setHoja(null);
        }}
      />
    ));
  }

  return (
    <dialog
      ref={dialogo}
      aria-label="Registrar"
      onCancel={alCancelar}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-fondo p-0 text-texto backdrop:bg-fondo"
    >
      <form onSubmit={enviar} noValidate className="relative flex h-dvh flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 pr-4 pl-1">
          <button type="button" aria-label="Cerrar" onClick={() => void cerrar()} className="flex size-11 shrink-0 items-center justify-center">
            <X size={20} strokeWidth={1.5} aria-hidden />
          </button>
          <SelectorTipo variante="pestanas" valor={valores.tipo} alCambiar={c.cambiarTipo} />
          {gastosHoy > 0n && (
            <div className="ml-auto shrink-0 text-right">
              <div className="text-rotulo uppercase text-secundario">Hoy</div>
              <div className="font-mono text-cifra-xs tabular-nums">{pesos(-gastosHoy)}</div>
            </div>
          )}
        </header>

        {errorCarga || c.sinCuentas ? (
          <div className="flex flex-1 flex-col justify-center px-4">
            {errorCarga ? <ErrorCarga alReintentar={c.reintentar} /> : <SinCuentas alIr={c.cerrar} />}
          </div>
        ) : (
          <>
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6">
              <div role="group" aria-label="Monto" className="flex max-w-full items-baseline gap-2">
                {signo && (
                  <span aria-hidden className={`font-mono text-cifra-l ${valores.tipo === "gasto" ? "text-salida" : "text-entrada"}`}>
                    {signo}
                  </span>
                )}
                <output aria-live="polite" className={`truncate font-mono tabular-nums ${tamano} ${valores.monto === "" ? "text-terciario" : ""}`}>
                  {montoTexto}
                </output>
                <span className="text-etiqueta text-secundario">COP</span>
              </div>
              {c.errores.monto && <MensajeError mensaje={c.errores.monto} />}
              <input
                aria-label="Descripción"
                value={valores.descripcion}
                onChange={(e) => c.cambiarDescripcion(e.target.value)}
                maxLength={MAX_DESCRIPCION}
                autoComplete="off"
                enterKeyHint="done"
                placeholder="¿En qué? Escribe o elige abajo"
                className={`h-11 w-full max-w-[280px] rounded-none border-0 border-b bg-transparent p-0 text-center text-cuerpo text-texto placeholder:text-terciario ${
                  c.errores.descripcion ? "border-salida" : "border-linea focus:border-raya"
                }`}
              />
              <div className="flex min-h-4 items-center">
                {c.errores.descripcion ? (
                  <MensajeError mensaje={c.errores.descripcion} />
                ) : (
                  propuestaActiva && (
                    <span className="font-mono text-cifra-xs text-marca-texto">
                      Regla «{propuestaActiva.regla.palabraClave}» → {propuestaActiva.categoria.nombre}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="flex h-14 shrink-0 items-start gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
              {chips.length > 0 ? (
                chips.map((concepto) => (
                  <ChipCategoria
                    key={concepto}
                    etiqueta={concepto}
                    seleccionada={concepto === valores.descripcion}
                    onClick={() => c.aceptarConcepto(concepto === valores.descripcion ? "" : concepto)}
                  />
                ))
              ) : !conTexto && listo ? (
                <p className="flex h-11 items-center text-etiqueta font-normal text-secundario">Tus conceptos frecuentes aparecerán aquí.</p>
              ) : null}
            </div>

            <div className="grid h-14 shrink-0 grid-cols-[1.25fr_1fr_0.9fr] border-t border-linea">
              {esTransferencia ? (
                <>
                  <Celda primera rotulo="Desde" valor={nombreCuenta(valores.cuentaId) ?? "Elegir"} vacio={!valores.cuentaId} alPulsar={() => setHoja("cuenta")} />
                  <Celda rotulo="Hacia" valor={nombreCuenta(valores.destinoId) ?? "Elegir"} vacio={!valores.destinoId} alPulsar={() => setHoja("destino")} />
                </>
              ) : (
                <>
                  <Celda
                    primera
                    rotulo="Categoría"
                    valor={categoriaElegida?.nombre ?? "Sin categoría"}
                    vacio={!categoriaElegida}
                    etiqueta={propuestaActiva ? "auto" : undefined}
                    alPulsar={() => setHoja("categoria")}
                  />
                  <Celda rotulo="Cuenta" valor={nombreCuenta(valores.cuentaId) ?? "Elegir"} vacio={!valores.cuentaId} alPulsar={() => setHoja("cuenta")} />
                </>
              )}
              <Celda rotulo="Fecha" valor={rotuloFechaCorto(valores.fecha, fechaHoy)} alPulsar={() => setHoja("fecha")} />
            </div>

            <TecladoNumerico valor={valores.monto} alCambiar={(v) => c.cambiar("monto", v)} />

            <div className="relative shrink-0 px-4 pt-3 pb-[max(24px,env(safe-area-inset-bottom))]">
              <div className="absolute inset-x-4 bottom-full mb-2">
                <AvisoRegistro formato="hoja" aviso={datosAviso(c)} oferta={datosOferta(c)} />
              </div>
              {erroresPie.map((error) => (
                <MensajeError key={error} mensaje={error} className="pb-2" />
              ))}
              <Boton
                type="submit"
                disabled={!c.puedeRegistrar}
                monto={c.montoNumero === null ? undefined : pesos(c.montoNumero)}
                className="w-full justify-center"
              >
                {etiquetaRegistrar(c)}
              </Boton>
            </div>
          </>
        )}
      </form>

      {hoja === "categoria" && (
        <HojaInferior titulo="Categoría" alCerrar={() => setHoja(null)}>
          <div className="flex flex-wrap gap-2 pb-2">
            {c.categorias.map((cat) => (
              <ChipCategoria
                key={cat.id}
                etiqueta={cat.nombre}
                estado={propuestaActiva?.categoria.id === cat.id ? "sugerida" : "normal"}
                seleccionada={valores.categoria.modo === "elegida" && valores.categoria.id === cat.id}
                onClick={() => {
                  c.tocarCategoria(cat.id);
                  setHoja(null);
                }}
              />
            ))}
          </div>
        </HojaInferior>
      )}

      {(hoja === "cuenta" || hoja === "destino") && (
        <HojaInferior titulo={hoja === "destino" ? "Hacia" : esTransferencia ? "Desde" : "Cuenta"} alCerrar={() => setHoja(null)}>
          <div className="border-t border-linea">{listaCuentas(hoja)}</div>
        </HojaInferior>
      )}

      {hoja === "fecha" && fechaHoy && (
        <HojaInferior titulo="Fecha" alCerrar={() => setHoja(null)}>
          <div className="border-t border-linea">
            {opcionesFecha(fechaHoy).map((opcion) => (
              <FilaHoja
                key={opcion.rotulo}
                nombre={opcion.rotulo}
                detalle={formatearDiaSemana(opcion.fecha)}
                elegida={valores.fecha === opcion.fecha}
                alPulsar={() => {
                  c.cambiar("fecha", opcion.fecha);
                  setHoja(null);
                }}
              />
            ))}
            <label className="flex min-h-14 flex-col justify-center gap-1 border-b border-linea px-1">
              <span className="text-etiqueta text-secundario">Otra fecha</span>
              <input
                type="date"
                value={valores.fecha}
                onChange={(e) => {
                  if (e.target.value !== "") c.cambiar("fecha", e.target.value);
                }}
                className="h-11 rounded-none border-0 bg-transparent p-0 text-cuerpo text-texto"
              />
            </label>
          </div>
        </HojaInferior>
      )}
    </dialog>
  );
}
