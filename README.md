# Twitter Clone Challenge

Functional Twitter/X clone monorepo built with Node.js, TypeScript, React, Prisma, and SQLite.

## Stack

- Backend: `Express + TypeScript + Prisma + SQLite`
- Frontend: `React + Vite + TypeScript`
- Testing: `Vitest + Supertest` for the API and `Vitest` for the web client

## Structure

- `apps/api`: HTTP API, authentication, timeline, follows, likes, seed script, and tests
- `apps/web`: responsive web client

## Current Status

The workspace is set up and the authentication flow is implemented end to end across backend and frontend.

## Authentication Status

The project currently covers the authentication section of the challenge with:

- Registration with `email`, `password`, unique `username`, and `displayName`
- Login and logout with an `HttpOnly` session cookie
- Protected authenticated routes in the backend
- Session bootstrap and route guard behavior in the frontend
- Basic editable profile with `username`, `bio`, and placeholder avatar

### Current Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PATCH /api/users/me`
- `GET /api/users/:username`

## Docker

The repo includes a full containerized setup with:

- `Dockerfile.api`: backend build and runtime image
- `Dockerfile.web`: frontend build and `nginx` runtime image
- `docker-compose.yml`: web plus API stack with SQLite persisted in a Docker volume

### Run With Docker

```bash
docker compose up --build
```

The app will be available at `http://localhost:8080`.

### Runtime Notes

- The frontend reaches the API through `/api` behind `nginx`, so browser and API share the same origin.
- SQLite data is persisted in the `twitter_data` Docker volume.
- The API container runs `prisma db push` on startup because versioned Prisma migrations are not in the repo yet.
- For local Docker development, `SESSION_COOKIE_SECURE=false` keeps auth cookies working over `http://localhost`.

### Optional Seed

To run the seed inside the API container:

```bash
docker compose exec api npm run db:seed --workspace @twitter-clone/api
```

## CI

GitHub Actions now validates:

- `lint`
- `typecheck`
- `test`
- `build`
- Docker compose validation and Docker image builds

## Challenge Coverage

The working checklist for the challenge lives in [`docs/requirements-checklist.md`](./docs/requirements-checklist.md). It should be kept up to date as features, tests, seed data, documentation, and bonus items evolve.
