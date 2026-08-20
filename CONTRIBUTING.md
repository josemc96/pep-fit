# Contributing

## Ramas

Cada fase del roadmap se desarrolla en su propia rama y se mergea a `main` solo cuando su criterio de verificación pasa. Convención de nombres: `feat/<fase>` (o `chore/<fase>` para setup sin lógica de negocio), ej. `feat/auth-clerk`.

## Antes de mergear

```
pnpm turbo run lint type-check test build
```

debe pasar en todo el monorepo.

## Desarrollo local

Copia `.env.example` a `.env` en `packages/db/` y `apps/backend/` (valores por defecto ya apuntan al Postgres de Docker). Luego:

```
docker compose up -d postgres
pnpm --filter @gym-app/db exec prisma migrate dev
pnpm --filter @gym-app/backend dev
```

En producción, `DATABASE_URL` apunta a un proyecto de Neon en vez de al Postgres local.

## Estructura

```
apps/
  mobile/     # Expo Router (web + iOS + Android)
  backend/    # API Fastify
packages/
  config/         # tsconfig, eslint, prettier base
  shared-types/   # Zod schemas + tipos compartidos entre apps
  db/             # Prisma schema, client, seeds
  ui/             # Componentes RN/NativeWind reutilizables
```
