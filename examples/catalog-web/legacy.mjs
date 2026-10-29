import { mkdirSync, writeFileSync } from 'node:fs'

const destination = new URL('../../docs/.vitepress/dist/garage/', import.meta.url)
mkdirSync(destination, { recursive: true })
writeFileSync(
  new URL('index.html', destination),
  `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex, follow"><title>Mavis UI</title></head>
<body><a href="/playground/#/showcase/vehicle">Open the vehicle showcase</a>
<script>location.replace('/playground/#/showcase/vehicle' + (location.hash === '#/details' ? '/details' : ''))</script>
</body></html>`,
)
