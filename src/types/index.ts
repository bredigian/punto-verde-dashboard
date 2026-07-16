export type Category = 'verduleria' | 'polleria'
export type PaymentMethod = 'efectivo' | 'mercadopago'

export interface Expense {
  id: string
  description: string
  amount: number
  created_at: string
}

export interface CashClosing {
  id: string
  date: string
  total_sales: number
  total_efectivo: number | null
  total_mercadopago: number | null
  total_expenses: number
  result: number
  closed_at: string
}

export interface Sale {
  id: string
  product_id: string | null
  product_name: string
  category: Category
  quantity: number
  unit_price: number
  total: number
  payment_method: PaymentMethod
  created_at: string
}
