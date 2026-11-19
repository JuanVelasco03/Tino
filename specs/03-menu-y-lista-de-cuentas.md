# SPEC 03 — Menú de la aplicación y lista de cuentas con orden

> **Estado:** Aprobado
> **Depende de:** SPEC 01, Tino-API SPEC 03
> **Fecha:** 2026-11-18
> **Objetivo:** Que el usuario con sesión entre a `/cuentas` con el menú de la aplicación y vea sus cuentas agrupadas en activos y pasivos, con totales y patrimonio neto, y pueda reordenarlas dentro de cada grupo.

## Por qué existe este spec

Es la primera pantalla de la aplicación autenticada. Fija tres cosas que heredarán las demás:

- El layout con menú (barra lateral en escritorio, pestañas en móvil).
- El cliente de la API con escritura y errores tipados (`codigo`, `mensaje`, `campo`).
- La presentación de montos que vienen de la API como string: se convierten a `bigint` y se formatean en la web, sin recalcular nada que la API ya calcula.

Diseño: `referencias/export-cuentas/` (`Menu.dc.html`, `Cuentas.dc.html`, `Menu y Cuentas.dc.html`).
Inventario: `../Tino-API/specs/necesidades/cuentas.md`.
Contrato: `../Tino-API/docs/api/cuentas.md` (Tino-API SPEC 03).

La pantalla completa se partió en dos specs. Este cubre menú, lista y orden. El SPEC 04 cubrirá el panel lateral de alta y edición, archivar, restaurar, borrar y la lista de archivadas.

## Alcance

**Entra:**

- Layout `(aplicacion)` con menú fiel a `Menu.dc.html`, en claro y oscuro con los tokens de `globals.css`.
  - Desde 768 px (`md`): barra lateral de 232 px con «TINO», botón «Registrar», ocho entradas y, al pie, «Cambiar tema» y «Salir».
  - Bajo 768 px: barra inferior de cinco pestañas (Resumen, Movimientos, Registrar, Cuentas, Más) y hoja «Más».
  - Hoja «Más»: Deudas y préstamos, Recurrentes, Inversiones, Metas y Avisos; debajo, «Cambiar tema» y «Salir». Se cierra con «Cerrar», tocando el fondo o con Escape.
  - Solo «Cuentas» navega. Las demás entradas y «Registrar» se ven deshabilitadas, con `title="Próximamente"` y `aria-disabled="true"`.
  - La entrada activa se resalta según la ruta.
- `/` redirige a `/cuentas`.
- El botón de tema fijo (`BotonTema`) sale del layout raíz. Queda en `(acceso)/layout.tsx` y en `/estilos`.
- Página `/cuentas` fiel a `Cuentas.dc.html`, escritorio y móvil:
  - Cabecera: «Cuentas», «Saldos al 18 nov 2026» (móvil: «Al 18 nov»), botón «Ordenar» y botón «Nueva cuenta».
  - Grupo Activos («Lo que tienes») como hoja con superficie; grupo Pasivos («Lo que debes») sobre el fondo. Cada uno con su total.
  - Fila de cuenta: ícono por tipo, nombre, tipo, detalle y saldo.
  - Tarjeta de crédito: barra de cupo usado, «Usado N %», «Disponible X de Y».
  - Cierre: Activos, Pasivos y «Patrimonio neto» con doble raya.
- Modo «Ordenar»: arrastrar (HTML5 nativo) y botones Subir/Bajar de 44 px, solo dentro del grupo. Se guarda al pulsar «Listo».
- «Nueva cuenta» y la acción del estado vacío, visibles y deshabilitadas con `title="Próximamente"`.
- Estados: carga (`loading.tsx`), error (`error.tsx`), sin cuentas, grupo vacío.
- `cliente.ts` gana escritura (`enviar`) y errores con `codigo` y `campo`.
- Funciones de dominio puras con pruebas: mover en un orden y formatear la fecha de los saldos.

**Fuera de alcance (specs futuros):**

- Panel lateral de nueva cuenta y de edición, archivar, restaurar, borrar y lista de archivadas (SPEC 04). Cubre N-30 a N-46.
- Hacer clic en una fila (abrirá la edición en SPEC 04).
- TRM en el menú y en la cabecera, cuentas en USD (N-01, N-08, N-20).
- Contador de avisos y punto en «Más» (N-02).
- Secciones Resumen, Movimientos, Deudas, Recurrentes, Inversiones, Metas y Avisos (N-03, N-04).
- «Registrar» / captura rápida (N-05).
- Corte, días al corte y pago límite de la tarjeta (N-19).
- Préstamos otorgados y deudas contraídas (N-21, N-22).
- Arrastre táctil en móvil (en móvil se usa Subir/Bajar).
- Barra de estado simulada del móvil (`9:41`, `5G`): es maqueta.

## Modelo de datos

Este spec no introduce tablas ni migraciones. Consume `GET /cuentas` y `PUT /cuentas/orden`.

### Contrato (copiado de Tino-API, no se redefine)

`src/repositories/api/cuentas.ts` declara los DTOs tal como los define `docs/api/cuentas.md`: `TipoCuenta` (`"efectivo" | "banco" | "tarjeta_credito"`), `Naturaleza`, `CuentaDto`, `GrupoCuentasDto`, `ListaCuentasDto`. Montos como `string`.

### Modelo de la web

El repositorio convierte los DTOs a este modelo. Todo monto pasa a `bigint` (REGLAS §6). No se recalcula nada: totales, disponible, porcentaje y patrimonio vienen de la API.

```ts
type Cuenta = {
  id: string;
  nombre: string;
  tipo: "efectivo" | "banco" | "tarjeta_credito";
  naturaleza: "activo" | "pasivo";
  detalle: string | null;
  saldo: bigint;                 // en un pasivo, la deuda, positiva
  tarjeta: { cupo: bigint; disponible: bigint; porcentajeUsado: number } | null;
};

type GrupoCuentas = { total: bigint; cuentas: Cuenta[] };

type ListaCuentas = {
  fechaSaldos: string;           // "YYYY-MM-DD", tal cual llega
  activos: GrupoCuentas;
  pasivos: GrupoCuentas;
  patrimonioNeto: bigint;        // ya con su signo
};
```

### Errores de la API

```ts
class ErrorApi extends Error {
  estado: number;
  codigo: string;                // "ORDEN_INVALIDO", "ERROR_INTERNO"…; "SIN_CONEXION" si fetch falla
  campo?: string;
  // message = `mensaje` de la API
}
```

### Resultado de la server action

```ts
type ResultadoOrden =
  | { ok: true }
  | { ok: false; codigo: string; mensaje: string };

// Entrada: uno o dos grupos, solo los que cambiaron.
type CambioOrden = { naturaleza: "activo" | "pasivo"; ids: string[] };
```

### Presentación

| Dato | Escritorio | Móvil |
|---|---|---|
| Fecha | `Saldos al 18 nov 2026` | `Al 18 nov` |
| Subtítulo efectivo/banco | tipo («Banco») | `Banco · Ahorros ·· 4821`; sin detalle, solo `Banco` |
| Subtítulo tarjeta | `Tarjeta de crédito` | `Tarjeta de crédito · cupo 4.000.000` |
| Columna detalle | `detalle` o vacío; en la tarjeta, `detalle` y debajo la barra | — (barra bajo la fila) |
| Saldo activo | `20.321` en tinta | igual |
| Saldo pasivo | `−1.284.300` en `salida-texto`, leyenda `deuda` | igual |
| Total pasivos | `−1.284.300` en `salida-texto` | igual |
| Patrimonio | `patrimonioNeto` formateado tal cual (negativo con `−` U+2212) | igual |
| Barra tarjeta | ancho = `porcentajeUsado` %, color `salida` | igual |
| Disponible negativo | `Disponible −200.000 de 4.000.000` | `Disponible −200.000` |

Montos con `formatearDinero(…, { omitirCOP: true })`, en `font-mono tabular-nums`. Meses abreviados: `ene feb mar abr may jun jul ago sep oct nov dic`.

Mapa de tokens del diseño: `--bg` → `fondo`, `--sf` → `superficie`, `--sk` → `hundido`, `--tx` → `texto`, `--t2` → `secundario`, `--t3` → `terciario`, `--ln` → `linea`, `--lf` → `raya`, `--br` → `marca-texto`, `--out` → `salida` / `salida-texto`.

### Textos literales

| Caso | Texto |
|---|---|
| Sin cuentas: título | «Aún no tienes cuentas.» |
| Sin cuentas: detalle | «Crea tu primera cuenta para ver tu patrimonio.» |
| Sin cuentas: acción (deshabilitada) | «Nueva cuenta» |
| Grupo vacío | «Sin activos» / «Sin pasivos» |
| Error al cargar | «No pudimos cargar tus cuentas.» + botón «Reintentar» |
| Guardando orden | botón «Guardando…», deshabilitado |
| `ORDEN_INVALIDO` | «Tu lista cambió. La recargamos; vuelve a ordenar.» |
| Otro fallo al ordenar | `mensaje` de la API, o «No pudimos guardar el orden. Intenta de nuevo.» si no hay conexión |

## Cobertura de necesidades

| Pantalla | N-xx | Endpoint / origen |
|---|---|---|
| Menú | Entradas deshabilitadas para N-03, N-04, N-05 | Sin endpoint: solo presentación. |
| Cuentas | N-06, N-07 | `GET /cuentas` → `fechaSaldos` |
| Cuentas | N-09 | `GET /cuentas` → `activos` / `pasivos` |
| Cuentas | N-10, N-23 | `activos.total`, `pasivos.total` |
| Cuentas | N-11, N-12, N-13 | `nombre`, `tipo`, `detalle` |
| Cuentas | N-14, N-15 | `saldo` + `naturaleza`; «−» y «deuda» los pone la web |
| Cuentas | N-16, N-17, N-18 | `tarjeta.cupo`, `tarjeta.porcentajeUsado`, `tarjeta.disponible` |
| Cuentas | N-24 | `patrimonioNeto` |
| Cuentas | N-25, N-28 | Orden del arreglo `cuentas`, sin reordenar en la web |
| Cuentas | N-26, N-27 | `PUT /cuentas/orden`; `ORDEN_INVALIDO` |
| Cuentas | N-29 | `CuentaDto.id` (usado en el orden) |
| Cuentas | N-47 | Grupos vacíos; acción deshabilitada hasta SPEC 04 |
| Cuentas | N-48 | `cuentas: []`, `total: "0"` |
| Cuentas | N-49 | `loading.tsx`, `error.tsx` |
| Cuentas | N-50 (solo orden) | `ErrorApi` (`codigo`, `mensaje`) |
| Cuentas | N-51 | Montos string → `bigint`; `formatearDinero` |
| Cuentas | N-52 | Token del usuario en cada petición; aislamiento en la API |
| SPEC 04 | N-30 a N-46, resto de N-50 | `POST`, `PATCH`, `DELETE`, archivar, restaurar, archivadas |
| Fuera de alcance | N-01, N-02, N-08, N-19 a N-22 | La API no los ofrece. |

## Estructura de archivos

Aprobada por el autor.

```
src/app/
  page.tsx                         # redirect("/cuentas")
  layout.tsx                       # sin <BotonTema />
  (acceso)/layout.tsx              # nuevo: <BotonTema /> fijo
  estilos/page.tsx                 # + <BotonTema />
  (aplicacion)/
    layout.tsx                     # menú lateral (md+) / pestañas (<md); pasa `salir` a los menús
    cuentas/
      page.tsx                     # servidor: obtenerCuentas()
      loading.tsx
      error.tsx                    # cliente
      acciones.ts                  # server action guardarOrden
src/components/
  boton-tema.tsx                   # exporta alternarTema() además de <BotonTema />
  estado-vacio.tsx                 # acción opcionalmente deshabilitada
  menu/
    entradas.ts                    # destinos, rótulo, href, habilitado
    menu-lateral.tsx               # cliente (usePathname)
    barra-pestanas.tsx             # cliente; incluye la hoja «Más»
  cuentas/
    lista-cuentas.tsx              # cliente: modo Ordenar, arrastre, Subir/Bajar, guardar
    grupo-cuentas.tsx
    fila-cuenta.tsx
    cierre-patrimonio.tsx
src/domain/
  cuenta/orden.ts                  # + orden.test.ts
  fecha/formato.ts                 # + formato.test.ts
src/services/cuentas.ts            # obtenerCuentas(), guardarOrden()
src/repositories/api/
  cliente.ts                       # + enviar(); ErrorApi con codigo y campo
  cuentas.ts                       # DTOs, conversión a modelo, listarCuentas(), guardarOrdenGrupo()
  cuentas.test.ts                  # conversión DTO → modelo
```

Dirección: `app/(aplicacion)/cuentas → services/cuentas → repositories/api/cuentas → repositories/api/cliente`. Los componentes importan `domain/` y tipos; nunca `repositories/` ni `@supabase/*`.

## Plan de implementación

1. `src/domain/fecha/formato.ts`: `formatearFecha("2026-11-18")` → `"18 nov 2026"` y `formatearFechaSinAnio(…)` → `"18 nov"`. Solo parte el string; no usa `Date` (evita corrimientos de zona). Pruebas: los doce meses, día con cero a la izquierda (`"2026-01-05"` → `"5 ene 2026"`), entrada mal formada lanza error.
2. `src/domain/cuenta/orden.ts`: `moverA(ids, id, destino)` devuelve un arreglo nuevo con `id` en la posición `destino`, acotada a los límites; `id` ausente devuelve copia igual. `ordenCambio(original, actual)` → `boolean`. Pruebas: subir el primero no cambia, bajar el último no cambia, mover al medio, arreglo de uno, sin mutar la entrada.
3. `src/repositories/api/cliente.ts`: `enviar<T>(metodo, ruta, cuerpo?)` para `POST`/`PUT`/`PATCH`/`DELETE`, con token y `cache: "no-store"`. `204` devuelve `null`. Error: lee `{ codigo, mensaje, campo }` del cuerpo; si no es JSON, `codigo = "ERROR_INTERNO"`. Si `fetch` lanza, `ErrorApi(0, "SIN_CONEXION")`. `obtener` usa el mismo lector de errores y conserva su contrato (404 → `null`).
4. `src/repositories/api/cuentas.ts`: DTOs del contrato, `aListaCuentas(dto)` (string → `bigint`), `listarCuentas()` (`GET /cuentas`) y `guardarOrdenGrupo(naturaleza, ids)` (`PUT /cuentas/orden`). `cuentas.test.ts` prueba la conversión con los dos ejemplos JSON del contrato (con cuentas y vacío), incluido `patrimonioNeto: "-1263979"` → `-1263979n`.
5. `src/services/cuentas.ts`: `obtenerCuentas()` delega; si `ErrorApi.estado === 401`, `redirect("/login")`. `guardarOrden(cambios)` llama a `guardarOrdenGrupo` una vez por cambio, en orden, y se detiene en el primer error.
6. `src/components/boton-tema.tsx`: extrae `alternarTema()` exportada; `BotonTema` la usa. Mover `<BotonTema />` del layout raíz a `src/app/(acceso)/layout.tsx` (nuevo) y a `src/app/estilos/page.tsx`. Acceso y estilos se ven igual que hoy.
7. `src/components/menu/entradas.ts`: lista de destinos con `DestinoNavegacion`, rótulo («Deudas y préstamos» en el menú), `href` (solo `cuentas` → `/cuentas`) y `habilitado`. Reutiliza `IconoNavegacion` de `iconos.tsx`.
8. `src/components/menu/menu-lateral.tsx`: barra de 232 px según el diseño; entrada activa con fondo `hundido` y peso 600; deshabilitadas en `secundario` sin `href`; «Registrar» deshabilitado; al pie «Cambiar tema» (llama a `alternarTema`) y «Salir» (form con la acción recibida por prop).
9. `src/components/menu/barra-pestanas.tsx`: cinco pestañas fijas abajo (84 px con `env(safe-area-inset-bottom)`); Registrar como cuadro de tinta de 40 px, deshabilitado; «Más» abre la hoja con fondo al 60 %; Escape, «Cerrar» y el fondo la cierran.
10. `src/app/(aplicacion)/layout.tsx`: grid `md:grid-cols-[232px_minmax(0,1fr)]`; `MenuLateral` visible en `md+`, `BarraPestanas` bajo `md`; `main` con relleno inferior para no quedar bajo las pestañas. Importa `salir` de `(acceso)/acciones.ts` y la pasa a ambos menús. `src/app/page.tsx` pasa a `redirect("/cuentas")`.
11. `src/components/cuentas/fila-cuenta.tsx`, `grupo-cuentas.tsx` y `cierre-patrimonio.tsx`: presentación según la tabla de Presentación, sin estado. Escritorio: grid `28px 24px minmax(0,1.1fr) minmax(0,1.6fr) 200px`. Móvil: `20px minmax(0,1fr) auto`. Entre 768 y 1023 px el `main` usa 24 px de relleno lateral; textos largos se cortan con elipsis.
12. `src/components/estado-vacio.tsx`: `accion` admite `{ etiqueta, deshabilitada: true }`, que dibuja un botón deshabilitado con `title="Próximamente"` en lugar del enlace. Los usos actuales no cambian.
13. `src/components/cuentas/lista-cuentas.tsx` (cliente), solo lectura: recibe `ListaCuentas`, dibuja cabecera, grupos, cierre, grupo vacío y estado vacío. «Ordenar» deshabilitado si no hay cuentas. «Nueva cuenta» deshabilitado.
14. `src/app/(aplicacion)/cuentas/page.tsx`, `loading.tsx` y `error.tsx`. La página llama a `obtenerCuentas()` y pasa el resultado a `ListaCuentas`. `loading.tsx`: cabecera y renglones vacíos. `error.tsx`: mensaje y «Reintentar» (`reset`). En este punto `/cuentas` muestra datos reales.
15. Modo «Ordenar» en `lista-cuentas.tsx`: estado local con el orden de cada grupo; oculta saldos y barra de tarjeta (móvil), muestra agarre y Subir/Bajar (deshabilitados en los extremos, en `terciario`); arrastre nativo con resaltado `hundido` en la fila destino, aceptado solo si origen y destino son del mismo grupo. Usa `moverA`. Botón «Ordenar» ↔ «Listo» (escritorio con ícono y borde `texto` en modo activo; móvil como texto en `marca-texto`).
16. `src/app/(aplicacion)/cuentas/acciones.ts`: `guardarOrden(cambios)` valida forma (1–2 cambios, `naturaleza` válida, sin naturaleza repetida, `ids` arreglo de strings UUID), llama al servicio, `revalidatePath("/cuentas")` en éxito y devuelve `ResultadoOrden`. Nunca lanza al cliente.
17. «Listo» en `lista-cuentas.tsx`: si `ordenCambio` es falso en ambos grupos, sale sin petición. Si no, envía solo los grupos cambiados; «Guardando…» mientras tanto. Éxito: sale del modo. `ORDEN_INVALIDO`: sale del modo, `router.refresh()` y muestra el aviso. Otro fallo: sigue en modo con el orden local y muestra el mensaje bajo la cabecera (`role="alert"`).

## Criterios de aceptación

- [ ] `npm test`, `npm run lint` y `npx tsc --noEmit` pasan.
- [ ] Con sesión, `/` redirige a `/cuentas`. Sin sesión, `/cuentas` redirige a `/login`.
- [ ] En 1440 px se ve la barra lateral con «TINO», «Registrar», las ocho entradas y, al pie, «Cambiar tema» y «Salir»; «Cuentas» resaltada.
- [ ] En 768 px se ve la barra lateral; en 767 px, la barra de pestañas.
- [ ] En 390 px se ven las cinco pestañas abajo, sin scroll horizontal, y el contenido no queda tapado por ellas.
- [ ] Pulsar Resumen, Movimientos, Registrar o cualquier sección de «Más» no navega; tienen `title="Próximamente"`.
- [ ] «Más» abre la hoja con Deudas y préstamos, Recurrentes, Inversiones, Metas, Avisos, «Cambiar tema» y «Salir»; Escape, «Cerrar» y tocar el fondo la cierran.
- [ ] «Cambiar tema» (lateral y hoja) alterna claro/oscuro y se conserva al recargar.
- [ ] «Salir» cierra sesión y lleva a `/login`.
- [ ] No hay botón de tema fijo en `/cuentas`; sí en `/login`, `/registro` y `/estilos`.
- [ ] Con la cuenta «Nequi» (banco, 20.321) y la «Tarjeta» del contrato (deuda 1.284.300, cupo 4.000.000), `/cuentas` muestra: Activos `20.321`, Pasivos `−1.284.300` en rojo, tarjeta con «Usado 32 %» y «Disponible 2.715.700 de 4.000.000», leyenda «deuda», patrimonio `−1.263.979`.
- [ ] La cabecera dice «Saldos al» + `fechaSaldos` de la API (móvil: «Al 18 nov»), sin TRM.
- [ ] La tarjeta no muestra corte ni pago límite.
- [ ] Las cuentas aparecen en el orden del arreglo de la API, igual en escritorio y móvil.
- [ ] Un usuario sin cuentas ve «Aún no tienes cuentas.» con «Nueva cuenta» deshabilitado, y «Ordenar» deshabilitado.
- [ ] Con solo activos, el grupo Pasivos muestra «Sin pasivos» y total `0`.
- [ ] Con la API apagada, `/cuentas` muestra «No pudimos cargar tus cuentas.»; al encenderla, «Reintentar» carga la lista.
- [ ] En modo Ordenar, Subir en la primera fila y Bajar en la última están deshabilitados.
- [ ] Mover una cuenta y pulsar «Listo» envía un solo `PUT /cuentas/orden` con el grupo completo; al recargar se conserva el orden.
- [ ] Cambiar ambos grupos envía dos `PUT`, uno por grupo.
- [ ] Pulsar «Listo» sin mover nada no hace ninguna petición.
- [ ] Arrastrar una cuenta activa sobre un pasivo no la mueve.
- [ ] Si otra sesión archiva una cuenta del grupo antes de «Listo», aparece «Tu lista cambió. La recargamos; vuelve a ordenar.» y la lista refleja el servidor.
- [ ] Con la API caída al pulsar «Listo», el modo sigue activo con el orden local y aparece «No pudimos guardar el orden. Intenta de nuevo.».
- [ ] Ningún archivo en `src/components/` ni `src/app/` importa `@supabase/*` ni `repositories/` (salvo `proxy.ts`).
- [ ] Ningún monto pasa por `number` ni por `parseFloat`/`Number()` en `src/`; el porcentaje usado es el único `number` y viene de la API.

## Decisiones

- **Sí:** partir la pantalla en dos specs (lista + orden aquí; alta, edición, archivo y borrado en SPEC 04). **No:** un spec único; ~20 pasos y formularios sin diseño mezclados con lo dibujado.
- **Sí:** secciones futuras visibles y deshabilitadas con «Próximamente». **No:** ocultarlas; el menú cambiaría de forma con cada spec. Mismo criterio que el botón Google de SPEC 01.
- **Sí:** «Metas» visible deshabilitada, como en el diseño. No se construye: requiere enmendar REGLAS §7 antes.
- **Sí:** `/` redirige a `/cuentas`. **No:** mantener el marcador; no hay Resumen todavía.
- **Sí:** tema y «Salir» al pie de la barra lateral y en la hoja «Más». **No:** botón de tema fijo en la aplicación; tapa «Nueva cuenta».
- **Sí:** barra lateral desde 768 px (`md`), elegido por el autor. **No:** 1024 px. Consecuencia: relleno reducido entre 768 y 1023 px (ver riesgos).
- **Sí:** «Nueva cuenta» y la acción del estado vacío deshabilitadas. **No:** ocultarlas; SPEC 04 solo las activa. Para probar con datos se crean cuentas por la API.
- **Sí:** guardar el orden al pulsar «Listo», un `PUT` por grupo cambiado. **No:** guardar en cada movimiento; más peticiones y más estados intermedios.
- **Sí:** arrastre HTML5 nativo + Subir/Bajar. **No:** dnd-kit; añade dependencia. Arrastre táctil queda fuera.
- **Sí:** `ORDEN_INVALIDO` recarga; otros fallos conservan el orden local para reintentar. **No:** revertir siempre; perdería el trabajo del usuario por un fallo de red.
- **Sí:** montos a `bigint` en el repositorio. **No:** formatear directamente los strings; el resto de la web ya trabaja con `Dinero` en `bigint`.
- **Sí:** la web no recalcula totales, disponible, porcentaje ni patrimonio. **No:** usar `domain/cuenta/cupo.ts` aquí; la API es la dueña del cálculo (REGLAS §5).
- **Sí:** formatear la fecha partiendo el string. **No:** `new Date("2026-11-18")`; se interpreta en UTC y puede mostrar el día anterior.
- **Sí:** server action para el orden. **No:** llamar a la API desde el navegador; el token vive en cookies del servidor y `cliente.ts` es el único punto de contacto.
- **Sí:** `salir` se pasa por prop desde el layout. **No:** importar `app/` desde `components/`.
- **Sí:** filas nuevas (`FilaCuenta`). **No:** reutilizar `TarjetaCuenta`; es la tarjeta suelta del sistema de diseño (C3), con otro formato. Queda intacta para `/estilos`.
- **Sí:** estructura y nombres aprobados por el autor (grupo `(aplicacion)`).

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Entre 768 y 1023 px la tabla de cinco columnas queda apretada (~480 px útiles) | Relleno lateral de 24 px en ese rango; columnas `minmax(0,…)` con elipsis; criterio de aceptación en 768 px. |
| Con dos grupos cambiados, el primer `PUT` puede salir bien y el segundo fallar | Cada `PUT` es atómico e idempotente en la API. Tras el fallo, el modo sigue activo; un nuevo «Listo» reenvía ambos grupos sin efecto dañino. |
| `bigint` en props de un componente cliente | React 19 serializa `bigint` entre servidor y cliente; la prueba de tipos y la carga real lo verifican. |
| Token vencido entre el proxy y la llamada a la API | `obtenerCuentas` redirige a `/login` ante `401`. |
| El arrastre HTML5 no funciona con dedo | En móvil se ordena con Subir/Bajar; arrastre táctil fuera de alcance. |

## Lo que **no** entra en este spec

- Panel lateral de nueva cuenta y edición, archivar, restaurar, borrar y archivadas (SPEC 04).
- TRM, USD, avisos, captura rápida y las demás secciones del menú.
- Ciclo de la tarjeta (corte y pago límite).
- Arrastre táctil.

Cada uno, si llega, va en su propio spec.
