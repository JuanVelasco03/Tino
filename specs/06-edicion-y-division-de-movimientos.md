# SPEC 06 — Edición, borrado y división de movimientos

> **Estado:** Implementado
> **Depende de:** SPEC 04, SPEC 05, Tino-API SPEC 04
> **Fecha:** 2026-11-21
> **Objetivo:** Que el usuario corrija, elimine y divida sus movimientos, recorra otros meses y elija su cuenta predeterminada, sin salir del libro de movimientos.

## Por qué existe este spec

Cierra el inventario de captura rápida que SPEC 05 dejó para después. Sin editar ni eliminar, un error de registro desvía el saldo para siempre (RN-16): corregirlo es parte del uso diario.

Fija estos patrones:

- Un formulario de movimiento con dos modos: **registro** (captura, en el layout, sin URL) y **edición** (abierta por URL desde `/movimientos`). Comparten un núcleo (`usar-formulario.ts`) y las presentaciones de SPEC 05.
- `PUT` de reemplazo completo: el formulario de edición siempre envía el movimiento entero, incluidos la nota y las partes.
- Un dato monetario repartido (partes) se valida en la web con la misma regla que la API, para no enviar una petición que se sabe fallida.

Diseño:

- `referencias/export-captura/`: formulario («Más opciones · notas, persona, dividir») y lista.
- `referencias/TINO sistema de diseño.zip` → `Movimientos.dc.html`: edición desde la fila, oferta de regla y confirmación. Se toma la intención, no la forma: ese diseño solo edita concepto y categoría (no cumple N-16) y reclasifica otros movimientos (la API no lo hace).
- Lo no dibujado (navegación de meses, editor de partes, «Usar siempre», solo lectura) se diseña aquí con el sistema: C4, C5, C19, C22, C26.

Inventario: `../Tino-API/specs/necesidades/captura-rapida.md`.
Contrato: `../Tino-API/docs/api/movimientos.md`, `captura.md`, `reglas.md`, `perfil.md` (Tino-API SPEC 04).

## Alcance

**Entra:**

- Cambiar de mes en `/movimientos`: `‹` y `›` junto al nombre del mes, «Este mes» fuera del actual, `?mes=YYYY-MM` en la URL. Sin límite hacia adelante (hay fechas futuras).
- Ver partes: un movimiento dividido muestra bajo su fila un sub-renglón por parte (categoría y monto).
- Editar: clic en una fila abre `/movimientos?mes=…&movimiento=<id>` con el formulario de la captura precargado. Escritorio: panel de 480 px. Móvil: la hoja a pantalla completa con teclado propio. Todos los campos, incluido el tipo (N-16, N-17).
- Guardar con `PUT /movimientos/:id`; la lista y los saldos se revalidan. Aviso «Guardado: …» arriba de la lista y resaltado de la fila mientras dura.
- Oferta de regla tras guardar, como en la captura, solo si la categoría cambió en esta edición.
- Eliminar desde el formulario de edición con el bloque C26 (`DELETE /movimientos/:id`). Aviso «Eliminado: …». Sin deshacer.
- Preguntar «¿Descartar los cambios?» al cerrar la edición con cambios.
- Movimiento con una cuenta archivada: formulario en solo lectura con aviso y enlace a «Cuentas archivadas».
- Dividir entre categorías en la captura y en la edición, escritorio y móvil: dos o más partes con categoría distinta y monto > 0 que suman el total.
- Elegir la cuenta predeterminada desde la captura con «Usar {cuenta} siempre» (`PATCH /perfil`).
- Componentes nuevos con muestra en `/estilos`: `NavegacionMes`, `EditorPartes`. `BloqueEliminar` pasa a `src/components/` y gana `detalle`.

**Fuera de alcance (specs futuros):**

- Filtros, búsqueda, totales del mes y agrupación por día del catálogo (`Movimientos.dc.html`). No están en el inventario y los totales son consultas analíticas (REGLAS §5).
- Reclasificar movimientos existentes al crear una regla. La API no lo ofrece.
- Deshacer una edición o un borrado.
- Vista previa del saldo en la edición (N-35 es de la captura).
- Elegir la cuenta predeterminada desde el panel de la cuenta.
- Editar la palabra clave de la regla ofrecida.
- Persona, TRM, USD, recurrentes y ajustes de saldo.
- Historial de cambios de un movimiento (no hay endpoint de lectura).

## Modelo de datos

Este spec no introduce tablas ni migraciones. Consume además de lo de SPEC 05: `GET /movimientos?mes=`, `PUT /movimientos/:id`, `DELETE /movimientos/:id`, `GET /perfil` y `PATCH /perfil`.

### Contrato (copiado de Tino-API, no se redefine)

- `src/repositories/api/movimientos.ts`: `MovimientoCuerpo` ya trae `partes`; se usa también como cuerpo del `PUT` (con `fecha` obligatoria).
- `src/repositories/api/perfil.ts`: `Perfil` gana `cuentaPredeterminadaId: string | null`. `EdicionPerfil = { cuentaPredeterminadaId: string | null }`.

### Modelo de la web

`Movimiento` (SPEC 05) cambia `dividido` por los datos que la edición necesita:

```ts
type Parte = { categoria: Ref; monto: bigint };

type Movimiento = {
  // … campos de SPEC 05, sin `dividido`
  nota: string | null;
  partes: Parte[];               // [] si no está dividido
};
```

`ValoresCaptura` (SPEC 05) gana las partes:

```ts
type ValorParte = {
  categoriaId: string | null;    // null mientras no se elige
  monto: string;                 // "20.000", lo tecleado ya formateado
};

type ValoresCaptura = {
  // … campos de SPEC 05
  partes: ValorParte[] | null;   // null = sin dividir
};

type CampoCaptura = /* SPEC 05 */ | "partes";
```

Campo de la API → formulario: `partes` y `partes.N.monto` → `partes`. Los demás, como en SPEC 05.

### Resultados de las server actions

```ts
type ResultadoGuardado =
  | { ok: true; movimiento: Movimiento }
  | { ok: false; codigo: string; mensaje: string; campo?: CampoCaptura };
```

`eliminarMovimiento` y `elegirPredeterminada` devuelven `ResultadoSimple` (SPEC 05). Guardar y eliminar revalidan `/movimientos` y `/cuentas`.

### Dominio

```ts
// src/domain/fecha/formato.ts (+)
sumarMeses(mes: string, n: number): string;        // "2026-01", -1 → "2025-12"
mesDeFecha(fecha: string): string;                 // "2026-11-19" → "2026-11"
mesEnZona(zona: string, ahora: Date): string;      // mes actual en la zona del perfil (IANA)

// src/domain/movimiento/partes.ts
restante(total: bigint, partes: ValorParte[]): bigint;   // > 0 falta, < 0 sobra, 0 cuadra
errorPartes(total: bigint, partes: ValorParte[]): string | null;
// Mismos textos que la API: «Divide en al menos dos partes.», «Elige la categoría de cada parte.»,
// «Cada parte debe tener una categoría distinta.», «Escribe un monto mayor que cero.»,
// «Las partes deben sumar el monto total.»

// src/domain/movimiento/cuerpo.ts (cambia)
// cuerpoDesdeValores: con partes, envía `partes` y nunca `categoriaId` (PARTES_CON_CATEGORIA);
// en transferencia, nunca partes. Devuelve null si el monto o las partes no son válidos.

// src/domain/movimiento/edicion.ts
valoresDesdeMovimiento(m: Movimiento): ValoresCaptura;   // categoría como { modo: "elegida" }; partes formateadas
hayCambios(original: ValoresCaptura, actual: ValoresCaptura): boolean;
cuentaArchivada(m: Movimiento, activas: { id: string }[]): Ref | null; // la primera cuenta del movimiento que no está entre las activas

// src/domain/categorizacion/oferta.ts (cambia)
// ofertaDeRegla gana `categoriaAnterior?: string | null` y `dividido: boolean`.
// Con partes → null. Si la categoría efectiva es igual a la anterior → null (la edición no tocó la categoría).
```

### Pantallas

Tokens de `globals.css`. Sin sombras, radio máximo 6, cifras en mono tabular.

**Cabecera de `/movimientos` con navegación de meses:**

```
Movimientos
‹  Noviembre 2026  ›                 Este mes      ‹ y › de 44 px; «Este mes» (EnlaceTexto) solo fuera del actual
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Guardado: Almuerzo −18.000 en Nequi              aviso tras guardar o eliminar, 5 s
  ¿Siempre «almuerzo» → Ocio?  Crear regla · No   oferta, si aplica
```

**Fila dividida (escritorio):**

```
19 nov  Almuerzo y mercado        Nequi             −30.000     la fila entera es un enlace a su edición
        Dividido
          Comida                                     20.000     sub-renglón: etiqueta secundaria, cifra-xs
          Mercado                                    10.000
```

En móvil, los sub-renglones van bajo la C2 con la misma sangría que el concepto.

**Formulario en modo edición** (panel 480 px; la hoja móvil cambia lo mismo):

```
│ EDITAR MOVIMIENTO                        Cerrar │
│ … campos de la captura, precargados …           │  sin «Hoy −X», sin frecuentes, sin «Usar siempre», sin vista previa
│ Más opciones · nota, dividir                  ▾ │
│───────────────────────────────────────────────── │
│ [          Guardar cambios          ]           │  Enter guarda
│───────────────────────────────────────────────── │
│ Eliminar movimiento…                            │  vínculo discreto, secundario
```

Bloque de borrado (reemplaza «Eliminar movimiento…»):

```
│ ELIMINAR ALMUERZO                               │
│ El saldo de Nequi vuelve a como estaba.         │
│ No se puede deshacer.                           │
│ [ Eliminar Almuerzo ]   Cancelar                │
```

Descartar (reemplaza el botón al intentar cerrar con cambios): «¿Descartar los cambios?» · «Descartar» · «Seguir editando».

Solo lectura (cuenta archivada): los campos se ven deshabilitados, sin botón de guardar ni de eliminar.

```
│ La cuenta Nequi está archivada. Restáurala para │
│ modificar este movimiento.                      │
│ Ver archivadas                                  │  EnlaceTexto a /cuentas/archivadas
```

**Editor de partes** (bajo «Más opciones», escritorio; en móvil, en la hoja de Categoría):

```
│ Dividir entre categorías                        │  botón de texto; «No dividir» lo deshace
│ [Comida            ▾]            20.000     ✕   │  <select> con la línea de CampoSubrayado · monto mono a la derecha
│ [Mercado           ▾]             5.000     ✕   │  ✕ (44 px) quita la parte; desde 2 partes no se quita
│ + Agregar parte                                 │
│ Falta asignar 5.000                  El resto   │  «Sobran 2.000» en salida-texto; «El resto» completa la última
│ Las partes deben sumar el monto total.          │  error local o de la API
```

- Al activar: dos partes, la primera con la categoría efectiva y sin monto.
- Cada `<select>` ofrece las categorías del tipo que no usa otra parte.
- Con partes, los chips de categoría se ocultan.
- Cambiar de tipo o pasar a transferencia descarta las partes.
- El botón de guardar o registrar queda inactivo mientras `errorPartes` no sea `null`.
- En móvil, los montos de las partes usan el teclado del sistema (`inputMode="numeric"`): el teclado propio es del monto total.

**«Usar siempre»** (solo en la captura): si la cuenta elegida no es la predeterminada, el rótulo dice «Cuenta · Nequi es la predeterminada» y a la derecha «Usar Efectivo siempre» (botón de texto). En móvil va al pie de la hoja de cuentas, y la predeterminada lleva «Predeterminada» en su subtítulo.

### Textos literales

| Caso | Texto |
|---|---|
| Mes anterior / siguiente (aria) | «Mes anterior: Octubre 2026» / «Mes siguiente: Diciembre 2026» |
| Volver al actual | «Este mes» |
| Mes vacío, actual | «Aún no registras movimientos este mes.» (SPEC 05) |
| Mes vacío, otro | «No hay movimientos en octubre.» · «Registra uno o cambia de mes.» |
| Título edición | «Editar movimiento» |
| Botón edición / pendiente | «Guardar cambios» / «Guardando…» |
| Vínculo borrado | «Eliminar movimiento…» |
| Bloque borrado | «Eliminar {concepto}» · «El saldo de {cuenta} vuelve a como estaba. No se puede deshacer.» |
| Botón borrado / pendiente | «Eliminar {concepto}» / «Eliminando…» |
| Descartar | «¿Descartar los cambios?» · «Descartar» · «Seguir editando» |
| Solo lectura | «La cuenta {nombre} está archivada. Restáurala para modificar este movimiento.» · «Ver archivadas» |
| Aviso tras guardar | «Guardado: {concepto} {±monto} en {cuenta}»; si cambió de mes, «… · ahora en {Mes Año}» |
| Aviso tras eliminar | «Eliminado: {concepto} {±monto} en {cuenta}» |
| Más opciones | «Más opciones · nota, dividir» |
| Dividir | «Dividir entre categorías» · «No dividir» · «+ Agregar parte» · «Quitar parte» (aria) · «El resto» |
| Restante | «Falta asignar {X}» · «Sobran {X}» · «Las partes suman el total.» |
| Errores de partes | los de `errorPartes`, iguales al catálogo de la API |
| Predeterminada | «Usar {cuenta} siempre» · «Predeterminada» |
| Errores de la API | `mensaje` del catálogo bajo su campo, o al pie del formulario |

`{concepto}` es la descripción o, sin ella, el tipo («Gasto»).

## Cobertura de necesidades

| Pantalla | N-xx | Endpoint / origen |
|---|---|---|
| Movimientos | N-05 | `GET /movimientos?mes=`; `MES_INVALIDO` → `/movimientos` |
| Movimientos | N-12 | `MovimientoDto.partes` como sub-renglones |
| Movimientos | N-15 | `MovimientoDto.id` en `?movimiento=<id>` |
| Edición | N-16 | `PUT /movimientos/:id` con el cuerpo completo |
| Edición | N-17 | Reglas del tipo resultante: `DESTINO_REQUERIDO`, `CATEGORIA_NO_PERMITIDA`, `DIVISION_NO_PERMITIDA`; el formulario quita categoría y partes al pasar a transferencia |
| Edición | N-18 | `DELETE /movimientos/:id`; confirmación C26 en el cliente |
| Edición | N-19 | Historial en la API (`movimientos_cambios`); sin lectura |
| Edición | N-20 | Revalidación de `/cuentas` y `/movimientos` |
| Edición | N-36 | `CUENTA_ARCHIVADA`; solo lectura si una cuenta no está activa |
| Edición | N-48 | `PATCH /reglas/:id` con `propuesta.regla.id` tras corregir |
| Captura y edición | N-41, N-42, N-43 | `partes`; `PARTES_*`, `DIVISION_NO_PERMITIDA`; `errorPartes` en la web |
| Captura | N-34 | `PATCH /perfil` → `cuentaPredeterminadaId`; `CUENTA_ARCHIVADA` |
| Todas | N-49 | `ErrorApi` con `campo` |
| Fuera de alcance | N-44, N-60 | — |

## Estructura de archivos

Pendiente de aprobación del autor (REGLAS §8).

```
src/app/(aplicacion)/
  captura/acciones.ts            # + elegirPredeterminada; cuerpo con partes
  captura/entrada.ts             # nuevo, sin "use server": cuerpoValido (con partes) y fallo(), compartidos
  movimientos/
    page.tsx                     # + ?mes, ?movimiento; carga captura y cuentas al editar
    acciones.ts                  # nuevo: guardarMovimiento, eliminarMovimiento
src/app/estilos/page.tsx         # + NavegacionMes, EditorPartes, BloqueEliminar con detalle
src/components/
  captura/
    usar-formulario.ts           # nuevo: núcleo (valores, sugerencias, categoría, partes, errores)
    usar-captura.ts              # usa el núcleo; + elegirPredeterminada
    panel-captura.tsx            # + modo «registro» | «edicion»; editor de partes; «Usar siempre»
    hoja-captura.tsx             # + modo; partes en la hoja de Categoría; «Usar siempre» en la hoja de cuentas
    editor-partes.tsx            # nuevo
  movimientos/
    libro-movimientos.tsx        # filas como enlace; sub-renglones; aviso de edición
    navegacion-mes.tsx           # nuevo
    edicion-movimiento.tsx       # nuevo: monta panel u hoja en modo edición
    usar-edicion.ts              # nuevo: guardar, eliminar, descartar, solo lectura, oferta
  bloque-eliminar.tsx            # movido desde cuentas/; + prop detalle
  fila-movimiento.tsx            # + partes (sub-renglones), como enlace
src/domain/fecha/formato.ts              # + sumarMeses, mesDeFecha, mesEnZona (+ pruebas)
src/domain/movimiento/partes.ts          # nuevo (+ partes.test.ts)
src/domain/movimiento/cuerpo.ts          # + partes (+ pruebas)
src/domain/movimiento/edicion.ts         # nuevo (+ edicion.test.ts)
src/domain/categorizacion/oferta.ts      # + categoriaAnterior, dividido (+ pruebas)
src/services/movimientos.ts              # + editar, listarDelMes(mes?)
src/services/perfil.ts                   # + elegirPredeterminada
src/repositories/api/movimientos.ts      # + nota, partes, reemplazarMovimiento (+ pruebas)
src/repositories/api/perfil.ts           # + cuentaPredeterminadaId, actualizarPerfil
DESIGN.md                                # + NavegacionMes, EditorPartes, modo edición, BloqueEliminar
```

Dirección: `app → services → repositories/api → cliente`. Los componentes importan `domain/` y tipos; nunca `repositories/`. Las server actions llegan por props.

## Plan de implementación

1. `domain/fecha/formato.ts`: `sumarMeses`, `mesDeFecha`, `mesEnZona`. Pruebas: cambio de año en ambos sentidos, `mesEnZona("America/Bogota", …)` en la medianoche UTC del día 1.
2. `repositories/api/movimientos.ts`: `Movimiento` con `nota` y `partes` (montos `bigint`) en lugar de `dividido`; `reemplazarMovimiento(id, cuerpo)` (`PUT`). Actualizar pruebas y usos (`libro-movimientos.tsx` usa `partes.length > 0`). `repositories/api/perfil.ts`: `cuentaPredeterminadaId` y `actualizarPerfil`. Servicios homónimos con `401` → `/login`.
3. Navegación de meses: `page.tsx` lee `?mes` (formato `YYYY-MM`; si no, redirige a `/movimientos`). Sin `?mes`, el actual es el `mes` de la respuesta; con `?mes`, se calcula con `mesEnZona(perfil.zonaHoraria, new Date())`. `MES_INVALIDO` → `/movimientos`. `navegacion-mes.tsx` con `‹`, `›` y «Este mes». Estado vacío según el mes. Al terminar se recorren meses.
4. Ver partes: sub-renglones en la rejilla de escritorio y en `FilaMovimiento` (prop `partes`), con muestra en `/estilos`.
5. `domain/movimiento/partes.ts` + pruebas: `restante` con falta, sobra y cuadre; cada error de `errorPartes` en el orden de la API; una parte sin monto cuenta como 0.
6. `domain/movimiento/cuerpo.ts` + pruebas: con partes envía `partes` sin `categoriaId`; transferencia nunca envía partes; partes inválidas → `null`.
7. `domain/movimiento/edicion.ts` + pruebas: `valoresDesdeMovimiento` con y sin partes, nota y fecha; `hayCambios` ignora espacios alrededor; `cuentaArchivada` en gasto, ingreso y transferencia. `oferta.ts` + pruebas: sin oferta si la categoría no cambió o hay partes.
8. Núcleo: extraer de `usar-captura.ts` a `usar-formulario.ts` los valores, sugerencias, categoría y errores, sin cambiar el comportamiento. La captura sigue cumpliendo los criterios de SPEC 05.
9. `editor-partes.tsx` (+ `/estilos`) y partes en el núcleo: activar, agregar, quitar, «El resto», descartar al cambiar de tipo. Escritorio: bajo «Más opciones · nota, dividir». Móvil: «Dividir entre categorías» en la hoja de Categoría. `captura/entrada.ts` valida la forma de `partes`. Al terminar se registran movimientos divididos.
10. Predeterminada: `elegirPredeterminada(cuentaId)` en `captura/acciones.ts`; «Usar {cuenta} siempre» en el panel y en la hoja de cuentas. Éxito → la captura se recarga y el rótulo cambia. Error → mensaje bajo el grupo de cuentas.
11. Edición, lectura y guardado: `movimientos/acciones.ts` con `guardarMovimiento(id, cuerpo)`. Las filas pasan a enlace a `?mes=…&movimiento=<id>` (`scroll={false}`). `page.tsx` busca el id en la lista del mes; si no está, redirige a `?mes=…`; si está, carga `GET /captura` y `GET /cuentas` en paralelo. `usar-edicion.ts` + `edicion-movimiento.tsx` montan el panel u hoja con `modo="edicion"`. Guardar → `PUT`, cierra, aviso «Guardado…», resaltado y oferta de regla.
12. Descartar: con `hayCambios`, cerrar muestra «¿Descartar los cambios?» en el pie; sin cambios, cierra directo.
13. Eliminar: mover `bloque-eliminar.tsx` a `src/components/` con `detalle` (cuentas pasa su texto actual). En la edición reemplaza a «Eliminar movimiento…»; éxito → cierra y aviso «Eliminado…».
14. Solo lectura: si `cuentaArchivada` no es `null`, campos deshabilitados, sin guardar ni eliminar, con el aviso y «Ver archivadas».
15. `DESIGN.md`: `NavegacionMes`, `EditorPartes`, modo edición del formulario, `BloqueEliminar` con `detalle`.

## Criterios de aceptación

- [ ] `npm test`, `npm run lint` y `npx tsc --noEmit` pasan.
- [ ] Los criterios de SPEC 05 siguen cumpliéndose tras extraer el núcleo.
- [ ] En `/movimientos`, `‹` lleva a `?mes=2026-10` con «Octubre 2026» y sus movimientos; `›` vuelve a noviembre.
- [ ] «Este mes» aparece en octubre y lleva al mes actual; en el mes actual no aparece.
- [ ] `?mes=2026-13` y `?mes=hola` redirigen a `/movimientos`.
- [ ] Un mes sin movimientos distinto del actual dice «No hay movimientos en octubre.».
- [ ] Un movimiento dividido en Comida 20.000 y Mercado 10.000 muestra «Dividido» y dos sub-renglones con esos montos, en escritorio y en 390 px.
- [ ] Clic en una fila abre «Editar movimiento» con todos sus valores, incluidas nota y partes, y la URL lleva `movimiento=<id>`.
- [ ] Recargar `/movimientos?mes=2026-11&movimiento=<id>` muestra la lista con el formulario abierto; un id que no está en el mes redirige a `?mes=2026-11`.
- [ ] Cambiar el monto de 15.000 a 18.000 envía un `PUT` con el cuerpo completo (nota y partes incluidas) y la fila muestra `−18.000`; el saldo de la cuenta en `/cuentas` cambia en 3.000.
- [ ] Pasar un gasto a transferencia pide «Hacia», quita categoría y partes, y la fila muestra «origen → destino» sin signo.
- [ ] Cambiar la fecha a octubre saca la fila de noviembre y el aviso dice «… · ahora en Octubre 2026».
- [ ] Corregir Comida (propuesta por «almuerzo») por Ocio y guardar ofrece «¿Cambiar la regla «almuerzo» a Ocio?»; cambiar solo el monto no ofrece nada.
- [ ] Con cambios, Escape, «Cerrar» y el velo muestran «¿Descartar los cambios?»; «Seguir editando» conserva lo escrito; sin cambios, cierra directo.
- [ ] «Eliminar movimiento…» muestra «Eliminar Almuerzo» y «El saldo de Nequi vuelve a como estaba. No se puede deshacer.»; confirmar cierra, la fila desaparece y aparece «Eliminado: …».
- [ ] El bloque de borrado de cuentas sigue mostrando su texto de SPEC 04.
- [ ] Un movimiento de una cuenta archivada abre en solo lectura con el aviso y «Ver archivadas», sin «Guardar cambios» ni «Eliminar movimiento…».
- [ ] En la captura de escritorio, «Más opciones · nota, dividir» → «Dividir entre categorías» muestra dos partes; con total 30.000 y una parte de 20.000 se lee «Falta asignar 10.000» y el botón está inactivo.
- [ ] «El resto» completa la última parte con 10.000; se lee «Las partes suman el total.» y el registro envía `partes` sin `categoriaId`.
- [ ] Una parte no puede elegir la categoría de otra; con dos partes, «Quitar parte» no aparece.
- [ ] Pasar a transferencia descarta las partes; «Dividir entre categorías» no aparece en transferencia.
- [ ] En 390 px, la hoja de Categoría ofrece «Dividir entre categorías» y el registro dividido funciona.
- [ ] Con Nequi predeterminada, elegir Efectivo muestra «Usar Efectivo siempre»; pulsarlo hace `PATCH /perfil` y el rótulo pasa a «Cuenta · Efectivo es la predeterminada»; al reabrir la captura viene Efectivo.
- [ ] «Usar siempre» no aparece en la edición.
- [ ] Con la API apagada, guardar muestra «No pudimos conectar. Intenta de nuevo.» y conserva lo escrito.
- [ ] `/estilos` muestra `NavegacionMes`, `EditorPartes` y los sub-renglones en claro y oscuro.
- [ ] Ningún archivo en `src/components/` ni `src/app/` importa `repositories/` ni `@supabase/*` (salvo `proxy.ts`).
- [ ] Ningún monto pasa por `number`, `parseFloat` ni `Number()`.

## Decisiones

- **Sí:** un solo spec. Dividir comparte el formulario de edición y la predeterminada es pequeña.
- **Sí:** editar con el formulario de la captura en modo edición, en escritorio (panel 480 px) y en móvil (hoja con teclado propio). **No:** edición en la fila del catálogo (no cumple N-16) ni un panel nuevo de 400 px.
- **Sí:** núcleo compartido (`usar-formulario.ts`) y una instancia aparte para la edición. Editar no toca el borrador de la captura.
- **Sí:** edición abierta por URL (`?movimiento=<id>`), como el panel de cuentas. Recargar la conserva.
- **Sí:** los datos de la edición (movimiento, captura, cuentas) llegan del servidor con la página. **No:** carga en el cliente al abrir.
- **Sí:** `PUT` con el cuerpo completo desde `valoresDesdeMovimiento`. Si faltara la nota o las partes, el reemplazo las borraría.
- **Sí:** flechas `‹ ›` y «Este mes», con `?mes` en la URL. **No:** desplegable de meses.
- **Sí:** mes actual con `mesEnZona(perfil.zonaHoraria)` cuando la URL trae `?mes`. Es presentación de fechas en la zona del usuario (REGLAS §6). Sin `?mes`, manda la API.
- **Sí:** sin límite hacia adelante: la captura admite fechas futuras.
- **Sí:** partes como sub-renglones del libro, visibles sin tocar nada. **No:** línea resumen (se corta) ni solo al editar.
- **Sí:** dividir en captura y edición, en ambos formatos. Misma regla en todas partes.
- **Sí:** manda el total; «Falta asignar» / «Sobran» en vivo y «El resto». **No:** total igual a la suma (cambiaría lo tecleado).
- **Sí:** `errorPartes` en la web con los textos de la API. Evita una petición que se sabe fallida; la API sigue validando.
- **Sí:** `<select>` nativo con la línea de `CampoSubrayado` para la categoría de cada parte. **No:** chips por parte (no caben en una fila).
- **Sí:** en móvil, montos de las partes con el teclado del sistema. El teclado propio es del total.
- **Sí:** «Usar siempre» en la captura, donde se decide la cuenta. **No:** en el panel de la cuenta, por ahora.
- **Sí:** borrar con confirmación C26, sin deshacer (N-18). **No:** deshacer recreando el movimiento (otro id, historial confuso).
- **Sí:** `BloqueEliminar` pasa a `src/components/` con `detalle`. Ahora lo usan dos funciones, y el texto de cuentas no vale para un movimiento (su borrado sí queda registrado).
- **Sí:** oferta de regla tras guardar, con el mismo aviso de la captura, solo si la categoría cambió. **No:** dentro del formulario como el catálogo, ni reclasificar otros movimientos.
- **Sí:** solo lectura si alguna cuenta del movimiento no está activa. **No:** dejar editar y fallar al guardar con `CUENTA_ARCHIVADA`.
- **Sí:** preguntar antes de descartar, como en cuentas.
- **Sí:** sin vista previa del saldo en la edición: el saldo actual ya incluye el movimiento y la cuenta saldría doble.
- **Sí:** filtros, búsqueda, totales y agrupación por día fuera: no están en el inventario y los totales son analíticas (REGLAS §5).
- **Sí:** estructura y nombres pendientes de aprobación del autor.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Extraer el núcleo rompe la captura de SPEC 05 | Paso 8 aislado, sin cambio de comportamiento; se revisan los criterios de SPEC 05. |
| Un `PUT` sin nota o sin partes las borra | `valoresDesdeMovimiento` las precarga; prueba de que el cuerpo incluye ambas. |
| El movimiento cambia de mes al guardar y desaparece de la lista | El aviso dice a qué mes pasó. |
| Otra pestaña edita o borra el movimiento con el formulario abierto | La API responde `MOVIMIENTO_NO_ENCONTRADO` o `CUENTA_ARCHIVADA`; error general; cerrar recarga la lista. |
| Las partes descuadran por tecleo | `restante` en vivo, botón inactivo y la API como última validación (`PARTES_NO_SUMAN`). |
| El mes actual calculado en la web difiere del de la API | Mismo dato de origen (`zonaHoraria` del perfil); sin `?mes` siempre manda la API. |
| El botón «Atrás» cierra la edición sin preguntar | Aceptado, como en SPEC 04. |
| `<select>` nativo se ve distinto entre navegadores | Línea inferior y tipografía propias (`appearance-none` con chevron de Lucide). |

## Lo que **no** entra en este spec

- Filtros, búsqueda, totales del mes y agrupación por día.
- Reclasificar movimientos al crear una regla.
- Deshacer una edición o un borrado.
- Vista previa del saldo al editar.
- Predeterminada desde el panel de la cuenta.
- Persona, TRM, USD, recurrentes, ajustes de saldo e historial de cambios.

Cada uno, si llega, va en su propio spec.
