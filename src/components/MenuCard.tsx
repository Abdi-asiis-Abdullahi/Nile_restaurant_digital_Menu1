import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { useCart } from "@/lib/cart";
import { getMenuImage } from "@/lib/menu-images";
import { toast } from "sonner";

export type MenuItemT = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  header?: string | null;
};

export function MenuCard({ item }: { item: MenuItemT }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const img = getMenuImage(item.name, item.image_url);

  const order = () => {
    add({ id: item.id, name: item.name, price: Number(item.price), image_url: img }, qty);
    toast.success(`${item.name} added to cart`);
    setQty(1);
  };

  return (
    <div className="group hover-lift glass rounded-2xl overflow-hidden">
      <div className="aspect-[4/3] overflow-hidden bg-muted/40">
        <img src={img} alt={item.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
      </div>
      <div className="p-4 space-y-3">
        {item.header && <div className="text-[10px] uppercase tracking-widest text-primary/80">{item.header}</div>}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg leading-tight">{item.name}</h3>
          <div className="text-base font-semibold gold-text whitespace-nowrap">${Number(item.price).toFixed(2)}</div>
        </div>
        {item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
        <div className="flex items-center gap-2 pt-2">
          <div className="flex items-center rounded-full border border-white/10">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setQty(q => Math.max(1, q - 1))}><Minus className="h-3 w-3" /></Button>
            <span className="text-sm w-6 text-center">{qty}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setQty(q => q + 1)}><Plus className="h-3 w-3" /></Button>
          </div>
          <Button onClick={order} className="flex-1 bg-primary text-primary-foreground hover:opacity-90 rounded-full">Order</Button>
        </div>
      </div>
    </div>
  );
}
