import type { InputHTMLAttributes, ReactNode } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  etiqueta: string;
  /** Contenido a la derecha de la etiqueta (p. ej. «¿La olvidaste?»). */
  extra?: ReactNode;
};

/** Campo de una sola línea: etiqueta arriba, texto sobre una línea. */
export function CampoSubrayado({ etiqueta, extra, className = "", ...resto }: Props) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex justify-between text-etiqueta font-normal text-secundario">
        <span>{etiqueta}</span>
        {extra}
      </span>
      <input
        className={`h-11 rounded-none border-0 border-b border-linea bg-transparent p-0 text-[17px] text-texto placeholder:text-terciario focus:border-raya ${className}`}
        {...resto}
      />
    </label>
  );
}
