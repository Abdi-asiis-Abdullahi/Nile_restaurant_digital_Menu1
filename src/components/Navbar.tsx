import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShoppingBag, HelpCircle, UtensilsCrossed } from "lucide-react";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";

export function Navbar({ onOpenCart }: { onOpenCart: () => void }) {
  const { count } = useCart();
  const [hoverAdmin, setHoverAdmin] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="sticky top-0 z-40 glass border-b border-white/5">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <UtensilsCrossed className="h-5 w-5 text-primary transition-transform group-hover:rotate-12" />
          <div className="leading-tight">
            <div className="font-display text-lg font-semibold tracking-tight gold-text">Nile</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground -mt-0.5">Restaurant</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <button onClick={() => scrollTo("menu")} className="px-4 py-2 text-sm text-foreground/80 hover:text-primary transition-colors">Menu</button>
          <button onClick={() => scrollTo("help")} className="px-4 py-2 text-sm text-foreground/80 hover:text-primary transition-colors flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5" /> Need Help
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <Button onClick={onOpenCart} variant="ghost" size="sm" className="relative gap-2 hover:bg-primary/10 hover:text-primary">
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{count}</span>
            )}
          </Button>
          {/* Hidden admin entry */}
          <div
            onMouseEnter={() => setHoverAdmin(true)}
            onMouseLeave={() => setHoverAdmin(false)}
            className="relative h-9 w-9 flex items-center justify-center"
          >
            <Link
              to="/admin/login"
              className={`absolute inset-0 rounded-full flex items-center justify-center text-[10px] uppercase tracking-widest transition-all duration-300 ${hoverAdmin ? "opacity-100 bg-primary/15 text-primary scale-100" : "opacity-0 scale-90"}`}
              aria-label="Admin"
              title="Admin"
            >
              Admin
            </Link>
            <span className={`h-1.5 w-1.5 rounded-full bg-primary/40 transition-opacity ${hoverAdmin ? "opacity-0" : "opacity-100"}`} />
          </div>
        </div>
      </div>
      {/* Mobile nav */}
      <div className="md:hidden flex items-center justify-center gap-6 pb-2 -mt-1">
        <button onClick={() => scrollTo("menu")} className="text-xs uppercase tracking-widest text-foreground/70 hover:text-primary">Menu</button>
        <button onClick={() => scrollTo("help")} className="text-xs uppercase tracking-widest text-foreground/70 hover:text-primary flex items-center gap-1"><HelpCircle className="h-3 w-3" /> Need Help</button>
      </div>
    </header>
  );
}
