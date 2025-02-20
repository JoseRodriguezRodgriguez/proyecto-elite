import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Header from '@/components/header'       // Supongamos que también lo separas
import Sidebar from '@/components/sidebar'     // <-- Import de tu sidebar cliente

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Administración Elite',
  description: 'Dashboard administrativo',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className={inter.className + ' flex h-full'}>
        {/* El layout server renderiza un componente cliente */}
        <Sidebar /> 
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 bg-white">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
