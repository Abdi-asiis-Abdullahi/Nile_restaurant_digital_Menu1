import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageCircle, AlertTriangle, Upload } from "lucide-react";

const WHATSAPP_NUMBER = "252771883469";

export function HelpSection() {
  const [name, setName] = useState("");
  const [table, setTable] = useState("");
  const [item, setItem] = useState("");
  const [msg, setMsg] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (kind: "submit" | "whatsapp") => {
    if (!name || !msg) { toast.error("Please fill in your name and message."); return; }
    setSubmitting(true);
    try {
      let url: string | null = null;
      if (file) {
        const path = `complaint-${Date.now()}-${file.name}`;
        await supabase.storage.from("payment-screenshots").upload(path, file);
        url = supabase.storage.from("payment-screenshots").getPublicUrl(path).data.publicUrl;
      }
      await supabase.from("complaints").insert({
        customer_name: name, table_number: table, ordered_item: item, message: msg,
        payment_screenshot_url: url, type: "custom",
      });
      if (kind === "whatsapp") {
        const text = `*Nile Restaurant — Complaint*%0A%0AName: ${name}%0ATable: ${table || "-"}%0AItem: ${item || "-"}%0A%0AMessage: ${msg}`;
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank");
      }
      toast.success("Your message has been sent.");
      setName(""); setTable(""); setItem(""); setMsg(""); setFile(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to send");
    } finally { setSubmitting(false); }
  };

  const quickComplaint = async () => {
    if (!name || !table) { toast.error("Please enter your name and table number first."); return; }
    try {
      await supabase.from("complaints").insert({
        customer_name: name, table_number: table, ordered_item: item || null,
        message: "My order has not arrived yet.", type: "quick",
      });
      toast.success("Your message has been sent to the restaurant.");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <section id="help" className="relative py-20 sm:py-28 border-t border-white/5">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="text-xs uppercase tracking-[0.3em] text-primary/80">Support</div>
          <h2 className="font-display text-4xl sm:text-5xl mt-2">Need <span className="gold-text">Help?</span></h2>
          <p className="text-sm text-muted-foreground mt-3 max-w-lg mx-auto">We're here to help. Send us a message or file a complaint — our team responds quickly.</p>
        </div>

        <div className="glass rounded-3xl p-6 sm:p-8 elegant-shadow">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Customer name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} className="mt-1.5" placeholder="Your full name" />
            </div>
            <div>
              <Label>Table number</Label>
              <Input value={table} onChange={e => setTable(e.target.value)} className="mt-1.5" placeholder="e.g. 7" />
            </div>
            <div className="sm:col-span-2">
              <Label>Ordered item</Label>
              <Input value={item} onChange={e => setItem(e.target.value)} className="mt-1.5" placeholder="e.g. Delicious Burger" />
            </div>
            <div className="sm:col-span-2">
              <Label>Complaint message</Label>
              <Textarea value={msg} onChange={e => setMsg(e.target.value)} rows={4} className="mt-1.5" placeholder="Describe the issue..." />
            </div>
            <div className="sm:col-span-2">
              <Label>Payment Screenshot (optional)</Label>
              <label className="mt-1.5 flex items-center gap-3 rounded-xl border border-dashed border-white/15 p-4 cursor-pointer hover:border-primary/40 transition">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{file ? file.name : "Attach a screenshot"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button onClick={() => submit("submit")} disabled={submitting} className="flex-1 bg-primary text-primary-foreground">Send Complaint</Button>
            <Button onClick={() => submit("whatsapp")} disabled={submitting} variant="outline" className="flex-1 gap-2 border-primary/30 hover:bg-primary/10">
              <MessageCircle className="h-4 w-4" /> Send via WhatsApp
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <Button onClick={quickComplaint} variant="ghost" className="w-full gap-2 text-amber-300 hover:bg-amber-500/10">
              <AlertTriangle className="h-4 w-4" /> My Order Has Not Arrived Yet
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
