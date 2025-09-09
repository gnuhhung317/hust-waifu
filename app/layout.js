import './globals.css'

export const metadata = {
  title: 'Waifu Model',
  description: 'Live2D Waifu Model with Next.js',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
