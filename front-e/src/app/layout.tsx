import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'EMS - Employee Management System',
  description: 'Generator Service Employee Management',
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
