<p align="center">
  <img src="./logo.svg" width="80px" alt="LiveDot logo" />
</p>

<h3 align="center">
  Real-time visitor map for your website.
</h3>

<p align="center">
Watch your users live across the world — fast, minimal, and real-time.
</p>

<p align="center">
  <a href="https://cloud.livedot.dev">Try now</a> · 
  <a href="https://discord.gg/3kUSy2d">Join Discord</a>
</p>

<br/>

<p align="center">
  <img src="https://img.shields.io/github/repo-size/mxvsh/livedot" />
  <img src="https://img.shields.io/github/stars/mxvsh/livedot" />
  <img src="https://img.shields.io/github/license/mxvsh/livedot" />
</p>

---

<img width="100%" alt="image" src="https://github.com/user-attachments/assets/0f858d81-637c-46f3-b289-5181aacc2dc6" />

<br/>
<br/>


> [!WARNING]
> Under active development — breaking changes may occur.

## Features

- Real-time visitor tracking
- Live world map visualization
- Lightweight and fast
- Simple script integration
- No complex analytics or setup

## Installation (Docker)

> For a full setup guide with Nginx Proxy Manager, SSL, and GeoIP, see the [Self-Hosting Guide](./docs/self-hosting.md).

### Run using prebuilt image (GHCR)

```bash
docker run -d \
  -p 5500:80 \
  -v ./data:/data \
  ghcr.io/mxvsh/livedot
````

### Open

```
http://localhost:5500
```

---

## Usage

1. Create a website from the dashboard
2. Copy the tracking script
3. Add it to your website
4. Open LiveDot and watch visitors appear live

---

## Notes

* Data is stored in the mounted `/data` directory
* Designed for real-time visibility, not historical analytics
* Works best with modern browsers
