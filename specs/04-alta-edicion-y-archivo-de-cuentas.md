# SPEC 04 — Alta, edición, archivo y borrado de cuentas

> **Estado:** Aprobado
> **Depende de:** SPEC 03, Tino-API SPEC 03
> **Fecha:** 2026-11-18
> **Objetivo:** Que el usuario pueda crear, editar, archivar, eliminar y restaurar sus cuentas desde `/cuentas`, con un panel lateral para el formulario y una página de cuentas archivadas.

## Por qué existe este spec

Completa la pantalla de cuentas que SPEC 03 dejó en solo lectura. Es el primer formulario de escritura de la aplicación y fija estos patrones:

- Panel lateral C22 abierto por URL (`?cuenta=`).
- Montos tecleados en formato colombiano que viajan a la API como string entero.
- Errores de la API mostrados en su campo por `campo`.
- Confirmaciones en la misma página (C26), sin ventanas modales de alerta.

Diseño: `referencias/export-cuentas/` no dibuja el panel, la confirmación de borrado ni las archivadas. Se diseñan aquí con el sistema de diseño (`referencias/TINO sistema de diseño.zip`, `TINO Sistema de Diseño.dc.html`):

- C4 · Campo de monto.
- C19 · Fila en edición (la fila se abre en su lugar).
- C22 · Panel lateral: hoja de 400 px con raya a la izquierda en escritorio; hoja inferior en móvil.
- C26 · Bloque en la misma página, sin modal.
- C34 · Opción única: círculo de 18 px en filas de 44 px.

Inventario: `../Tino-API/specs/necesidades/cuentas.md`.
Contrato: `../Tino-API/docs/api/cuentas.md` (Tino-API SPEC 03).

## Alcance

**Entra:**

- «Nueva cuenta» habilitado: botón de la cabecera (escritorio), acción del estado vacío y vínculo «+ Nueva cuenta» al pie de los grupos (solo móvil).
- Panel lateral C22 abierto por URL:
  - `/cuentas?cuenta=nueva`: alta.
  - `/cuentas?cuenta=<id>`: edición de una cuenta no archivada.
  - Hacer clic en una fila abre su edición (salvo en modo Ordenar).
  - Cerrar con «Cerrar», Escape o tocando el fondo. Con cambios sin guardar, pregunta antes en el propio panel.
- Formulario: nombre, tipo (C34), detalle opcional, saldo (C4 editable) y cupo (C4 editable, solo tarjeta).
- Edición: el tipo solo ofrece la misma naturaleza; la tarjeta muestra su tipo fijo. Solo se envían los campos que cambian.
- Archivar desde el panel de edición. Deshabilitado con explicación si el saldo no es cero.
- Eliminar desde el panel de edición con bloque de confirmación C26.
- Página `/cuentas/archivadas`, enlazada con «Ver archivadas» bajo el patrimonio neto:
  - Lista de archivadas, la más reciente primero.
  - «Restaurar» por fila. Si el nombre choca, la fila se abre en su lugar (C19) para renombrar y reintentar.
  - «Eliminar…» por fila con confirmación C26 en la fila.
  - Estados de carga, error y vacío.
- `CampoMonto` (C4) gana modo editable. Nuevo componente `OpcionUnica` (C34) y `PanelLateral` (C22), con muestra en `/estilos`.
- Modelo web `Cuenta` con `saldoInicial` y `archivadaEn`.

**Fuera de alcance (specs futuros):**

- Bloqueo de «eliminar una cuenta con movimientos» (N-42): llega con movimientos; la API documentará el error entonces.
- Ver el historial de cambios del saldo inicial (N-40): la API no tiene endpoint de lectura.
- Fecha de archivo en la lista de archivadas: requiere la zona horaria del perfil; ninguna necesidad la pide.
- Mensajes de confirmación tras guardar, archivar o eliminar (toasts). La lista actualizada es la confirmación.
- Deshacer.
- Detalle de una cuenta (`GET /cuentas/:id`, pantalla «Detalle Cuenta» del sistema de diseño).
- Tipos `inversion`, `prestamo_otorgado`, `deuda_contraida`, USD y ciclo de la tarjeta.
- Alta rápida de varias cuentas (C35, primer uso).

## Modelo de datos

Este spec no introduce tablas ni migraciones. Consume `POST /cuentas`, `PATCH /cuentas/:id`, `DELETE /cuentas/:id`, `POST /cuentas/:id/archivar`, `POST /cuentas/:id/restaurar` y `GET /cuentas/archivadas`, además de lo que ya usa SPEC 03.

### Contrato (copiado de Tino-API, no se redefine)

`src/repositories/api/cuentas.ts` añade `AltaCuenta` y `EdicionCuenta` tal como los define `docs/api/cuentas.md`. Montos como `string` entero (`^\d{1,19}$`).

### Modelo de la web

`Cuenta` (SPEC 03) gana dos campos:

```ts
type Cuenta = {
  // … campos de SPEC 03
  saldoInicial: bigint;          // en un pasivo, la deuda inicial
  archivadaEn: string | null;    // ISO 8601, tal cual llega
};
```

Valores del formulario, controlados en el cliente. Los montos son lo tecleado, ya formateado:

```ts
type ValoresCuenta = {
  nombre: string;
  tipo: "efectivo" | "banco" | "tarjeta_credito";
  detalle: string;
  saldo: string;                 // "1.284.300"
  cupo: string;                  // "" si no es tarjeta
};

type CampoCuenta = "nombre" | "tipo" | "detalle" | "saldo" | "cupo";
```

El campo `saldoInicial` de la API se muestra en `saldo`. Un error con `campo: "saldoInicial"` se dibuja bajo `saldo`.

### Resultado de las server actions

```ts
type ResultadoCuenta =
  | { ok: true }
  | { ok: false; codigo: string; mensaje: string; campo?: CampoCuenta };
```

Las acciones nunca lanzan al cliente. En éxito llaman a `revalidatePath("/cuentas")` (y `"/cuentas/archivadas"` cuando aplica). El cliente cierra el panel con `router.replace("/cuentas", { scroll: false })`.

### Dominio

```ts
// src/domain/dinero/entrada.ts
formatearEntradaPesos(texto: string): string;   // "1284300" → "1.284.300"; descarta lo que no es dígito
aDigitos(texto: string): string | null;         // "1.284.300" → "1284300"; "" o > 19 dígitos → null
desdeMonto(monto: bigint): string;              // 1284300n → "1.284.300" (para precargar)

// src/domain/cuenta/edicion.ts
cambiosEdicion(cuenta: Cuenta, valores: ValoresCuenta): EdicionCuenta | null; // null = nada cambió
```

`cambiosEdicion` compara con el nombre y el detalle recortados. Un detalle vacío equivale a `null`. `tipo` solo entra si cambió. `cupo` solo si la cuenta es tarjeta.

### Pantallas nuevas (diseñadas con el sistema)

Tokens: los de `globals.css`. Sin sombras, radio máximo 6. Fondo del velo: `fondo` al 60 %, como la hoja «Más» de SPEC 03.

**Panel C22 · escritorio (≥ 768 px).** `<dialog>` modal anclado a la derecha, 400 px, alto completo, `bg-superficie`, `border-l border-raya`, relleno 24 px, contenido con scroll propio.
**Panel C22 · móvil (< 768 px).** Hoja inferior de ancho completo, `max-h-[90dvh]`, radio 6 arriba, `border-t border-raya`, scroll interno.

Alta:

```
┌─────────────────────────────── 400 px ┐
│ NUEVA CUENTA                   Cerrar │  rótulo 11 px mayúsculas · texto secundario
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│  raya
│ Nombre                                │  CampoSubrayado
│ Nequi________________________________ │
│                                       │
│ TIPO                                  │  rótulo
│ (•) ▣  Banco                          │  C34: filas 44 px, línea entre filas
│ ( ) ▤  Efectivo                       │
│ ( ) ▭  Tarjeta de crédito             │
│                                       │
│ Detalle · opcional                    │  CampoSubrayado, placeholder «Ahorros ·· 4821»
│ _____________________________________ │
│                                       │
│ Saldo de hoy                          │  C4 editable; «Deuda de hoy» si es tarjeta
│ 0▏                                COP │
│ Cupo total                            │  C4 editable, solo tarjeta
│ 0▏                                COP │
│                                       │
│ [        Crear cuenta        ]        │  Boton primario, ancho completo
│ No pudimos conectar. Intenta de nuevo.│  error general (salida-texto), si lo hay
└───────────────────────────────────────┘
```

Edición (cambia lo que está debajo del formulario):

```
│ EDITAR CUENTA                  Cerrar │
│ … mismos campos, precargados …        │
│ TIPO                                  │  efectivo/banco: solo esas dos opciones
│ ▭  Tarjeta de crédito                 │  tarjeta: texto fijo, sin círculo
│ Saldo inicial                         │  «Deuda inicial» en la tarjeta
│ 20.321                            COP │
│ Cambiarlo queda registrado.           │  etiqueta secundaria (N-40)
│ [       Guardar cambios       ]       │
│───────────────────────────────────────│  línea
│ [ Archivar ]                          │  Boton secundario
│ Solo puedes archivar una cuenta con   │  secundario; solo si saldo ≠ 0 (botón deshabilitado)
│ saldo cero.                           │
│                                       │
│ Eliminar cuenta…                      │  vínculo discreto, texto secundario
```

Bloque de borrado C26 (reemplaza «Eliminar cuenta…» al pulsarlo):

```
│───────────────────────────────────────│
│ ELIMINAR NEQUI                        │  rótulo
│ Se borra para siempre, con su         │  cuerpo
│ historial de cambios. No se puede     │
│ deshacer.                             │
│ [ Eliminar Nequi ]   Cancelar         │  Boton secundario con text-salida-texto · Boton texto
```

Descartar cambios (reemplaza el botón de guardar cuando se intenta cerrar con cambios):

```
│ ¿Descartar los cambios?               │  cuerpo, 600
│ [ Descartar ]   Seguir editando       │  Boton primario · Boton texto
```

**Página `/cuentas/archivadas`.** Mismo layout que `/cuentas` (menú con «Cuentas» activa). Ancho máximo 1120 px.

```
← Cuentas                                    vínculo texto marca-texto
Cuentas archivadas                           h1 28 px
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  raya
▣  Nequi                       Restaurar  Eliminar…    fila ≥ 60 px
   Banco · Celular ·· 3108                 Boton texto · texto secundario
───────────────────────────────────────────  línea
▭  Tarjeta vieja               Restaurar  Eliminar…
   Tarjeta de crédito
```

Fila con nombre duplicado al restaurar (C19: la fila se abre en su lugar, `bg-superficie` entre dos rayas):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▣  Nequi
   Ya tienes una cuenta con ese nombre. Elige otro para restaurarla.
   Nombre
   Nequi vieja__________________
   [ Restaurar con este nombre ]   Cancelar
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Fila con borrado (C26 en la fila, mismo texto que en el panel). En móvil, «Restaurar» y «Eliminar…» bajan bajo el subtítulo.

### Textos literales

| Caso | Texto |
|---|---|
| Título del panel | «Nueva cuenta» / «Editar cuenta» (rótulo en mayúsculas) |
| Rótulo saldo, alta | «Saldo de hoy»; tarjeta: «Deuda de hoy» |
| Rótulo saldo, edición | «Saldo inicial»; tarjeta: «Deuda inicial» |
| Nota saldo, edición | «Cambiarlo queda registrado.» |
| Rótulo cupo | «Cupo total» |
| Rótulo detalle | «Detalle · opcional» |
| Botón alta / pendiente | «Crear cuenta» / «Creando…» |
| Botón edición / pendiente | «Guardar cambios» / «Guardando…» |
| Archivar / pendiente | «Archivar» / «Archivando…» |
| Archivar deshabilitado | «Solo puedes archivar una cuenta con saldo cero.» |
| Vínculo borrado | «Eliminar cuenta…» (panel) / «Eliminar…» (archivadas) |
| Bloque borrado | «Eliminar {nombre}» · «Se borra para siempre, con su historial de cambios. No se puede deshacer.» |
| Botón borrado / pendiente | «Eliminar {nombre}» / «Eliminando…» |
| Descartar | «¿Descartar los cambios?» · «Descartar» · «Seguir editando» |
| Vínculo móvil | «+ Nueva cuenta» |
| Vínculo a archivadas | «Ver archivadas» |
| Página archivadas | «Cuentas archivadas» · «← Cuentas» |
| Sin archivadas | «No tienes cuentas archivadas.» |
| Error al cargar archivadas | «No pudimos cargar tus cuentas archivadas.» + «Reintentar» |
| Restaurar / pendiente | «Restaurar» / «Restaurando…» |
| Nombre duplicado al restaurar | «Ya tienes una cuenta con ese nombre. Elige otro para restaurarla.» · «Restaurar con este nombre» |
| Monto mal escrito (local) | «Escribe un valor en pesos, sin decimales.» |
| Sin conexión (`SIN_CONEXION`) | «No pudimos conectar. Intenta de nuevo.» |
| Errores de la API | `mensaje` del catálogo de `docs/api/cuentas.md`, bajo el campo de `campo`, o como error general si no trae `campo`. |

## Cobertura de necesidades

| Pantalla | N-xx | Endpoint / origen |
|---|---|---|
| Panel · alta | N-28 | `POST /cuentas`; la API la pone al final del grupo |
| Panel · alta | N-30 | `POST /cuentas` |
| Panel · alta | N-31 | `NOMBRE_REQUERIDO`, `NOMBRE_LARGO` |
| Panel · alta | N-32 | `NOMBRE_DUPLICADO` |
| Panel · alta | N-33 | `TIPO_INVALIDO`; C34 con los tres tipos |
| Panel · alta | N-34 | `AltaCuenta.saldoInicial` |
| Panel · alta | N-35 | `cupo`; `CUPO_REQUERIDO`, `CUPO_NO_PERMITIDO` |
| Panel · alta | N-36 | `MONTO_INVALIDO`; `aDigitos` en la web |
| Panel · alta | N-37 | `AltaCuenta.detalle?` |
| Panel · edición | N-29 | `CuentaDto.id` en `?cuenta=<id>` |
| Panel · edición | N-38 | `PATCH /cuentas/:id` con solo los campos cambiados |
| Panel · edición | N-39 | Opciones de la misma naturaleza; `CAMBIO_DE_NATURALEZA` |
| Panel · edición | N-40 | Registro en la API al cambiar `saldoInicial`; nota en el panel |
| Panel · edición | N-41 | `DELETE /cuentas/:id`; confirmación C26 |
| Panel · edición | N-43 | `POST /cuentas/:id/archivar`; `SALDO_NO_CERO` |
| Cuentas | N-44 | `GET /cuentas` excluye archivadas (SPEC 03) |
| Archivadas | N-45 | `GET /cuentas/archivadas` |
| Archivadas | N-46 | `POST /cuentas/:id/restaurar` con `nombre?`; `NOMBRE_DUPLICADO` |
| Archivadas | N-41 | `DELETE /cuentas/:id` sobre una archivada |
| Todas | N-50 | `ErrorApi` (`codigo`, `mensaje`, `campo`) |
| Todas | N-52 | Token del usuario; un id ajeno da `404 CUENTA_NO_ENCONTRADA` |
| Fuera de alcance | N-42 | Sin movimientos todavía. |

## Estructura de archivos

Aprobada por el autor.

```
src/app/(aplicacion)/cuentas/
  page.tsx                    # + lee ?cuenta=, abre el panel en alta o edición
  acciones.ts                 # + crearCuenta, editarCuenta, archivarCuenta, eliminarCuenta
  archivadas/
    page.tsx                  # GET /cuentas/archivadas
    loading.tsx
    error.tsx
    acciones.ts               # restaurarCuenta, eliminarArchivada
src/app/estilos/page.tsx      # + muestras de C4 editable, C22 y C34
src/components/
  panel-lateral.tsx           # C22: <dialog>, 400 px a la derecha / hoja inferior
  opcion-unica.tsx            # C34
  campo-monto.tsx             # C4 + modo editable (input real)
  cuentas/
    panel-cuenta.tsx          # formulario alta/edición, archivar, eliminar, descartar
    bloque-eliminar.tsx       # C26
    lista-archivadas.tsx      # filas, restaurar, renombrar, eliminar
    lista-cuentas.tsx         # «Nueva cuenta» habilitado, «+ Nueva cuenta» móvil, «Ver archivadas»
    fila-cuenta.tsx           # la fila es un enlace a ?cuenta=<id> fuera del modo Ordenar
src/domain/dinero/entrada.ts       # + entrada.test.ts
src/domain/cuenta/edicion.ts       # + edicion.test.ts
src/services/cuentas.ts            # + crear, editar, archivar, restaurar, eliminar, listarArchivadas
src/repositories/api/cuentas.ts    # + saldoInicial, archivadaEn, AltaCuenta, EdicionCuenta, endpoints
src/repositories/api/cuentas.test.ts  # + conversión de saldoInicial y archivadaEn
```

Dirección: `app/(aplicacion)/cuentas → services/cuentas → repositories/api/cuentas → repositories/api/cliente`. Los componentes importan `domain/` y tipos; nunca `repositories/` ni `@supabase/*`. Las server actions llegan a los componentes por props, como en SPEC 03.

## Plan de implementación

1. `src/domain/dinero/entrada.ts`: `formatearEntradaPesos`, `aDigitos`, `desdeMonto`. Pruebas: `"1284300"` → `"1.284.300"`; letras, comas y signo se descartan; `"0"` → `"0"`; ceros a la izquierda (`"007"` → `"7"`); `""` → `aDigitos` null; 20 dígitos → null; `desdeMonto(0n)` → `"0"`. Sin `number` en ningún paso.
2. `src/repositories/api/cuentas.ts`: `Cuenta` gana `saldoInicial` y `archivadaEn`; actualizar `aCuenta` y `cuentas.test.ts`. Añadir `AltaCuenta`, `EdicionCuenta`, `crearCuenta`, `editarCuenta`, `eliminarCuenta`, `archivarCuenta`, `restaurarCuenta(id, nombre?)` y `listarArchivadas()`. `/cuentas` sigue igual.
3. `src/services/cuentas.ts`: funciones homónimas que delegan; `401` → `redirect("/login")` como `obtenerCuentas`.
4. `src/domain/cuenta/edicion.ts`: `cambiosEdicion`. Pruebas: nada cambió → `null`; solo nombre con espacios alrededor → sin cambio; detalle `""` sobre `null` → sin cambio; detalle borrado → `detalle: null`; saldo `"20.321"` sobre `20321n` → sin cambio; banco → efectivo → `{ tipo }`; cupo solo en tarjeta.
5. `src/components/opcion-unica.tsx` (C34): grupo `role="radiogroup"` de filas de 44 px con `<input type="radio">` visualmente reemplazado por círculo de 18 px, ícono opcional y rótulo. Teclado nativo (flechas). Muestra en `/estilos`.
6. `src/components/campo-monto.tsx`: prop opcional `editable` con `valor`, `alCambiar`, `nombre`, `error`. Con ella dibuja un `<input inputMode="numeric" autoComplete="off">` con el mismo aspecto (mono, `text-cifra-campo`, «COP» a la derecha, raya debajo) y formatea al teclear con `formatearEntradaPesos`. Sin ella, se comporta como hoy. Muestra en `/estilos`.
7. `src/components/panel-lateral.tsx` (C22): `<dialog>` con `showModal()` al montar; props `titulo`, `alSolicitarCierre`, `children`. Escape (`cancel` con `preventDefault`), «Cerrar» y clic en el velo llaman a `alSolicitarCierre`; quien lo usa decide si cierra. Escritorio y móvil según «Pantallas nuevas». Muestra en `/estilos`.
8. `src/app/(aplicacion)/cuentas/acciones.ts`: `crearCuenta(valores)`, `editarCuenta(id, cambios)`, `archivarCuenta(id)` y `eliminarCuenta(id)`. Validan forma (strings, tipo válido, id UUID, montos con `aDigitos`), llaman al servicio, traducen `ErrorApi` a `ResultadoCuenta` (`saldoInicial` → `saldo`; `SIN_CONEXION` → texto local) y revalidan en éxito.
9. Alta. `panel-cuenta.tsx` en modo alta, con estado controlado de `ValoresCuenta` (tipo inicial `banco`). El campo cupo aparece solo con `tarjeta_credito` y su valor se descarta al cambiar a otro tipo. «Crear cuenta» deshabilitado y «Creando…» mientras se envía; errores bajo cada campo y error general al pie. `page.tsx` lee `searchParams.cuenta === "nueva"` y monta el panel. En `lista-cuentas.tsx`, «Nueva cuenta» y la acción del estado vacío pasan a `Link` a `/cuentas?cuenta=nueva` (`scroll={false}`); se añade «+ Nueva cuenta» al pie de los grupos solo en móvil. Al terminar este paso se pueden crear cuentas.
10. Edición. `fila-cuenta.tsx`: fuera del modo Ordenar, la fila es un `Link` a `/cuentas?cuenta=<id>` (`scroll={false}`) con fondo `hundido` al pasar. `page.tsx` busca el id en activos y pasivos; si no existe, `redirect("/cuentas")`. El panel precarga con `desdeMonto` y ofrece solo los tipos de la misma naturaleza. «Guardar cambios» usa `cambiosEdicion`: `null` cierra sin petición.
11. Descartar. Si los valores difieren de los iniciales y se solicita cerrar, el pie muestra «¿Descartar los cambios?» en lugar del botón de guardar. «Descartar» cierra; «Seguir editando» vuelve. Sin cambios, cierra directo.
12. Archivar. Sección bajo una línea en el modo edición: «Archivar» habilitado solo si `saldo === 0n`; si no, deshabilitado con la explicación. Éxito → cierra el panel. `SALDO_NO_CERO` u otro error → mensaje en la sección.
13. Eliminar. `bloque-eliminar.tsx` (C26), reutilizable en panel y fila: recibe `nombre`, `alConfirmar`, `alCancelar`, `pendiente`, `error`. En el panel reemplaza al vínculo «Eliminar cuenta…». Éxito → cierra el panel.
14. Archivadas, lectura. `archivadas/page.tsx` llama a `listarArchivadas()` y pasa el resultado a `lista-archivadas.tsx`; `loading.tsx` y `error.tsx` como los de `/cuentas`. Estado vacío con «No tienes cuentas archivadas.» y «← Cuentas». En `lista-cuentas.tsx`, vínculo «Ver archivadas» bajo el cierre (también en el estado vacío). «Cuentas» sigue activa en el menú.
15. Restaurar. `archivadas/acciones.ts`: `restaurarCuenta(id, nombre?)` revalida ambas rutas. En la fila: «Restaurar» sin cuerpo; éxito → la fila desaparece. `NOMBRE_DUPLICADO` → la fila se abre (C19) con el nombre precargado; «Restaurar con este nombre» reintenta con `nombre`; errores de nombre bajo el campo; «Cancelar» cierra la fila.
16. Eliminar archivada. `eliminarArchivada(id)` en `archivadas/acciones.ts`; la fila usa `bloque-eliminar.tsx` en su lugar. Éxito → la fila desaparece.

## Criterios de aceptación

- [ ] `npm test`, `npm run lint` y `npx tsc --noEmit` pasan.
- [ ] En escritorio, «Nueva cuenta» abre el panel de 400 px a la derecha con raya a la izquierda y la URL pasa a `/cuentas?cuenta=nueva`.
- [ ] En 390 px el panel es una hoja inferior con scroll interno, sin scroll horizontal; «+ Nueva cuenta» aparece entre los grupos y el cierre, y no aparece en escritorio.
- [ ] Recargar `/cuentas?cuenta=nueva` muestra la lista con el panel abierto.
- [ ] Crear «Nequi», banco, saldo «20.321» envía `{"nombre":"Nequi","tipo":"banco","saldoInicial":"20321"}`; el panel se cierra y «Nequi» aparece al final de Activos con `20.321`.
- [ ] Al escribir `1284300` en el saldo se ve `1.284.300`.
- [ ] En `1.284.300`, insertar un `5` tras el primer `1` deja `15.284.300` con el cursor justo después del `5`.
- [ ] El campo «Cupo total» solo aparece al elegir «Tarjeta de crédito»; el rótulo del saldo cambia a «Deuda de hoy».
- [ ] Crear una tarjeta con cupo «4.000.000» y deuda «1.284.300» la pone al final de Pasivos con «Usado 32 %».
- [ ] Crear con nombre vacío muestra «Escribe un nombre.» bajo Nombre.
- [ ] Crear «nequi» con «Nequi» activa muestra «Ya tienes una cuenta con ese nombre.» bajo Nombre.
- [ ] Crear una tarjeta sin cupo muestra «La tarjeta necesita un cupo mayor que cero.» bajo Cupo total.
- [ ] Con la API apagada, crear muestra «No pudimos conectar. Intenta de nuevo.» y conserva lo escrito.
- [ ] Mientras se envía, el botón está deshabilitado y dice «Creando…».
- [ ] Hacer clic en una fila abre su edición en `/cuentas?cuenta=<id>` con los valores precargados; en modo Ordenar no abre nada.
- [ ] `/cuentas?cuenta=<uuid inexistente>` redirige a `/cuentas`.
- [ ] Editar un banco ofrece solo Efectivo y Banco; editar una tarjeta muestra el tipo fijo sin opciones.
- [ ] Cambiar solo el nombre envía un `PATCH` con solo `nombre`.
- [ ] «Guardar cambios» sin cambios cierra el panel sin petición.
- [ ] Cambiar el saldo inicial actualiza el saldo y los totales de la lista.
- [ ] Con cambios sin guardar, Escape, «Cerrar» y el velo muestran «¿Descartar los cambios?»; «Seguir editando» conserva lo escrito; «Descartar» cierra.
- [ ] Sin cambios, Escape cierra el panel directamente.
- [ ] Con saldo distinto de cero, «Archivar» está deshabilitado y se lee «Solo puedes archivar una cuenta con saldo cero.».
- [ ] Con saldo cero, «Archivar» cierra el panel, la cuenta sale de la lista y los totales no cambian.
- [ ] «Eliminar cuenta…» muestra el bloque con «Eliminar Nequi» y la frase de irreversibilidad; «Cancelar» lo oculta; confirmar cierra el panel y la cuenta desaparece.
- [ ] «Ver archivadas» lleva a `/cuentas/archivadas`, con «Cuentas» activa en el menú y la archivada más reciente primero.
- [ ] Sin archivadas se lee «No tienes cuentas archivadas.».
- [ ] «Restaurar» devuelve la cuenta al final de su grupo en `/cuentas` y la quita de archivadas.
- [ ] Archivar «Nequi», crear otra «Nequi» y restaurar la primera abre la fila con «Ya tienes una cuenta con ese nombre. Elige otro para restaurarla.»; con «Nequi vieja» se restaura con ese nombre.
- [ ] «Eliminar…» en una archivada muestra la confirmación en la fila; confirmar la quita de la lista.
- [ ] Con la API apagada, `/cuentas/archivadas` muestra «No pudimos cargar tus cuentas archivadas.» y «Reintentar».
- [ ] `/estilos` muestra C4 editable, C22 y C34 en claro y oscuro.
- [ ] El panel no tiene sombra y su radio no pasa de 6 px.
- [ ] Ningún archivo en `src/components/` ni `src/app/` importa `@supabase/*` ni `repositories/` (salvo `proxy.ts`).
- [ ] Ningún monto pasa por `number`, `parseFloat` ni `Number()` en `src/`.

## Decisiones

- **Sí:** diseñar lo no dibujado con componentes existentes del sistema (C4, C19, C22, C26, C34) y esquemas en el spec. **No:** maqueta `.dc.html` nueva en `referencias/`; sería trabajo de diseño aparte para piezas que el sistema ya define.
- **Sí:** panel abierto por URL (`?cuenta=nueva`, `?cuenta=<id>`). **No:** estado de cliente (recargar lo cerraría) ni rutas paralelas `@panel` (más piezas para el mismo resultado).
- **Sí:** `<dialog>` nativo con `showModal()`. Da foco atrapado, `inert` del fondo y Escape sin código propio.
- **Sí:** panel lateral de 400 px en escritorio y hoja inferior en móvil, como dice C22. **No:** página completa en móvil; se aparta del sistema.
- **Sí:** confirmación de borrado como bloque C26 con el nombre en el botón. **No:** escribir el nombre para confirmar (fricción para un borrado poco frecuente) ni `confirm()` (fuera del sistema).
- **Sí:** el botón de borrado en `salida-texto`. C26 evita el rojo para condonar, pero eliminar es irreversible y debe distinguirse.
- **Sí:** página `/cuentas/archivadas`. **No:** sección plegable en `/cuentas` (una petición extra en cada carga) ni panel.
- **Sí:** restaurar sin cuerpo y renombrar solo si llega `NOMBRE_DUPLICADO`, como sugiere el contrato.
- **Sí:** «+ Nueva cuenta» al pie de los grupos en móvil. **No:** en la cabecera (el diseño solo pone «Ordenar») ni en «Más» (poco descubrible).
- **Sí:** tipo con C34. **No:** chips de tipo (C35); son para el alta rápida de varias cuentas.
- **Sí:** C4 editable con formato al teclear. **No:** campo subrayado compacto; C22 ya usa C4 en un panel.
- **Sí:** rótulos «Saldo de hoy» / «Deuda de hoy» en alta e «inicial» en edición, con nota de registro (N-40). En alta es el lenguaje del usuario; en edición se explica el efecto.
- **Sí:** archivar deshabilitado con explicación si el saldo no es cero. **No:** intentar y mostrar el error; es una petición que se sabe fallida.
- **Sí:** preguntar antes de descartar cambios, en el propio panel. **No:** cerrar sin preguntar; el autor lo pidió.
- **Sí:** formulario controlado en el cliente que llama a la server action con `ValoresCuenta`. **No:** `<form action>` con `FormData`; React 19 reinicia el formulario tras la acción y se perderían los valores al fallar.
- **Sí:** `PATCH` solo con lo que cambió; sin cambios no hay petición. Evita `SIN_CAMBIOS`.
- **Sí:** sin mensajes de confirmación tras guardar. La lista actualizada basta; un sistema de avisos merece su propio spec.
- **Sí:** sin fecha de archivo en la lista. **No:** pedir `GET /perfil` solo para la zona horaria.
- **Sí:** `PanelLateral` y `OpcionUnica` como componentes genéricos con muestra en `/estilos`; los reutilizarán ajuste de saldo y captura.
- **Sí:** estructura y nombres aprobados por el autor.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| El botón «Atrás» del navegador cierra el panel sin preguntar por cambios sin guardar | Aceptado: la navegación suave no se puede interceptar de forma fiable. Solo afecta a lo escrito en el panel. |
| Formatear al teclear mueve el cursor al final | Se recalcula la posición contando dígitos antes del cursor; hay un criterio de aceptación que edita en medio de la cifra. |
| Un id en `?cuenta=` de una cuenta archivada o ajena | `page.tsx` solo busca en `GET /cuentas`; si no está, redirige a `/cuentas`. La API devuelve `404` de todos modos. |
| Otra sesión borra o archiva la cuenta con el panel abierto | La API responde `CUENTA_NO_ENCONTRADA` o `CUENTA_ARCHIVADA`; se muestra como error general y cerrar el panel recarga la lista. |
| `<dialog>` y el velo con opacidad en navegadores viejos | `<dialog>` es estándar en los navegadores soportados por Next 16; el velo usa `::backdrop`. |
| El panel en móvil tapa la barra de pestañas | `showModal()` lo pone en la capa superior; la hoja respeta `env(safe-area-inset-bottom)`. |

## Lo que **no** entra en este spec

- Bloqueo de borrado con movimientos (N-42).
- Historial de cambios del saldo inicial.
- Fecha de archivo, avisos tras guardar y deshacer.
- Detalle de cuenta, USD, inversiones, préstamos y ciclo de la tarjeta.
- Alta rápida de varias cuentas (primer uso).

Cada uno, si llega, va en su propio spec.
