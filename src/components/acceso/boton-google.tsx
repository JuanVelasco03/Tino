import { Boton } from "@/components/boton";

/** Visible pero deshabilitado: el acceso con Google llega en otro spec. */
export function BotonGoogle() {
  return (
    <Boton
      variante="secundario"
      disabled
      title="Próximamente"
      className="h-[52px]! w-full justify-center gap-3 font-semibold"
    >
      <span
        aria-hidden="true"
        className="flex size-5 items-center justify-center rounded-full border border-current text-[12px] font-bold"
      >
        G
      </span>
      Continuar con Google
    </Boton>
  );
}
