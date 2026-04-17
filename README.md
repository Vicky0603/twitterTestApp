# Twitter Clone Challenge

Monorepo inicial para un clon funcional de Twitter/X usando Node.js, TypeScript y React.

## Stack elegido

- Backend: `Express + TypeScript + Prisma + SQLite`
- Frontend: `React + Vite + TypeScript`
- Testing planificado: `Vitest + Supertest` en backend, `Vitest + Testing Library` en frontend y `Playwright` para E2E

## Estructura

- `apps/api`: API HTTP, autenticación, timeline, follows, likes, seeds y tests
- `apps/web`: cliente web responsive mobile-first

## Estado actual

Este commit deja el scaffolding base del workspace. Todavía faltan dependencias e implementación funcional.

## Cobertura del brief

La checklist operativa del challenge vive en [`docs/requirements-checklist.md`](./docs/requirements-checklist.md). Se va a mantener actualizada a medida que se implementen features, tests, seeds, documentación y bonus.

## Próximos pasos

1. Configurar dependencias y TypeScript en ambas apps.
2. Modelar base de datos para usuarios, tweets, follows y likes.
3. Implementar autenticación por sesión propia.
4. Construir timeline, perfil, búsqueda y tests.
