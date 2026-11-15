import type { EstadoAcceso } from "@/domain/autenticacion/estado";

/** Forma de una server action de acceso, tal como la espera `useActionState`. */
export type AccionAcceso = (estado: EstadoAcceso, datos: FormData) => Promise<EstadoAcceso>;
