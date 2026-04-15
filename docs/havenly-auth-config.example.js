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
// Optional local-only fallback for debugging:
// - append ?authLoopbackProbe=1 only when you explicitly want HAVENLY to try a local
//   127.0.0.1:4175/localhost:4175 auth server from the live Pages app.
// - By default the live Pages build no longer auto-probes loopback, because browsers
//   increasingly block GitHub Pages -> localhost access and that produced noisy false paths.

globalThis.__HAVENLY_AUTH_CONFIG__ = {
  apiBaseUrl: 'https://your-auth-host.example.com',
  credentialsMode: 'include',
}
