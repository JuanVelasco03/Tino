# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

La app de celular nativa es un cliente futuro de la misma API (REGLAS §7). Hoy el
celular se atiende con la web móvil.

## Users

- **Hoy:** el autor. Colombiano, lleva sus finanzas personales a mano y quiere
  dejar de usar Notion para hacerlo.
- **Después:** público abierto en Colombia. La app ya es multiusuario y cada
  persona solo ve sus datos (RN-12), pero todavía no se ha diseñado para ese
  público.

Su trabajo es registrar cada entrada y salida de dinero sin fricción y saber en
todo momento cuánto tiene, cuánto debe y en qué se le va la plata.

## Product Purpose

Tino es una app de finanzas personales para el uso real de todos los días.
El registro es manual, sin conexión bancaria. La moneda base es COP, con
posiciones en USD.

**Criterio de éxito:** que el autor deje de usar Notion. Si registrar un gasto
cuesta más de diez segundos, el proyecto falló aunque todo lo demás esté
perfecto.

## Positioning

Una app de gastos corriente anota compras. Tino lleva un libro de cuentas con
los pasivos tratados como reales:

- Préstamos y deudas con personas, con intereses y condonación.
- Tarjeta de crédito como pasivo real: cupo, ciclo de corte y pago. Pagarla es
  una transferencia, no un gasto.
- Inversiones valoradas a precio de mercado, en otra moneda.
- Categorización automática por reglas de texto: la app propone y el usuario
  decide.

Los saldos se calculan y nunca se almacenan, así que el patrimonio neto siempre
es verdadero.

## Operating Context

- **En la calle, desde el celular:** registrar un gasto en el momento en que
  ocurre, en menos de diez segundos.
- **En el computador:** revisar, organizar, corregir y ordenar las cuentas.
- **Sin conexión bancaria:** toda entrada y salida de dinero de una cuenta real
  se registra a mano (RN-16). Un movimiento sin registrar desvía el saldo para
  siempre.

## Capabilities and Constraints

- **Construido:** acceso con correo, perfil, menú de la aplicación, lista de
  cuentas con orden, y alta, edición, archivo, borrado y restauración de
  cuentas.
- **Ahora:** categorías, movimientos, captura rápida y cálculo de saldos.
- **Diseñado, sin construir:** deudas y préstamos, recurrentes, avisos,
  inversiones, ciclo de la tarjeta, informes y app de celular.
- **Fuera de esta versión:** presupuestos, compras a cuotas, funcionamiento sin
  conexión, importación desde Notion y cuentas compartidas.
- **Reglas de negocio vinculantes:** RN-01 a RN-20 en `REGLAS.md`. Ante
  conflicto, gana la regla.
- **Dinero:** `bigint` en unidades menores, nunca coma flotante. Formato
  colombiano: punto de miles y coma decimal. Pesos sin decimales
  (`1.234.567 COP`) y dólares con dos (`US$ 7.750,00`). Toda cifra en moneda
  extranjera muestra su equivalente en COP y la tasa aplicada.
- **Arquitectura:** la web es un cliente más de Tino API. No toca tablas y no
  contiene lógica de negocio.
- **Términos:** Activos («Lo que tienes»), Pasivos («Lo que debes»), Patrimonio
  neto, saldo, deuda, cupo, archivar, restaurar.

## Brand Commitments

- **Nombre:** Tino.
- **Voz:** tuteo, español de Colombia, frases cortas y llanas, sin jerga
  financiera. Los botones nombran su acción («Crear cuenta», «Guardar
  cambios»). Los errores dicen qué falta, sin culpar («Escribe un nombre.»).

## Evidence on Hand

- Requerimientos completos: `docs/Tino_Requerimientos.pdf`, citado en
  REGLAS.md, pero no está en ninguno de los dos repositorios.
- Referencias de diseño: `referencias/` (sistema de diseño, export-acceso,
  export-cuentas).
- No hay testimonios, usuarios externos, métricas ni prensa. No se deben
  inventar.

## Product Principles

1. **Registrar es lo primero.** Cada pantalla se juzga por cuánto acerca o
   aleja el registro de los diez segundos.
2. **La cifra es verdadera.** Ningún saldo se guarda ni se maquilla. Lo que se
   muestra sale de los movimientos, con su moneda y su tasa.
3. **El usuario dispone.** La app propone (categorías, recurrentes) y nada
   altera un saldo sin intervención del usuario.
4. **Sin modificación silenciosa.** Todo cambio de datos financieros es visible
   y queda registrado.
5. **Uso real antes que modelo completo.** Se construye lo que se usa todos los
   días; el resto espera su spec.
