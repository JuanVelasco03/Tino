# Tino web

Cliente web de Tino (Next.js 16). Los datos vienen de Tino API (`../Tino-API`).

## Arranque

```bash
cp .env.example .env.local   # Supabase (Auth) + TINO_API_URL
npm install
npm run dev                  # http://localhost:3000 (con Tino API corriendo)
```

## Configuración de Supabase para el acceso (spec 01)

Manual, en el panel de Supabase del proyecto:

1. **Authentication → Providers → Email**: «Confirm email» activo.
2. **Authentication → Email Templates → Confirm signup**: el enlace debe ser exactamente

   ```
   {{ .SiteURL }}/auth/confirmar?token_hash={{ .TokenHash }}&type=email
   ```

3. **Authentication → URL Configuration**: Site URL `http://localhost:3000` y
   `http://localhost:3000` en Redirect URLs.
