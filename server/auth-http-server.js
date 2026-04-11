import http from 'node:http'
import { pathToFileURL } from 'node:url'
import {
  AUTH_ACTION_CONNECTION_CREDENTIALS_HEADER,
  AUTH_ACTION_CONNECTION_ENDPOINT_HEADER,
  AUTH_ACTION_CONNECTION_METHOD_HEADER,
  AUTH_ACTION_CONNECTION_SOURCE_HEADER,
  AUTH_ACTION_CONNECTION_TARGET_HEADER,
  AUTH_CONNECTION_CREDENTIALS_HEADER,
  AUTH_CONNECTION_ENDPOINT_HEADER,
  AUTH_CONNECTION_METHOD_HEADER,
  AUTH_CONNECTION_SOURCE_HEADER,
  AUTH_CONNECTION_TARGET_HEADER,
  AUTH_HANDOFF_HEADER,
  AUTH_NEXT_ACTION_HEADER,
  AUTH_RESUME_TOKEN_HEADER,
  AUTH_SCAFFOLD_HEADER,
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
          // ignore and fall through to structured error below
        }

        resolve({ __invalidJson: raw })
      }
    })
    req.on('error', reject)
  })
}

function writeJson(res, status, data, headers = {}) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value)
  })
  res.end(JSON.stringify(data))
}


function encodeHeaderValue(value) {
  const normalized = typeof value === 'string' ? value : String(value ?? '')
  return encodeURIComponent(normalized)
}

function buildAuthContinuationHeaders(payload = null) {
  if (!payload || typeof payload !== 'object') return {}

  return {
    [AUTH_HANDOFF_HEADER]: encodeHeaderValue(payload.handoffId ?? payload.summary?.handoffId ?? ''),
    [AUTH_RESUME_TOKEN_HEADER]: encodeHeaderValue(payload.resumeToken ?? payload.continuation?.resumeToken ?? ''),
    [AUTH_NEXT_ACTION_HEADER]: encodeHeaderValue(payload.nextAction ?? payload.continuation?.nextAction ?? ''),
    [AUTH_STATUS_HEADER]: encodeHeaderValue(payload.status ?? payload.continuation?.status ?? ''),
    [AUTH_STATUS_LABEL_HEADER]: encodeHeaderValue(payload.statusLabel ?? payload.continuation?.statusLabel ?? ''),
  }
}

function readAuthConnection(req) {
  const headerMethod = req.headers[AUTH_CONNECTION_METHOD_HEADER]
  const endpoint = req.headers[AUTH_CONNECTION_ENDPOINT_HEADER] ?? req.url ?? '/api/auth/login'
  const targetLabel = req.headers[AUTH_CONNECTION_TARGET_HEADER] ?? 'mock-auth.local'
  const credentialsMode = req.headers[AUTH_CONNECTION_CREDENTIALS_HEADER] ?? 'include'
  const source = req.headers[AUTH_CONNECTION_SOURCE_HEADER] ?? 'default'
  const resolvedUrl = targetLabel === 'same-origin /api auth scaffold'
    ? endpoint
    : `https://${targetLabel}${endpoint}`

  return {
    method: headerMethod ?? req.method ?? 'POST',
    endpoint,
    resolvedUrl,
    targetLabel,
    isExternal: targetLabel !== 'same-origin /api auth scaffold',
    isSameOriginScaffold: targetLabel === 'same-origin /api auth scaffold',
    credentialsMode,
    source,
  }
}

function buildActionConnection(req) {
  const forwardedHost = typeof req.headers['x-forwarded-host'] === 'string' ? req.headers['x-forwarded-host'].trim() : ''
  const forwardedProto = typeof req.headers['x-forwarded-proto'] === 'string' ? req.headers['x-forwarded-proto'].trim() : ''
  const host = forwardedHost || (typeof req.headers.host === 'string' ? req.headers.host.trim() : '') || 'same-origin /api auth scaffold'
  const protocol = forwardedProto || 'http'

  return {
    method: 'POST',
    endpoint: '/api/auth/continue',
    targetLabel: host,
    resolvedUrl: host === 'same-origin /api auth scaffold' ? '/api/auth/continue' : `${protocol}://${host}/api/auth/continue`,
    isExternal: host !== 'same-origin /api auth scaffold',
    isSameOriginScaffold: host === 'same-origin /api auth scaffold',
    credentialsMode: 'include',
    source: forwardedHost || forwardedProto ? 'forwarded' : 'http-server',
  }
}

function buildAuthConnectionHeaders(connection = null) {
  if (!connection) return {}

  return {
    [AUTH_CONNECTION_METHOD_HEADER]: connection.method ?? '',
    [AUTH_CONNECTION_ENDPOINT_HEADER]: connection.endpoint ?? '',
    [AUTH_CONNECTION_TARGET_HEADER]: connection.targetLabel ?? '',
    [AUTH_CONNECTION_CREDENTIALS_HEADER]: connection.credentialsMode ?? '',
    [AUTH_CONNECTION_SOURCE_HEADER]: connection.source ?? '',
  }
}

function buildAuthActionConnectionHeaders(connection = null) {
  if (!connection) return {}

  return {
    [AUTH_ACTION_CONNECTION_METHOD_HEADER]: connection.method ?? '',
    [AUTH_ACTION_CONNECTION_ENDPOINT_HEADER]: connection.endpoint ?? '',
    [AUTH_ACTION_CONNECTION_TARGET_HEADER]: connection.targetLabel ?? '',
    [AUTH_ACTION_CONNECTION_CREDENTIALS_HEADER]: connection.credentialsMode ?? '',
    [AUTH_ACTION_CONNECTION_SOURCE_HEADER]: connection.source ?? '',
  }
}

function readRequestPath(req) {
  if (typeof req?.url !== 'string') return ''

  try {
    return new URL(req.url, 'http://localhost').pathname
  } catch {
    return req.url.split('?')[0] ?? ''
  }
}

function normalizeAuthPath(pathname = '') {
  if (pathname === '/api/auth/login') return pathname
  if (pathname.endsWith('/api/auth/login')) return '/api/auth/login'
  if (pathname === '/api/auth/signup') return pathname
  if (pathname.endsWith('/api/auth/signup')) return '/api/auth/signup'
  if (pathname === '/api/auth/session') return pathname
  if (pathname.endsWith('/api/auth/session')) return '/api/auth/session'
  if (pathname === '/api/auth/pending') return pathname
  if (pathname.endsWith('/api/auth/pending')) return '/api/auth/pending'
  if (pathname === '/api/auth/logout') return pathname
  if (pathname.endsWith('/api/auth/logout')) return '/api/auth/logout'
  if (pathname === '/api/auth/continue') return pathname
  if (pathname.endsWith('/api/auth/continue')) return '/api/auth/continue'
  if (pathname === '/api/auth/health') return pathname
  if (pathname.endsWith('/api/auth/health')) return '/api/auth/health'
  return pathname
}

function writeHealthResponse(res, { storePaths }) {
  writeJson(res, 200, {
    ok: true,
    service: 'havenly-auth-http-server',
    storage: 'sqlite',
    sqlitePath: storePaths.sqlitePath,
  }, {
    'cache-control': 'no-store',
    'x-havenly-auth-server': 'health',
  })
}

export function startAuthHttpServer(options = {}) {
  const host = options.host ?? '127.0.0.1'
  const port = Number.parseInt(options.port ?? process.env.HAVENLY_AUTH_SERVER_PORT ?? '4175', 10)
  const storePaths = readAuthStorePaths({
    dataDir: options.dataDir,
    storeFile: options.storeFile,
  })

  const server = http.createServer(async (req, res) => {
    if (!req.url) {
      writeJson(res, 400, { message: 'Missing request URL' })
      return
    }

    const requestPath = normalizeAuthPath(readRequestPath(req))

    if (requestPath === '/api/auth/health') {
      writeHealthResponse(res, { storePaths })
      return
    }

    if (!['/api/auth/login', '/api/auth/signup', '/api/auth/session', '/api/auth/pending', '/api/auth/logout', '/api/auth/continue'].includes(requestPath)) {
      writeJson(res, 404, { message: `Unknown auth path: ${requestPath}` })
      return
    }

    const connection = readAuthConnection(req)
    const cookieHeader = typeof req.headers.cookie === 'string' ? req.headers.cookie : ''
    const sessionCookie = cookieHeader.split(/;\s*/).find((entry) => entry.startsWith('havenly_session='))
    const pendingCookie = cookieHeader.split(/;\s*/).find((entry) => entry.startsWith('havenly_pending='))
    const body = req.method === 'GET' || req.method === 'HEAD'
      ? {}
      : await readRequestBody(req)

    const response = handleAuthRequest(req, {
      connection,
      actionConnection: buildActionConnection(req),
      body,
      pathName: requestPath,
      handoffHeader: req.headers[AUTH_HANDOFF_HEADER] ?? null,
      resumeTokenHeader: req.headers[AUTH_RESUME_TOKEN_HEADER] ?? null,
      sessionIdHeader: sessionCookie ? sessionCookie.slice('havenly_session='.length) : null,
      pendingHandoffIdHeader: pendingCookie ? pendingCookie.slice('havenly_pending='.length) : null,
      dataDir: storePaths.dataDir,
      storeFile: storePaths.storeFile,
    })

    if (Array.isArray(response.cookies) && response.cookies.length > 0) {
      res.setHeader('set-cookie', response.cookies)
    }

    writeJson(res, response.status, response.data, {
      'x-havenly-auth-server': 'true',
      [AUTH_SCAFFOLD_HEADER]: 'true',
      ...buildAuthConnectionHeaders(response.data?.connection ?? connection),
      ...buildAuthActionConnectionHeaders(response.data?.actionConnection ?? buildActionConnection(req)),
      ...buildAuthContinuationHeaders(response.data),
    })
  })

  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, host, () => {
      server.off('error', reject)
      const address = server.address()
      const resolvedPort = typeof address === 'object' && address ? address.port : port
      resolve({
        server,
        host,
        port: resolvedPort,
        url: `http://${host}:${resolvedPort}`,
        close: () => new Promise((closeResolve, closeReject) => {
          server.close((error) => {
            if (error) {
              closeReject(error)
              return
            }
            closeResolve()
          })
        }),
      })
    })
  })
}

function parseCliArgs(argv = process.argv.slice(2), env = process.env) {
  const options = {
    host: env.HAVENLY_AUTH_SERVER_HOST ?? env.HAVENLY_AUTH_HOST ?? '127.0.0.1',
    port: env.HAVENLY_AUTH_SERVER_PORT ?? env.HAVENLY_AUTH_PORT ?? '4175',
    dataDir: env.HAVENLY_AUTH_DATA_DIR,
    storeFile: env.HAVENLY_AUTH_STORE_FILE,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const nextValue = argv[index + 1]

    if (arg === '--host' && nextValue) {
      options.host = nextValue
      index += 1
      continue
    }

    if (arg === '--port' && nextValue) {
      options.port = nextValue
      index += 1
      continue
    }

    if (arg === '--data-dir' && nextValue) {
      options.dataDir = nextValue
      index += 1
      continue
    }

    if (arg === '--store-file' && nextValue) {
      options.storeFile = nextValue
      index += 1
      continue
    }
  }

  return options
}

function resolveAuthHttpServerOptions({ args = process.argv.slice(2), env = process.env } = {}) {
  const parsed = parseCliArgs(args, env)
  return {
    host: parsed.host,
    port: Number.parseInt(parsed.port, 10),
    ...(parsed.dataDir ? { dataDir: parsed.dataDir } : {}),
    ...(parsed.storeFile ? { storeFile: parsed.storeFile } : {}),
  }
}

export { parseCliArgs, resolveAuthHttpServerOptions }

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : null
const isDirectExecution = invokedPath === import.meta.url

if (isDirectExecution) {
  const options = parseCliArgs()
  startAuthHttpServer(options)
    .then(({ host, port, url }) => {
      console.log(`[havenly-auth-server] listening on ${url} (host=${host} port=${port})`)
    })
    .catch((error) => {
      console.error('[havenly-auth-server] failed to start', error)
      process.exitCode = 1
    })
}
