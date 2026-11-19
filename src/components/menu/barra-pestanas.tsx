"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Ellipsis, LogOut, Moon, Sun } from "lucide-react";
import { alternarTema } from "../boton-tema";
import { IconoNavegacion } from "../iconos";
import { ENTRADAS_MAS, estaActiva, PESTANAS, TITULO_PROXIMAMENTE, type EntradaMenu } from "./entradas";

type Props = {
  /** Server action de cierre de sesión; llega por prop desde el layout. */
  salir: () => Promise<void>;
};

/**
 * Alto de la barra: 56 px de pestañas más el margen inferior del dispositivo
 * (mínimo 28 px, como en el diseño). Son 84 px sin zona segura.
 */
export const ALTO_PESTANAS = "calc(56px + max(env(safe-area-inset-bottom), 28px))";

const PESTANA = "relative flex flex-col items-center justify-center gap-[3px] text-[11px] leading-[14px]";

function Pestana({ entrada, ruta, hojaAbierta }: { entrada: EntradaMenu; ruta: string; hojaAbierta: boolean }) {
  const esRegistrar = entrada.destino === "registrar";
  const icono = esRegistrar ? (
    <span className="flex size-10 items-center justify-center rounded-campo bg-texto text-fondo">
      <IconoNavegacion destino="registrar" />
    </span>
  ) : (
    <span className="flex size-6 items-center justify-center">
      <IconoNavegacion destino={entrada.destino} />
    </span>
  );

  if (!entrada.habilitado || !entrada.href) {
    return (
      <span
        aria-disabled="true"
        title={TITULO_PROXIMAMENTE}
        className={`${PESTANA} cursor-not-allowed font-normal text-secundario`}
      >
        {icono}
        <span>{entrada.rotulo}</span>
      </span>
    );
  }

  const activa = estaActiva(entrada, ruta) && !hojaAbierta;
  return (
    <Link
      href={entrada.href}
      aria-current={estaActiva(entrada, ruta) ? "page" : undefined}
      className={`${PESTANA} ${activa ? "font-semibold text-texto" : "font-normal text-secundario"}`}
    >
      {icono}
      <span>{entrada.rotulo}</span>
    </Link>
  );
}

/** Menú móvil (< md): cinco pestañas fijas abajo y hoja «Más» con el resto. */
export function BarraPestanas({ salir }: Props) {
  const ruta = usePathname();
  const [abierta, setAbierta] = useState(false);
  const idHoja = useId();
  const botonMas = useRef<HTMLButtonElement>(null);
  const botonCerrar = useRef<HTMLButtonElement>(null);

  const masActiva = abierta || ENTRADAS_MAS.some((e) => estaActiva(e, ruta));

  function cerrar() {
    setAbierta(false);
    botonMas.current?.focus();
  }

  useEffect(() => {
    if (!abierta) return;
    botonCerrar.current?.focus();

    function alPulsar(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        setAbierta(false);
        botonMas.current?.focus();
      }
    }
    document.addEventListener("keydown", alPulsar);
    return () => document.removeEventListener("keydown", alPulsar);
  }, [abierta]);

  return (
    <div className="md:hidden">
      {abierta && (
        <>
          <div aria-hidden className="fixed inset-0 z-30 bg-fondo opacity-60" onClick={cerrar} />
          <div
            id={idHoja}
            role="dialog"
            aria-modal="true"
            aria-label="Más secciones"
            className="fixed inset-x-0 z-30 rounded-t-hoja border-t border-raya bg-superficie px-4 pt-1 pb-3"
            style={{ bottom: ALTO_PESTANAS }}
          >
            <div className="flex h-12 items-center justify-between">
              <span className="text-rotulo uppercase text-secundario">Más secciones</span>
              <button
                ref={botonCerrar}
                type="button"
                onClick={cerrar}
                className="h-11 px-1 text-cuerpo text-secundario"
              >
                Cerrar
              </button>
            </div>

            <ul>
              {ENTRADAS_MAS.map((entrada) => (
                <li key={entrada.destino} className="border-t border-linea">
                  <span
                    aria-disabled="true"
                    title={TITULO_PROXIMAMENTE}
                    className="grid min-h-13 cursor-not-allowed grid-cols-[20px_minmax(0,1fr)_16px] items-center gap-3 text-secundario"
                  >
                    <span className="flex">
                      <IconoNavegacion destino={entrada.destino} />
                    </span>
                    <span className="truncate text-cuerpo">{entrada.rotulo}</span>
                    <span className="flex text-terciario">
                      <ChevronRight size={16} strokeWidth={1.5} aria-hidden />
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="border-t border-linea">
              <button
                type="button"
                onClick={alternarTema}
                className="grid min-h-13 w-full grid-cols-[20px_minmax(0,1fr)] items-center gap-3 text-left text-cuerpo"
              >
                <span className="flex text-secundario">
                  <Moon size={20} strokeWidth={1.5} aria-hidden className="block [[data-theme=dark]_&]:hidden" />
                  <Sun size={20} strokeWidth={1.5} aria-hidden className="hidden [[data-theme=dark]_&]:block" />
                </span>
                Cambiar tema
              </button>
              <form action={salir} className="border-t border-linea">
                <button
                  type="submit"
                  className="grid min-h-13 w-full grid-cols-[20px_minmax(0,1fr)] items-center gap-3 text-left text-cuerpo"
                >
                  <span className="flex text-secundario">
                    <LogOut size={20} strokeWidth={1.5} aria-hidden />
                  </span>
                  Salir
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      <nav
        aria-label="Secciones"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-linea bg-fondo"
        style={{ height: ALTO_PESTANAS, paddingBottom: "max(env(safe-area-inset-bottom), 28px)" }}
      >
        {PESTANAS.map((entrada) => (
          <Pestana key={entrada.destino} entrada={entrada} ruta={ruta} hojaAbierta={abierta} />
        ))}
        <button
          ref={botonMas}
          type="button"
          aria-expanded={abierta}
          aria-controls={abierta ? idHoja : undefined}
          onClick={() => setAbierta((a) => !a)}
          className={`${PESTANA} ${masActiva ? "font-semibold text-texto" : "font-normal text-secundario"}`}
        >
          <span className="flex size-6 items-center justify-center">
            <Ellipsis size={20} strokeWidth={1.5} aria-hidden />
          </span>
          <span>Más</span>
        </button>
      </nav>
    </div>
  );
}
