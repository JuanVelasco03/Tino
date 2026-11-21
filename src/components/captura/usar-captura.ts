"use client";

import { useEffect, useRef, useState } from "react";
import { ofertaDeRegla, type Oferta } from "@/domain/categorizacion/oferta";
import type { Sentido } from "@/domain/cuenta/naturaleza";
import {
  cuerpoDesdeValores,
  montoValido,
  type Categoria,
  type DecisionCategoria,
  type Propuesta,
} from "@/domain/movimiento/cuerpo";
import { saldoResultante } from "@/domain/movimiento/vista-previa";
import type { DatosAviso, DatosOferta } from "./aviso-registro";
import type { Cuenta, DatosCaptura, ResultadoCarga, ResultadoSugerencias, Sugerencias } from "@/services/captura";
import type {
  CampoCaptura,
  Movimiento,
  MovimientoCuerpo,
  ResultadoRegistro,
  ResultadoSimple,
  TipoMovimiento,
  ValoresCaptura,
} from "@/services/movimientos";

/** Server actions; llegan por prop desde el layout (los componentes no importan `app/`). */
export type AccionesCaptura = {
  cargar: () => Promise<ResultadoCarga>;
  sugerir: (tipo: TipoMovimiento, texto: string) => Promise<ResultadoSugerencias>;
  registrar: (cuerpo: MovimientoCuerpo) => Promise<ResultadoRegistro>;
  deshacer: (id: string) => Promise<ResultadoSimple>;
  crearRegla: (palabraClave: string, categoriaId: string) => Promise<ResultadoSimple>;
  ajustarRegla: (id: string, categoriaId: string) => Promise<ResultadoSimple>;
};

/** Rol de una cuenta en el movimiento: de dónde sale o a dónde entra el dinero. */
export type RolCuenta = "cuenta" | "destino";

type Errores = Partial<Record<CampoCaptura, string>>;

type EstadoCarga = "inactiva" | "cargando" | "error" | "lista";

/** Respuesta de `/sugerencias` con lo que se pidió, para saber si sigue vigente. */
type SugerenciasPara = { tipo: TipoMovimiento; texto: string; datos: Sugerencias };

export type Aviso = { movimiento: Movimiento; deshaciendo: boolean; error: string | null };
export type EstadoOferta = { oferta: Oferta; pendiente: boolean; error: string | null };

/** Espera tras la última tecla antes de pedir sugerencias. */
const ESPERA_SUGERENCIAS_MS = 150;
/** Plazo para deshacer un registro (y del resaltado en la lista). */
const PLAZO_AVISO_MS = 5000;
/** Largo máximo de `texto` en `GET /sugerencias` y de la descripción. */
export const MAX_DESCRIPCION = 80;
export const MAX_NOTA = 500;

const VALORES_INICIALES: ValoresCaptura = {
  tipo: "gasto",
  monto: "",
  descripcion: "",
  categoria: { modo: "propuesta" },
  cuentaId: null,
  destinoId: null,
  fecha: "",
  nota: "",
};

/** Sin mayúsculas ni tildes, como compara la API («cafe» = «Café»). */
export function normalizar(texto: string): string {
  return texto.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function sentidoDe(tipo: TipoMovimiento, rol: RolCuenta): Sentido {
  if (rol === "destino") return "entrada";
  return tipo === "ingreso" ? "entrada" : "salida";
}

/**
 * La lógica de la captura rápida, una sola para sus dos presentaciones (panel
 * en escritorio, hoja en móvil). Vive en el proveedor del layout: cerrar
 * conserva el borrador; registrar lo limpia.
 */
export function useCaptura(acciones: AccionesCaptura) {
  const [abierto, setAbierto] = useState(false);
  const [estadoCarga, setEstadoCarga] = useState<EstadoCarga>("inactiva");
  const [datos, setDatos] = useState<DatosCaptura | null>(null);
  const [valores, setValores] = useState<ValoresCaptura>(VALORES_INICIALES);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [sugerencias, setSugerencias] = useState<SugerenciasPara | null>(null);
  const [registrando, setRegistrando] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [oferta, setOferta] = useState<EstadoOferta | null>(null);
  /** Sube con cada registro: la presentación devuelve el foco al monto. */
  const [registros, setRegistros] = useState(0);

  const secuenciaCarga = useRef(0);
  const secuenciaSugerencias = useRef(0);
  const esperaSugerencias = useRef<ReturnType<typeof setTimeout> | null>(null);
  const plazoAviso = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Bloqueo síncrono: dos Enter seguidos no registran dos veces. */
  const enCurso = useRef(false);

  useEffect(
    () => () => {
      if (esperaSugerencias.current) clearTimeout(esperaSugerencias.current);
      if (plazoAviso.current) clearTimeout(plazoAviso.current);
    },
    [],
  );

  /* ── Carga ─────────────────────────────────────────────────────────── */

  /**
   * `GET /captura` y `GET /cuentas`. La primera vez muestra la carga; después
   * refresca en segundo plano y, si falla, conserva lo que había.
   */
  async function cargar() {
    const secuencia = ++secuenciaCarga.current;
    setEstadoCarga((actual) => (actual === "lista" ? actual : "cargando"));
    const resultado = await acciones.cargar();
    if (secuencia !== secuenciaCarga.current) return;

    if (!resultado.ok) {
      setEstadoCarga((actual) => (actual === "lista" ? actual : "error"));
      return;
    }
    const { captura, cuentas } = resultado;
    setDatos({ captura, cuentas });
    setEstadoCarga("lista");
    setValores((actual) => {
      const existe = (id: string | null) => id !== null && cuentas.some((c) => c.id === id);
      return {
        ...actual,
        cuentaId: existe(actual.cuentaId) ? actual.cuentaId : captura.cuentaPredeterminadaId,
        destinoId: existe(actual.destinoId) ? actual.destinoId : null,
        fecha: actual.fecha === "" ? captura.fechaHoy : actual.fecha,
      };
    });
  }

  function abrir() {
    setAbierto(true);
    void cargar();
  }

  /** La presentación lo llama cuando terminó de retirar la hoja. */
  function cerrar() {
    setAbierto(false);
  }

  /* ── Sugerencias ───────────────────────────────────────────────────── */

  function cancelarEspera() {
    if (esperaSugerencias.current) clearTimeout(esperaSugerencias.current);
    esperaSugerencias.current = null;
  }

  /** Pide sugerencias; solo se aplica la última respuesta (número de secuencia). */
  async function pedirSugerencias(tipo: TipoMovimiento, texto: string): Promise<Sugerencias | null> {
    const secuencia = ++secuenciaSugerencias.current;
    if (texto.trim() === "" || texto.length > MAX_DESCRIPCION) {
      setSugerencias(null);
      return null;
    }
    const resultado = await acciones.sugerir(tipo, texto);
    if (secuencia !== secuenciaSugerencias.current || !resultado.ok) return null;
    setSugerencias({ tipo, texto, datos: resultado.sugerencias });
    return resultado.sugerencias;
  }

  function programarSugerencias(tipo: TipoMovimiento, texto: string) {
    cancelarEspera();
    if (texto.trim() === "") {
      secuenciaSugerencias.current++;
      setSugerencias(null);
      return;
    }
    esperaSugerencias.current = setTimeout(() => void pedirSugerencias(tipo, texto), ESPERA_SUGERENCIAS_MS);
  }

  /* ── Edición ───────────────────────────────────────────────────────── */

  function limpiarError(campo: CampoCaptura) {
    setErrores((actual) => (actual[campo] ? { ...actual, [campo]: undefined } : actual));
    setErrorGeneral(null);
  }

  function cambiar<C extends "monto" | "cuentaId" | "destinoId" | "fecha" | "nota">(campo: C, valor: ValoresCaptura[C]) {
    setValores((actual) => ({ ...actual, [campo]: valor }));
    limpiarError(campo === "cuentaId" ? "cuenta" : campo === "destinoId" ? "destino" : campo);
  }

  function cambiarTipo(tipo: TipoMovimiento) {
    if (tipo === valores.tipo) return;
    // La categoría es del tipo: al cambiarlo, vuelve a valer la propuesta.
    setValores((actual) => ({ ...actual, tipo, categoria: { modo: "propuesta" } }));
    setErrores({});
    setErrorGeneral(null);
    cancelarEspera();
    void pedirSugerencias(tipo, valores.descripcion);
  }

  function cambiarDescripcion(descripcion: string) {
    setValores((actual) => ({
      ...actual,
      descripcion,
      // Quitar la propuesta era sobre otro texto: con uno nuevo vuelve a proponer.
      categoria: actual.categoria.modo === "quitada" ? { modo: "propuesta" } : actual.categoria,
    }));
    limpiarError("descripcion");
    programarSugerencias(valores.tipo, descripcion);
  }

  /** Acepta un concepto (Tab, clic o chip): completa la descripción y propone su categoría. */
  function aceptarConcepto(descripcion: string) {
    cambiarDescripcion(descripcion);
    cancelarEspera();
    void pedirSugerencias(valores.tipo, descripcion);
  }

  /** Respuesta de sugerencias para el tipo actual; la última, aunque el texto siga cambiando. */
  const vigentes = sugerencias && sugerencias.tipo === valores.tipo && valores.descripcion.trim() !== "" ? sugerencias.datos : null;
  const propuesta: Propuesta | null = valores.tipo === "transferencia" ? null : (vigentes?.propuesta ?? null);
  const conceptos = vigentes?.conceptos ?? [];

  /** Texto fantasma: lo que falta del primer concepto si empieza por lo escrito. */
  const primero = conceptos[0];
  const fantasma =
    primero && normalizar(primero.descripcion).startsWith(normalizar(valores.descripcion))
      ? primero.descripcion.slice(valores.descripcion.length)
      : "";

  /** Toca un chip de categoría: elige, cambia o quita (la propuesta o la elegida). */
  function tocarCategoria(id: string) {
    const actual = valores.categoria;
    const esPropuesta = actual.modo === "propuesta" && propuesta?.categoria.id === id;
    const esElegida = actual.modo === "elegida" && actual.id === id;
    const siguiente: DecisionCategoria = esPropuesta || esElegida ? { modo: "quitada" } : { modo: "elegida", id };
    setValores((v) => ({ ...v, categoria: siguiente }));
    limpiarError("categoria");
  }

  /* ── Registro ──────────────────────────────────────────────────────── */

  function mostrarAviso(movimiento: Movimiento) {
    if (plazoAviso.current) clearTimeout(plazoAviso.current);
    setAviso({ movimiento, deshaciendo: false, error: null });
    plazoAviso.current = setTimeout(() => {
      plazoAviso.current = null;
      // Si se está deshaciendo, el aviso espera la respuesta.
      setAviso((a) => (a?.deshaciendo ? a : null));
    }, PLAZO_AVISO_MS);
  }

  const montoDigitos = montoValido(valores.monto);
  const sinCuentas = datos !== null && datos.cuentas.length === 0;
  const puedeRegistrar = montoDigitos !== null && datos !== null && !sinCuentas && !registrando;

  async function registrar() {
    if (enCurso.current || !puedeRegistrar || !datos) return;
    enCurso.current = true;
    setRegistrando(true);
    setErrores({});
    setErrorGeneral(null);

    const enviados = valores;
    const conTexto = enviados.descripcion.trim() !== "" && enviados.tipo !== "transferencia";
    let propuestaUsada = conTexto ? propuesta : null;
    // La categoría propuesta debe ser la de la descripción final, no la de una tecla anterior.
    const alDia = sugerencias?.tipo === enviados.tipo && sugerencias.texto === enviados.descripcion;
    if (conTexto && enviados.categoria.modo === "propuesta" && !alDia) {
      cancelarEspera();
      propuestaUsada = (await pedirSugerencias(enviados.tipo, enviados.descripcion))?.propuesta ?? null;
    }

    const cuerpo = cuerpoDesdeValores(enviados, propuestaUsada);
    const resultado = cuerpo ? await acciones.registrar(cuerpo) : null;
    enCurso.current = false;
    setRegistrando(false);
    if (!resultado) return;

    if (!resultado.ok) {
      // Se conserva todo lo escrito.
      if (resultado.campo) setErrores({ [resultado.campo]: resultado.mensaje });
      else setErrorGeneral(resultado.mensaje);
      return;
    }

    const categorias: readonly Categoria[] = enviados.tipo === "transferencia" ? [] : datos.captura.categorias[enviados.tipo];
    const nueva = ofertaDeRegla({
      tipo: enviados.tipo,
      descripcion: enviados.descripcion,
      categoria: enviados.categoria,
      propuesta: propuestaUsada,
      categorias,
    });
    setOferta(nueva ? { oferta: nueva, pendiente: false, error: null } : null);
    mostrarAviso(resultado.movimiento);

    // Listo para otro: tipo, cuentas y fecha se mantienen.
    setValores((actual) => ({ ...actual, monto: "", descripcion: "", categoria: { modo: "propuesta" }, nota: "" }));
    secuenciaSugerencias.current++;
    setSugerencias(null);
    setRegistros((n) => n + 1);
    void cargar(); // saldos, gastos de hoy y frecuentes, en segundo plano
  }

  async function deshacer() {
    if (!aviso || aviso.deshaciendo) return;
    const { id } = aviso.movimiento;
    setAviso({ ...aviso, deshaciendo: true, error: null });
    const resultado = await acciones.deshacer(id);
    if (resultado.ok) {
      if (plazoAviso.current) clearTimeout(plazoAviso.current);
      plazoAviso.current = null;
      setAviso(null);
      setOferta(null); // el movimiento ya no existe
      void cargar();
      return;
    }
    // Error (p. ej. `CUENTA_ARCHIVADA`): el aviso lo muestra otros cinco segundos.
    setAviso((a) => (a ? { ...a, deshaciendo: false, error: resultado.mensaje } : a));
    if (plazoAviso.current) clearTimeout(plazoAviso.current);
    plazoAviso.current = setTimeout(() => {
      plazoAviso.current = null;
      setAviso((a) => (a?.deshaciendo ? a : null));
    }, PLAZO_AVISO_MS);
  }

  /** «Crear regla» / «Cambiar regla» o «No» (sin petición). RN-11: nunca sin respuesta del usuario. */
  async function responderOferta(acepta: boolean) {
    if (!oferta || oferta.pendiente) return;
    if (!acepta) {
      setOferta(null);
      return;
    }
    const { oferta: o } = oferta;
    setOferta({ ...oferta, pendiente: true, error: null });
    const resultado =
      o.tipo === "crear" ? await acciones.crearRegla(o.palabraClave, o.categoria.id) : await acciones.ajustarRegla(o.reglaId, o.categoria.id);
    if (resultado.ok) setOferta((actual) => (actual?.oferta === o ? null : actual));
    else setOferta((actual) => (actual?.oferta === o ? { ...actual, pendiente: false, error: resultado.mensaje } : actual));
  }

  /* ── Derivados para presentar ──────────────────────────────────────── */

  const cuentas: Cuenta[] = datos?.cuentas ?? [];
  const captura = datos?.captura ?? null;
  const montoNumero = montoDigitos === null ? null : BigInt(montoDigitos);

  /** Saldo estimado de la cuenta elegida en ese rol tras el movimiento (solo presentación, RN-02). */
  function vistaPrevia(cuenta: Cuenta, rol: RolCuenta): bigint | null {
    if (montoNumero === null) return null;
    const elegida = rol === "cuenta" ? valores.cuentaId : valores.destinoId;
    if (cuenta.id !== elegida) return null;
    if (rol === "destino" && valores.tipo !== "transferencia") return null;
    return saldoResultante(cuenta, sentidoDe(valores.tipo, rol), montoNumero);
  }

  const categorias: readonly Categoria[] = captura && valores.tipo !== "transferencia" ? captura.categorias[valores.tipo] : [];
  const cuentaElegida = cuentas.find((c) => c.id === valores.cuentaId) ?? null;
  const predeterminada = cuentas.find((c) => c.id === captura?.cuentaPredeterminadaId) ?? null;

  return {
    abierto,
    abrir,
    cerrar,
    reintentar: () => void cargar(),
    estadoCarga,
    captura,
    cuentas,
    sinCuentas,
    categorias,
    cuentaElegida,
    predeterminada,
    valores,
    errores,
    errorGeneral,
    cambiar,
    cambiarTipo,
    cambiarDescripcion,
    aceptarConcepto,
    tocarCategoria,
    propuesta,
    conceptos,
    fantasma,
    montoNumero,
    vistaPrevia,
    puedeRegistrar,
    registrando,
    registrar,
    registros,
    aviso,
    deshacer,
    resaltadoId: aviso?.movimiento.id ?? null,
    oferta,
    responderOferta,
  };
}

export type EstadoCaptura = ReturnType<typeof useCaptura>;

/* ── Aviso y oferta, iguales en panel y hoja ───────────────────────────── */

/** Cuenta del movimiento como se lee en el aviso: «Nequi» o «Nequi → Visa Oro». */
function cuentaDe(movimiento: Movimiento): string {
  const origen = movimiento.cuentaOrigen?.nombre ?? "";
  const destino = movimiento.cuentaDestino?.nombre ?? "";
  if (movimiento.tipo === "transferencia") return `${origen} → ${destino}`;
  return movimiento.tipo === "gasto" ? origen : destino;
}

export function datosAviso(c: EstadoCaptura): DatosAviso | null {
  if (!c.aviso) return null;
  const { movimiento, deshaciendo, error } = c.aviso;
  return {
    tipo: movimiento.tipo,
    monto: movimiento.monto,
    descripcion: movimiento.descripcion,
    cuenta: cuentaDe(movimiento),
    alDeshacer: () => void c.deshacer(),
    deshaciendo,
    error,
  };
}

export function datosOferta(c: EstadoCaptura): DatosOferta | null {
  if (!c.oferta) return null;
  const { oferta, pendiente, error } = c.oferta;
  const crear = oferta.tipo === "crear";
  return {
    pregunta: crear
      ? `¿Siempre «${oferta.palabraClave}» → ${oferta.categoria.nombre}?`
      : `¿Cambiar la regla «${oferta.palabraClave}» a ${oferta.categoria.nombre}?`,
    accion: crear ? "Crear regla" : "Cambiar regla",
    alAceptar: () => void c.responderOferta(true),
    alRechazar: () => void c.responderOferta(false),
    pendiente,
    error,
  };
}

const VERBO: Record<TipoMovimiento, string> = {
  gasto: "Registrar gasto",
  ingreso: "Registrar ingreso",
  transferencia: "Registrar transferencia",
};

/** Texto del botón: «Registrar gasto», o «Registrando…» mientras espera. */
export function etiquetaRegistrar(c: EstadoCaptura): string {
  return c.registrando ? "Registrando…" : VERBO[c.valores.tipo];
}
