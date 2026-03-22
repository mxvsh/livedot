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
  <a href="https://livedot.dev">Website</a> · 
  <a href="#">Documentation</a> · 
  <a href="#">Live Demo</a>
</p>

<br/>

<p align="center">
  <img src="https://img.shields.io/github/repo-size/mxvsh/livedot" />
  <img src="https://img.shields.io/github/stars/mxvsh/livedot" />
  <img src="https://img.shields.io/github/license/mxvsh/livedot" />
</p>

---

## Features

- Real-time visitor tracking
- Live world map visualization
- Lightweight and fast
- Simple script integration
- No complex analytics or setup

## Installation (Docker)

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
