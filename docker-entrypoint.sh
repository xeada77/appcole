#!/bin/sh
set -e

# Se executado como root, axustar permisos de /app/data e delegar no usuario nextjs
if [ "$(id -u)" = "0" ]; then
  mkdir -p /app/data
  chown -R nextjs:nodejs /app/data 2>/dev/null || true
  chmod -R 775 /app/data 2>/dev/null || true

  # Asegurar que o directorio de RustFS (UID 10001) teña permisos plenos de lectura/escritura
  if [ -d /app/data/rustfs ]; then
    chown -R 10001:10001 /app/data/rustfs 2>/dev/null || true
    chmod -R 777 /app/data/rustfs 2>/dev/null || true
  fi

  exec su-exec nextjs "$@"
fi

exec "$@"
