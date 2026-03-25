---
title: Embed widgets
description: Customize the map, chart, and live counter embeds with supported query parameters.
order: 2
---

Use the embed widgets when you want to place live traffic data inside your own product or marketing site.

## Common parameters

- `website`: your website id
- `token`: the share token from the dashboard
- `bg`: embed background color or `transparent`
- `branding`: `1` or `true` to force branding for non-free plans

## Map widget

The map widget keeps the full live map visible.

```html
<iframe
  src="https://cloud.livedot.dev/embed/map?website=YOUR_WEBSITE_ID&token=YOUR_SHARE_TOKEN&bg=transparent"
  width="100%"
  height="400"
  frameborder="0"
  style="border:0;border-radius:12px;"
></iframe>
```

## Chart widget

The chart widget shows a compact trend line and current live count.

- `accent`: line and status color, defaults to `#96E421`
- `scale`: widget size multiplier, defaults to `0.9`

```html
<iframe
  src="https://cloud.livedot.dev/embed/chart?website=YOUR_WEBSITE_ID&token=YOUR_SHARE_TOKEN&accent=%2396E421&scale=0.9"
  width="260"
  height="128"
  frameborder="0"
  style="border:0;overflow:hidden;"
></iframe>
```

## Live counter widget

The live widget is the most compact option.

- `accent`: status dot color, defaults to `#96E421`
- `scale`: widget size multiplier, defaults to `0.85`

```html
<iframe
  src="https://cloud.livedot.dev/embed/live?website=YOUR_WEBSITE_ID&token=YOUR_SHARE_TOKEN&accent=%2396E421&scale=0.85"
  width="260"
  height="84"
  frameborder="0"
  style="border:0;overflow:hidden;"
></iframe>
```
