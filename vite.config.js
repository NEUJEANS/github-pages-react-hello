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
import { handleAuthRequest } from "./server/auth-persistent-store.js"

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []

    req.on("data", (chunk) => {
      if (Buffer.isBuffer(chunk)) {
        chunks.push(chunk.toString("utf8"))
        return
      }

      if (typeof chunk === "string") {
        chunks.push(chunk)
        return
      }

      if (chunk instanceof Uint8Array) {
        chunks.push(Buffer.from(chunk).toString("utf8"))
        return
      }

      chunks.push(String(chunk ?? ""))
    })
    req.on("end", () => {
      const raw = chunks.join("").replace(/^\uFEFF/, "").trim()
      if (!raw) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(raw))
        return
      } catch {
        try {
          const params = new URLSearchParams(raw)
          const entries = Array.from(params.entries())
          if (entries.length) {
            resolve(Object.fromEntries(entries))
            return
          }
        } catch {
          // ignore and fall through to structured error below
        }

        resolve({ __invalidJson: raw })
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
  const headerMethod = req.headers[AUTH_CONNECTION_METHOD_HEADER]
  const endpoint = req.headers[AUTH_CONNECTION_ENDPOINT_HEADER] ?? req.url ?? "/api/auth/login"
  const targetLabel = req.headers[AUTH_CONNECTION_TARGET_HEADER] ?? "same-origin /api auth scaffold"
  const credentialsMode = req.headers[AUTH_CONNECTION_CREDENTIALS_HEADER] ?? "include"
  const source = req.headers[AUTH_CONNECTION_SOURCE_HEADER] ?? "default"
  const resolvedUrl = targetLabel === "same-origin /api auth scaffold"
    ? endpoint
    : `https://${targetLabel}${endpoint}`

  return {
    method: headerMethod ?? req.method ?? "POST",
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

function encodeHeaderValue(value) {
  const normalized = typeof value === "string" ? value : String(value ?? "")
  return encodeURIComponent(normalized)
}

function buildAuthContinuationHeaders(payload = null) {
  if (!payload || typeof payload !== "object") return {}

  return {
    [AUTH_HANDOFF_HEADER]: encodeHeaderValue(payload.handoffId ?? payload.summary?.handoffId ?? ""),
    [AUTH_RESUME_TOKEN_HEADER]: encodeHeaderValue(payload.resumeToken ?? payload.continuation?.resumeToken ?? ""),
    [AUTH_NEXT_ACTION_HEADER]: encodeHeaderValue(payload.nextAction ?? payload.continuation?.nextAction ?? ""),
    [AUTH_STATUS_HEADER]: encodeHeaderValue(payload.status ?? payload.continuation?.status ?? ""),
    [AUTH_STATUS_LABEL_HEADER]: encodeHeaderValue(payload.statusLabel ?? payload.continuation?.statusLabel ?? ""),
  }
}

function readRequestPath(req) {
  if (typeof req?.url !== "string") return ""

  try {
    return new URL(req.url, "http://localhost").pathname
  } catch {
    return req.url.split("?")[0] ?? ""
  }
}

function normalizeAuthScaffoldPath(pathname = "") {
  if (pathname === "/api/auth/login") return pathname
  if (pathname.endsWith("/api/auth/login")) return "/api/auth/login"
  if (pathname === "/api/auth/signup") return pathname
  if (pathname.endsWith("/api/auth/signup")) return "/api/auth/signup"
  if (pathname === "/api/auth/session") return pathname
  if (pathname.endsWith("/api/auth/session")) return "/api/auth/session"
  if (pathname === "/api/auth/pending") return pathname
  if (pathname.endsWith("/api/auth/pending")) return "/api/auth/pending"
  if (pathname === "/api/auth/logout") return pathname
  if (pathname.endsWith("/api/auth/logout")) return "/api/auth/logout"
  if (pathname === "/api/auth/continue") return pathname
  if (pathname.endsWith("/api/auth/continue")) return "/api/auth/continue"
  return pathname
}

function readAuthProxyBaseUrl() {
  const raw = process.env.HAVENLY_AUTH_PROXY_BASE_URL
    ?? process.env.VITE_AUTH_PROXY_BASE_URL
    ?? ""
  const normalized = typeof raw === "string" ? raw.trim().replace(/\/$/, "") : ""
  return normalized || null
}

async function proxyAuthRequest(req, res, requestPath, { proxyBaseUrl }) {
  const requestBody = req.method === "GET" || req.method === "HEAD"
    ? undefined
    : await readRequestBody(req)
  const targetUrl = `${proxyBaseUrl}${requestPath}`
  const forwardedHeaders = {
    accept: req.headers.accept ?? "application/json",
    [AUTH_CONNECTION_METHOD_HEADER]: req.headers[AUTH_CONNECTION_METHOD_HEADER] ?? req.method ?? "GET",
    [AUTH_CONNECTION_ENDPOINT_HEADER]: req.headers[AUTH_CONNECTION_ENDPOINT_HEADER] ?? requestPath,
    [AUTH_CONNECTION_TARGET_HEADER]: req.headers[AUTH_CONNECTION_TARGET_HEADER] ?? new URL(proxyBaseUrl).host,
    [AUTH_CONNECTION_CREDENTIALS_HEADER]: req.headers[AUTH_CONNECTION_CREDENTIALS_HEADER] ?? "include",
    [AUTH_CONNECTION_SOURCE_HEADER]: req.headers[AUTH_CONNECTION_SOURCE_HEADER] ?? "vite-proxy",
    [AUTH_HANDOFF_HEADER]: req.headers[AUTH_HANDOFF_HEADER] ?? "",
    [AUTH_RESUME_TOKEN_HEADER]: req.headers[AUTH_RESUME_TOKEN_HEADER] ?? "",
    [AUTH_NEXT_ACTION_HEADER]: req.headers[AUTH_NEXT_ACTION_HEADER] ?? "",
  }

  if (req.headers.cookie) {
    forwardedHeaders.cookie = req.headers.cookie
  }

  if (requestBody !== undefined) {
    forwardedHeaders["content-type"] = "application/json"
  }

  const response = await fetch(targetUrl, {
    method: req.method,
    headers: forwardedHeaders,
    redirect: "manual",
    body: requestBody !== undefined ? JSON.stringify(requestBody) : undefined,
  })

  res.statusCode = response.status

  const contentType = response.headers.get("content-type") ?? "application/json"
  res.setHeader("content-type", contentType)

  const setCookie = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : []
  if (setCookie.length > 0) {
    res.setHeader("set-cookie", setCookie)
  }

  ;[
    AUTH_HANDOFF_HEADER,
    AUTH_RESUME_TOKEN_HEADER,
    AUTH_NEXT_ACTION_HEADER,
    AUTH_STATUS_HEADER,
    AUTH_STATUS_LABEL_HEADER,
    AUTH_CONNECTION_METHOD_HEADER,
    AUTH_CONNECTION_ENDPOINT_HEADER,
    AUTH_CONNECTION_TARGET_HEADER,
    AUTH_CONNECTION_CREDENTIALS_HEADER,
    AUTH_CONNECTION_SOURCE_HEADER,
  ].forEach((headerName) => {
    const value = response.headers.get(headerName)
    if (value) res.setHeader(headerName, value)
  })

  const responseText = await response.text()
  res.end(responseText)
}

function havenlyAuthScaffoldPlugin() {
  const authProxyBaseUrl = readAuthProxyBaseUrl()

  const handler = async (req, res, next) => {
    const requestPath = normalizeAuthScaffoldPath(readRequestPath(req))
    const isSupportedAuthPath = [
      "/api/auth/login",
      "/api/auth/signup",
      "/api/auth/session",
      "/api/auth/pending",
      "/api/auth/logout",
      "/api/auth/continue",
    ].includes(requestPath)

    if (authProxyBaseUrl && isSupportedAuthPath) {
      try {
        await proxyAuthRequest(req, res, requestPath, { proxyBaseUrl: authProxyBaseUrl })
      } catch (error) {
        writeJson(res, 502, {
          message: "Auth proxy request failed",
          detail: error instanceof Error ? error.message : String(error),
          proxyBaseUrl: authProxyBaseUrl,
        }, { "x-havenly-auth-scaffold": "proxy-error" })
      }
      return
    }

    if (!["/api/auth/login", "/api/auth/signup", "/api/auth/session", "/api/auth/pending", "/api/auth/logout", "/api/auth/continue"].includes(requestPath)) {
      next()
      return
    }

    try {
      const request = req.method === "GET" || req.method === "HEAD"
        ? {}
        : await readRequestBody(req)
      const connection = readAuthConnection(req)
      const response = handleAuthRequest(req, {
        connection,
        actionConnection: {
          ...connection,
          method: "POST",
          endpoint: "/api/auth/continue",
          resolvedUrl: "/api/auth/continue",
          targetLabel: "same-origin /api auth scaffold",
          isExternal: false,
          isSameOriginScaffold: true,
        },
        body: {
          ...request,
          continuation: {
            ...(request.continuation ?? {}),
            resumeToken: req.headers[AUTH_RESUME_TOKEN_HEADER] ?? request.continuation?.resumeToken ?? null,
            nextAction: req.headers[AUTH_NEXT_ACTION_HEADER] ?? request.continuation?.nextAction ?? null,
            status: request.continuation?.status ?? null,
            statusLabel: request.continuation?.statusLabel ?? null,
          },
        },
        pathName: requestPath,
        handoffHeader: req.headers[AUTH_HANDOFF_HEADER] ?? null,
        resumeTokenHeader: req.headers[AUTH_RESUME_TOKEN_HEADER] ?? null,
      })

      if (Array.isArray(response.cookies) && response.cookies.length > 0) {
        res.setHeader("set-cookie", response.cookies)
      }

      writeJson(res, response.status, response.data, {
        "x-havenly-auth-scaffold": "true",
        ...buildAuthConnectionHeaders(response.data?.connection ?? connection),
        ...buildAuthContinuationHeaders(response.data),
      })
    } catch (error) {
      writeJson(res, 400, {
        message: "Invalid auth scaffold request",
        detail: error instanceof Error ? error.message : String(error),
      }, { "x-havenly-auth-scaffold": "true" })
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
