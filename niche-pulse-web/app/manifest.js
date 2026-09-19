export default function manifest() {
  return {
    name: 'Niche Pulse',
    short_name: 'Niche Pulse',
    description: 'Cross-store AI productivity dashboard for niche e-commerce sellers',
    start_url: '/',
    display: 'standalone',
    background_color: '#05030a',
    theme_color: '#05030a',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  };
}
