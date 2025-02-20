"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Wrench, Package, Calendar, ClipboardList, ReceiptText } from 'lucide-react';
import { Label } from "@radix-ui/react-label";

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const menuItems = [
    { icon: Users, label: 'Clientes', href: '/clients' },
    { icon: Users, label: 'Empleados', href: '/employees' },
    { icon: Wrench, label: 'Maquinaria', href: '/machinery' },
    { icon: Package, label: 'Suministros', href: '/supplies' },
    { icon: Calendar, label: 'Calendario de trabajos', href: '/scheduled-jobs' },
    { icon: ClipboardList, label: 'Trabajos finalizados', href: '/worked-jobs' },
    { icon: ReceiptText, Label: 'Cotizacion', href: '/quote'},
  ];

  return (
    <aside
      className={`
        bg-[#262451] 
        shadow-md 
        transition-all 
        duration-300 
        ease-in-out 
        flex 
        flex-col
        ${isExpanded ? 'w-64' : 'w-16'}
      `}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="p-4">
        <img
          src="/EliteLogo.svg"
          alt="Elite Logo"
          className={`transition-all duration-300 ease-in-out ${isExpanded ? 'w-32' : 'w-8'}`}
        />
      </div>

      <nav className="mt-4 flex flex-col space-y-2 flex-grow">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex items-center px-2 py-2 text-[#d2c9ff]
              hover:bg-[#4e497a] 
              rounded-r-full 
              transition-all 
              duration-300 
              ease-in-out
              ${isExpanded ? 'px-4' : 'justify-center'}
            `}
          >
            <item.icon className="w-5 h-5" />
            <span
              className={`
                ml-2 
                transition-all 
                duration-300 
                ease-in-out
                ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}
              `}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      {isExpanded && (
        <div className="mt-auto p-4">
          <p className="text-[#d2c9ff] text-xs">v0.1.2</p>
        </div>
      )}
    </aside>
  );
}