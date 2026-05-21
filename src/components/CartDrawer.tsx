import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/lib/cart";
import { Minus, Plus, Trash2, ShoppingBag, Upload, CheckCircle2, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

type Step = "cart" | "details" | "payment" | "success";

const PAYMENT_NUMBER = "619688385";

const PAYMENT_SHORTCODES: Record<string, string> = {
  "EVC Plus": "712619688385",
  "E-Dahab": "110629688385",
  "Agent Payment": "789688385",
};

function buildUssdCode(method: string, amount: number) {
  const base = PAYMENT_SHORTCODES[method];
  if (!base) return "";
  // Round to nearest whole currency unit for USSD; many MNO gateways reject decimals
  const amt = Math.max(1, Math.round(amount));
  return `${base}*${amt}#`;
}

function buildTelHref(method: string, amount: number) {
  const code = buildUssdCode(method, amount);
  if (!code) return "#";
  // Encode * and # so Android/iOS dialers consistently parse the USSD string
  return `tel:${code.replace(/\*/g, "%2A").replace(/#/g, "%23")}`;
}

export function CartDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { items, setQty, remove, total, clear, count } = useCart();
  const [step, setStep] = useState<Step>("cart");
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("EVC Plus");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const reset = () => {
    setStep("cart"); setCustomerName(""); setTableNumber(""); setScreenshot(null); setOrderId(null);
  };

  const screenshotPreview = useMemo(() => screenshot ? URL.createObjectURL(screenshot) : null, [screenshot]);

  const submitOrder = async () => {
    if (!customerName || !tableNumber) { toast.error("Please fill in your name and table number."); return; }
    if (!screenshot) { toast.error("Payment proof screenshot is required."); return; }
    if (!screenshot.type.startsWith("image/")) { toast.error("Please upload a valid image file."); return; }
    setSubmitting(true);
    try {
      let screenshotUrl: string | null = null;
      {
        const path = `${Date.now()}-${Math.random().toString(36).slice(2,8)}-${screenshot.name}`;
        const { error: upErr } = await supabase.storage.from("payment-screenshots").upload(path, screenshot);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("payment-screenshots").getPublicUrl(path);
        screenshotUrl = data.publicUrl;
      }
      const { data: order, error: oErr } = await supabase
        .from("orders")
        .insert({
          customer_name: customerName,
          table_number: tableNumber,
          payment_method: paymentMethod,
          payment_screenshot_url: screenshotUrl,
          total,
          status: "pending",
        })
        .select()
        .single();
      if (oErr) throw oErr;
      const { error: iErr } = await supabase.from("order_items").insert(
        items.map(i => ({
          order_id: order.id,
          item_id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image_url: i.image_url,
        }))
      );
      if (iErr) throw iErr;
      setOrderId(order.id);
      clear();
      setStep("success");
      toast.success("Order placed successfully!");
    } catch (e: any) {
      toast.error(e.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setTimeout(reset, 300); }}>
      <SheetContent className="w-full sm:max-w-md bg-card border-l border-white/10 flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl gold-text">
            {step === "cart" && "Your Order"}
            {step === "details" && "Your Details"}
            {step === "payment" && "Pay the Fee"}
            {step === "success" && "Order Confirmed"}
          </SheetTitle>
        </SheetHeader>

        {step === "cart" && (
          <div className="flex-1 flex flex-col mt-4 min-h-0">
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 text-muted-foreground">
                <ShoppingBag className="h-12 w-12 opacity-30" />
                <p>Your cart is empty.</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-3 rounded-xl bg-muted/40 p-3">
                      <img src={item.image_url || ""} alt={item.name} className="h-16 w-16 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.name}</div>
                        <div className="text-xs gold-text">${item.price.toFixed(2)}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(item.id, item.quantity - 1)}><Minus className="h-3 w-3"/></Button>
                          <span className="text-sm w-6 text-center">{item.quantity}</span>
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(item.id, item.quantity + 1)}><Plus className="h-3 w-3"/></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 ml-auto text-destructive" onClick={() => remove(item.id)}><Trash2 className="h-3.5 w-3.5"/></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 border-t border-white/10 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total ({count} items)</span>
                    <span className="text-xl font-semibold gold-text">${total.toFixed(2)}</span>
                  </div>
                  <Button className="w-full bg-primary text-primary-foreground hover:opacity-90 gold-glow" size="lg" onClick={() => setStep("details")}>Order</Button>
                </div>
              </>
            )}
          </div>
        )}

        {step === "details" && (
          <div className="flex-1 flex flex-col mt-4 gap-4">
            <div>
              <Label>Your name</Label>
              <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="John Doe" className="mt-1.5" />
            </div>
            <div>
              <Label>Table number</Label>
              <Input value={tableNumber} onChange={e => setTableNumber(e.target.value)} placeholder="e.g. 12" className="mt-1.5" />
            </div>
            <div className="mt-auto flex gap-2">
              <Button variant="outline" onClick={() => setStep("cart")} className="flex-1">Back</Button>
              <Button onClick={() => { if (!customerName || !tableNumber) { toast.error("Fill both fields"); return; } setStep("payment"); }} className="flex-1 bg-primary text-primary-foreground">Continue to payment</Button>
            </div>
          </div>
        )}

        {step === "payment" && (
          <div className="flex-1 flex flex-col mt-4 gap-4 overflow-y-auto">
            <div className="rounded-xl bg-primary/10 border border-primary/20 p-4">
              <div className="text-xs uppercase tracking-widest text-primary/80">Pay to</div>
              <div className="font-mono text-2xl mt-1 gold-text">{PAYMENT_NUMBER}</div>
              <div className="text-xs text-muted-foreground mt-1">Amount: <span className="text-foreground font-semibold">${total.toFixed(2)}</span></div>
            </div>
            <div>
              <Label>Payment method · tap to dial</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(m) => {
                  setPaymentMethod(m);
                  // Auto-launch the dialer with the USSD code pre-filled (mobile only)
                  if (typeof window !== "undefined" && total > 0) {
                    const href = buildTelHref(m, total);
                    if (href !== "#") window.location.href = href;
                  }
                }}
                className="mt-2 grid gap-2"
              >
                {["EVC Plus", "E-Dahab", "Agent Payment"].map(m => {
                  const ussd = buildUssdCode(m, total);
                  const href = buildTelHref(m, total);
                  const active = paymentMethod === m;
                  return (
                    <label key={m} className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition ${active ? "border-primary bg-primary/5" : "border-white/10 hover:border-white/20"}`}>
                      <RadioGroupItem value={m} id={m} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{m}</div>
                        <div className="text-[11px] font-mono text-muted-foreground truncate">{ussd}</div>
                      </div>
                      <a
                        href={href}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary text-xs font-medium px-3 py-2 border border-primary/30"
                      >
                        <Phone className="h-3.5 w-3.5" /> Dial
                      </a>
                    </label>
                  );
                })}
              </RadioGroup>
              <p className="text-[11px] text-muted-foreground mt-2">
                Selecting a method opens your phone keypad with the USSD code and the order total pre-filled.
              </p>
            </div>
            <div>
              <Label>Payment Screenshot <span className="text-destructive">*</span></Label>
              <label className={`mt-1.5 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-4 cursor-pointer transition ${screenshot ? "border-primary/50 bg-primary/5" : "border-white/15 hover:border-primary/40"}`}>
                {screenshotPreview ? (
                  <img src={screenshotPreview} alt="Payment proof preview" className="max-h-40 rounded-lg object-contain" />
                ) : (
                  <Upload className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="text-xs text-muted-foreground text-center">{screenshot ? `${screenshot.name} · tap to change` : "Upload your transfer screenshot (required)"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files?.[0] ?? null;
                  if (f && !f.type.startsWith("image/")) { toast.error("Please select an image file."); return; }
                  setScreenshot(f);
                }} />
              </label>
              {!screenshot && <p className="text-[11px] text-destructive/80 mt-1.5">Payment proof screenshot is required.</p>}
            </div>
            <div className="mt-auto flex gap-2">
              <Button variant="outline" onClick={() => setStep("details")} className="flex-1">Back</Button>
              <Button onClick={submitOrder} disabled={submitting || !screenshot} className="flex-1 bg-primary text-primary-foreground gold-glow disabled:opacity-50">{submitting ? "Submitting…" : "Submit Order"}</Button>
            </div>
          </div>
        )}

        {step === "success" && orderId && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <CheckCircle2 className="h-14 w-14 text-primary" />
            <h3 className="font-display text-2xl">Thank you, {customerName || "guest"}</h3>
            <p className="text-sm text-muted-foreground">Your order has been sent to the kitchen.</p>
            <div className="text-xs text-muted-foreground">Order ID</div>
            <div className="font-mono text-sm">{orderId.slice(0,8).toUpperCase()}</div>
            <Link to="/track/$orderId" params={{ orderId }} className="text-sm text-primary underline underline-offset-4">Track live status →</Link>
            <Button onClick={() => onOpenChange(false)} variant="outline" className="mt-4">Close</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
