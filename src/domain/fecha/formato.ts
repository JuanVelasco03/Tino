/**
 * Fechas calendario (`"YYYY-MM-DD"`) que la API ya entrega en la zona del
 * usuario. Se formatean partiendo el string, sin `Date`: `new Date("2026-11-18")`
 * se interpreta en UTC y en Colombia mostraría el día anterior.
 */

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"] as const;

const FECHA_CALENDARIO = /^(\d{4})-(\d{2})-(\d{2})$/;

type Partes = { anio: string; mes: string; dia: string };

function partir(fecha: string): Partes {
  const coincidencia = FECHA_CALENDARIO.exec(fecha);
  if (!coincidencia) throw new Error(`Fecha mal formada: "${fecha}". Se espera "YYYY-MM-DD".`);

  const [, anio, mesTexto, diaTexto] = coincidencia;
  const mes = MESES[Number.parseInt(mesTexto, 10) - 1];
  const dia = Number.parseInt(diaTexto, 10);
  if (!mes || dia < 1 || dia > 31) throw new Error(`Fecha mal formada: "${fecha}".`);

  return { anio, mes, dia: String(dia) };
}

/** `"2026-11-18"` → `"18 nov 2026"`. */
export function formatearFecha(fecha: string): string {
  const { anio, mes, dia } = partir(fecha);
  return `${dia} ${mes} ${anio}`;
}

/** `"2026-11-18"` → `"18 nov"`. */
export function formatearFechaSinAnio(fecha: string): string {
  const { mes, dia } = partir(fecha);
  return `${dia} ${mes}`;
}
