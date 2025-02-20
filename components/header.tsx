import Link from "next/link";
import { Home, Search, Bell } from 'lucide-react';

export default function Header() {
    return (
        <header className="bg-gradient-to-r from-[#4e497a] to-[#7871a6] text-white shadow-lg">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Breadcrumb o Icono Home */}
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                <li>
                  <Link href="/" className="hover:text-[#d2c9ff]">
                    <Home className="h-4 w-4" />
                  </Link>
                </li>
              </ol>
            </nav>
            
            {/* Buscador */}
            <div className="relative max-w-lg w-full flex-grow mx-4">
              <input
                type="text"
                placeholder="Búsqueda global..."
                className="pl-8 pr-4 py-2 rounded-full bg-white/10 text-white placeholder-white focus:border-white focus:ring-white w-full"
              />
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/75" />
            </div>
    
            {/* Notificaciones (ejemplo) */}
            <button className="relative rounded-md p-2 text-white hover:bg-white/20">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-red-500 rounded-full">
                3
              </span>
            </button>
          </div>
        </header>
    )
}