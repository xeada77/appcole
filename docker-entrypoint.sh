#!/bin/sh
set -e

# Se executado como root, axustar permisos de /app/data e delegar no usuario nextjs
if [ "$(id -u)" = "0" ]; then
  mkdir -p /app/data
  chown -R nextjs:nodejs /app/data 2>/dev/null || true
  chmod -R 775 /app/data 2>/dev/null || true
  exec su-exec nextjs "$@"
fi

exec "$@"
