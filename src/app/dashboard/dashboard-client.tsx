"use client"

import { useState } from "react"
import React from "react"
import Image from "next/image"
import logo from "../../../public/punto-fresco-logo.jpg"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Sale, Category, PaymentMethod } from "@/types"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { MoneyInput } from "@/components/money-input"
import { CategoryPicker } from "@/components/category-picker"
import { PaymentPicker } from "@/components/payment-picker"
import { Plus, LogOut, TrendingUp, ShoppingCart, Trash2, Banknote } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const CATEGORY_COLORS: Record<Category, string> = {
  verduleria: "bg-green-100 text-green-700",
  polleria: "bg-yellow-100 text-yellow-700",
}

const PAYMENT_ICONS: Record<PaymentMethod, React.ReactNode> = {
  efectivo: <Banknote className="h-3.5 w-3.5 inline" />,
  mercadopago: <img src="/mercado-pago-logo.svg" alt="MP" className="h-3.5 w-3.5 inline" />,
}

interface Props {
  initialSales: Sale[]
}

export default function DashboardClient({ initialSales }: Props) {
  const [sales, setSales] = useState<Sale[]>(initialSales)
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState<Category | "">("")
  const [payment, setPayment] = useState<PaymentMethod | "">("")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("todas")

  const router = useRouter()
  const supabase = createClient()

  const totalDay = sales.reduce((sum, s) => sum + s.total, 0)
  const totalEfectivo = sales.filter((s) => s.payment_method === "efectivo").reduce((sum, s) => sum + s.total, 0)
  const totalMP = sales.filter((s) => s.payment_method === "mercadopago").reduce((sum, s) => sum + s.total, 0)

  const filteredSales =
    activeTab === "todas"
      ? sales
      : sales.filter((s) => s.category === activeTab)

  function handleOpen() {
    setAmount("")
    setCategory("")
    setPayment("")
    setNote("")
    setOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const total = parseFloat(amount || "0")
    if (!total) return
    setSaving(true)

    const { data, error } = await supabase
      .from("sales")
      .insert({
        product_id: null,
        product_name: note.trim() || "Venta",
        category: category as Category,
        quantity: 1,
        unit_price: total,
        total,
        payment_method: payment as PaymentMethod,
      })
      .select()
      .single()

    if (!error && data) {
      setSales([data, ...sales])
      setOpen(false)
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    await supabase.from("sales").delete().eq("id", id)
    setSales(sales.filter((s) => s.id !== id))
    setDeletingId(null)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="max-w-lg mx-auto p-4 pb-36">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Image src={logo} alt="Punto Fresco" width={36} height={36} className="rounded-lg object-cover" />
          <h1 className="text-xl font-bold">Punto Fresco</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mb-4 capitalize">
        {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
      </p>

      {/* Resumen */}
      <div className="grid grid-cols-6 gap-3 mb-6">
        <Card className="col-span-4">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-green-600" />
              Total del día
            </CardTitle>
          </CardHeader>
          <CardContent className="py-1 flex justify-center">
            <p className="text-2xl font-bold text-green-700">
              ${totalDay.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
            </p>
          </CardContent>
          <CardFooter className="flex flex-row justify-center gap-4">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Banknote className="h-4 w-4" />
              ${totalEfectivo.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
            </span>
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <img src="/mercado-pago-logo.svg" alt="MP" className="h-4 w-4" />
              ${totalMP.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
            </span>
          </CardFooter>
        </Card>
        <Card className="col-span-2">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <ShoppingCart className="h-3.5 w-3.5 text-blue-600" />
              Ventas
            </CardTitle>
          </CardHeader>
          <CardContent className="py-1 flex justify-center">
            <p className="text-2xl font-bold text-blue-700">{sales.length}</p>
          </CardContent>
          <CardFooter className="flex flex-row justify-center gap-4">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Banknote className="h-4 w-4" />
              {sales.filter(s => s.payment_method === "efectivo").length}
            </span>
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <img src="/mercado-pago-logo.svg" alt="MP" className="h-4 w-4" />
              {sales.filter(s => s.payment_method === "mercadopago").length}
            </span>
          </CardFooter>
        </Card>
      </div>

      {/* Lista de ventas con tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-3">
          <TabsTrigger value="todas" className="flex-1">Todas</TabsTrigger>
          <TabsTrigger value="verduleria" className="flex-1">Verdulería</TabsTrigger>
          <TabsTrigger value="polleria" className="flex-1">Pollería</TabsTrigger>
        </TabsList>

        {["todas", "verduleria", "polleria"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <div className="space-y-3">
              {filteredSales.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground text-sm">
                    {tab === "todas" ? "Aún no hay ventas hoy." : "Sin ventas en esta categoría."}
                  </CardContent>
                </Card>
              ) : (
                filteredSales.map((sale) => (
                  <Card key={sale.id} className="overflow-hidden">
                    <CardHeader className="pb-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          {PAYMENT_ICONS[sale.payment_method]}
                          {sale.payment_method === "efectivo" ? "Efectivo" : "Mercado Pago"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(sale.created_at), "HH:mm")}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="py-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-lg font-bold text-green-700">
                          ${sale.total.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                          {sale.product_name && sale.product_name !== "Venta" && (
                            <span className="ml-1.5 font-normal text-sm text-muted-foreground">
                              ({sale.product_name})
                            </span>
                          )}
                        </p>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-red-500 shrink-0"
                          onClick={() => handleDelete(sale.id)}
                          disabled={deletingId === sale.id}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                    <CardFooter className="py-2">
                      <Badge variant="secondary" className={`text-xs ${CATEGORY_COLORS[sale.category]}`}>
                        {sale.category === "verduleria" ? "Verdulería" : "Pollería"}
                      </Badge>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* FAB */}
      <div className="fixed bottom-20 right-4 left-4 max-w-lg mx-auto">
        <Button className="w-full h-14 text-base shadow-lg bg-green-600 hover:bg-green-700" onClick={handleOpen}>
          <Plus className="h-5 w-5 mr-2" />
          Registrar venta
        </Button>
      </div>

      {/* Drawer */}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Nueva venta</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8">
            <form onSubmit={handleSave} className="space-y-4">
              <MoneyInput value={amount} onChange={setAmount} autoFocus className="py-6" />

              <div className="space-y-3">
                <Label>Categoría</Label>
                <CategoryPicker value={category} onChange={setCategory} />
              </div>

              <div className="space-y-3">
                <Label>Forma de pago</Label>
                <PaymentPicker value={payment} onChange={setPayment} />
              </div>

              <div className="space-y-3">
                <Label>Nota <span className="text-muted-foreground font-normal text-xs">(opcional)</span></Label>
                <Input
                  type="text" value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ej: Venta mostrador" maxLength={60}
                />
              </div>

              <Button
                type="submit" className="w-full h-14 text-base bg-green-600 hover:bg-green-700"
                disabled={saving || !amount || parseFloat(amount) === 0 || !category || !payment}
              >
                {saving ? "Guardando..." : "Guardar venta"}
              </Button>
            </form>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
