import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/admin/login")({ component: Login });

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Welcome back");
      navigate({ to: "/admin/dashboard" });
    } catch (e: any) {
      toast.error(e.message || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={submit} className="glass rounded-3xl p-8 w-full max-w-md elegant-shadow space-y-5">
        <div className="text-center">
          <Lock className="h-8 w-8 mx-auto text-primary" />
          <h1 className="font-display text-2xl mt-3 gold-text">Admin Access</h1>
          <p className="text-xs text-muted-foreground mt-1">Nile Restaurant</p>
        </div>
        <div>
          <Label>Email</Label>
          <Input value={email} onChange={e => setEmail(e.target.value)} type="email" className="mt-1.5" placeholder="Enter admin email" required />
        </div>
        <div>
          <Label>Password</Label>
          <Input value={password} onChange={e => setPassword(e.target.value)} type="password" className="mt-1.5" required />
        </div>
        <Button disabled={loading} className="w-full bg-primary text-primary-foreground gold-glow">{loading ? "Signing in…" : "Sign in"}</Button>
        <div className="text-center text-xs">
          <Link to="/admin/forgot" className="text-primary/80 hover:text-primary">Forgot password?</Link>
        </div>
        <div className="text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Back to menu</Link>
        </div>
      </form>
    </div>
  );
}
