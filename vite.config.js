import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function trimTrailingSlash(value = '') {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

function normalizeBasePath(base = '/') {
  const trimmed = trimTrailingSlash(base)
  return trimmed && trimmed !== '' ? trimmed : ''
}

function readAuthProxyBaseUrl(env = {}) {
  const value = typeof env.HAVENLY_AUTH_PROXY_BASE_URL === 'string' && env.HAVENLY_AUTH_PROXY_BASE_URL.trim()
    ? env.HAVENLY_AUTH_PROXY_BASE_URL.trim()
    : typeof env.VITE_AUTH_PROXY_BASE_URL === 'string' && env.VITE_AUTH_PROXY_BASE_URL.trim()
      ? env.VITE_AUTH_PROXY_BASE_URL.trim()
      : ''

  return trimTrailingSlash(value)
}

function buildPreviewRuntimeAuthConfig(proxyBaseUrl = '') {
  const serializedApiBaseUrl = proxyBaseUrl ? `  apiBaseUrl: ${JSON.stringify(proxyBaseUrl)},` : null

  return [
    'window.__HAVENLY_AUTH_CONFIG__ = {',
    "  credentialsMode: 'include',",
    ...(serializedApiBaseUrl ? [serializedApiBaseUrl] : []),
    "  loginEndpoint: '/api/auth/login',",
    "  signupEndpoint: '/api/auth/signup',",
    "  sessionEndpoint: '/api/auth/session',",
    "  pendingEndpoint: '/api/auth/pending',",
    "  continueEndpoint: '/api/auth/continue',",
    "  logoutEndpoint: '/api/auth/logout',",
    '}',
    '',
  ].join('\n')
}

function stripBasePath(pathname = '', basePath = '') {
  if (!basePath) return pathname
  return pathname.startsWith(basePath) ? pathname.slice(basePath.length) || '/' : pathname
}

function isRuntimeAuthConfigPath(pathname = '', basePath = '') {
  return pathname === '/havenly-auth-config.js' || pathname === `${basePath}/havenly-auth-config.js`
}

function runtimeAuthConfigPlugin({ basePath, proxyBaseUrl }) {
  const runtimeAuthConfig = buildPreviewRuntimeAuthConfig(proxyBaseUrl)

  return {
    name: 'havenly-runtime-auth-config',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const requestUrl = new URL(req.url ?? '/', 'http://localhost')
        if (!isRuntimeAuthConfigPath(requestUrl.pathname, basePath)) {
          next()
          return
        }

        res.statusCode = 200
        res.setHeader('content-type', 'application/javascript; charset=utf-8')
        res.end(runtimeAuthConfig)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const requestUrl = new URL(req.url ?? '/', 'http://localhost')
        if (!isRuntimeAuthConfigPath(requestUrl.pathname, basePath)) {
          next()
          return
        }

        res.statusCode = 200
        res.setHeader('content-type', 'application/javascript; charset=utf-8')
        res.end(runtimeAuthConfig)
      })
    },
  }
}

function escapeRegex(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildAuthProxyEntry({ proxyBaseUrl, basePath, stripBasePathPrefix = false }) {
  return {
    target: proxyBaseUrl,
    changeOrigin: false,
    xfwd: true,
    secure: false,
    rewrite: (requestPath) => stripBasePathPrefix ? stripBasePath(requestPath, basePath) : requestPath,
  }
}

function buildAuthProxyRules({ proxyBaseUrl, basePath }) {
  if (!proxyBaseUrl) return undefined

  const escapedBasePath = escapeRegex(basePath)

  return {
    '^/api/auth(?:/.*)?$': buildAuthProxyEntry({ proxyBaseUrl, basePath, stripBasePathPrefix: false }),
    [`^${escapedBasePath}/api/auth(?:/.*)?$`]: buildAuthProxyEntry({ proxyBaseUrl, basePath, stripBasePathPrefix: true }),
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = '/github-pages-react-hello/'
  const proxyBaseUrl = readAuthProxyBaseUrl(env)
  const basePath = normalizeBasePath(base)
  const authProxyRules = buildAuthProxyRules({ proxyBaseUrl, basePath })

  return {
    plugins: [
      react(),
      runtimeAuthConfigPlugin({ basePath, proxyBaseUrl }),
    ],
    server: {
      proxy: authProxyRules,
    },
    preview: {
      proxy: authProxyRules,
    },
    base,
  }
})
