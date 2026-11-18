# Tino web

Cliente web de Tino. La API (reglas de negocio, datos, migraciones) vive en
`../Tino-API`.

`REGLAS.md` es **vinculante**. Léelo completo antes de cualquier cambio.
Ante conflicto entre una propuesta y una regla, gana la regla.
`REGLAS.md` es el mismo en ambos repositorios: si cambia, se cambia en los dos.

@REGLAS.md
@AGENTS.md

## Comandos

- `npm run dev` — servidor de desarrollo (puerto 3000; necesita Tino API en `TINO_API_URL`)
- `npm test` — Vitest (una pasada)
- `npm run lint`

## Recordatorios

- Next.js 16: `middleware` se llama `proxy` (`src/proxy.ts`). Lee `node_modules/next/dist/docs/` antes de tocar APIs de Next.
- Dinero: `bigint` en unidades menores (COP = pesos, USD = centavos). Nunca `number` con decimales.
- La web no toca tablas. Datos: `src/repositories/api/` (único cliente de Tino API, reenvía el token de la sesión). Supabase solo para Auth.
- Solo `src/repositories/supabase/servidor.ts` construye clientes de Supabase con la sesión del usuario. Nunca `service_role`.
- Migraciones y modelo de datos: en `Tino-API` (REGLAS §8).

## Specs

- Numeración propia desde 03 (01 y 02 son históricos, compartidos con Tino-API).
- Flujo de una feature con interfaz: diseño en `referencias/<feature>/` → `/necesidades <ruta>` en Tino-API → `../Tino-API/specs/necesidades/<feature>.md` → spec de Tino-API → spec de la web.
- El inventario (necesidades numeradas `N-01`, `N-02`…, implícitas incluidas, choques con RN y fuera de alcance) vive en la API, no aquí. Se genera con el skill `/necesidades` de Tino-API.
- Un spec que consume la API lee antes `../Tino-API/specs/` y declara `Depende de: Tino-API SPEC NN`. El contrato (endpoints, DTOs, errores) se toma de ese spec; no se redefine aquí. Si falta algo en el contrato, se cambia primero el spec de la API.
- El spec web cita la referencia de diseño y el inventario, y cada pantalla lista sus `N-xx` y el endpoint del que salen. Una `N-xx` sin endpoint en el spec de la API → parar y enmendar ese spec antes de seguir.
