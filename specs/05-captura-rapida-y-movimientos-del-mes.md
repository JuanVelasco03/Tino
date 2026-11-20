# SPEC 05 — Captura rápida y movimientos del mes

> **Estado:** Aprobado
> **Depende de:** SPEC 03, SPEC 04, Tino-API SPEC 04
> **Fecha:** 2026-11-19
> **Objetivo:** Que el usuario registre un gasto, ingreso o transferencia en menos de diez segundos desde cualquier página, y lo vea arriba de la lista de movimientos del mes.

## Por qué existe este spec

Es el criterio de éxito de REGLAS §1. Fija estos patrones:

- Un formulario global que vive en el layout de la aplicación, no en una ruta.
- Una sola lógica de captura (`usarCaptura`) con dos presentaciones: panel en escritorio, hoja a pantalla completa en móvil.
- Autocompletado contra la API mientras se escribe, con respuestas viejas descartadas.
- RN-11 en la interfaz: la propuesta de la regla se ve como propuesta, y crear o ajustar una regla se ofrece, nunca se hace solo.

Diseño: `referencias/export-captura/` (`Captura Escritorio.dc.html`, `Captura Movil.dc.html`, `TINO Captura Rápida.dc.html`).
Inventario: `../Tino-API/specs/necesidades/captura-rapida.md`.
Contrato: `../Tino-API/docs/api/captura.md`, `movimientos.md`, `reglas.md` (Tino-API SPEC 04).

## Alcance

**Entra:**

- «Registrar» habilitado: botón del menú lateral (con la marca de tecla «N»), tecla `N` en escritorio y pestaña central en móvil. Abren la captura sobre la página actual, sin cambiar la URL.
- Escritorio (≥ 768 px): `PanelLateral` (C22) de 480 px a la derecha.
- Móvil (< 768 px): hoja `<dialog>` a pantalla completa con teclado numérico propio.
- Tipos gasto, ingreso y transferencia; gasto por defecto. La transferencia pide «Desde» y «Hacia», distintas.
- Monto obligatorio > 0, en pesos enteros. Botón inactivo con 0.
- Descripción opcional con autocompletado (`GET /sugerencias`):
  - Escritorio: texto fantasma y hasta 2 sugerencias; Tab acepta la primera, clic cualquiera.
  - Móvil: sin texto, chips de conceptos frecuentes; con texto, chips con las sugerencias.
- Categoría opcional por chips (C5) del tipo elegido. La regla la propone («Sugerida por «almuerzo»»); el usuario la elige, la cambia o la quita. Sin categoría se registra «sin clasificar».
- Cuenta con la predeterminada puesta e indicada. Vista previa del saldo resultante (solo presentación).
- Fecha: Hoy, Ayer, Anteayer u «Otra fecha» (`<input type="date">`), cualquier día.
- Nota opcional (≤ 500) bajo «Más opciones», solo en escritorio.
- Registrar deja el formulario listo para otro y muestra «Registrado: …» con «Deshacer» durante 5 s (`DELETE /movimientos/:id`).
- Tras registrar, si aplica, se ofrece crear la regla (`POST /reglas`) o ajustarla (`PATCH /reglas/:id`).
- Cabecera móvil «Hoy −5.700» con los gastos de hoy; oculta si son cero.
- Sin cuentas activas: «Para registrar necesitas una cuenta.» y «+ Nueva cuenta».
- Página `/movimientos`: lista del mes actual en solo lectura, con carga, error y vacío. «Movimientos» habilitado en el menú. El recién registrado aparece arriba, resaltado mientras dura su aviso.
- Componentes nuevos con muestra en `/estilos`: `TecladoNumerico`, `SelectorTipo`, `FichaCuenta`, `AvisoRegistro`. `ChipCategoria` (C5) pasa a ser interactivo.

**Fuera de alcance (SPEC 06 y otros):**

- Editar y eliminar movimientos de la lista (N-15 a N-19).
- Cambiar de mes (N-05).
- Dividir entre categorías y ver las partes (N-41 a N-43, N-12). Un movimiento con partes se muestra como «Dividido».
- Elegir la cuenta predeterminada (N-34, `PATCH /perfil`).
- Nota en móvil (el diseño no la dibuja).
- Persona, TRM, contador de avisos, entradas a otros módulos, indicador de sin clasificar (N-44, N-01, N-02, N-03, N-60).
- Listar o borrar reglas; gestionar categorías.
- USD.

## Modelo de datos

Este spec no introduce tablas ni migraciones. Consume `GET /captura`, `GET /sugerencias`, `GET /movimientos`, `POST /movimientos`, `DELETE /movimientos/:id`, `POST /reglas`, `PATCH /reglas/:id` y `GET /cuentas`.

### Contrato (copiado de Tino-API, no se redefine)

- `src/repositories/api/captura.ts`: `CategoriaDto`, `CapturaDto`, `SugerenciasDto` de `docs/api/captura.md`.
- `src/repositories/api/movimientos.ts`: `TipoMovimiento`, `MovimientoDto`, `MovimientoCuerpo` de `docs/api/movimientos.md`.
- `src/repositories/api/reglas.ts`: `ReglaDto` de `docs/api/reglas.md`.

Montos como `string` entero en el borde; `bigint` desde el repositorio hacia dentro.

### Modelo de la web

```ts
type Movimiento = {
  id: string;
  tipo: TipoMovimiento;
  monto: bigint;                 // siempre positivo
  fecha: string;                 // "YYYY-MM-DD"
  descripcion: string | null;
  cuentaOrigen: Ref | null;
  cuentaDestino: Ref | null;
  categoria: Ref | null;
  dividido: boolean;             // partes.length > 0
};

type Captura = {
  fechaHoy: string;
  cuentaPredeterminadaId: string | null;
  categorias: { gasto: Categoria[]; ingreso: Categoria[] };
  gastosHoy: bigint;
  conceptosFrecuentes: Record<TipoMovimiento, string[]>;
};

// Estado del formulario, en el cliente.
type ValoresCaptura = {
  tipo: TipoMovimiento;
  monto: string;                 // "15.000", lo tecleado ya formateado
  descripcion: string;
  categoria:                     // lo que decidió el usuario sobre la categoría
    | { modo: "propuesta" }      // sin tocar: vale la propuesta de la regla, si hay
    | { modo: "elegida"; id: string }
    | { modo: "quitada" };       // tocó la propuesta para quitarla
  cuentaId: string | null;       // gasto: origen · ingreso: destino · transferencia: origen
  destinoId: string | null;      // solo transferencia
  fecha: string;                 // "YYYY-MM-DD"; por defecto captura.fechaHoy
  nota: string;
};

type CampoCaptura = "tipo" | "monto" | "descripcion" | "categoria" | "cuenta" | "destino" | "fecha" | "nota";
```

Campo de la API → campo del formulario: `monto` → `monto`; `cuentaOrigenId` → `cuenta`; `cuentaDestinoId` → `cuenta` en ingreso y `destino` en transferencia; `categoriaId` → `categoria`; `fecha`, `descripcion`, `nota` igual.

### Resultados de las server actions

```ts
type ResultadoRegistro =
  | { ok: true; movimiento: Movimiento }
  | { ok: false; codigo: string; mensaje: string; campo?: CampoCaptura };

type ResultadoSimple = { ok: true } | { ok: false; codigo: string; mensaje: string };
```

Nunca lanzan al cliente. Registrar y deshacer revalidan `/movimientos` y `/cuentas`.

### Dominio

```ts
// src/domain/movimiento/cuerpo.ts
cuerpoDesdeValores(valores: ValoresCaptura, propuesta: CategoriaDto | null): MovimientoCuerpo | null;
// null si el monto no es válido. Gasto: cuentaOrigenId. Ingreso: cuentaDestinoId.
// Transferencia: ambos y nunca categoriaId. Categoría efectiva: elegida > propuesta > null.

// src/domain/movimiento/vista-previa.ts
saldoResultante(cuenta: { tipo: TipoCuenta; saldo: bigint }, sentido: Sentido, monto: bigint): bigint;
// saldo + efectoEnSaldo (naturaleza.ts, RN-02). En un pasivo el saldo es la deuda.

// src/domain/categorizacion/oferta.ts
ofertaDeRegla(entrada): { tipo: "crear"; palabraClave: string; categoria: Categoria }
                     | { tipo: "ajustar"; reglaId: string; palabraClave: string; categoria: Categoria }
                     | null;
// crear: sin propuesta, categoría elegida a mano, descripción no vacía y ≤ 60.
// ajustar: con propuesta y categoría elegida distinta de la propuesta.
// null en cualquier otro caso y siempre en transferencia.

// src/domain/fecha/formato.ts (+)
sumarDias(fecha: string, dias: number): string;   // "2026-11-01", -1 → "2026-10-31"; sin zona horaria
formatearDiaSemana(fecha: string): string;         // "2026-11-19" → "jue 19 nov"
formatearMes(mes: string): string;                 // "2026-11" → "Noviembre 2026"
```

Signo en la lista y en el aviso: gasto `−` en terracota, ingreso `+` en verde, transferencia sin signo en tinta. Coincide con `efectoEnPatrimonio` para cualquier cuenta (un gasto siempre reduce el patrimonio), así que la fila no necesita el tipo de cuenta.

### Pantallas

Tokens de `globals.css`. Sin sombras, radio máximo 6, cifras en mono tabular.

**Escritorio · panel de 480 px** (`PanelLateral` con `ancho="amplio"`):

```
┌──────────────────────────────────────── 480 px ┐
│ REGISTRAR                                Cerrar │  rótulo · raya
│ ✓ Registrado: Almuerzo −15.000 en Nequi Deshacer│  AvisoRegistro, 5 s
│   ¿Siempre «peluquería» → Hogar? Crear regla · No│  oferta, hasta responder o registrar otro
│ [ Gasto | Ingreso | Transferencia ]             │  SelectorTipo, activo en tinta
│ Monto                                       COP │  C4 editable, con signo − / +
│ −15.000▏                                        │
│ Descripción                                     │
│ almu|erzo                                       │  texto fantasma en terciario
│ ▸ Almuerzo                  Comida          Tab │  hasta 2 sugerencias
│ Categoría · Sugerida por «almuerzo»             │
│ [Comida ✓auto] [Transporte] [Celular] …         │  C5
│ Cuenta · Nequi es la predeterminada             │  transferencia: «Desde» y «Hacia»
│ [▣ Nequi 20.321 → 5.321] [▤ Efectivo 45.000]    │  FichaCuenta, 2 columnas
│ [▭ Visa Oro debe 1.284.300]                     │
│ Fecha        Hoy · jue 19 nov            Cambiar│  → Hoy · Ayer · Anteayer · Otra fecha
│ Más opciones · nota                           ▾ │  despliega «Nota»
│───────────────────────────────────────────────── │
│ [     Registrar gasto  −15.000     ]            │  Boton primario con monto
│ ↵ registra y deja el panel listo para otro      │
│                         Nequi quedará en 5.321  │
└─────────────────────────────────────────────────┘
```

- Enter en cualquier campo salvo la nota registra. Escape cierra.
- Cerrar conserva el borrador en memoria; registrar lo limpia (tipo, cuenta y fecha se mantienen).

**Móvil · hoja a pantalla completa:**

```
✕        Gasto  Ingreso  Transferir        Hoy −5.700
            −15.000 COP                    cifra-xl; cifra-campo si pasa de 9 caracteres
   ¿En qué? Escribe o elige abajo          campo de descripción
   Regla «almuerzo» → Comida               pista en marca-texto, si hay propuesta
[Almuerzo] [Pasaje] [Recarga datos] …      frecuentes; al escribir, sugerencias
Categoría     │ Cuenta      │ Fecha        cada celda abre una hoja inferior («Listo»)
Comida auto   │ Nequi       │ Hoy          transferencia: Desde │ Hacia │ Fecha
┌─────┬─────┬─────┐
│  1  │  2  │  3  │                        TecladoNumerico, radio 0
│ ... │     │     │
│ 000 │  0  │  ⌫  │
└─────┴─────┴─────┘
[   Registrar gasto 15.000   ]
✓ Almuerzo · Nequi   −15.000   Deshacer    5 s, sobre el botón
```

- Primer día: «Tus conceptos frecuentes aparecerán aquí.»
- La hoja de cuentas lista ícono, nombre, tipo y saldo («Debes» en pasivo), con marca en la elegida.

**Sin cuentas** (ambos formatos): «Para registrar necesitas una cuenta.» y «+ Nueva cuenta» (`EnlaceTexto` a `/cuentas?cuenta=nueva`, cierra la captura).

**Página `/movimientos`:**

```
Movimientos                                 h1
Noviembre 2026                              etiqueta secundaria
FECHA   DESCRIPCIÓN               CUENTA            IMPORTE     escritorio: rejilla de 4 columnas
19 nov  Almuerzo                  Nequi             −15.000     el recién registrado: fondo hundido, 600
        Comida
18 nov  Pago tarjeta              Nequi → Visa Oro  1.200.000
        Transferencia
```

- Móvil: `FilaMovimiento` (C2).
- Vacío: `EstadoVacio` con «Movimientos · noviembre», «Aún no registras movimientos este mes.», «Registra tu primer gasto.» y la acción «Registrar» (abre la captura).
- Error: «No pudimos cargar tus movimientos.» + «Reintentar».

### Textos literales

| Caso | Texto |
|---|---|
| Título del panel | «Registrar» |
| Tipos | «Gasto» · «Ingreso» · «Transferencia» (móvil: «Transferir») |
| Botón | «Registrar gasto» / «Registrar ingreso» / «Registrar transferencia» + monto · pendiente «Registrando…» |
| Ayuda del botón | «↵ registra y deja el panel listo para otro» |
| Vista previa | «{cuenta} quedará en {saldo}»; pasivo: «{cuenta} quedará en debe {deuda}» |
| Placeholder descripción | escritorio «Almuerzo, taxi, recarga…» · móvil «¿En qué? Escribe o elige abajo» |
| Propuesta | escritorio «Sugerida por «{palabraClave}»» · móvil «Regla «{palabraClave}» → {categoría}» |
| Cuenta | «Cuenta · {nombre} es la predeterminada»; transferencia «Desde» y «Hacia» |
| Fecha | «Hoy» · «Ayer» · «Anteayer» · «Otra fecha» · «Cambiar» |
| Más opciones | «Más opciones · nota» · «Nota» |
| Aviso | «Registrado: {descripción o tipo} {±monto} en {cuenta}» · «Deshacer» |
| Oferta crear | «¿Siempre «{palabraClave}» → {categoría}?» · «Crear regla» · «No» |
| Oferta ajustar | «¿Cambiar la regla «{palabraClave}» a {categoría}?» · «Cambiar regla» · «No» |
| Frecuentes vacíos | «Tus conceptos frecuentes aparecerán aquí.» |
| Sin cuentas | «Para registrar necesitas una cuenta.» · «+ Nueva cuenta» |
| Error al cargar la captura | «No pudimos cargar el formulario.» + «Reintentar» |
| Sin conexión | «No pudimos conectar. Intenta de nuevo.» |
| Errores de la API | `mensaje` del catálogo, bajo su campo (`campo`) o al pie del formulario. |

## Cobertura de necesidades

| Pantalla | N-xx | Endpoint / origen |
|---|---|---|
| Movimientos | N-04 | `GET /movimientos` sin `mes` |
| Movimientos | N-06 | Orden de la respuesta |
| Movimientos | N-07, N-08 | `fecha`, `descripcion` |
| Movimientos | N-09 | `categoria`, `tipo`; «Dividido» si hay `partes` |
| Movimientos | N-10 | `cuentaOrigen`, `cuentaDestino` |
| Movimientos | N-11 | `tipo` + `monto` |
| Movimientos | N-13, N-14 | `movimientos: []`; estados HTTP |
| Captura | N-20 | `GET /cuentas` tras registrar (revalidación) |
| Captura | N-21 | `tipo`; defecto en el cliente |
| Captura | N-22 | `MONTO_REQUERIDO`, `MONTO_INVALIDO` |
| Captura | N-23 | `moneda`, `tasa` (los pone la API) |
| Captura | N-24, N-40 | `descripcion`, `nota` |
| Captura | N-25, N-26 | `GET /sugerencias` → `conceptos` |
| Captura | N-27 | `GET /captura` → `categorias` |
| Captura | N-28 | `GET /sugerencias` → `propuesta` |
| Captura | N-29, N-30, N-31 | `categoriaId` opcional; `CATEGORIA_INVALIDA` |
| Captura | N-32 | `GET /cuentas` |
| Captura | N-33 | `GET /captura` → `cuentaPredeterminadaId` |
| Captura | N-35 | `saldoResultante` sobre `GET /cuentas` (presentación) |
| Captura | N-36, N-37, N-38 | `CUENTA_INVALIDA`, `CUENTA_ARCHIVADA`, `ORIGEN_REQUERIDO`, `DESTINO_REQUERIDO`, `CUENTAS_IGUALES` |
| Captura | N-39 | `fecha`; `FECHA_INVALIDA` |
| Captura | N-45 | `POST /movimientos` → `201 MovimientoDto` |
| Captura | N-46 | `DELETE /movimientos/:id`; plazo de 5 s en el cliente |
| Captura | N-47 | `POST /reglas`; `PALABRA_CLAVE_DUPLICADA` |
| Captura | N-48 | `PATCH /reglas/:id` con `propuesta.regla.id` |
| Todas | N-49 | `ErrorApi` (`codigo`, `mensaje`, `campo`) |
| Todas | N-52, N-53 | Montos string entero / `bigint`; token del usuario |
| Captura móvil | N-56 | `GET /captura` → `gastosHoy` |
| Captura móvil | N-57, N-58, N-59 | `conceptosFrecuentes`; listas vacías |
| Ya cubierto (API) | N-50, N-51, N-54, N-55 | Semilla, bloqueo de moneda, `CUENTA_CON_MOVIMIENTOS` (el panel de cuentas ya muestra el `mensaje`) |
| SPEC 06 | N-05, N-12, N-15 a N-19, N-34, N-41 a N-43 | — |
| Fuera de alcance | N-01, N-02, N-03, N-44, N-60 | — |

## Estructura de archivos

Pendiente de aprobación del autor (REGLAS §8).

```
src/app/(aplicacion)/
  layout.tsx                    # + <ProveedorCaptura> envuelve menú, contenido y pestañas
  captura/acciones.ts           # cargarCaptura, sugerir, registrarMovimiento, deshacerRegistro, crearRegla, ajustarRegla
  movimientos/
    page.tsx                    # GET /movimientos
    loading.tsx
    error.tsx
src/app/estilos/page.tsx        # + TecladoNumerico, SelectorTipo, FichaCuenta, AvisoRegistro, C5 interactivo
src/components/
  captura/
    proveedor-captura.tsx       # contexto: abrir, cerrar, tecla N, borrador, último registrado; elige panel u hoja
    usar-captura.ts             # hook: carga, valores, sugerencias, registrar, deshacer, oferta
    panel-captura.tsx           # escritorio
    hoja-captura.tsx            # móvil, <dialog> a pantalla completa
    selector-tipo.tsx
    teclado-numerico.tsx
    ficha-cuenta.tsx
    selector-fecha.tsx
    aviso-registro.tsx          # aviso + Deshacer + oferta de regla
  movimientos/libro-movimientos.tsx  # lista del mes; resalta el recién registrado
  chip-categoria.tsx            # + onClick, aria-pressed
  fila-movimiento.tsx           # signo por tipo; tipoCuenta deja de ser necesario
  estado-vacio.tsx              # + acción que es botón (alPulsar)
  panel-lateral.tsx             # + ancho «amplio» (480 px)
  menu/entradas.ts              # Movimientos → /movimientos; Registrar habilitado
  menu/menu-lateral.tsx         # Registrar abre la captura; marca «N»
  menu/barra-pestanas.tsx       # pestaña Registrar abre la captura
src/domain/movimiento/cuerpo.ts          # + cuerpo.test.ts
src/domain/movimiento/vista-previa.ts    # + vista-previa.test.ts
src/domain/categorizacion/oferta.ts      # + oferta.test.ts
src/domain/fecha/formato.ts              # + sumarDias, formatearDiaSemana, formatearMes (+ pruebas)
src/services/captura.ts                  # cargar, sugerir, crearRegla, ajustarRegla
src/services/movimientos.ts              # listarDelMes, registrar, eliminar
src/repositories/api/captura.ts          # + captura.test.ts
src/repositories/api/movimientos.ts      # + movimientos.test.ts
src/repositories/api/reglas.ts
DESIGN.md                                # + componentes nuevos, panel de 480 px, hoja de captura
```

Dirección: `app → services → repositories/api → cliente`. Los componentes importan `domain/` y tipos; nunca `repositories/`. Las server actions llegan por props desde el layout.

## Plan de implementación

1. `domain/fecha/formato.ts`: `sumarDias`, `formatearDiaSemana`, `formatearMes`. Pruebas: cambio de mes y de año, 29 de febrero, «jue 19 nov», «Noviembre 2026».
2. `repositories/api/movimientos.ts` + prueba: tipos del contrato, `aMovimiento` (string → `bigint`, `dividido`), `listarMovimientos(mes?)`, `crearMovimiento`, `eliminarMovimiento`.
3. `repositories/api/captura.ts` + prueba y `reglas.ts`: `leerCaptura`, `leerSugerencias(tipo, texto)`, `crearRegla`, `ajustarRegla`.
4. `services/movimientos.ts` y `services/captura.ts`: delegan; `401` → `redirect("/login")`.
5. `/movimientos`: `page.tsx`, `loading.tsx`, `error.tsx` y `libro-movimientos.tsx` (escritorio en rejilla, móvil con C2). `fila-movimiento.tsx` toma el signo del tipo. `entradas.ts`: Movimientos → `/movimientos`. Al terminar se ve la lista del mes.
6. `domain/movimiento/vista-previa.ts` + pruebas: activo con gasto e ingreso; tarjeta con gasto (sube la deuda) e ingreso; transferencia origen y destino.
7. `domain/movimiento/cuerpo.ts` + pruebas: forma por tipo; elegida gana a propuesta; quitada → sin categoría; transferencia nunca lleva categoría; monto `"0"` o vacío → `null`; nota y descripción vacías → `null`.
8. `domain/categorizacion/oferta.ts` + pruebas: los casos de crear, ajustar y `null` (transferencia, sin descripción, > 60 caracteres, elegida = propuesta).
9. `captura/acciones.ts`: las seis acciones. Validan forma, llaman al servicio, traducen `ErrorApi` con el mapa de campos, revalidan.
10. Componentes base con muestra en `/estilos`: `SelectorTipo`, `TecladoNumerico` (1–9, 000, 0, borrar; ignora ceros a la izquierda; 19 dígitos máximo), `FichaCuenta`, `AvisoRegistro`, `ChipCategoria` interactivo. `PanelLateral` gana `ancho`.
11. `proveedor-captura.tsx` en el layout: contexto con `abrir()`; tecla `N` sin modificadores y fuera de campos de texto y de otros diálogos; Registrar del menú y de la pestaña llaman a `abrir()`. Elige panel u hoja con `matchMedia("(min-width: 768px)")`.
12. `usar-captura.ts` + `panel-captura.tsx`, primer corte: carga con `cargarCaptura` (estado de carga y error), tipo, monto, cuenta predeterminada, fichas con vista previa, registrar. Enter registra. Tras registrar: limpia, recarga la captura en segundo plano y la página se revalida. Al terminar se registran gastos en escritorio.
13. Descripción y categoría en el panel: `sugerir` con espera de 150 ms y descarte de respuestas viejas; texto fantasma, 2 sugerencias, Tab; chips con propuesta y nota «Sugerida por…».
14. Transferencia (Desde/Hacia, distintas, sin categoría), fecha (Hoy/Ayer/Anteayer/Otra fecha) y nota bajo «Más opciones». Errores de la API bajo su campo.
15. Aviso y deshacer: 5 s; `deshacerRegistro`; resaltado del recién registrado en `/movimientos` mientras dura el aviso.
16. Oferta de regla en el aviso con `ofertaDeRegla`; «Crear regla» / «Cambiar regla» / «No»; errores de la API en el aviso.
17. `hoja-captura.tsx` (móvil): misma lógica con tabs, «Hoy −X», monto grande, descripción, pista de regla, chips (frecuentes o sugerencias), fila Categoría/Cuenta/Fecha con hojas inferiores, teclado, botón y aviso.
18. Sin cuentas en ambos formatos. `DESIGN.md` actualizado con los componentes y medidas nuevas.

## Criterios de aceptación

- [ ] `npm test`, `npm run lint` y `npx tsc --noEmit` pasan.
- [ ] En `/cuentas` (escritorio), pulsar «Registrar» o la tecla `N` abre el panel de 480 px sin cambiar la URL.
- [ ] La tecla `N` no abre nada mientras se escribe en un campo ni con el panel de cuentas abierto.
- [ ] Con «Nequi» predeterminada, teclear `15000`, «Almuerzo» y Enter envía `{"tipo":"gasto","monto":"15000","descripcion":"Almuerzo","cuentaOrigenId":"<nequi>","categoriaId":"<comida>","fecha":"<hoy>"}` y responde en menos de 10 s de punta a punta.
- [ ] Tras registrar, el formulario queda vacío con tipo, cuenta y fecha conservados, y el foco vuelve al monto.
- [ ] En `/movimientos`, el registrado aparece arriba, resaltado, y deja de estarlo al acabar el aviso.
- [ ] El saldo de Nequi en `/cuentas` baja en 15.000 tras registrar.
- [ ] Con monto 0 el botón está inactivo.
- [ ] Escribir «almu» muestra «erzo» como texto fantasma y la sugerencia «Almuerzo · Comida»; Tab completa «Almuerzo».
- [ ] Escribir «corrientazo» propone Comida con «Sugerida por «corrientazo»» y el chip marcado «auto».
- [ ] Tocar el chip propuesto lo quita y el movimiento se registra sin categoría.
- [ ] Elegir Hogar a mano para «Peluquería» y registrar muestra «¿Siempre «Peluquería» → Hogar?»; «Crear regla» la crea y la siguiente vez «peluquería» propone Hogar.
- [ ] Cambiar la propuesta Comida por Ocio y registrar ofrece «¿Cambiar la regla «almuerzo» a Ocio?».
- [ ] «No» oculta la oferta sin petición.
- [ ] Una transferencia pide Desde y Hacia; elegir la misma cuenta muestra «Origen y destino deben ser cuentas distintas.» y no lleva categoría.
- [ ] La ficha elegida muestra «20.321 → 5.321» con 15.000; en Visa Oro (pasivo) «debe 1.284.300 → debe 1.299.300».
- [ ] «Ayer» envía la fecha de ayer según `fechaHoy`; «Otra fecha» acepta un día futuro.
- [ ] La nota se envía si se escribe y no aparece en móvil.
- [ ] «Deshacer» dentro de 5 s elimina el movimiento y lo quita de la lista; después de 5 s el aviso desaparece.
- [ ] En 390 px, la pestaña Registrar abre la hoja a pantalla completa sin la barra de pestañas, sin scroll horizontal.
- [ ] En móvil, `1`, `5`, `000` en el teclado muestran `15.000`; `0` como primera tecla no escribe nada; borrar quita un dígito.
- [ ] En móvil, sin texto se ven los frecuentes; al escribir «alm», los chips pasan a las sugerencias.
- [ ] «Hoy −X» muestra los gastos de hoy y se oculta si son cero; tras registrar un gasto de hoy sube.
- [ ] Un usuario sin movimientos ve «Tus conceptos frecuentes aparecerán aquí.».
- [ ] Sin cuentas activas, Registrar muestra «Para registrar necesitas una cuenta.» y «+ Nueva cuenta» lleva a `/cuentas?cuenta=nueva`.
- [ ] Con la API apagada, abrir muestra «No pudimos cargar el formulario.» y «Reintentar»; registrar muestra «No pudimos conectar. Intenta de nuevo.» y conserva lo escrito.
- [ ] `/movimientos` sin movimientos muestra el estado vacío y su acción abre la captura.
- [ ] `/movimientos` muestra gasto `−` terracota, ingreso `+` verde y transferencia sin signo con «origen → destino».
- [ ] `/estilos` muestra los componentes nuevos en claro y oscuro.
- [ ] Ningún archivo en `src/components/` ni `src/app/` importa `repositories/` ni `@supabase/*` (salvo `proxy.ts`).
- [ ] Ningún monto pasa por `number`, `parseFloat` ni `Number()`.

## Decisiones

- **Sí:** dos specs; este registra y lista, SPEC 06 edita, elimina, divide, cambia de mes y elige la predeterminada. **No:** uno solo (más de 25 pasos) ni tres (una lista sin forma de registrar).
- **Sí:** captura sobre la página actual, sin cambiar la URL, en escritorio y móvil. **No:** ruta `/registrar` ni `?registrar`. Recargar cierra la captura: aceptado.
- **Sí:** panel de 480 px como el diseño. **No:** 400 px de C22; las fichas de cuenta no caben en dos columnas. `PanelLateral` gana `ancho`.
- **Sí:** hoja móvil propia (`hoja-captura.tsx`) a pantalla completa. **No:** `PanelLateral` en móvil (hoja de 90 dvh con cabecera fija; el diseño es otra pantalla).
- **Sí:** teclado numérico propio en móvil. **No:** teclado del sistema; tapa conceptos y la fila de categoría, cuenta y fecha.
- **Sí:** monto móvil en `cifra-xl` (56) y `cifra-campo` (44) si pasa de 9 caracteres. **No:** 64/52/44 del diseño; están fuera de los tokens.
- **Sí:** datos al abrir con `cargarCaptura` (captura y cuentas en paralelo); tipo y monto usables mientras llegan. **No:** precarga en el layout; los saldos y los gastos de hoy envejecen.
- **Sí:** una lógica (`usar-captura.ts`) y dos presentaciones. Las reglas del formulario no se duplican.
- **Sí:** oferta de regla en el aviso tras registrar, con la descripción como palabra clave. **No:** crearla sola (RN-11) ni preguntar antes de registrar (frena el registro).
- **Sí:** sin oferta si la descripción pasa de 60 caracteres (`PALABRA_CLAVE_LARGA`).
- **Sí:** quitar la propuesta tocando su chip; se registra sin clasificar (N-29, N-30).
- **Sí:** Hoy/Ayer/Anteayer + `<input type="date">`. **No:** calendario propio.
- **Sí:** nota solo en escritorio, bajo «Más opciones». **No:** inventar dónde va en móvil.
- **Sí:** vista previa del saldo con `efectoEnSaldo` (RN-02). Es presentación; el saldo vigente lo da `GET /cuentas` tras revalidar.
- **Sí:** en móvil, chips de sugerencias al escribir; el mismo dato que el escritorio (N-25).
- **Sí:** deshacer = `DELETE` normal, registrado en la API (RN-13); el plazo de 5 s es del cliente.
- **Sí:** cerrar conserva el borrador; registrar lo limpia. Reabrir no pierde lo tecleado.
- **Sí:** autocompletado con espera de 150 ms y descarte por secuencia. **No:** pedir en cada tecla sin descartar (respuestas cruzadas).
- **Sí:** signo de la fila por tipo; equivale a `efectoEnPatrimonio` y `MovimientoDto` no trae el tipo de cuenta.
- **Sí:** un movimiento con partes se ve como «Dividido»; el detalle llega en SPEC 06.
- **Sí:** la transferencia del escritorio pide «Hacia» aunque el diseño solo dibuja «De la cuenta» (RN-03).

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Respuestas de `/sugerencias` que llegan desordenadas | Número de secuencia: solo se aplica la última. |
| La tecla `N` choca con escribir | Solo sin modificadores, fuera de `input`, `textarea`, `[contenteditable]` y sin otro `<dialog>` abierto. |
| «Deshacer» después de que otra pestaña editó la cuenta (archivada) | La API responde `CUENTA_ARCHIVADA`; el aviso muestra el `mensaje`. |
| Registrar dos veces con Enter rápido | Botón y Enter inactivos mientras hay un registro pendiente. |
| Fecha «hoy» del cliente distinta de la del usuario | Siempre se parte de `captura.fechaHoy`; nunca de `new Date()`. |
| El layout se vuelve cliente | Solo el proveedor es cliente; las páginas siguen siendo de servidor como `children`. |
| La vista previa difiere del saldo real (movimientos con fecha futura, otra pestaña) | Se presenta como estimación de la ficha; tras registrar se revalida `/cuentas`. |

## Lo que **no** entra en este spec

- Editar, eliminar, cambiar de mes, dividir y ver partes (SPEC 06).
- Elegir la cuenta predeterminada (SPEC 06).
- Nota en móvil.
- Persona y préstamos, TRM, avisos, indicador de sin clasificar.
- Listar o borrar reglas y gestionar categorías.
- USD.

Cada uno, si llega, va en su propio spec.
