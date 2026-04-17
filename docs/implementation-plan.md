# Implementation Plan

## Goal

Cover 100% of the required challenge scope and at least two bonus items with an implementation order that keeps the commit history clear and defensible.

## Selected Bonus Items

- Reply threads
- Basic notifications

Docker Compose remains a possible third bonus if time allows without compromising testing or documentation quality.

## Implementation Order

1. `chore`: workspace, tsconfig, env example, checklist, and initial README
2. `feat(api)`: Prisma schema, database client, migrations, and seed
3. `feat(api-auth)`: registration, login, logout, `HttpOnly` cookie session, and route protection
4. `test(api-auth)`: auth integration tests and a basic authentication E2E flow
5. `feat(api-tweets)`: create, delete, and list timeline tweets with pagination
6. `test(api-tweets)`: tweet validations and critical endpoints
7. `feat(api-social)`: follow/unfollow, like/unlike, followers/following, and search
8. `test(api-social)`: coverage for follows, likes, and search
9. `feat(api-bonus)`: replies and notifications
10. `feat(web-auth)`: auth screens and flows
11. `feat(web-timeline)`: responsive feed, composer, like, delete, and infinite scroll
12. `feat(web-profile-search)`: profile, followers/following, search, and follow
13. `test(web)`: login, create tweet, and follow
14. `docs`: final runbook, technical decisions, seed credentials, and trade-offs

## Internal Acceptance Criteria

- No feature is considered complete without an associated test.
- The final README must allow someone to run the app from scratch without guesswork.
- The seed should leave at least one user ready for an immediate demo.
- Backend coverage should not be accepted below 80%.
