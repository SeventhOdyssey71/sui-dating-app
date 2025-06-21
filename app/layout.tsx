import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import { Providers } from '@/components/Providers'
import './globals.css'

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: 'Discoveer - Find Your Match',
  description: 'Blockchain-powered dating platform with encrypted messaging and Web3 features',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}