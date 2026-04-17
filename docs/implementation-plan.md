# Implementation Plan

## Objetivo

Cubrir el 100% de los requerimientos obligatorios y al menos dos bonus con un orden de trabajo que mantenga el historial de commits claro y defendible.

## Bonus elegidos

- Reply threads
- Notificaciones básicas

Docker Compose queda como posible tercero, si el tiempo lo permite sin comprometer testing ni documentación.

## Orden de implementación

1. `chore`: workspace, tsconfig, env example, checklist y README inicial
2. `feat(api)`: Prisma schema, cliente de base de datos, migraciones y seed
3. `feat(api-auth)`: registro, login, logout, sesión por cookie HTTP-only y protección de rutas
4. `test(api-auth)`: integración de auth y E2E básico del flujo de autenticación
5. `feat(api-tweets)`: crear, borrar, listar timeline con paginación
6. `test(api-tweets)`: validaciones y endpoints críticos de tweets
7. `feat(api-social)`: follow/unfollow, like/unlike, followers/following, búsqueda
8. `test(api-social)`: cobertura de follows, likes y search
9. `feat(api-bonus)`: replies y notificaciones
10. `feat(web-auth)`: screens y flujos de auth
11. `feat(web-timeline)`: feed responsive, composer, like, delete, infinite scroll
12. `feat(web-profile-search)`: perfil, followers/following, search y follow
13. `test(web)`: login, crear tweet y follow
14. `docs`: runbook final, decisiones técnicas, credenciales del seed y trade-offs

## Criterios de aceptación internos

- Ninguna feature se marca como completa sin test asociado.
- El README final debe permitir levantar la app desde cero sin inferencias.
- La seed debe dejar al menos un usuario listo para demo inmediata.
- La cobertura backend no se acepta por debajo de 80%.
