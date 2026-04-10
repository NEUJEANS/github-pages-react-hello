import http from 'node:http'
import { pathToFileURL } from 'node:url'
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
} from '../src/components/auth-submit.js'
import { handleAuthRequest, readAuthStorePaths } from './auth-persistent-store.js'

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []

    req.on('data', (chunk) => {
      if (Buffer.isBuffer(chunk)) {
        chunks.push(chunk.toString('utf8'))
        return
      }

      if (typeof chunk === 'string') {
        chunks.push(chunk)
        return
      }

      if (chunk instanceof Uint8Array) {
        chunks.push(Buffer.from(chunk).toString('utf8'))
        return
      }

      chunks.push(String(chunk ?? ''))
    })

    req.on('end', () => {
      const raw = chunks.join('').replace(/^\uFEFF/, '').trim()
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
          // ignore and fall through to structured payload below
        }
      }

      resolve({ __invalidJson: raw })
    })

    req.on('error', reject)
  })
}

function encodeHeaderValue(value) {
  return encodeURIComponent(typeof value === 'string' ? value : String(value ?? ''))
}

function readRequestPath(req) {
  if (typeof req?.url !== 'string') return ''

  try {
    return new URL(req.url, 'http://127.0.0.1').pathname
  } catch {
    return req.url.split('?')[0] ?? ''
  }
}

function normalizeAuthPath(pathname = '') {
  const supported = [
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/session',
    '/api/auth/pending',
    '/api/auth/logout',
    '/api/auth/continue',
  ]

  return supported.find((entry) => pathname === entry || pathname.endsWith(entry)) ?? pathname
}

function readAuthConnection(req, requestPath) {
  const targetLabel = req.headers[AUTH_CONNECTION_TARGET_HEADER] ?? req.headers.host ?? '127.0.0.1'
  const endpoint = req.headers[AUTH_CONNECTION_ENDPOINT_HEADER] ?? requestPath
  const resolvedUrl = targetLabel === 'same-origin /api auth scaffold'
    ? endpoint
    : `http://${targetLabel}${endpoint}`

  return {
    method: req.headers[AUTH_CONNECTION_METHOD_HEADER] ?? req.method ?? 'GET',
    endpoint,
    resolvedUrl,
    targetLabel,
    isExternal: targetLabel !== 'same-origin /api auth scaffold',
    isSameOriginScaffold: targetLabel === 'same-origin /api auth scaffold',
    credentialsMode: req.headers[AUTH_CONNECTION_CREDENTIALS_HEADER] ?? 'include',
    source: req.headers[AUTH_CONNECTION_SOURCE_HEADER] ?? 'standalone-auth-http-server',
  }
}

function readForwardedOrigin(req) {
  const host = req.headers['x-forwarded-host'] ?? req.headers.host ?? '127.0.0.1'
  const protocol = req.headers['x-forwarded-proto'] ?? 'http'

  return {
    host,
    protocol: typeof protocol === 'string' && protocol.trim() ? protocol.trim() : 'http',
  }
}

function buildActionConnection(req) {
  const forwardedOrigin = readForwardedOrigin(req)

  return {
    method: 'POST',
    endpoint: '/api/auth/continue',
    resolvedUrl: `${forwardedOrigin.protocol}://${forwardedOrigin.host}/api/auth/continue`,
    targetLabel: forwardedOrigin.host,
    isExternal: false,
    isSameOriginScaffold: false,
    credentialsMode: req.headers[AUTH_CONNECTION_CREDENTIALS_HEADER] ?? 'include',
    source: req.headers[AUTH_CONNECTION_SOURCE_HEADER] ?? 'standalone-auth-http-server',
  }
}

function buildResponseHeaders(payload, connection) {
  return {
    'content-type': 'application/json',
    [AUTH_CONNECTION_METHOD_HEADER]: connection?.method ?? '',
    [AUTH_CONNECTION_ENDPOINT_HEADER]: connection?.endpoint ?? '',
    [AUTH_CONNECTION_TARGET_HEADER]: connection?.targetLabel ?? '',
    [AUTH_CONNECTION_CREDENTIALS_HEADER]: connection?.credentialsMode ?? '',
    [AUTH_CONNECTION_SOURCE_HEADER]: connection?.source ?? '',
    [AUTH_HANDOFF_HEADER]: encodeHeaderValue(payload?.handoffId ?? payload?.summary?.handoffId ?? ''),
    [AUTH_RESUME_TOKEN_HEADER]: encodeHeaderValue(payload?.resumeToken ?? payload?.continuation?.resumeToken ?? ''),
    [AUTH_NEXT_ACTION_HEADER]: encodeHeaderValue(payload?.nextAction ?? payload?.continuation?.nextAction ?? ''),
    [AUTH_STATUS_HEADER]: encodeHeaderValue(payload?.status ?? payload?.continuation?.status ?? ''),
    [AUTH_STATUS_LABEL_HEADER]: encodeHeaderValue(payload?.statusLabel ?? payload?.continuation?.statusLabel ?? ''),
  }
}

function writeJson(res, status, data, headers = {}, cookies = []) {
  res.statusCode = status
  Object.entries(headers).forEach(([key, value]) => {
    if (value !== '') res.setHeader(key, value)
  })
  if (Array.isArray(cookies) && cookies.length > 0) {
    res.setHeader('set-cookie', cookies)
  }
  res.end(JSON.stringify(data))
}

async function handleHttpRequest(req, res) {
  const requestPath = normalizeAuthPath(readRequestPath(req))
  const supported = new Set([
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/session',
    '/api/auth/pending',
    '/api/auth/logout',
    '/api/auth/continue',
  ])

  if (!supported.has(requestPath)) {
    writeJson(res, 404, { message: 'Not found' })
    return
  }

  try {
    const requestBody = req.method === 'GET' || req.method === 'HEAD'
      ? {}
      : await readRequestBody(req)
    const connection = readAuthConnection(req, requestPath)
    const response = handleAuthRequest(req, {
      connection,
      actionConnection: buildActionConnection(req),
      body: {
        ...requestBody,
        continuation: {
          ...(requestBody?.continuation ?? {}),
          resumeToken: req.headers[AUTH_RESUME_TOKEN_HEADER] ?? requestBody?.continuation?.resumeToken ?? null,
          nextAction: req.headers[AUTH_NEXT_ACTION_HEADER] ?? requestBody?.continuation?.nextAction ?? null,
          status: requestBody?.continuation?.status ?? null,
          statusLabel: requestBody?.continuation?.statusLabel ?? null,
        },
      },
      pathName: requestPath,
      handoffHeader: req.headers[AUTH_HANDOFF_HEADER] ?? null,
      resumeTokenHeader: req.headers[AUTH_RESUME_TOKEN_HEADER] ?? null,
    })

    writeJson(
      res,
      response.status,
      response.data,
      buildResponseHeaders(response.data, response.data?.connection ?? connection),
      response.cookies,
    )
  } catch (error) {
    writeJson(res, 400, {
      message: 'Invalid auth request',
      detail: error instanceof Error ? error.message : String(error),
    })
  }
}

export function resolveAuthHttpServerOptions({
  env = process.env,
  args = process.argv.slice(2),
} = {}) {
  const parsed = {
    host: typeof env.HAVENLY_AUTH_HOST === 'string' && env.HAVENLY_AUTH_HOST.trim()
      ? env.HAVENLY_AUTH_HOST.trim()
      : '127.0.0.1',
    port: Number.parseInt(env.HAVENLY_AUTH_PORT ?? '', 10),
  }

  if (!Number.isFinite(parsed.port) || parsed.port < 0) parsed.port = 4175

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    const nextValue = args[index + 1]

    if (arg === '--host' && typeof nextValue === 'string' && nextValue.trim()) {
      parsed.host = nextValue.trim()
      index += 1
      continue
    }

    if (arg === '--port' && typeof nextValue === 'string' && nextValue.trim()) {
      const nextPort = Number.parseInt(nextValue.trim(), 10)
      if (Number.isFinite(nextPort) && nextPort >= 0) parsed.port = nextPort
      index += 1
      continue
    }
  }

  return parsed
}

export async function startAuthHttpServer({ port = 0, host = '127.0.0.1' } = {}) {
  const server = http.createServer((req, res) => {
    handleHttpRequest(req, res)
  })

  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, host, resolve)
  })

  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Unable to resolve auth server address')
  }

  return {
    host,
    port: address.port,
    url: `http://${host}:${address.port}`,
    server,
    close() {
      return new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error)
            return
          }
          resolve()
        })
      })
    },
  }
}

async function runCli() {
  const serverOptions = resolveAuthHttpServerOptions()
  const authServer = await startAuthHttpServer(serverOptions)
  const storePaths = readAuthStorePaths()

  console.log(`[havenly-auth] listening on ${authServer.url}`)
  console.log(`[havenly-auth] sqlite ${storePaths.sqlitePath}`)

  const shutdown = async (signal) => {
    try {
      await authServer.close()
      console.log(`[havenly-auth] stopped on ${signal}`)
      process.exit(0)
    } catch (error) {
      console.error(`[havenly-auth] shutdown failed on ${signal}:`, error)
      process.exit(1)
    }
  }

  process.on('SIGINT', () => {
    shutdown('SIGINT')
  })
  process.on('SIGTERM', () => {
    shutdown('SIGTERM')
  })
}

const isDirectExecution = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirectExecution) {
  runCli().catch((error) => {
    console.error('[havenly-auth] failed to start:', error)
    process.exit(1)
  })
}
