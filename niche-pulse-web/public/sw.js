// Minimal service worker — its only job is to exist, which is one of the
// requirements Chrome/Android checks before offering "Add to Home Screen"
// as an installable app rather than a plain bookmark. It passes every
// request straight through to the network; no offline caching is attempted,
// since this dashboard's data changes constantly and stale cached numbers
// would be actively misleading.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
