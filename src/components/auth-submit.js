function trimTrailingSlash(value = '') {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

export function resolveAuthEndpoint(endpoint, { apiBaseUrl } = {}) {
  if (/^https?:\/\//.test(endpoint)) return endpoint

  const normalizedBase = trimTrailingSlash(apiBaseUrl?.trim?.() ?? '')
  if (!normalizedBase) return endpoint

  return `${normalizedBase}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
}

async function parseAuthResponse(response) {
  const contentType = response.headers?.get?.('content-type') ?? ''

  if (contentType.includes('application/json')) {
    try {
      return await response.json()
    } catch {
      return null
    }
  }

  try {
    const text = await response.text()
    return text ? { message: text } : null
  } catch {
    return null
  }
}

export async function submitAuthLoginPlan(plan, { fetchImpl = fetch, apiBaseUrl } = {}) {
  const response = await fetchImpl(resolveAuthEndpoint(plan.endpoint, { apiBaseUrl }), {
    method: plan.method,
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(plan.request),
  })

  const data = await parseAuthResponse(response)

  return {
    ok: response.ok,
    status: response.status,
    data,
  }
}
