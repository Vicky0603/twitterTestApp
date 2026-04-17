# Requirements Checklist

Este documento traduce el brief del challenge a entregables verificables dentro del repo.

## Stack y arquitectura

- [x] Backend en Node.js + TypeScript
- [x] Frontend web en React + TypeScript
- [x] Base de datos relacional planificada con SQLite + Prisma
- [x] Autenticación propia sin terceros
- [ ] Stack justificado en el README

## Autenticación

- [x] Registro con email + password
- [x] Login
- [x] Logout
- [x] Protección de rutas autenticadas
- [x] Perfil básico con username único, bio y avatar placeholder

## Tweets

- [ ] Crear tweet de hasta 280 caracteres
- [ ] Eliminar tweet propio
- [ ] Timeline con tweets de usuarios seguidos
- [ ] Orden cronológico
- [ ] Paginación o infinite scroll

## Interacciones sociales

- [ ] Follow
- [ ] Unfollow
- [ ] Like
- [ ] Unlike
- [ ] Contador de likes visible
- [ ] Listado de followers y following en perfil

## Búsqueda

- [ ] Búsqueda de usuarios por nombre o username

## Responsive

- [ ] Diseño mobile-first
- [ ] Usable en mobile
- [ ] Breakpoint mobile `<640px`
- [ ] Breakpoint tablet `640px-1024px`
- [ ] Breakpoint desktop `>1024px`

## Testing

- [ ] 80%+ coverage backend
- [x] Unit tests de modelos y validaciones
- [x] Integration tests de endpoints críticos
- [ ] Al menos un E2E del flujo de autenticación
- [x] Frontend integration tests para login
- [ ] Frontend integration tests para crear tweet
- [ ] Frontend integration tests para follow

## Seed data

- [ ] Seed con al menos 10 usuarios
- [ ] Tweets realistas
- [ ] Follows cruzados
- [ ] Likes cruzados
- [ ] App usable inmediatamente luego del seed
- [ ] Credenciales de ejemplo documentadas

## Documentación

- [ ] README con runbook completo
- [ ] Prerrequisitos con versiones exactas
- [ ] Pasos de instalación exactos
- [ ] Cómo correr seed
- [ ] Cómo levantar app en desarrollo
- [ ] Cómo correr tests
- [ ] Variables de entorno documentadas
- [ ] Decisiones técnicas
- [ ] Timeline y grafo de follows explicados
- [ ] Autenticación explicada
- [ ] Trade-offs y limitaciones
- [ ] Uso de herramientas de AI explicado

## Bonus

- [x] Modelo preparado para notificaciones
- [x] Modelo preparado para reply threads
- [ ] Implementar al menos uno o dos bonus reales
- [ ] Docker Compose con un comando

## Proceso de desarrollo

- [ ] Commits progresivos sin squash
- [ ] Features y tests juntos
- [ ] Últimos commits de polish y docs
