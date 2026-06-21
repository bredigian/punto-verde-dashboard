'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, History, BookLock } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/dashboard', label: 'Ventas', icon: ShoppingCart },
  { href: '/dashboard/history', label: 'Historial', icon: History },
  { href: '/dashboard/cierres', label: 'Cierres', icon: BookLock },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t">
      <div className="max-w-lg mx-auto flex">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors',
                active ? 'text-green-600' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'fill-green-100')} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
