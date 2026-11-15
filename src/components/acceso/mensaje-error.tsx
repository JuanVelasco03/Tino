export function MensajeError({ mensaje }: { mensaje: string }) {
  return (
    <p role="alert" className="text-etiqueta font-normal text-salida-texto">
      {mensaje}
    </p>
  );
}
