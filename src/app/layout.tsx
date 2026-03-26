import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Analytics } from '@vercel/analytics/next'
import { LocaleProvider } from '@/context/LocaleContext'

export const metadata: Metadata = {
  title: 'SOL Operations Platform',
  description: 'SOL For Business Solutions — Operations Excellence Platform',
}

export const viewport: Viewport = {
  themeColor: '#142680',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* Preconnect to Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Montserrat (English) + Tajawal (Arabic) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&family=Tajawal:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Apply saved locale before first paint to avoid flash */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var l=localStorage.getItem('sol-locale');if(l==='ar'){document.documentElement.lang='ar';document.documentElement.dir='rtl';}}catch(e){}})();` }} />
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});})}` }} />
      </head>
      <body>
        {/* LocaleProvider at root so ALL pages (login, dashboard, verify) get i18n */}
        <LocaleProvider>
          {children}
        </LocaleProvider>
        <Analytics />
      </body>
    </html>
  )
}
