import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import {
  AUTH_CONNECTION_CREDENTIALS_HEADER,
  AUTH_CONNECTION_ENDPOINT_HEADER,
  AUTH_CONNECTION_METHOD_HEADER,
  AUTH_CONNECTION_SOURCE_HEADER,
  AUTH_CONNECTION_TARGET_HEADER,
  AUTH_HANDOFF_HEADER,
  AUTH_NEXT_ACTION_HEADER,
  AUTH_RESUME_TOKEN_HEADER,
  AUTH_STATUS_HEADER,
  AUTH_STATUS_LABEL_HEADER,
} from "./src/components/auth-submit.js"
import {
  readAuthScaffoldPending,
  readAuthScaffoldSession,
  signOutAuthScaffoldSession,
  submitAuthScaffoldRequest,
} from "./src/components/auth-backend-scaffold.js"

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []

    req.on("data", (chunk) => {
      if (Buffer.isBuffer(chunk)) {
        chunks.push(chunk)
        return
      }

      if (typeof chunk === "string") {
        chunks.push(Buffer.from(chunk, "utf8"))
        return
      }

      if (chunk instanceof Uint8Array) {
        chunks.push(Buffer.from(chunk))
        return
      }

      chunks.push(Buffer.from(String(chunk ?? ""), "utf8"))
    })
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

function buildAuthConnectionHeaders(connection = null) {
  if (!connection) return {}

  return {
    [AUTH_CONNECTION_METHOD_HEADER]: connection.method ?? "",
    [AUTH_CONNECTION_ENDPOINT_HEADER]: connection.endpoint ?? "",
    [AUTH_CONNECTION_TARGET_HEADER]: connection.targetLabel ?? "",
    [AUTH_CONNECTION_CREDENTIALS_HEADER]: connection.credentialsMode ?? "",
    [AUTH_CONNECTION_SOURCE_HEADER]: connection.source ?? "",
  }
}

function buildAuthContinuationHeaders(payload = null) {
  if (!payload || typeof payload !== "object") return {}

  return {
    [AUTH_HANDOFF_HEADER]: payload.handoffId ?? payload.summary?.handoffId ?? "",
    [AUTH_RESUME_TOKEN_HEADER]: payload.resumeToken ?? payload.continuation?.resumeToken ?? "",
    [AUTH_NEXT_ACTION_HEADER]: payload.nextAction ?? payload.continuation?.nextAction ?? "",
    [AUTH_STATUS_HEADER]: payload.status ?? payload.continuation?.status ?? "",
    [AUTH_STATUS_LABEL_HEADER]: payload.statusLabel ?? payload.continuation?.statusLabel ?? "",
  }
}

function havenlyAuthScaffoldPlugin() {
  const handler = async (req, res, next) => {
    if (req.method === "GET" && req.url === "/api/auth/session") {
      const response = readAuthScaffoldSession()
      writeJson(res, response.status, response.data, {
        "x-havenly-auth-scaffold": "true",
        ...buildAuthConnectionHeaders(response.data?.connection),
        ...buildAuthContinuationHeaders(response.data),
      })
      return
    }

    if (req.method === "GET" && req.url === "/api/auth/pending") {
      const response = readAuthScaffoldPending()
      writeJson(res, response.status, response.data, {
        "x-havenly-auth-scaffold": "true",
        ...buildAuthConnectionHeaders(response.data?.connection),
        ...buildAuthContinuationHeaders(response.data),
      })
      return
    }

    if (req.method === "POST" && req.url === "/api/auth/logout") {
      const response = signOutAuthScaffoldSession()
      writeJson(res, response.status, response.data, {
        "x-havenly-auth-scaffold": "true",
        ...buildAuthConnectionHeaders(response.data?.connection),
        ...buildAuthContinuationHeaders(response.data),
      })
      return
    }

    if (req.method !== "POST" || req.url !== "/api/auth/login") {
      next()
      return
    }

    try {
      const request = await readRequestBody(req)
      const connection = readAuthConnection(req)
      const response = submitAuthScaffoldRequest({
        request: {
          ...request,
          continuation: {
            ...(request.continuation ?? {}),
            resumeToken: req.headers[AUTH_RESUME_TOKEN_HEADER] ?? request.continuation?.resumeToken ?? null,
            nextAction: req.headers[AUTH_NEXT_ACTION_HEADER] ?? request.continuation?.nextAction ?? null,
            status: request.continuation?.status ?? null,
            statusLabel: request.continuation?.statusLabel ?? null,
          },
        },
        connection,
      })

      writeJson(res, response.status, response.data, {
        "x-havenly-auth-scaffold": "true",
        ...buildAuthConnectionHeaders(response.data?.connection ?? connection),
        ...buildAuthContinuationHeaders(response.data),
      })
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
