/** Estado que devuelven las server actions de acceso a `useActionState`. */
export type EstadoAcceso =
  | { tipo: "inicial" }
  | { tipo: "error"; mensaje: string; correo: string } // conserva el correo escrito
  | { tipo: "revisa_correo"; correo: string }; // solo registro
