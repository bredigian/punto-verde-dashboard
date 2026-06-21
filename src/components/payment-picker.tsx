'use client'

import { PaymentMethod } from '@/types'
import { cn } from '@/lib/utils'
import { Banknote } from 'lucide-react'

const OPTIONS: { value: PaymentMethod; label: string; icon: React.ReactNode; activeClass: string }[] = [
  { value: 'efectivo', label: 'Efectivo', icon: <Banknote className="h-4 w-4" />, activeClass: 'bg-green-600 text-white border-green-600' },
  {
    value: 'mercadopago',
    label: 'Mercado Pago',
    icon: <img src="/mercado-pago-logo.svg" alt="MP" className="h-4 w-4" />,
    activeClass: 'bg-sky-500 text-white border-sky-500',
  },
]

interface Props {
  value: PaymentMethod | ''
  onChange: (v: PaymentMethod) => void
}

export function PaymentPicker({ value, onChange }: Props) {
  return (
    <div className="flex gap-2">
      {OPTIONS.map((opt) => (
        <button
          type="button"
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-1.5',
            value === opt.value
              ? opt.activeClass
              : 'bg-transparent text-muted-foreground border-input hover:border-foreground'
          )}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  )
}
