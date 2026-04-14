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
//
// Recent Pages behavior:
// - if the live site is opened on a machine already running `npm run dev:auth-server`
//   on 127.0.0.1:4175 or localhost:4175, HAVENLY now auto-detects that local auth
//   backend and uses it without requiring query params or manual localStorage setup.

globalThis.__HAVENLY_AUTH_CONFIG__ = {
  apiBaseUrl: 'https://your-auth-host.example.com',
  credentialsMode: 'include',
}
