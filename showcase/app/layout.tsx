import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fancy Buttons — Precious Stone Collection',
  description: 'Beautiful gem-inspired React button components',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
