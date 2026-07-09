import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { AppShell } from '@/components/layout/app-shell'
import { Toaster } from 'react-hot-toast'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Vocred - Enterprise Voice AI Platform & AI Voice Agents',
  description: 'The most configurable Voice API to build and deploy conversational AI voice agents. Automate inbound support and outbound sales calls with Vocred.',
  keywords: ['Voice AI Platform', 'AI Voice Agents', 'Conversational AI', 'Voice API', 'AI Outbound Calling Bot', 'Automated IVR Replacement', 'Voice AI API', 'Voice AI Solutions'],
  metadataBase: new URL('https://vocred.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://vocred.com',
    title: 'Vocred - Enterprise Voice AI Platform',
    description: 'The most configurable Voice API to build and deploy conversational AI voice agents.',
    siteName: 'Vocred',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Vocred Voice AI Platform',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vocred - Enterprise Voice AI Platform',
    description: 'The most configurable Voice API to build and deploy conversational AI voice agents.',
    images: ['/logo.png'],
  },
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
            <Toaster position="bottom-right" />
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
