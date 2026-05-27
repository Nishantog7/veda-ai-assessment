import './globals.css';

export const metadata = {
  title: 'VedaAI Assessment',
  description: 'AI Generated Question Papers',
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