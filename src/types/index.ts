export type Category = 'verduleria' | 'polleria'
export type PaymentMethod = 'efectivo' | 'mercadopago'

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
