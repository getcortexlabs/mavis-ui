import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
const root = resolve(process.argv[2])
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    let file = resolve(root, `.${path}`)
    if (file !== root && !file.startsWith(root + sep)) { response.writeHead(403).end(); return }
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html')
    const body = await readFile(file)
    response.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream')
    response.end(body)
  } catch { response.writeHead(404).end('Not found') }
}).listen(Number(process.argv[3]), '127.0.0.1')
