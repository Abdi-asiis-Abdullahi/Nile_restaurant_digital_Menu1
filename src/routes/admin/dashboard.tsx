import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Bell, LogOut, Trash2, Plus, Pencil, RotateCcw, Printer, X, Check, ChefHat, Utensils,
  ShoppingBag, DollarSign, Image as ImageIcon, Upload, BadgeCheck,
  Layers, MessageSquare, BarChart3, Trophy,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getMenuImage } from "@/lib/menu-images";

export const Route = createFileRoute("/admin/dashboard")({ component: Dashboard });

const STATUS_FLOW: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  accepted: { label: "Accepted", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  preparing: { label: "Preparing", color: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  served: { label: "Served", color: "bg-primary/15 text-primary border-primary/30" },
  canceled: { label: "Canceled", color: "bg-red-500/15 text-red-300 border-red-500/30" },
  trashed: { label: "Trashed", color: "bg-muted text-muted-foreground border-white/10" },
};

const PAY_STATUS: Record<string, { label: string; color: string }> = {
  unpaid: { label: "Unpaid", color: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  paid: { label: "Paid", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  rejected: { label: "Rejected", color: "bg-red-500/15 text-red-300 border-red-500/30" },
};

function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { navigate({ to: "/admin/login" }); return; }
      setAuthed(true);
    });
  }, [navigate]);

  useEffect(() => {
    const ch = supabase.channel("admin-notifs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, () => {
        setNotifCount(n => n + 1);
        try { new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=").play().catch(()=>{}); } catch {}
        qc.invalidateQueries({ queryKey: ["orders"] });
        qc.invalidateQueries({ queryKey: ["stats"] });
        toast("🔔 New order received");
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "complaints" }, () => {
        setNotifCount(n => n + 1);
        qc.invalidateQueries({ queryKey: ["complaints"] });
        toast("💬 New complaint received");
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, () => {
        qc.invalidateQueries({ queryKey: ["orders"] });
        qc.invalidateQueries({ queryKey: ["stats"] });
      })
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [qc]);

  const logout = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };

  if (!authed) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 glass border-b border-white/5">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="font-display text-xl gold-text tracking-tight">Nile · Admin</Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative h-9 w-9" onClick={() => setNotifCount(0)}>
              <Bell className="h-4 w-4" />
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center animate-scale-in">
                  {notifCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="gap-2 hover:text-primary"><LogOut className="h-4 w-4"/>Sign out</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <StatsRow />
        <Tabs defaultValue="orders" className="mt-8">
          <TabsList className="bg-card/60 backdrop-blur border border-white/5 h-11 p-1 flex-wrap">
            <TabsTrigger value="orders" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5"><ShoppingBag className="h-3.5 w-3.5"/>Orders</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5"><BarChart3 className="h-3.5 w-3.5"/>Analytics</TabsTrigger>
            <TabsTrigger value="menu" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5"><Utensils className="h-3.5 w-3.5"/>Menu</TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5"><Layers className="h-3.5 w-3.5"/>Categories</TabsTrigger>
            <TabsTrigger value="complaints" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5"><MessageSquare className="h-3.5 w-3.5"/>Complaints</TabsTrigger>
            <TabsTrigger value="trash" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5"><Trash2 className="h-3.5 w-3.5"/>Trash</TabsTrigger>
          </TabsList>
          <TabsContent value="orders" className="mt-6 animate-fade-up"><OrdersTab /></TabsContent>
          <TabsContent value="analytics" className="mt-6 animate-fade-up"><AnalyticsTab /></TabsContent>
          <TabsContent value="menu" className="mt-6 animate-fade-up"><MenuTab /></TabsContent>
          <TabsContent value="categories" className="mt-6 animate-fade-up"><CategoriesTab /></TabsContent>
          <TabsContent value="complaints" className="mt-6 animate-fade-up"><ComplaintsTab /></TabsContent>
          <TabsContent value="trash" className="mt-6 animate-fade-up"><TrashTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/* ---------- Shared analytics query (single source of truth) ---------- */
function localDayBounds(dateISO: string) {
  const start = new Date(dateISO + "T00:00:00");
  const end = new Date(start); end.setDate(end.getDate() + 1);
  return { start, end };
}
function todayLocalISO() {
  const d = new Date();
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function useServedDay(dateISO: string) {
  return useQuery({
    queryKey: ["served-day", dateISO],
    queryFn: async () => {
      const { start, end } = localDayBounds(dateISO);
      const { data, error } = await supabase
        .from("orders")
        .select("id, total, served_at, customer_name, table_number, order_items(name, quantity, price, image_url)")
        .eq("status", "served")
        .gte("served_at", start.toISOString())
        .lt("served_at", end.toISOString())
        .order("served_at", { ascending: false });
      if (error) throw error;
      const list = (data || []) as any[];
      const revenue = list.reduce((s, o) => s + Number(o.total || 0), 0);
      return { orders: list, revenue, count: list.length };
    },
    refetchInterval: 10000,
  });
}

/* ---------- Stats ---------- */
function StatsRow() {
  const { data } = useServedDay(todayLocalISO());
  const cards = [
    { label: "Today's Orders", value: data?.count ?? "—", icon: ShoppingBag, accent: "text-primary" },
    { label: "Today's Revenue", value: data ? `$${data.revenue.toFixed(2)}` : "—", icon: DollarSign, accent: "text-emerald-300" },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {cards.map(c => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="glass-card rounded-2xl p-4 sm:p-5 hover-lift">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">{c.label}</div>
                <div className={`mt-2 text-2xl sm:text-3xl font-display font-semibold ${c.accent}`}>{c.value}</div>
              </div>
              <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Icon className={`h-4 w-4 ${c.accent}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Orders ---------- */
function OrdersTab() {
  const qc = useQueryClient();
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .neq("status","trashed")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  // Only show active orders (hide served and trashed automatically)
  const filtered = useMemo(
    () => orders.filter(o => !["served", "trashed"].includes(o.status)),
    [orders]
  );

  const patchOrderCache = (id: string, patch: Record<string, any>) => {
    qc.setQueryData<any[]>(["orders"], (current = []) => current.map(order => order.id === id ? { ...order, ...patch } : order));
  };

  const updateStatus = async (id: string, status: string, msg: string) => {
    const updated_at = new Date().toISOString();
    const currentOrder = qc.getQueryData<any[]>(["orders"])?.find(order => order.id === id);
    const served_at = status === "served" ? updated_at : currentOrder?.served_at ?? null;
    const patch = { status, updated_at, served_at };
    patchOrderCache(id, patch);
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    if (error) {
      toast.error(error.message);
      qc.invalidateQueries({ queryKey: ["orders"] });
      return;
    }
    toast.success(msg);
    qc.invalidateQueries({ queryKey: ["orders"] });
    qc.invalidateQueries({ queryKey: ["served-day"] });
    if (status === "trashed") qc.invalidateQueries({ queryKey: ["trash-orders"] });
  };

  const acceptPayment = async (id: string) => {
    patchOrderCache(id, { payment_status: "paid", payment_accepted_at: new Date().toISOString() });
    const { error } = await supabase.from("orders").update({ payment_status: "paid", payment_accepted_at: new Date().toISOString() }).eq("id", id);
    if (error) {
      toast.error(error.message);
      qc.invalidateQueries({ queryKey: ["orders"] });
    } else { toast.success("Payment accepted ✓"); qc.invalidateQueries({ queryKey: ["orders"] }); }
  };
  const rejectPayment = async (id: string) => {
    patchOrderCache(id, { payment_status: "rejected" });
    const { error } = await supabase.from("orders").update({ payment_status: "rejected" }).eq("id", id);
    if (error) {
      toast.error(error.message);
      qc.invalidateQueries({ queryKey: ["orders"] });
    } else { toast.success("Payment Rejected"); qc.invalidateQueries({ queryKey: ["orders"] }); }
  };

  const trash = async (id: string) => {
    await updateStatus(id, "trashed", "Order Moved to Trash");
  };


  const printReceipt = (o: any) => {
    const w = window.open("", "_blank", "width=400,height=600");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Receipt ${o.id.slice(0,8)}</title>
      <style>body{font-family:ui-sans-serif,system-ui;padding:20px;color:#111}h1{font-family:Georgia,serif;text-align:center;margin:0}small{color:#666}table{width:100%;border-collapse:collapse;margin-top:12px}td{padding:4px 0;font-size:13px}tfoot td{border-top:1px dashed #999;padding-top:8px;font-weight:600}</style>
      </head><body>
      <h1>Nile Restaurant</h1>
      <p style="text-align:center"><small>Zoobe, Opposite Safari Apartments<br/>+252 0771883469</small></p>
      <hr/>
      <p><small>Order #${o.id.slice(0,8).toUpperCase()}<br/>${new Date(o.created_at).toLocaleString()}<br/>Customer: ${o.customer_name} · Table ${o.table_number}<br/>Payment: ${o.payment_method || "-"} · ${o.payment_status}</small></p>
      <table>${o.order_items.map((i:any)=>`<tr><td>${i.quantity}× ${i.name}</td><td style="text-align:right">$${(i.price*i.quantity).toFixed(2)}</td></tr>`).join("")}
      <tfoot><tr><td>Total</td><td style="text-align:right">$${Number(o.total).toFixed(2)}</td></tr></tfoot></table>
      <p style="text-align:center;margin-top:24px"><small>Thank you for dining with us</small></p>
      <script>window.print();</script></body></html>`);
    w.document.close();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl gold-text">Active Orders</h2>
        <span className="text-xs text-muted-foreground">{filtered.length} order(s)</span>
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-muted-foreground py-16 glass-card rounded-2xl">
          <ShoppingBag className="h-10 w-10 mx-auto opacity-30 mb-3"/>
          No active orders right now.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(o => (
          <div key={o.id} className="glass-card rounded-2xl p-5 hover-lift animate-fade-up flex flex-col">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-white/5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/5 text-primary">#{o.id.slice(0,8).toUpperCase()}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border ${STATUS_FLOW[o.status]?.color}`}>{STATUS_FLOW[o.status]?.label || o.status}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border ${PAY_STATUS[o.payment_status]?.color || PAY_STATUS.unpaid.color}`}>
                    {PAY_STATUS[o.payment_status]?.label || "Unpaid"}
                  </span>
                </div>
                <div className="font-display text-lg mt-2 truncate">{o.customer_name}</div>
                <div className="text-xs text-muted-foreground truncate">Table <span className="text-foreground">{o.table_number}</span> · {new Date(o.created_at).toLocaleTimeString()} · {o.payment_method || "—"}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="font-display text-xl gold-text">${Number(o.total).toFixed(2)}</div>
              </div>
            </div>

            {/* Body */}
            <div className="mt-4 space-y-2 flex-1">
              {o.order_items?.map((i: any) => (
                <div key={i.id} className="flex items-center gap-3 text-sm rounded-lg bg-white/[0.02] border border-white/5 p-2">
                  <img src={getMenuImage(i.name, i.image_url)} className="h-10 w-10 rounded-md object-cover" alt="" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{i.name}</div>
                    <div className="text-xs text-muted-foreground">${Number(i.price).toFixed(2)} × {i.quantity}</div>
                  </div>
                  <div className="text-sm font-medium">${(i.price * i.quantity).toFixed(2)}</div>
                </div>
              ))}
              {o.payment_screenshot_url && (
                <button onClick={() => setReceiptUrl(o.payment_screenshot_url)} className="mt-2 text-xs text-primary hover:underline">
                  View payment receipt →
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-wrap items-center gap-2 pt-4 border-t border-white/5">
              {o.payment_screenshot_url && o.payment_status !== "paid" && (
                <>
                  <Button size="sm" onClick={() => acceptPayment(o.id)} className="gap-1 bg-emerald-600 hover:bg-emerald-500"><BadgeCheck className="h-3.5 w-3.5"/>Accept Payment</Button>
                  {o.payment_status === "unpaid" && <Button size="sm" variant="outline" onClick={() => rejectPayment(o.id)} className="gap-1 text-red-300 border-red-500/30 hover:bg-red-500/10"><X className="h-3.5 w-3.5"/>Reject</Button>}
                </>
              )}

              {o.status === "pending" && (
                <Button size="sm" onClick={() => updateStatus(o.id, "accepted", "Order Accepted")} className="gap-1 bg-emerald-600 hover:bg-emerald-500"><Check className="h-3.5 w-3.5"/>Accept</Button>
              )}
              {o.status === "accepted" && (
                <Button size="sm" variant="outline" onClick={() => updateStatus(o.id, "preparing", "Preparing Started")} className="gap-1"><ChefHat className="h-3.5 w-3.5"/>Preparing</Button>
              )}
              {(o.status === "accepted" || o.status === "preparing") && (
                <Button size="sm" variant="outline" onClick={() => updateStatus(o.id, "served", "Order Served Successfully")} className="gap-1"><Utensils className="h-3.5 w-3.5"/>Served</Button>
              )}
              <Button size="sm" variant="outline" onClick={() => updateStatus(o.id, "trashed", "Order Cancelled")} className="gap-1 text-red-300 border-red-500/30 hover:bg-red-500/10"><X className="h-3.5 w-3.5"/>Cancel</Button>

              <Button size="sm" variant="ghost" onClick={() => printReceipt(o)} className="gap-1 ml-auto"><Printer className="h-3.5 w-3.5"/></Button>
              <Button size="sm" variant="ghost" onClick={() => trash(o.id)} className="gap-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5"/></Button>
            </div>
          </div>
        ))}
      </div>


      {/* Inline receipt modal */}
      <Dialog open={!!receiptUrl} onOpenChange={(v) => !v && setReceiptUrl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Payment Receipt</DialogTitle></DialogHeader>
          {receiptUrl && <img src={receiptUrl} alt="Receipt" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- Menu items ---------- */
function MenuTab() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["admin-menu"],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_items").select("*, categories(name)").order("sort_order");
      if (error) throw error;
      return data as any[];
    },
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data as any[],
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const save = async (form: any) => {
    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      category_id: form.sub_category_id || form.main_category_id,
      image_url: form.image_url || null,
      header: form.header || null,
      available: true,
    };
    if (!payload.name) { toast.error("Name required"); return; }
    if (Number.isNaN(payload.price) || payload.price < 0) { toast.error("Invalid price"); return; }
    if (!payload.category_id) { toast.error("Pick a category"); return; }
    const res = editing?.id
      ? await supabase.from("menu_items").update(payload).eq("id", editing.id)
      : await supabase.from("menu_items").insert(payload);
    if (res.error) toast.error(res.error.message);
    else {
      toast.success(editing?.id ? "Item updated ✓" : "Item added live ✓");
      setOpen(false); setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-menu"] });
      qc.invalidateQueries({ queryKey: ["menu-items"] });
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-menu"] }); qc.invalidateQueries({ queryKey: ["menu-items"] }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-2xl">Menu Items <span className="text-muted-foreground text-base">({items.length})</span></h2>
        <Button onClick={() => { setEditing({ price: "" }); setOpen(true); }} className="gap-1 bg-primary text-primary-foreground gold-glow"><Plus className="h-4 w-4"/>Add Item</Button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(i => (
          <div key={i.id} className="glass-card rounded-2xl p-4 flex gap-3 hover-lift">
            <img src={getMenuImage(i.name, i.image_url)} alt="" className="h-20 w-20 object-cover rounded-xl" />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{i.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{i.categories?.name}</div>
              <div className="text-sm gold-text font-semibold mt-1">${Number(i.price).toFixed(2)}</div>
              <div className="mt-2 flex gap-1">
                <Button size="sm" variant="ghost" className="h-7 px-2 gap-1" onClick={() => { setEditing(i); setOpen(true); }}><Pencil className="h-3 w-3"/>Edit</Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-destructive hover:text-destructive" onClick={() => del(i.id)}><Trash2 className="h-3 w-3"/>Delete</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display text-xl">{editing?.id ? "Edit item" : "Add new item"}</DialogTitle></DialogHeader>
          <ItemForm initial={editing} categories={categories} onSave={save} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ItemForm({ initial, categories, onSave }: { initial: any; categories: any[]; onSave: (f: any) => void }) {
  const mains = useMemo(() => categories.filter(c => !c.parent_id), [categories]);
  const subs = useMemo(() => categories.filter(c => c.parent_id), [categories]);
  const initialCategory = categories.find(c => c.id === initial?.category_id);
  const initialMainId = initialCategory?.parent_id || initialCategory?.id || mains[0]?.id || "";
  const [form, setForm] = useState({
    name: initial?.name || "",
    description: initial?.description || "",
    price: initial?.price ?? "",
    main_category_id: initialMainId,
    sub_category_id: initialCategory?.parent_id ? initialCategory.id : "",
    image_url: initial?.image_url || "",
    header: initial?.header || "",
  });
  const [uploading, setUploading] = useState(false);
  const availableSubs = subs.filter(c => c.parent_id === form.main_category_id);

  const onPick = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
      const { error } = await supabase.storage.from("menu-images").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
      setForm(f => ({ ...f, image_url: data.publicUrl }));
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally { setUploading(false); }
  };

  return (
    <div className="space-y-4">
      <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1.5"/></div>
      <div><Label>Header (optional)</Label><Input value={form.header} onChange={e => setForm({...form, header: e.target.value})} placeholder="e.g. Chef's Special" className="mt-1.5"/></div>
      <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="mt-1.5"/></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Price ($)</Label><Input type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="mt-1.5"/></div>
        <div>
          <Label>Main Category</Label>
          <Select value={form.main_category_id} onValueChange={v => setForm({...form, main_category_id: v, sub_category_id: ""})}>
            <SelectTrigger className="mt-1.5"><SelectValue/></SelectTrigger>
            <SelectContent>{mains.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Sub Category</Label>
        <Select value={form.sub_category_id || "none"} onValueChange={v => setForm({...form, sub_category_id: v === "none" ? "" : v})}>
          <SelectTrigger className="mt-1.5"><SelectValue placeholder="Optional sub category"/></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No sub category</SelectItem>
            {availableSubs.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Image</Label>
        <div className="mt-1.5 flex items-center gap-3">
          {form.image_url ? (
            <img src={form.image_url} alt="" className="h-20 w-20 rounded-lg object-cover border border-white/10" />
          ) : (
            <div className="h-20 w-20 rounded-lg border border-dashed border-white/10 flex items-center justify-center text-muted-foreground">
              <ImageIcon className="h-5 w-5" />
            </div>
          )}
          <label className="flex-1 flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 p-4 cursor-pointer hover:border-primary/40 transition">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{uploading ? "Uploading…" : "Upload from device"}</span>
            <input type="file" accept="image/*" className="hidden" disabled={uploading}
              onChange={e => { const f = e.target.files?.[0]; if (f) onPick(f); }} />
          </label>
        </div>
      </div>
      <DialogFooter><Button onClick={() => onSave(form)} disabled={uploading} className="bg-primary text-primary-foreground gold-glow">Save</Button></DialogFooter>
    </div>
  );
}

/* ---------- Categories (Main + Sub) ---------- */
function CategoriesTab() {
  const qc = useQueryClient();
  const { data: cats = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data as any[],
  });
  const mains = cats.filter(c => !c.parent_id);
  const subs = cats.filter(c => c.parent_id);

  const [newMain, setNewMain] = useState("");
  const [newSub, setNewSub] = useState("");
  const [subParent, setSubParent] = useState<string>("");

  useEffect(() => { if (!subParent && mains[0]) setSubParent(mains[0].id); }, [mains, subParent]);

  const addCategory = async (name: string, parent_id: string | null) => {
    if (!name.trim()) return;
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    const { error } = await supabase.from("categories").insert({ name, slug, parent_id, sort_order: cats.length + 1 });
    if (error) toast.error(error.message);
    else { toast.success("Category added"); qc.invalidateQueries({ queryKey: ["admin-categories"] }); qc.invalidateQueries({ queryKey: ["categories"] }); }
  };
  const rename = async (id: string, name: string) => {
    const { error } = await supabase.from("categories").update({ name }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Renamed"); qc.invalidateQueries({ queryKey: ["admin-categories"] }); qc.invalidateQueries({ queryKey: ["categories"] }); }
  };
  const del = async (id: string) => {
    if (!confirm("Delete this category? Subcategories will also be removed.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-categories"] }); qc.invalidateQueries({ queryKey: ["categories"] }); }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      {/* Main */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl">Main Categories</h3>
          <span className="text-xs text-muted-foreground">{mains.length}</span>
        </div>
        <div className="flex gap-2 mb-4">
          <Input value={newMain} onChange={e => setNewMain(e.target.value)} placeholder="e.g. Foods, Drinks, Desserts" />
          <Button onClick={() => { addCategory(newMain, null); setNewMain(""); }} className="bg-primary text-primary-foreground gap-1"><Plus className="h-4 w-4"/>Add</Button>
        </div>
        <div className="space-y-2">
          {mains.map(c => (
            <div key={c.id} className="rounded-lg bg-white/[0.02] border border-white/5 p-2 flex items-center gap-2">
              <Input defaultValue={c.name} onBlur={e => e.target.value !== c.name && rename(c.id, e.target.value)} className="border-0 bg-transparent" />
              <Button size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => del(c.id)}><Trash2 className="h-4 w-4"/></Button>
            </div>
          ))}
          {mains.length === 0 && <div className="text-center text-muted-foreground py-6 text-sm">No main categories yet.</div>}
        </div>
      </div>

      {/* Sub */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl">Sub Categories</h3>
          <span className="text-xs text-muted-foreground">{subs.length}</span>
        </div>
        <div className="space-y-2 mb-4">
          <Select value={subParent} onValueChange={setSubParent}>
            <SelectTrigger><SelectValue placeholder="Parent category"/></SelectTrigger>
            <SelectContent>{mains.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input value={newSub} onChange={e => setNewSub(e.target.value)} placeholder="e.g. Pizza, Coffee, Cakes" />
            <Button onClick={() => { if (subParent) { addCategory(newSub, subParent); setNewSub(""); } else toast.error("Pick a parent first"); }} className="bg-primary text-primary-foreground gap-1"><Plus className="h-4 w-4"/>Add</Button>
          </div>
        </div>
        <div className="space-y-2">
          {subs.map(c => {
            const parent = mains.find(m => m.id === c.parent_id);
            return (
              <div key={c.id} className="rounded-lg bg-white/[0.02] border border-white/5 p-2 flex items-center gap-2">
                <div className="text-xs text-primary/70 pl-1">{parent?.name || "—"} ↳</div>
                <Input defaultValue={c.name} onBlur={e => e.target.value !== c.name && rename(c.id, e.target.value)} className="border-0 bg-transparent flex-1" />
                <Button size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => del(c.id)}><Trash2 className="h-4 w-4"/></Button>
              </div>
            );
          })}
          {subs.length === 0 && <div className="text-center text-muted-foreground py-6 text-sm">No sub categories yet.</div>}
        </div>
      </div>
    </div>
  );
}

/* ---------- Complaints ---------- */
function ComplaintsTab() {
  const qc = useQueryClient();
  const { data: complaints = [] } = useQuery({
    queryKey: ["complaints"],
    queryFn: async () => (await supabase.from("complaints").select("*").neq("status","trashed").order("created_at", { ascending: false })).data as any[],
  });
  const update = async (id: string, status: string) => {
    await supabase.from("complaints").update({ status }).eq("id", id);
    toast.success(status === "resolved" ? "Marked resolved" : "Updated");
    qc.invalidateQueries({ queryKey: ["complaints"] });
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl gold-text">Complaints</h2>
        <span className="text-xs text-muted-foreground">{complaints.length} item(s)</span>
      </div>
      {complaints.length === 0 && (
        <div className="text-center text-muted-foreground py-16 glass-card rounded-2xl">
          <MessageSquare className="h-10 w-10 mx-auto opacity-30 mb-3"/>
          No complaints.
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
        {complaints.map(c => (
          <div key={c.id} className="glass-card rounded-xl p-3 hover-lift min-w-0">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <div className="font-display text-sm truncate">{c.customer_name}</div>
                <div className="text-[11px] text-muted-foreground truncate">Table {c.table_number || "-"} · {c.type}</div>
                <div className="text-[10px] text-muted-foreground/80 truncate">{new Date(c.created_at).toLocaleString()}</div>
              </div>
              <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border ${c.type === "quick" ? "border-amber-500/30 text-amber-300 bg-amber-500/10" : "border-white/10"}`}>{c.status}</span>
            </div>
            {c.ordered_item && <div className="text-[11px] mt-2 text-muted-foreground truncate">Item: <span className="text-foreground">{c.ordered_item}</span></div>}
            <p className="mt-2 text-xs leading-relaxed line-clamp-3">{c.message}</p>
            {c.payment_screenshot_url && <a href={c.payment_screenshot_url} target="_blank" rel="noreferrer" className="text-[11px] text-primary mt-2 inline-block">View attachment →</a>}
            <div className="mt-3 flex gap-1.5">
              <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={() => update(c.id, "resolved")}>Resolve</Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive ml-auto" onClick={() => update(c.id, "trashed")}><Trash2 className="h-3.5 w-3.5"/></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Trash ---------- */
function TrashTab() {
  const qc = useQueryClient();
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const { data: orders = [] } = useQuery({
    queryKey: ["trash-orders"],
    queryFn: async () => (await supabase.from("orders").select("*").eq("status","trashed").order("updated_at", { ascending: false })).data as any[],
  });
  const restore = async (id: string) => {
    const { error } = await supabase.from("orders").update({ status: "pending" }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Order restored ✓"); qc.invalidateQueries({ queryKey: ["trash-orders"] }); qc.invalidateQueries({ queryKey: ["orders"] }); }
  };
  const del = async (id: string) => {
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted permanently"); qc.invalidateQueries({ queryKey: ["trash-orders"] }); }
    setConfirmDel(null);
  };
  const clearAll = async () => {
    const { error } = await supabase.from("orders").delete().eq("status", "trashed");
    if (error) toast.error(error.message);
    else { toast.success("Trash cleared"); qc.invalidateQueries({ queryKey: ["trash-orders"] }); }
    setConfirmClear(false);
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-2xl">Trash <span className="text-muted-foreground text-base">({orders.length})</span></h2>
        <Button variant="outline" disabled={!orders.length} onClick={() => setConfirmClear(true)} className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1"><Trash2 className="h-4 w-4"/>Delete All Trash</Button>
      </div>
      {orders.length === 0 && (
        <div className="text-center text-muted-foreground py-16 glass-card rounded-2xl">
          <Trash2 className="h-10 w-10 mx-auto opacity-30 mb-3"/>
          Trash is empty.
        </div>
      )}
      {orders.map(o => (
        <div key={o.id} className="glass-card rounded-2xl p-4 flex items-center justify-between hover-lift animate-fade-up">
          <div>
            <div className="font-medium">#{o.id.slice(0,8).toUpperCase()} · {o.customer_name}</div>
            <div className="text-xs text-muted-foreground">Table {o.table_number} · ${Number(o.total).toFixed(2)}</div>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => restore(o.id)} className="gap-1"><RotateCcw className="h-3.5 w-3.5"/>Restore</Button>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDel(o.id)}><Trash2 className="h-4 w-4"/></Button>
          </div>
        </div>
      ))}

      <AlertDialog open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this order permanently?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDel && del(confirmDel)} className="bg-destructive">Delete forever</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all trashed orders?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete all {orders.length} trashed orders. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={clearAll} className="bg-destructive">Delete forever</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ---------- Analytics ---------- */
function AnalyticsTab() {
  const [date, setDate] = useState<string>(todayLocalISO());
  const { data: served, isLoading } = useServedDay(date);

  const top = useMemo(() => {
    const map = new Map<string, { name: string; image_url: string | null; qty: number; revenue: number }>();
    for (const o of (served?.orders || [])) {
      for (const it of (o.order_items || [])) {
        const key = it.name as string;
        const prev = map.get(key) || { name: it.name, image_url: it.image_url, qty: 0, revenue: 0 };
        prev.qty += Number(it.quantity || 0);
        prev.revenue += Number(it.price || 0) * Number(it.quantity || 0);
        map.set(key, prev);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty);
  }, [served]);

  const isToday = date === todayLocalISO();

  return (
    <div className="space-y-6">
      {/* Date search */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Select date</Label>
          <Input type="date" value={date} max={todayLocalISO()} onChange={(e) => setDate(e.target.value)} className="mt-1.5 h-11" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDate(todayLocalISO())} className="h-11">Today</Button>
          <Button
            variant="outline"
            onClick={() => {
              const d = new Date(date + "T00:00:00"); d.setDate(d.getDate() - 1);
              setDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);
            }}
            className="h-11"
          >← Prev</Button>
          <Button
            variant="outline"
            disabled={isToday}
            onClick={() => {
              const d = new Date(date + "T00:00:00"); d.setDate(d.getDate() + 1);
              const next = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
              if (next <= todayLocalISO()) setDate(next);
            }}
            className="h-11"
          >Next →</Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="glass-card rounded-2xl p-5 hover-lift">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">{isToday ? "Today's" : ""} Served Orders</div>
          <div className="mt-2 text-3xl font-display font-semibold text-primary">{isLoading ? "—" : served?.count ?? 0}</div>
        </div>
        <div className="glass-card rounded-2xl p-5 hover-lift">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">{isToday ? "Today's" : ""} Revenue</div>
          <div className="mt-2 text-3xl font-display font-semibold text-emerald-300">{isLoading ? "—" : `$${(served?.revenue ?? 0).toFixed(2)}`}</div>
        </div>
        <div className="glass-card rounded-2xl p-5 hover-lift">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Unique Dishes Sold</div>
          <div className="mt-2 text-3xl font-display font-semibold">{isLoading ? "—" : top.length}</div>
        </div>
      </div>

      {/* Top sellers */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-4 w-4 text-primary" />
          <h3 className="font-display text-lg gold-text">Top Selling Items</h3>
          <span className="ml-auto text-xs text-muted-foreground">Ranked by quantity sold</span>
        </div>
        {isLoading ? (
          <div className="text-center text-muted-foreground py-10">Loading…</div>
        ) : top.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">No served orders for this date.</div>
        ) : (
          <div className="space-y-2">
            {top.map((it, idx) => {
              const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
              const max = top[0].qty || 1;
              const pct = Math.max(4, (it.qty / max) * 100);
              return (
                <div key={it.name} className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/5 p-3 hover-lift">
                  <div className="w-9 text-center font-display text-sm">{medal}</div>
                  <img src={getMenuImage(it.name, it.image_url || "")} alt={it.name} className="h-12 w-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium">{it.name}</div>
                    <div className="mt-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary/60 to-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{it.qty} sold</div>
                    <div className="text-xs gold-text">${it.revenue.toFixed(2)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
