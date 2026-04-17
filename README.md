# Twitter Clone Challenge

Monorepo inicial para un clon funcional de Twitter/X usando Node.js, TypeScript y React.

## Stack elegido

- Backend: `Express + TypeScript + Prisma + SQLite`
- Frontend: `React + Vite + TypeScript`
- Testing planificado: `Vitest + Supertest` en backend, `Vitest + Testing Library` en frontend y `Playwright` para E2E

## Estructura

- `apps/api`: API HTTP, autenticación, timeline, follows, likes, seeds y tests
- `apps/web`: cliente web responsive mobile-first

## Docker

El repo ahora incluye una copia containerizada completa con:

- `Dockerfile.api`: build y runtime del backend
- `Dockerfile.web`: build del frontend y serving con `nginx`
- `docker-compose.yml`: levanta web + API con SQLite persistido en volumen Docker

### Levantar la app con Docker

```bash
docker compose up --build
```

La app queda disponible en `http://localhost:8080`.

### Notas de runtime

- El frontend consume la API vía `/api` detrás de `nginx`, así que navegador y API comparten origen.
- La base SQLite persiste en el volumen `twitter_data`.
- El contenedor API ejecuta `prisma db push` al iniciar porque todavía no hay migrations versionadas.
- Para desarrollo local por Docker, `SESSION_COOKIE_SECURE=false` evita que las cookies queden bloqueadas sobre `http://localhost`.

### Seed opcional

Para correr el seed dentro del contenedor API:

```bash
docker compose exec api npm run db:seed --workspace @twitter-clone/api
```

## Estado actual

La base del workspace ya está creada y el bloque de autenticación está implementado de punta a punta en backend y frontend.

## Estado de autenticación

Se cubre `4.1 Autenticación` del challenge con:

- Registro con `email`, `password`, `username` único y `displayName`
- Login y logout con sesión propia por cookie `HttpOnly`
- Protección de rutas autenticadas en backend
- Bootstrap de sesión y route guard en frontend
- Perfil básico editable con `username`, `bio` y avatar placeholder

### Endpoints actuales

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PATCH /api/users/me`
- `GET /api/users/:username`

## Cobertura del brief

La checklist operativa del challenge vive en [`docs/requirements-checklist.md`](./docs/requirements-checklist.md). Se va a mantener actualizada a medida que se implementen features, tests, seeds, documentación y bonus.

## Próximos pasos

1. Configurar dependencias y TypeScript en ambas apps.
2. Modelar base de datos para usuarios, tweets, follows y likes.
3. Implementar autenticación por sesión propia.
4. Construir timeline, perfil, búsqueda y tests.
