import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { CartDrawer } from "@/components/CartDrawer";
import { MenuCard, type MenuItemT } from "@/components/MenuCard";
import { HelpSection } from "@/components/HelpSection";
import { MapPin, Phone, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Nile Restaurant — Order Premium Foods, Drinks & Desserts" },
      { name: "description", content: "Order luxury dining online from Nile Restaurant. Located in Zoobe, opposite Safari Apartments. Call +252 0771883469." },
    ],
  }),
});

type Category = { id: string; name: string; slug: string; sort_order: number; active: boolean };

function Index() {
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCat, setActiveCat] = useState<string>("all");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("active", true)
        .is("parent_id", null)
        .order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
  });

  const { data: items = [] } = useQuery({
    queryKey: ["menu-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*, categories(parent_id)")
        .eq("available", true)
        .order("sort_order");
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = useMemo(() => {
    if (activeCat === "all") return items;
    return items.filter(i => i.category_id === activeCat || i.categories?.parent_id === activeCat);
  }, [items, activeCat]);

  return (
    <div className="min-h-screen">
      <Navbar onOpenCart={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2000&q=80" alt="" className="h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-24 sm:py-36 text-center">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-primary/90 animate-fade-up">
            <Sparkles className="h-3.5 w-3.5" /> Fine Dining · Est. Zoobe
          </div>
          <h1 className="font-display text-5xl sm:text-7xl md:text-8xl mt-6 leading-[0.95] animate-fade-up">
            <span className="block">Nile</span>
            <span className="block gold-text">Restaurant</span>
          </h1>
          <p className="mt-6 max-w-xl mx-auto text-base sm:text-lg text-muted-foreground animate-fade-up">
            A premium ordering experience. Curated dishes, signature drinks, and world-class desserts — delivered to your table.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-muted-foreground animate-fade-up">
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary"/> Zoobe, Opposite Safari Apartments</span>
            <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-primary"/> +252 0771883469</span>
          </div>
        </div>
      </section>

      {/* MENU */}
      <section id="menu" className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="text-xs uppercase tracking-[0.3em] text-primary/80">Our Menu</div>
            <h2 className="font-display text-4xl sm:text-5xl mt-2">A Taste of <span className="gold-text">Luxury</span></h2>
          </div>

          {/* Category tabs */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
            <button
              onClick={() => setActiveCat("all")}
              className={`px-5 py-2 rounded-full text-sm transition-all border ${activeCat === "all" ? "bg-primary text-primary-foreground border-primary gold-glow" : "border-white/10 text-foreground/70 hover:border-primary/40 hover:text-primary"}`}
            >
              All
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`px-5 py-2 rounded-full text-sm transition-all border ${activeCat === c.id ? "bg-primary text-primary-foreground border-primary gold-glow" : "border-white/10 text-foreground/70 hover:border-primary/40 hover:text-primary"}`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {filtered.map(it => (
              <MenuCard key={it.id} item={it} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center text-muted-foreground py-20">No items in this category yet.</div>
          )}
        </div>
      </section>

      <HelpSection />

      <footer className="border-t border-white/5 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Nile Restaurant · Zoobe, Opposite Safari Apartments · +252 0771883469
      </footer>
    </div>
  );
}
