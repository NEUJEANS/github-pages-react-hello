import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import {
  AUTH_CONNECTION_CREDENTIALS_HEADER,
  AUTH_CONNECTION_ENDPOINT_HEADER,
  AUTH_CONNECTION_SOURCE_HEADER,
  AUTH_CONNECTION_TARGET_HEADER,
} from "./src/components/auth-submit.js"
import { buildAuthScaffoldResponse, buildAuthScaffoldSessionResponse } from "./src/components/auth-backend-scaffold.js"

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []

    req.on("data", (chunk) => chunks.push(chunk))
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8")
        resolve(raw ? JSON.parse(raw) : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on("error", reject)
  })
}

function writeJson(res, status, data, headers = {}) {
  res.statusCode = status
  res.setHeader("content-type", "application/json")
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value)
  })
  res.end(JSON.stringify(data))
}

function readAuthConnection(req) {
  const endpoint = req.headers[AUTH_CONNECTION_ENDPOINT_HEADER] ?? "/api/auth/login"
  const targetLabel = req.headers[AUTH_CONNECTION_TARGET_HEADER] ?? "same-origin /api auth scaffold"
  const credentialsMode = req.headers[AUTH_CONNECTION_CREDENTIALS_HEADER] ?? "include"
  const source = req.headers[AUTH_CONNECTION_SOURCE_HEADER] ?? "default"
  const resolvedUrl = targetLabel === "same-origin /api auth scaffold"
    ? endpoint
    : `https://${targetLabel}${endpoint}`

  return {
    method: req.method ?? "POST",
    endpoint,
    resolvedUrl,
    targetLabel,
    isExternal: targetLabel !== "same-origin /api auth scaffold",
    isSameOriginScaffold: targetLabel === "same-origin /api auth scaffold",
    credentialsMode,
    source,
  }
}

function havenlyAuthScaffoldPlugin() {
  let latestSession = null

  const handler = async (req, res, next) => {
    if (req.method === "GET" && req.url === "/api/auth/session") {
      const response = buildAuthScaffoldSessionResponse(latestSession)
      writeJson(res, response.status, response.data, { "x-havenly-auth-scaffold": "true" })
      return
    }

    if (req.method === "POST" && req.url === "/api/auth/logout") {
      latestSession = null
      writeJson(res, 200, { ok: true }, { "x-havenly-auth-scaffold": "true" })
      return
    }

    if (req.method !== "POST" || req.url !== "/api/auth/login") {
      next()
      return
    }

    try {
      const request = await readRequestBody(req)
      const response = buildAuthScaffoldResponse(request)
      if (response.status >= 200 && response.status < 300) {
        latestSession = {
          ...response.data,
          connection: readAuthConnection(req),
        }
      }
      writeJson(res, response.status, latestSession && response.status >= 200 && response.status < 300 ? latestSession : response.data, { "x-havenly-auth-scaffold": "true" })
    } catch {
      writeJson(res, 400, { message: "Invalid auth scaffold request" }, { "x-havenly-auth-scaffold": "true" })
    }
  }

  return {
    name: "havenly-auth-scaffold",
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}

export default defineConfig({
  plugins: [react(), havenlyAuthScaffoldPlugin()],
  base: "/github-pages-react-hello/"
})
