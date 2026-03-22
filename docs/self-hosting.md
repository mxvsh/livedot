# Self-Hosting Livedot

## Requirements

- A Linux server (Ubuntu 22.04+ recommended)
- [Docker](https://docs.docker.com/engine/install/ubuntu/) + [Docker Compose](https://docs.docker.com/compose/install/)
- [Nginx Proxy Manager](https://nginxproxymanager.com/) (or any reverse proxy)
- A domain name pointing to your server

---

## 1. Create the compose file

Create a directory and add a `compose.yml`:

```sh
mkdir livedot && cd livedot
```

```yaml
services:
  livedot:
    image: ghcr.io/mxvsh/livedot:latest
    restart: unless-stopped
    volumes:
      - ./data:/data
      - ./geo:/geo
    env_file:
      - .env
    networks:
      - proxy

networks:
  proxy:
    external: true
```

> No ports are exposed to the host. Nginx Proxy Manager connects to Livedot over the shared `proxy` Docker network.

---

## 2. Create the `.env` file

```env
NODE_ENV=production
DATABASE_PATH=/data/livedot.db

BETTER_AUTH_SECRET=your-random-secret-here
BETTER_AUTH_URL=https://livedot.yourdomain.com

DEFAULT_MAX_USER_SIGNUP=1
DEFAULT_MAX_WEBSITES=0
DEFAULT_MAX_CONNECTIONS=1000
```

Generate a secret:
```sh
openssl rand -hex 32
```

> `BETTER_AUTH_URL` must match the public URL you expose — auth cookies are scoped to it.

---

## 3. Start the container

```sh
docker compose up -d
```

---

## 4. Create the proxy network

This network must exist before starting any containers that use it:

```sh
docker network create proxy
```

> If Nginx Proxy Manager is already running on this network, skip this step.

---

## 5. Set up Nginx Proxy Manager

1. Open Nginx Proxy Manager (usually at `http://your-server:81`)
2. Go to **Proxy Hosts** → **Add Proxy Host**
3. Fill in:
   - **Domain Names**: `livedot.yourdomain.com`
   - **Scheme**: `http`
   - **Forward Hostname / IP**: `livedot` (the container name)
   - **Forward Port**: `80`
   - Enable **Websockets Support** ← required for live map
5. Under the **SSL** tab:
   - Request a **Let's Encrypt** certificate
   - Enable **Force SSL**
5. Save

---

## 6. First run

Open `https://livedot.yourdomain.com` — you'll be redirected to `/auth/register` to create your admin account.

---

## Updating

```sh
docker compose pull && docker compose up -d
```

---

## GeoIP (optional, higher accuracy)

By default Livedot uses `fast-geoip` for IP → location resolution. For better accuracy, you can provide a [MaxMind GeoLite2-City](https://dev.maxmind.com/geoip/geolite2-free-geolocation-data) database:

1. Download `GeoLite2-City.mmdb` from MaxMind
2. Place it in the `./geo` directory
3. Restart the container

```sh
docker compose restart
```

---

## Data

All data is stored in `./data/livedot.db` (SQLite). Back this up regularly.

```sh
cp ./data/livedot.db ./data/livedot.db.bak
```
