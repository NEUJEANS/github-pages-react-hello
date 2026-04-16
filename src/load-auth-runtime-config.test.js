import test from 'node:test'
import assert from 'node:assert/strict'

import { loadAuthRuntimeConfig } from './load-auth-runtime-config.js'

test('loadAuthRuntimeConfig loads the served runtime file and applies stored/query overrides in order', async () => {
  const appendedScripts = []
  const originalDocument = globalThis.document
  const originalLocation = globalThis.location
  const originalConfig = globalThis.__HAVENLY_AUTH_CONFIG__

  globalThis.__HAVENLY_AUTH_CONFIG__ = {
    apiBaseUrl: 'https://existing.example.com',
    credentialsMode: 'omit',
    fromExisting: true,
  }

  globalThis.location = {
    origin: 'https://neujeans.github.io',
    search: '?authApiBaseUrl=https%3A%2F%2Fquery.example.com%2F&authCredentials=same-origin&authLoopbackProbe=1',
  }

  globalThis.document = {
    baseURI: 'https://neujeans.github.io/github-pages-react-hello/',
    createElement: () => ({}),
    head: {
      appendChild: (script) => {
        appendedScripts.push(script.src)
        globalThis.__HAVENLY_AUTH_CONFIG__ = {
          apiBaseUrl: 'https://file.example.com',
          credentialsMode: 'include',
          fromFile: true,
        }
        script.onload()
      },
    },
  }

  const storage = {
    getItem: () => JSON.stringify({
      apiBaseUrl: 'https://stored.example.com/',
      credentialsMode: 'include',
      fromStorage: true,
    }),
  }

  try {
    const result = await loadAuthRuntimeConfig({
      baseUrl: '/github-pages-react-hello/',
      locationSearch: globalThis.location.search,
      storage,
    })

    assert.deepEqual(appendedScripts, ['https://neujeans.github.io/github-pages-react-hello/havenly-auth-config.js'])
    assert.deepEqual(result, {
      apiBaseUrl: 'https://query.example.com',
      credentialsMode: 'same-origin',
      fromFile: true,
      fromStorage: true,
      fromExisting: true,
      allowLoopbackProbe: true,
    })
  } finally {
    globalThis.document = originalDocument
    globalThis.location = originalLocation
    globalThis.__HAVENLY_AUTH_CONFIG__ = originalConfig
  }
})

test('loadAuthRuntimeConfig still applies stored config when the runtime file is missing', async () => {
  const originalDocument = globalThis.document
  const originalLocation = globalThis.location
  const originalConfig = globalThis.__HAVENLY_AUTH_CONFIG__

  globalThis.__HAVENLY_AUTH_CONFIG__ = undefined
  globalThis.location = {
    origin: 'https://neujeans.github.io',
    search: '',
  }
  globalThis.document = {
    baseURI: 'https://neujeans.github.io/github-pages-react-hello/',
    createElement: () => ({}),
    head: {
      appendChild: (script) => {
        script.onerror()
      },
    },
  }

  const storage = {
    getItem: () => JSON.stringify({
      apiBaseUrl: 'https://stored.example.com/',
      credentialsMode: 'include',
    }),
  }

  try {
    const result = await loadAuthRuntimeConfig({
      baseUrl: '/github-pages-react-hello/',
      storage,
    })

    assert.deepEqual(result, {
      apiBaseUrl: 'https://stored.example.com/',
      credentialsMode: 'include',
    })
  } finally {
    globalThis.document = originalDocument
    globalThis.location = originalLocation
    globalThis.__HAVENLY_AUTH_CONFIG__ = originalConfig
  }
})
