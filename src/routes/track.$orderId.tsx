import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Clock, XCircle, ChefHat, Utensils } from "lucide-react";

export const Route = createFileRoute("/track/$orderId")({
  component: Track,
});

const statusMap: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: "Awaiting confirmation", icon: Clock, color: "text-amber-300" },
  accepted: { label: "Your order has been accepted", icon: CheckCircle2, color: "text-emerald-400" },
  preparing: { label: "Your food is being prepared", icon: ChefHat, color: "text-amber-300" },
  served: { label: "Your order has been served", icon: Utensils, color: "text-emerald-400" },
  canceled: { label: "Your order has been canceled", icon: XCircle, color: "text-red-400" },
  payment_failed: { label: "Payment verification failed", icon: XCircle, color: "text-red-400" },
};

function Track() {
  const { orderId } = Route.useParams();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("orders").select("*, order_items(*)").eq("id", orderId).single();
      setOrder(data);
    };
    load();
    const ch = supabase.channel("order-" + orderId)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` }, () => load())
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [orderId]);

  if (!order) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  const s = statusMap[order.status] || statusMap.pending;
  const Icon = s.icon;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass rounded-3xl p-8 max-w-md w-full text-center elegant-shadow">
        <a href="/" className="text-xs uppercase tracking-widest text-primary/80">← Nile Restaurant</a>
        <Icon className={`h-14 w-14 mx-auto mt-6 ${s.color}`} />
        <h1 className="font-display text-2xl mt-4">{s.label}</h1>
        <div className="mt-6 text-xs text-muted-foreground">Order #{order.id.slice(0,8).toUpperCase()}</div>
        <div className="mt-1 text-sm">Table {order.table_number} · {order.customer_name}</div>
        <div className="mt-4 text-lg font-semibold gold-text">${Number(order.total).toFixed(2)}</div>
        <div className="mt-6 space-y-1 text-sm text-left">
          {order.order_items?.map((i: any) => (
            <div key={i.id} className="flex justify-between text-muted-foreground">
              <span>{i.quantity}× {i.name}</span>
              <span>${(Number(i.price) * i.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
