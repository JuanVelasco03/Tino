# Sistema de diseño de TINO — prompt original

Prompt con el que se implementó el sistema de diseño (sesión del
2026-11-14, commit `d837ec8`). Recuperado de la transcripción; texto
sin modificar. Referencia visual: `TINO sistema de diseño.zip`
(`TINO Sistema de Diseño.dc.html`). La ruta `docs/diseno/` que cita el
prompt hoy es `referencias/`.

El documento vigente del sistema es `DESIGN.md` en la raíz.

---

```text
Implementa el sistema de diseño de TINO en el proyecto.
Lee REGLAS.md primero. La referencia visual está en docs/diseno/,
especialmente "TINO Sistema de Diseño.dc.html" — léelo completo antes
de escribir nada.

CONCEPTO
Un libro de cuentas: papel y tinta. El contenido son cifras en
columnas, y el diseño existe para que se lean y comparen rápido.
Se separa con líneas y espacio. NO HAY SOMBRAS en ningún componente.
Las tarjetas son la excepción, no la norma.

TOKENS — defínelos como variables CSS en globals.css y exponlos a
Tailwind. Usa estos nombres.

Modo claro (papel):
  fondo        #FAF8F3    superficie   #FFFFFF
  hundido      #F2EEE5    texto        #1A1A17
  secundario   #6B6760    terciario    #9A958B
  linea        #E4DFD4    raya         #1A1A17

Modo oscuro (tinta azulada, no gris):
  fondo        #12141A    superficie   #181B22
  hundido      #1F232C    texto        #E8E4DC
  secundario   #8B8A84    terciario    #5E5F63
  linea        #272B34    raya         #8B8A84

Acentos — base para iconos, gráficas y cifras de 24px o más;
variante de texto para tamaños pequeños, por contraste:
  marca      base #A8762C · claro #8A5F1F · oscuro #BC8A3E
  entrada    base #2F7D5A · claro #2F7D5A · oscuro #4E9E78
  salida     base #B0452E · claro #B0452E · oscuro #D0664B
Los acentos NUNCA son fondo de un bloque. Solo texto e iconos.

El modo oscuro se define bajo @media (prefers-color-scheme: dark)
guardado por :root:not([data-theme="light"]), y también bajo
:root[data-theme="dark"], para permitir cambio manual.

TIPOGRAFÍA
Familjen Grotesk (400/500/600/700) para interfaz.
IBM Plex Mono (400/500) para TODO importe monetario, sin excepción.
Cárgalas con next/font.

Escala de cifras (tamaño/interlineado · peso):
  cifra-xl 56/60·500 · cifra-l 32/36·500 · cifra-m 20/28·500
  cifra-s  15/22·500 · cifra-xs 12/16·400
Escala de texto:
  titulo-1 28/34·600 · titulo-2 20/26·600 · cuerpo 15/22·400
  etiqueta 13/18·500 · rotulo 11/14·600 con tracking +8%

Regla de peso: el monto siempre va un escalón por encima de su
etiqueta. Nunca al revés.

ESPACIADO Y RADIOS
Base 4: 4, 8, 12, 16, 24, 32, 48, 64.
Radios, máximo 6: 0 filas y teclado · 2 muestras y barras ·
4 campos, botones y chips · 6 hojas y paneles.
Cuatro tipos de línea: división, raya, doble raya, punteada
(provisional). La jerarquía se construye solo con estas cuatro y el
espacio. Sin sombras.

FORMATO DE CIFRAS — en src/domain/dinero/formato.ts
Ya existen pruebas para esto en el proyecto; haz que pasen.
  Pesos: punto de miles, sin decimales → 1.234.567
  Dólares: coma decimal, dos cifras → US$ 7.750,00
  Negativo con signo menos U+2212 (−), NUNCA guion
  "COP" se omite cuando toda la columna está en pesos
  Equivalencia debajo, en secundario, con la tasa:
  ≈ 31.775.000 COP · TRM 4.100,00

COMPONENTES A CONSTRUIR AHORA
Solo estos siete, los del bloque 06 del documento:
  C1  Encabezado de sección
  C2  Fila de movimiento, lista general
  C3  Tarjeta de cuenta: activo, activo en USD, pasivo
  C4  Campo de monto: vacío, con valor, en USD
  C5  Chip de categoría: sugerida, normal, sin clasificar
  C6  Botones
  C7  Estado vacío, primer día
Los componentes C8 a C29 NO los construyas: pertenecen a pantallas
que aún no existen.

SIGNO Y COLOR
En lista general cada cifra se lee desde el patrimonio del usuario:
salida con − en terracota, entrada con + en verde, transferencia en
tinta sin signo.
La decisión de signo debe venir de src/domain/cuenta/naturaleza.ts
(RN-02). NO dupliques esa lógica en los componentes.

ICONOS
Lucide, 20px, trazo 1,5, en el color del texto que acompañan.
Uno por destino de navegación y uno por tipo de cuenta.
Las filas de movimientos NO llevan icono.

ENTREGA
Una página en /estilos que muestre todos los tokens y los siete
componentes en sus variantes, en ambos modos, con un botón para
alternar. Es la referencia viva del sistema.

NO HAGAS
- No introduzcas colores, tamaños, radios ni espaciados fuera de los
  listados.
- No uses sombras.
- No construyas pantallas todavía.
- No llames a Supabase: todo con props.
```
