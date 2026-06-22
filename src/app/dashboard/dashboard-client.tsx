"use client"

import { useState, useEffect } from "react"
import React from "react"
import Image from "next/image"
import logo from "../../../public/punto-fresco-logo.jpg"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Sale, Category, PaymentMethod, Expense, CashClosing } from "@/types"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { MoneyInput } from "@/components/money-input"
import { CategoryPicker } from "@/components/category-picker"
import { PaymentPicker } from "@/components/payment-picker"
import { Plus, LogOut, TrendingUp, ShoppingCart, Trash2, Banknote, Calculator } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { CierreCajaDrawer } from "@/components/cierre-caja-drawer"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { todayAR, formatInAR, nowInAR } from "@/lib/date"

const CATEGORY_COLORS: Record<Category, string> = {
  verduleria: "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100",
  polleria: "bg-yellow-100 text-yellow-700 dark:bg-yellow-600 dark:text-yellow-50",
}

const PAYMENT_ICONS: Record<PaymentMethod, React.ReactNode> = {
  efectivo: <Banknote className="h-3.5 w-3.5 inline" />,
  mercadopago: <img src="/mercado-pago-logo.svg" alt="MP" className="h-3.5 w-3.5 inline" />,
}

interface Props {
  initialSales: Sale[]
  initialExpenses: Expense[]
  initialClosing: CashClosing | null
}

export default function DashboardClient({ initialSales, initialExpenses, initialClosing }: Props) {
  const [sales, setSales] = useState<Sale[]>(initialSales)
  const [closing, setClosing] = useState<CashClosing | null>(initialClosing)
  const [open, setOpen] = useState(false)
  const [cierreOpen, setCierreOpen] = useState(false)
  const today = todayAR()
  const isClosed = closing !== null
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState<Category | "">("")
  const [payment, setPayment] = useState<PaymentMethod | "">("")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [logoutConfirm, setLogoutConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState("todas")

  const [scrolled, setScrolled] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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

    const nextDay = nowInAR()
    nextDay.setDate(nextDay.getDate() + 1)
    nextDay.setHours(3, 0, 1, 0)

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
        ...(isClosed && { created_at: nextDay.toISOString() }),
      })
      .select()
      .single()

    if (!error && data) {
      if (!isClosed) setSales([data, ...sales])
      setOpen(false)
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (isClosed) return
    setDeletingId(id)
    await supabase.from("sales").delete().eq("id", id)
    setSales(sales.filter((s) => s.id !== id))
    setDeletingId(null)
    setDeleteTarget(null)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="max-w-lg mx-auto pb-36">
      {/* Header */}
      <div className={`sticky top-0 z-30 bg-background/80 backdrop-blur-md px-4 py-3 transition-shadow ${scrolled ? 'border-b' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src={logo} alt="Punto Fresco" width={36} height={36} className="rounded-lg object-cover" />
            <h1 className="text-xl font-bold">Punto Fresco</h1>
          </div>
          <div className="flex items-center">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => setLogoutConfirm(true)}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
      <p className="text-sm text-muted-foreground capitalize mt-2">
        {format(nowInAR(), "EEEE d 'de' MMMM", { locale: es })}
      </p>
      <p className="text-sm text-muted-foreground/70 mb-4">Registrá ventas y controlá el movimiento del día.</p>

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
              <ShoppingCart className="h-3.5 w-3.5 text-blue-600 dark:text-indigo-400" />
              Ventas
            </CardTitle>
          </CardHeader>
          <CardContent className="py-1 flex justify-center">
            <p className="text-2xl font-bold text-blue-700 dark:text-indigo-400">{sales.length}</p>
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
                          {formatInAR(sale.created_at, "HH:mm")}
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
                        {!isClosed && (
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-red-500 shrink-0"
                            onClick={() => setDeleteTarget(sale.id)}
                            disabled={deletingId === sale.id}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
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
      <div className="fixed bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
      <div className="fixed bottom-20 right-4 left-4 max-w-lg mx-auto flex gap-3">
        <Button className="flex-1 h-14 text-base shadow-lg bg-green-600 hover:bg-green-700" onClick={handleOpen}>
          Registrar venta
        </Button>
        <Button className="h-14 px-4 shadow-lg bg-amber-500 hover:bg-amber-600 text-white dark:text-black text-sm font-medium" onClick={() => setCierreOpen(true)}>
          Cerrar caja
        </Button>
      </div>

      {/* Drawer */}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Nueva venta</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8">
            {isClosed && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300 rounded-lg px-3 py-2 text-sm mb-4">
                <span className="mt-0.5">⚠️</span>
                <span>La caja de hoy está cerrada. Esta venta se registrará como del día siguiente.</span>
              </div>
            )}
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

      <CierreCajaDrawer
        open={cierreOpen}
        onClose={() => setCierreOpen(false)}
        sales={sales}
        initialExpenses={initialExpenses}
        initialClosing={initialClosing}
        today={today}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar venta?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              disabled={!!deletingId}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={logoutConfirm} onOpenChange={setLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
            <AlertDialogDescription>Vas a salir de la cuenta.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Salir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
