'use client'

import { Category } from '@/types'
import { cn } from '@/lib/utils'

const OPTIONS: { value: Category; label: string; activeClass: string }[] = [
  { value: 'verduleria', label: 'Verdulería', activeClass: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-700 dark:text-green-100 dark:border-green-600' },
  { value: 'polleria', label: 'Pollería', activeClass: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-600 dark:text-yellow-50 dark:border-yellow-500' },
]

interface Props {
  value: Category | ''
  onChange: (v: Category | '') => void
  allowEmpty?: boolean
}

export function CategoryPicker({ value, onChange, allowEmpty }: Props) {
  return (
    <div className="flex gap-2">
      {allowEmpty && (
        <button
          type="button"
          onClick={() => onChange('')}
          className={cn(
            'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
            !value
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-transparent text-muted-foreground border-input hover:border-foreground'
          )}
        >
          Todas
        </button>
      )}
      {OPTIONS.map((opt) => (
        <button
          type="button"
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
            value === opt.value
              ? opt.activeClass
              : 'bg-transparent text-muted-foreground border-input hover:border-foreground'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
