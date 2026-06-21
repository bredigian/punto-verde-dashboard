'use client'

import { useRef, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const MAX = 15_000_000

function formatDisplay(value: string): string {
  if (!value) return '0'
  const [intPart, decPart] = value.split('.')
  const intFormatted = parseInt(intPart || '0', 10).toLocaleString('es-AR')
  if (decPart !== undefined) return intFormatted + ',' + decPart
  return intFormatted
}

interface MoneyInputProps {
  value: string
  onChange: (v: string) => void
  autoFocus?: boolean
  compact?: boolean
  className?: string
}

export function MoneyInput({ value, onChange, autoFocus, compact, className }: MoneyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [maxReached, setMaxReached] = useState(false)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  function applyRaw(raw: string) {
    // Normalize separator
    raw = raw.replace(',', '.')
    // Strip invalid chars
    raw = raw.replace(/[^\d.]/g, '')
    // Only one decimal point: keep first occurrence
    const firstDot = raw.indexOf('.')
    if (firstDot !== -1) {
      raw = raw.slice(0, firstDot + 1) + raw.slice(firstDot + 1).replace(/\./g, '')
    }
    // Max 2 decimal places
    const [int, dec] = raw.split('.')
    if (dec !== undefined) raw = int + '.' + dec.slice(0, 2)
    // Strip leading zeros on integer part (but keep "0.")
    raw = raw.replace(/^0+(\d)/, '$1')

    if (!raw) {
      setMaxReached(false)
      onChange('')
      return
    }

    if (parseFloat(raw) > MAX) {
      setMaxReached(true)
      onChange(String(MAX))
    } else {
      setMaxReached(false)
      onChange(raw)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    applyRaw(e.target.value)
  }

  // Desktop: intercept comma/period before browser strips them from numeric-ish inputs
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === ',' || e.key === '.') {
      e.preventDefault()
      if (!value.includes('.')) applyRaw(value + '.')
    }
  }

  const isZero = !value || parseFloat(value) === 0
  const display = formatDisplay(value)
  const isLong = display.replace(/[,.]/g, '').length > 7

  if (compact) {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <div
          className="relative flex items-center rounded-lg border border-input bg-transparent px-3 h-9 cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="absolute inset-0 w-full h-full opacity-0 cursor-text"
            aria-label="Monto"
          />
          <div className="pointer-events-none select-none flex items-baseline gap-1 w-full">
            <span className="text-sm text-muted-foreground font-medium">$</span>
            <span className={cn('text-sm font-semibold tabular-nums', isZero && 'text-muted-foreground/40')}>
              {display}
            </span>
          </div>
        </div>
        {maxReached && (
          <p className="text-xs text-amber-600">Máximo $15.000.000</p>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div
        className="relative flex items-center justify-center cursor-text w-full py-6"
        onClick={() => inputRef.current?.focus()}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="absolute inset-0 w-full h-full opacity-0 cursor-text"
          aria-label="Monto"
        />

        <div className="pointer-events-none select-none flex items-end gap-1.5 pb-1">
          <span className="text-2xl font-semibold text-muted-foreground mb-0.5">
            $
          </span>
          <span
            className={cn(
              'font-bold tabular-nums',
              isLong ? 'text-4xl' : 'text-5xl',
              isZero ? 'text-muted-foreground/40' : 'text-foreground'
            )}
          >
            {display}
          </span>
        </div>
      </div>

      {maxReached && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5 text-center">
          El monto máximo que podés ingresar es{' '}
          <span className="font-semibold">$15.000.000</span>
        </p>
      )}
    </div>
  )
}
