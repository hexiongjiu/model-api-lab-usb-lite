import { createReadStream, promises as fs } from "node:fs"
import { createServer } from "node:http"
import { dirname, extname, resolve, sep } from "node:path"
import { Readable } from "node:stream"
import { fileURLToPath } from "node:url"
import worker from "./dist/server/index.js"

const rootDirectory = dirname(fileURLToPath(import.meta.url))
const clientDirectory = resolve(rootDirectory, "dist", "client")
const port = Number(process.argv[2] || process.env.PORT || 8188)
const host = "127.0.0.1"

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
])

function assetPath(request) {
  const pathname = decodeURIComponent(new URL(request.url).pathname)
  const relativePath = pathname.replace(/^\/+/, "")
  const candidate = resolve(clientDirectory, relativePath)
  if (candidate !== clientDirectory && !candidate.startsWith(clientDirectory + sep)) return null
  return candidate
}

const assets = {
  async fetch(request) {
    let filePath
    try {
      filePath = assetPath(request)
    } catch {
      return new Response("Not found", { status: 404 })
    }
    if (!filePath) return new Response("Not found", { status: 404 })
    try {
      const stats = await fs.stat(filePath)
      if (!stats.isFile()) return new Response("Not found", { status: 404 })
      const headers = new Headers({
        "Content-Length": String(stats.size),
        "Content-Type": mimeTypes.get(extname(filePath).toLowerCase()) || "application/octet-stream",
      })
      if (new URL(request.url).pathname.startsWith("/_next/static/")) {
        headers.set("Cache-Control", "public, max-age=31536000, immutable")
      }
      if (request.method === "HEAD") return new Response(null, { status: 200, headers })
      return new Response(Readable.toWeb(createReadStream(filePath)), { status: 200, headers })
    } catch {
      return new Response("Not found", { status: 404 })
    }
  },
}

function requestUrl(request) {
  const authority = request.headers.host || `${host}:${port}`
  return `http://${authority}${request.url || "/"}`
}

function toWebRequest(request) {
  const hasBody = request.method !== "GET" && request.method !== "HEAD"
  return new Request(requestUrl(request), {
    method: request.method,
    headers: request.headers,
    body: hasBody ? request : undefined,
    duplex: hasBody ? "half" : undefined,
  })
}

async function sendResponse(response, reply) {
  reply.statusCode = response.status
  reply.statusMessage = response.statusText
  for (const [name, value] of response.headers) {
    if (name.toLowerCase() !== "set-cookie") reply.setHeader(name, value)
  }
  const cookies = response.headers.getSetCookie?.() || []
  if (cookies.length) reply.setHeader("Set-Cookie", cookies)
  if (!response.body) {
    reply.end()
    return
  }
  Readable.fromWeb(response.body).pipe(reply)
}

const server = createServer(async (request, reply) => {
  try {
    if (request.url === "/__model_api_lab_health") {
      reply.writeHead(200, { "Content-Type": "application/json; charset=utf-8" })
      reply.end(JSON.stringify({ ok: true, app: "model-api-lab", version: 2 }))
      return
    }
    const webRequest = toWebRequest(request)
    if (request.method === "GET" || request.method === "HEAD") {
      const assetResponse = await assets.fetch(webRequest)
      if (assetResponse.ok) {
        await sendResponse(assetResponse, reply)
        return
      }
    }
    const pending = []
    const context = { waitUntil(promise) { pending.push(Promise.resolve(promise)) } }
    const response = await worker.fetch(webRequest, { ASSETS: assets }, context)
    await sendResponse(response, reply)
    Promise.allSettled(pending).catch(() => {})
  } catch (error) {
    console.error(error)
    if (!reply.headersSent) reply.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" })
    reply.end("Local server error")
  }
})

server.listen(port, host, () => {
  console.log(`Model API Lab is ready at http://${host}:${port}/`)
})

server.on("error", (error) => {
  console.error(error)
  process.exitCode = 1
})
