# Guía de Despregue: Servidor Caseiro con Docker e Cloudflare Tunnel

Esta guía explica como poñer en produción a aplicación **appcole** no teu servidor caseiro (Ubuntu, Debian, Raspberry Pi, mini PC, etc.) usando **Docker**, **Docker Compose** e **Cloudflare Tunnel**.

Non necesitas abrir ningún porto no teu router nin ter IP fixa; Cloudflare Tunnel xestiona a conexión segura e os certificados SSL de xeito automático.

---

## 1. Requisitos Previos

1. **Docker e Docker Compose** instalados no servidor caseiro.
2. Unha conta en **Cloudflare** cun dominio engadido (o plan gratuíto é suficiente).

---

## 2. Configuración en Cloudflare Zero Trust

1. Accede a [Cloudflare Zero Trust](https://one.dash.cloudflare.com/).
2. No menú lateral esquerdo, vai a **Networks** > **Tunnels**.
3. Fai clic en **Add a tunnel** (ou *Create a tunnel*).
4. Selecciona o conector **Cloudflared** e pulsa **Next**.
5. Ponlle un nome ao túnel (por exemplo: `appcole-home`).
6. Na pantalla de instalación, verás un comando semellante a este:
   ```bash
   cloudflared.exe service install eyJhIjoi...
   ```
   **Copia unicamente a cadea longa do token** (a que empeza por `eyJ...`).
7. Fai clic en **Next** para ir á pestana **Public Hostnames**:
   - **Subdomain**: o subdominio que queiras (ex: `app` ou `cole`).
   - **Domain**: escolle o teu dominio da lista desplegable (ex: `oteudominio.com`).
   - **Type**: `HTTP`
   - **URL**: `app:3000` *(se usas o servizo tunnel de docker-compose)* ou `localhost:3000` *(se xa tes cloudflared instalado fóra de Docker no host)*.
8. Fai clic en **Save tunnel**.

---

## 3. Preparación no Servidor

1. Clona ou copia este proxecto no teu servidor:
   ```bash
   git clone <url-do-teu-repositorio> appcole
   cd appcole
   ```

2. Crea o teu arquivo de variables de contorno:
   ```bash
   cp .env.example .env
   ```

3. Edita `.env` co teu editor preferido (`nano .env`):
   ```env
   TUNNEL_TOKEN=pega_aqui_o_token_que_copiaches_de_cloudflare
   ```

---

## 4. Iniciar a Aplicación

Executa a construción e arranque dos contedores en segundo plano:

```bash
docker compose up -d --build
```

### Comprobar o estado:
```bash
# Ver os contedores en execución
docker compose ps

# Ver os rexistros da aplicación Next.js
docker compose logs -f app

# Ver os rexistros do túnel de Cloudflare
docker compose logs -f tunnel
```

Se todo é correcto, o túnel amosará que conectou con éxito e poderás acceder á túa aplicación directamente desde o teu dominio:
👉 `https://cole.oteudominio.com`

Tamén podes acceder localmente dentro da túa rede Wi-Fi/LAN mediante o porto 3000:
👉 `http://<IP_LOCAL_DO_SERVIDOR>:3000`

---

## 5. Actualizacións Futuras

Cando fagas cambios no código ou descargues novas versións:

```bash
git pull
docker compose up -d --build
```
*A base de datos SQLite non se verá afectada porque está gardada fóra do contedor, no cartafol local `./data`.*

---

## 6. Persistencia e Copias de Seguridade

- **Base de datos**: Está en `./data/appcole.db`.
- **Copias automáticas**: A aplicación garda periodicamente copias en `./data/backups/`.
- **Facer copia manual**: Podes copiar a carpeta `./data` en calquera momento:
  ```bash
  cp -r ./data ./data-backup-$(date +%F)
  ```
