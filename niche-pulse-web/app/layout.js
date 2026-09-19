import './globals.css';

export const metadata = {
  title: 'Niche Pulse',
  description: 'Cross-store AI productivity dashboard for niche e-commerce sellers',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Niche Pulse'
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png'
  }
};

export const viewport = {
  themeColor: '#05030a',
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {})); }`
          }}
        />
      </body>
    </html>
  );
}
