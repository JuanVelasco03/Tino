import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { MensajeError } from "./mensaje-error";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  etiqueta: string;
  /** Contenido a la derecha de la etiqueta (p. ej. «¿La olvidaste?»). */
  extra?: ReactNode;
  /** Mensaje bajo el campo: la línea pasa a terracota y el input queda marcado como inválido. */
  error?: string;
};

/** Campo de una sola línea: etiqueta arriba y texto sobre un renglón, que pasa a raya con el foco. */
export function CampoSubrayado({ etiqueta, extra, error, id, className = "", ...resto }: Props) {
  const generado = useId();
  const idCampo = id ?? generado;
  const idError = `${idCampo}-error`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={idCampo} className="flex flex-col gap-1">
        <span className="flex justify-between text-etiqueta font-normal text-secundario">
          <span>{etiqueta}</span>
          {extra}
        </span>
        <input
          id={idCampo}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? idError : undefined}
          className={`h-11 rounded-none border-0 border-b bg-transparent p-0 text-[17px] text-texto placeholder:text-terciario ${
            error ? "border-salida" : "border-linea focus:border-raya"
          } ${className}`}
          {...resto}
        />
      </label>
      {error && <MensajeError id={idError} mensaje={error} />}
    </div>
  );
}
