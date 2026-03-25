---
title: Getting started
description: Create your account, add a website, and install the Livedot tracking script.
order: 1
---

Livedot has a short setup flow:

1. Create your account with email and password, or continue with GitHub if available.
2. Add your first website from the dashboard.
3. Install the tracking script.
4. Enable sharing if you want widgets and embeds.

## 1. Create your account

Open the signup screen and create your account.

- Use email and password to sign up.
- If GitHub is enabled, you can continue with GitHub instead.
- After setup, you land on the dashboard.

## 2. Add a website

From the dashboard, click `New Website` and fill in:

- Website name
- Optional URL

This creates the website entry in your dashboard.

## 3. Install the script

After a website is created, Livedot shows the tracking snippet right away.

Use this script on the site you want to track:

```html
<script defer src="https://your-domain/t.js" data-website="YOUR_WEBSITE_ID"></script>
```

That script is what sends visitor sessions to Livedot.

## 4. Confirm it is working

Once the script is installed, return to the website dashboard page.

You should see:

- live visitor count
- active sessions
- the realtime chart and map updating as visitors arrive

## 5. Enable sharing for embeds

If you want to use the map, chart, or live counter embeds, open the website share modal and enable sharing.

That gives you the embed token used by the widget snippets.

## Where to go next

- Use the website dashboard for live monitoring.
- Open [Embed widgets](/help/embed) for widget query parameters and embed examples.
- Read [What counts as an event?](/help/events) to understand monthly usage.
