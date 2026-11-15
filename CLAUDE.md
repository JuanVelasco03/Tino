# Tino

`REGLAS.md` es **vinculante**. Léelo completo antes de cualquier cambio.
Ante conflicto entre una propuesta y una regla, gana la regla.

@REGLAS.md
@AGENTS.md

## Comandos

- `npm run dev` — servidor de desarrollo
- `npm test` — Vitest (una pasada)
- `npm run lint`

## Recordatorios

- Next.js 16: `middleware` se llama `proxy` (`src/proxy.ts`). Lee `node_modules/next/dist/docs/` antes de tocar APIs de Next.
- Dinero: `bigint` en unidades menores (COP = pesos, USD = centavos). Nunca `number` con decimales.
- Solo `src/repositories/supabase/servidor.ts` construye clientes con el token del usuario. Nunca `service_role` en peticiones.
- Las migraciones y el diseño del modelo los escribe el autor (REGLAS §8).
