# Tino — Reglas del proyecto

Documento vinculante. Toda decisión de código debe respetarlo.
Si algo aquí estorba, se discute y se cambia este archivo primero; no se
salta en silencio.

Especificación completa: `docs/Tino_Requerimientos.pdf`.

---

## 1. Qué es Tino

Aplicación web de finanzas personales de uso real y diario, multiusuario.
Registro manual, sin conexión bancaria. Moneda base COP, con posiciones
en USD.

Lo que la distingue de una app de gastos corriente:

- Préstamos y deudas con personas, con intereses y condonación.
- Tarjeta de crédito como pasivo real: cupo, ciclo de corte y pago.
- Inversiones valoradas a precio de mercado, en otra moneda.
- Categorización automática por reglas de texto.

**Criterio de éxito:** que el autor deje de usar Notion. Si registrar un
gasto cuesta más de diez segundos, el proyecto falló aunque todo lo demás
esté perfecto.

---

## 2. Stack

- Next.js (App Router), TypeScript.
- Supabase: PostgreSQL, Auth (correo y Google), políticas a nivel de fila.
- Esquema gestionado con migraciones versionadas en el repositorio.

---

## 3. Reglas de negocio

Invariantes del dominio. Se implementan en la base de datos cuando es
posible, y en la capa de dominio cuando no. **Nunca solo en la interfaz.**

| # | Regla |
|---|---|
| RN-01 | Los saldos no se almacenan. El saldo de una cuenta es su saldo inicial más sus movimientos. |
| RN-02 | El signo depende de la naturaleza de la cuenta. En un activo, un gasto reduce el saldo; en un pasivo (tarjeta de crédito), lo aumenta. |
| RN-03 | Una transferencia exige cuenta de origen y destino, ambas informadas y distintas. |
| RN-04 | Todo movimiento guarda su moneda y la tasa de cambio de su fecha. Esa tasa queda congelada: una variación posterior no reescribe el histórico. |
| RN-05 | Una transferencia no lleva categoría y no computa como ingreso ni como gasto. |
| RN-06 | Comprar un activo de inversión es una transferencia hacia la cuenta de inversión, nunca un gasto. |
| RN-07 | Pagar la tarjeta de crédito es una transferencia, nunca un gasto. El gasto se registró al consumir. |
| RN-08 | Entregar un préstamo es una transferencia hacia la cuenta de préstamo. Su devolución, la inversa. |
| RN-09 | Los intereses sí son ingreso o gasto, a diferencia del capital. |
| RN-10 | Un recurrente genera un movimiento pendiente de confirmación. Nada altera saldos sin intervención del usuario. |
| RN-11 | La categorización automática propone; el usuario dispone. Al corregir, se ofrece crear o ajustar la regla. |
| RN-12 | Un usuario solo lee y escribe sus propios datos, garantizado en la base de datos y no solo en el código. |
| RN-13 | Todo movimiento es editable y eliminable, y toda modificación queda registrada. Sin modificación silenciosa de datos financieros. |
| RN-14 | Un ajuste de saldo es un movimiento de tipo propio, con categoría reservada, que no se mezcla con el gasto ordinario en informes. |
| RN-15 | La moneda base se define al crear el perfil y no cambia si ya hay movimientos. |
| RN-16 | Toda entrada o salida de dinero de una cuenta real se registra, sin excepción. Que el usuario no quiera analizar algo no autoriza a omitirlo: un movimiento sin registrar desvía el saldo para siempre. |
| RN-17 | Un movimiento asociado a una persona es préstamo por defecto. Puede convertirse en gasto propio al registrarlo o después, condonándolo. |
| RN-18 | El cupo disponible es cupo total menos deuda vigente. No se almacena. |
| RN-19 | El acceso a datos de usuario usa el cliente de Supabase en el servidor, portando el token del usuario, de modo que las políticas evalúen al usuario real. |
| RN-20 | La aplicación no almacena contraseñas. Toda verificación de identidad se resuelve contra el token del proveedor. |

---

## 4. Seguridad

**Inviolable:** la credencial de servicio de Supabase (`service_role`)
nunca atiende una petición de usuario y nunca cruza al cliente. Esa clave
ignora deliberadamente las políticas a nivel de fila. Usarla para servir
datos deja el aislamiento anulado sin ningún aviso, y convierte la RN-12
en una garantía aparente pero falsa.

Queda reservada a tareas de mantenimiento ejecutadas fuera del ciclo de
petición y respuesta.

Reglas que se derivan:

- Toda tabla con datos de usuario lleva columna de usuario, índice y
  política de seguridad, desde su primera migración.
- Ninguna tabla se expone sin políticas activas.
- Existe una prueba automatizada que crea dos usuarios y verifica que
  ninguno ve los datos del otro. **No se borra ni se desactiva.**
- Las variables de entorno con secretos nunca llevan prefijo público.
- El MCP de Supabase se usa en modo solo lectura salvo al aplicar
  migraciones a propósito, y nunca apuntando a datos reales.

---

## 5. Arquitectura

Next.js no impone estructura, así que la imponemos nosotros. Esta es la
parte que decide si el proyecto enseña algo.

```
src/
  app/              Rutas, páginas, route handlers. Delgados.
  domain/           Reglas de negocio puras. Sin HTTP, sin Supabase.
  services/         Casos de uso. Orquestan dominio y repositorios.
  repositories/     Único lugar que conoce Supabase y el esquema.
  components/       Interfaz.
  lib/              Utilidades transversales.
```

Dirección de dependencias: `app → services → domain`, con
`repositories` detrás de `services`. El dominio no importa nada de las
capas de arriba.

Reglas de capa:

- **Los componentes nunca llaman a Supabase directamente.** Es la
  tentación central de este stack y el camino por el que las reglas de
  negocio se dispersan por la interfaz.
- Los route handlers y server actions validan la entrada, llaman a un
  servicio y devuelven. Nada de lógica.
- El cálculo de saldos, la conversión de moneda, el devengo de intereses
  y el signo por naturaleza de cuenta viven en `domain/`, son funciones
  puras y tienen pruebas unitarias.
- Las consultas analíticas (saldo corrido, jerarquía de categorías,
  series mensuales) se escriben como SQL o funciones de Postgres, no se
  resuelven trayendo filas a memoria.

---

## 6. Datos y formato

- Todo importe monetario en `NUMERIC`. **Nunca coma flotante.** Un saldo
  que termina en `0.30000000000000004` es un defecto, no un redondeo.
- Fechas almacenadas en UTC, presentadas en la zona del usuario.
- Formato colombiano: punto de miles, coma decimal. Pesos sin decimales
  (`1.234.567 COP`), dólares con dos (`US$ 7.750,00`).
- Toda cifra en moneda extranjera muestra su equivalente en COP y la tasa
  aplicada.
- Cifras tabulares en la interfaz: las columnas de montos se alinean
  dígito con dígito.

---

## 7. Alcance

**Construir ahora:** perfil, cuentas, categorías, movimientos, captura
rápida, cálculo de saldos.

**Diseñado pero no construir todavía:** deudas y préstamos, recurrentes,
avisos, inversiones, tarjeta de crédito con ciclo, informes.

**Fuera de esta versión, no diseñar:** presupuestos por categoría,
compras a cuotas y diferidos, funcionamiento sin conexión, importación
del histórico de Notion, cuentas compartidas entre usuarios.

El modelo completo es el destino, no el punto de partida. Un esquema de
doce tablas con cero movimientos registrados es trabajo por rehacer.

---

## 8. Cómo trabajar con asistentes de IA

Este proyecto es un ejercicio de aprendizaje, con prioridad en
arquitectura de backend. Esa prioridad se protege así:

- **Las decisiones de diseño las toma el autor.** Estructura de módulos,
  modelo de datos y nombres no se delegan.
- **El modelo de datos lo decide el autor en el spec.** Tablas, columnas,
  nombres y tipos se fijan ahí. El agente puede escribir y aplicar la
  migración que lo implementa; el autor la revisa antes de aplicarla.
- Sí se delega lo repetitivo: tipos, formularios, pruebas, configuración,
  componentes de interfaz a partir del sistema de diseño.
- Ante una propuesta que contradiga una regla de la sección 3, gana la
  regla. El patrón habitual —guardar el saldo como columna, tratar el
  pago de tarjeta como gasto— es justo lo que este documento existe para
  impedir.
