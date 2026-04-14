// Copy this file to a served runtime script or paste the same object into the browser console
// before loading the app. GitHub Pages cannot host the auth backend itself, so the live app
// needs a real external auth/API base URL.
//
// Example manual setup in DevTools on the live site:
// localStorage.setItem('havenly.auth.runtimeConfig', JSON.stringify({
//   apiBaseUrl: 'https://your-auth-host.example.com',
//   credentialsMode: 'include',
// }))
// location.reload()
//
// Or append ?authApiBaseUrl=https://your-auth-host.example.com to the live URL.

globalThis.__HAVENLY_AUTH_CONFIG__ = {
  apiBaseUrl: 'https://your-auth-host.example.com',
  credentialsMode: 'include',
}
