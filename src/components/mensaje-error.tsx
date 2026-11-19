type Props = {
  mensaje: string;
  /** Para enlazarlo desde el campo con `aria-describedby`. */
  id?: string;
  className?: string;
};

/** Mensaje de error bajo un campo o al pie de un bloque: etiqueta en terracota, anunciado al aparecer. */
export function MensajeError({ mensaje, id, className = "" }: Props) {
  return (
    <p id={id} role="alert" className={`text-etiqueta font-normal text-salida-texto ${className}`}>
      {mensaje}
    </p>
  );
}
