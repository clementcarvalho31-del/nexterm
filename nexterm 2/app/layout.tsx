import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/src/design-system/themes/ThemeProvider'

export const metadata: Metadata = {
  title: 'PrimeMarket — Institutional Trading Platform',
  description: 'Professional Forex & Macro Trading Terminal — Institutional grade analysis',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="h-screen">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
