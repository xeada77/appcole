# ==========================================
# 1. Base Image (Node 22 LTS Alpine)
# ==========================================
FROM node:22-alpine AS base

# ==========================================
# 2. Dependencies
# ==========================================
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ==========================================
# 3. Builder
# ==========================================
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ==========================================
# 4. Runner (Production Image)
# ==========================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# su-exec permite arrancar el script de entrada, asegurar permisos en el volumen SQLite y pasar al usuario nextjs
RUN apk add --no-cache su-exec

# Crear usuario y grupo sin privilegios
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar recursos estáticos y build standalone generado por Next.js
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Crear carpeta de datos para SQLite y copias de seguridad
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Copiar y preparar entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
