---
title: "Privacy"
description: "This site collects no data about you and keeps only six settings in your browser, plus a note of what your device can draw."
---

This site is a set of static pages. There is no account, no form and no database.

## What does not exist here

No analytics, no advertising tracker, no cookie, no social button, no third-party script. The security policy sent with every page allows the site's own scripts only, so the browser refuses any script from another domain.

## What stays in your browser

Six settings are remembered once you change them:

- the light or dark theme, under the key `aubaine.theme`;
- whether drafts are hidden from lists, under the key `aubaine.drafts`;
- sound (on or muted, master volume, and the ambience, effects and interface volumes), under the key `aubaine.sound`;
- whether the animations are paused on the Species and Trees pages, and on the page of every Species and every Tree (the background at the top of the page and a subspecies' flag), under the key `aubaine.stage`;
- the Atlas map view (top, 3/4, relief or free), under the key `aubaine.atlas.view`;
- the Atlas options (display quality, screen effect, 3D or parchment rendering, legend open or closed, what the map shows), under the key `aubaine.atlas.settings`.

The site itself sets a seventh key, `aubaine.gpu`, whenever the graphics card draws one of these pictures: the background at the top of a Species or Tree page, a painting under glass, or a subspecies' banner, flag or coat of arms. The key records what your device can draw, so the pages that follow keep a picture's plain version hidden until the graphics card has drawn it. If your browser can no longer use the graphics card, the site removes the key.

All of these keys stay in your browser and are sent nowhere. Clearing the site's data removes them.

## Hosting

The pages are served by Cloudflare, which handles the requests needed to deliver the files as any web server does. Aubaine adds no collection on top, and receives no data about you.
