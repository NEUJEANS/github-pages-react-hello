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

function writeHtml(res, status, html, headers = {}) {
  res.statusCode = status
  res.setHeader('content-type', 'text/html; charset=utf-8')
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value)
  })
  res.end(html)
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

function readAuthConnection(req, requestPath) {
  const endpoint = req.headers[AUTH_CONNECTION_ENDPOINT_HEADER] ?? requestPath ?? req.url ?? '/api/auth/login'
  const targetLabel = req.headers[AUTH_CONNECTION_TARGET_HEADER] ?? req.headers.host ?? '127.0.0.1'
  const credentialsMode = req.headers[AUTH_CONNECTION_CREDENTIALS_HEADER] ?? 'include'
  const source = req.headers[AUTH_CONNECTION_SOURCE_HEADER] ?? 'standalone-auth-http-server'
  const resolvedUrl = targetLabel === 'same-origin /api auth scaffold'
    ? endpoint
    : `http://${targetLabel}${endpoint}`

  return {
    method: req.headers[AUTH_CONNECTION_METHOD_HEADER] ?? req.method ?? 'POST',
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

function readRequestQuery(req) {
  if (typeof req?.url !== 'string') return {}

  try {
    const url = new URL(req.url, 'http://localhost')
    return Object.fromEntries(url.searchParams.entries())
  } catch {
    return {}
  }
}

function normalizeAuthPath(pathname = '') {
  const supportedPaths = [
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/session',
    '/api/auth/pending',
    '/api/auth/logout',
    '/api/auth/continue',
    '/api/auth/health',
    '/api/auth/verification/start',
    '/api/auth/verification/status',
    '/api/auth/verification/callback',
    '/api/auth/layout/track',
  ]

  return supportedPaths.find((entry) => pathname === entry || pathname.endsWith(entry)) ?? pathname
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

function buildVerificationCallbackPage({ verificationId, status = 'verified' }) {
  const safeVerificationId = JSON.stringify(verificationId ?? '')
  const safeStatus = JSON.stringify(status)

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>HAVENLY 인증 완료</title>
    <style>
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f7f3ee; color: #2f241c; margin: 0; min-height: 100vh; display: grid; place-items: center; }
      main { width: min(420px, calc(100vw - 32px)); background: #fff; border-radius: 24px; padding: 28px 24px; box-shadow: 0 22px 50px rgba(47, 36, 28, .12); text-align: center; }
      h1 { margin: 0 0 10px; font-size: 22px; }
      p { margin: 0; line-height: 1.5; color: #6b5d52; }
    </style>
  </head>
  <body>
    <main>
      <h1>인증이 완료되었어요</h1>
      <p>이 창은 자동으로 닫혀요. 원래 화면에서 이어서 진행해 주세요.</p>
    </main>
    <script>
      const payload = { type: 'havenly-verification-complete', verificationId: ${safeVerificationId}, status: ${safeStatus} }
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(payload, '*')
        }
      } catch {}
      window.setTimeout(() => window.close(), 80)
    </script>
  </body>
</html>`
}

export function startAuthHttpServer(options = {}) {
  const host = options.host ?? '127.0.0.1'
  const port = Number.parseInt(options.port ?? process.env.HAVENLY_AUTH_SERVER_PORT ?? '4175', 10)
  const storePaths = readAuthStorePaths({
    dataDir: options.dataDir,
    sqlitePath: options.sqlitePath,
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

    const supportedPaths = [
      '/api/auth/login',
      '/api/auth/signup',
      '/api/auth/session',
      '/api/auth/pending',
      '/api/auth/logout',
      '/api/auth/continue',
      '/api/auth/verification/start',
      '/api/auth/verification/status',
      '/api/auth/verification/callback',
      '/api/auth/layout/track',
    ]

    if (!supportedPaths.includes(requestPath)) {
      writeJson(res, 404, { message: `Unknown auth path: ${requestPath}` })
      return
    }

    const connection = readAuthConnection(req, requestPath)
    const actionConnection = buildActionConnection(req)
    const query = readRequestQuery(req)
    const rawBody = req.method === 'GET' || req.method === 'HEAD'
      ? {}
      : await readRequestBody(req)
    const body = requestPath === '/api/auth/verification/callback'
      ? { ...query, ...rawBody }
      : rawBody

    const response = handleAuthRequest(req, {
      connection,
      actionConnection,
      body: {
        ...body,
        continuation: {
          ...(body?.continuation ?? {}),
          resumeToken: req.headers[AUTH_RESUME_TOKEN_HEADER] ?? body?.continuation?.resumeToken ?? null,
          nextAction: req.headers[AUTH_NEXT_ACTION_HEADER] ?? body?.continuation?.nextAction ?? null,
          status: body?.continuation?.status ?? null,
          statusLabel: body?.continuation?.statusLabel ?? null,
        },
      },
      pathName: requestPath,
      handoffHeader: req.headers[AUTH_HANDOFF_HEADER] ?? null,
      resumeTokenHeader: req.headers[AUTH_RESUME_TOKEN_HEADER] ?? null,
      dataDir: storePaths.dataDir,
      sqlitePath: storePaths.sqlitePath,
      storeFile: storePaths.sqlitePath,
    })

    if (Array.isArray(response.cookies) && response.cookies.length > 0) {
      res.setHeader('set-cookie', response.cookies)
    }

    const responseHeaders = {
      'x-havenly-auth-server': 'true',
      [AUTH_SCAFFOLD_HEADER]: 'true',
      ...buildAuthConnectionHeaders(response.data?.connection ?? connection),
      ...buildAuthActionConnectionHeaders(response.data?.actionConnection ?? actionConnection),
      ...buildAuthContinuationHeaders(response.data),
    }

    if (requestPath === '/api/auth/verification/callback' && response.status === 200) {
      writeHtml(
        res,
        response.status,
        buildVerificationCallbackPage({
          verificationId: response.data?.verificationId ?? body?.verificationId ?? null,
          status: response.data?.status ?? body?.status ?? 'verified',
        }),
        responseHeaders,
      )
      return
    }

    writeJson(res, response.status, response.data, responseHeaders)
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
    sqlitePath: env.HAVENLY_AUTH_SQLITE_PATH ?? env.HAVENLY_AUTH_STORE_FILE,
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

    if ((arg === '--sqlite-path' || arg === '--store-file') && nextValue) {
      options.sqlitePath = nextValue
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
    ...(parsed.sqlitePath ? { sqlitePath: parsed.sqlitePath } : {}),
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
