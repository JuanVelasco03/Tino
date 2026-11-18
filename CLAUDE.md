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
