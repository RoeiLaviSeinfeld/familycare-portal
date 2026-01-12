'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, Pill, CheckSquare, ShoppingCart } from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'בית' },
  { href: '/dashboard/calendar', icon: Calendar, label: 'יומן' },
  { href: '/dashboard/medications', icon: Pill, label: 'תרופות' },
  { href: '/dashboard/tasks', icon: CheckSquare, label: 'משימות' },
  { href: '/dashboard/shopping', icon: ShoppingCart, label: 'קניות' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-xs mt-1 ${isActive ? 'font-medium' : ''}`}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
