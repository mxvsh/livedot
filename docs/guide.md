# Tracking Guide

Livedot tracks visitors in real time using a lightweight script tag. It also supports custom event tracking and is fully compatible with [Umami](https://umami.is).

---

## Installation

Add the tracker script to your website, just before `</head>` or `</body>`:

```html
<script defer src="https://your-livedot-instance.com/t.js" data-website="YOUR_WEBSITE_ID"></script>
```

Replace `YOUR_WEBSITE_ID` with the ID from your Livedot dashboard.

The script is ~1 KB, loads asynchronously, and uses `sendBeacon` for zero impact on page performance.

---

## How It Works

Once installed, the tracker automatically:

1. Generates a persistent anonymous session ID (stored in `localStorage`)
2. Sends a beacon on page load with the current URL
3. Sends a heartbeat every 5 seconds to keep the session alive
4. Sends a beacon when the page becomes visible again (tab switch)

Sessions expire on the server after 10 seconds of inactivity (no beacons received). All data is held in memory — nothing is written to disk or stored long-term.

---

## Custom Event Tracking

Livedot supports three ways to track custom events (button clicks, form submissions, etc.). All events appear in real time in the activity panel on the dashboard.

### 1. Data Attributes

Add `data-livedot-event` to any clickable element:

```html
<button data-livedot-event="signup-click">Sign Up</button>
```

Clicking the button sends an event named `signup-click` to Livedot.

This also works on parent elements — the tracker uses `closest()`, so nested content is fine:

```html
<div data-livedot-event="cta-click">
  <img src="banner.png" />
  <span>Click here</span>
</div>
```

### 2. JavaScript API

Use `window.livedot.track()` for programmatic tracking:

```js
window.livedot.track("purchase-complete");
```

```js
document.querySelector("form").addEventListener("submit", () => {
  window.livedot.track("form-submit");
});
```

The function is available as soon as the tracker script loads. If you call it before the script loads, wrap it in a check:

```js
if (window.livedot) {
  window.livedot.track("early-event");
}
```

### 3. Umami-Compatible Data Attributes

If you are migrating from Umami or running both side by side, Livedot also listens for `data-umami-event`:

```html
<button data-umami-event="signup-click">Sign Up</button>
```

This works identically to `data-livedot-event` — no code changes needed.

---

## Umami Compatibility

Livedot is designed to work alongside Umami with zero configuration. If both scripts are on the same page, Livedot automatically proxies Umami's `track()` function so that every event sent to Umami is also sent to Livedot.

### How It Works

- If `window.umami` exists when Livedot loads, it patches `umami.track()` immediately
- If Umami loads after Livedot, a setter trap on `window.umami` detects it and patches automatically
- The original `umami.track()` still works normally — Livedot only adds a side-effect

### Example: Both Scripts Together

```html
<!-- Umami -->
<script defer src="https://analytics.example.com/script.js" data-website-id="UMAMI_ID"></script>

<!-- Livedot -->
<script defer src="https://your-livedot-instance.com/t.js" data-website="LIVEDOT_ID"></script>
```

Now any call to `umami.track()` also sends the event to Livedot:

```js
// This sends to BOTH Umami and Livedot
umami.track("button-click");
```

```html
<!-- This triggers events in BOTH Umami and Livedot -->
<button data-umami-event="signup-click">Sign Up</button>
```

### Load Order

The scripts can load in any order. Livedot handles both cases:

| Umami loads first | Livedot patches `umami.track()` on init |
|---|---|
| Livedot loads first | Livedot sets a trap and patches when Umami appears |

### Disabling the Proxy

If you don't want Livedot to proxy Umami events, simply ensure the Livedot script loads on pages where Umami is not present. There is no explicit toggle — the proxy only activates when `window.umami` is detected.

---

## API Reference

### `POST /api/event`

The tracker sends JSON payloads to this endpoint. You can also call it directly from your server or other clients.

**Beacon (page view / heartbeat):**

```json
{
  "websiteId": "your-website-id",
  "sessionId": "client-generated-uuid",
  "url": "https://example.com/page"
}
```

**Custom event:**

```json
{
  "websiteId": "your-website-id",
  "sessionId": "client-generated-uuid",
  "url": "https://example.com/page",
  "eventName": "button-click"
}
```

**Response codes:**

| Code | Meaning |
|---|---|
| `204` | Success |
| `400` | Missing `websiteId` or `sessionId` |
| `403` | Origin mismatch (production only) |
| `404` | Unknown `websiteId` |
| `429` | Rate limited (beacons only, 1 per 3s per IP) |

Custom events are not rate limited.

---

## Privacy

- No cookies are used
- Session IDs are random UUIDs stored in `localStorage` — they cannot identify a person
- IP addresses are used only for geolocation lookup, then discarded
- All session data is held in memory and never persisted to disk
- Sessions are automatically removed after 10 seconds of inactivity
- Activity events are cleaned up after 30 minutes
