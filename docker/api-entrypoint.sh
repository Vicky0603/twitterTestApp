#!/bin/sh
set -eu

mkdir -p /data

npx prisma db push --schema apps/api/prisma/schema.prisma

if [ "${SEED_DATABASE:-false}" = "true" ]; then
  npm run db:seed --workspace @twitter-clone/api
fi

exec node apps/api/dist/src/server.js
