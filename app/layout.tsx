import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/src/design-system/themes/ThemeProvider'

export const metadata: Metadata = {
  title: 'NEXTERM — Institutional FX Terminal',
  description: 'Professional Forex & Macro Trading Terminal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="h-screen overflow-hidden">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
