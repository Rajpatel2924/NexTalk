import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageSquare, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/store/useAuth";

export default function Login() {
  const nav = useNavigate();
  const setAuth = useAuth((s) => s.setAuth);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      setAuth(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}`);
      nav("/app");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* ===== LEFT BRAND PANEL ===== */}
      <div className="hidden lg:flex relative bg-primary text-primary-foreground p-12 flex-col justify-between overflow-hidden grain">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-accent opacity-90" />
        <div className="absolute -bottom-32 -right-20 w-96 h-96 rounded-full bg-secondary" />
        <div className="absolute top-1/3 right-12 w-24 h-24 rounded-2xl bg-foreground rotate-12" />

        <Link to="/" className="flex items-center gap-2.5 relative z-10" data-testid="brand-logo">
          <div className="w-9 h-9 rounded-xl bg-foreground text-background flex items-center justify-center">
            <MessageSquare className="w-5 h-5" strokeWidth={2.6} />
          </div>
          <span className="font-display font-black text-xl tracking-tighter">NexTalk</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <Sparkles className="w-7 h-7 mb-4 opacity-90" />
          <h2 className="h-display text-4xl xl:text-5xl">
            Welcome back<br />to the conversation.
          </h2>
          <p className="mt-4 opacity-90 font-medium">
            Sign in to pick up where you left off — your chats, groups, and friends are waiting.
          </p>
        </div>

        <div className="relative z-10 text-xs opacity-80 font-semibold">© NexTalk · Connect. Communicate. Instantly.</div>
      </div>

      {/* ===== RIGHT FORM ===== */}
      <div className="flex items-center justify-center p-6 lg:p-12 relative">
        <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
        <form
          onSubmit={submit}
          className="w-full max-w-md bento p-8 lg:p-10 space-y-6 relative shadow-xl"
          data-testid="login-form"
        >
          <div>
            <div className="eyebrow text-primary mb-2">// Sign in</div>
            <h1 className="h-display text-3xl sm:text-4xl">Welcome back.</h1>
            <p className="text-muted-foreground text-sm mt-1.5 font-medium">Enter your details to continue.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="font-bold text-xs uppercase tracking-wider">Email</Label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email" type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="pl-10 h-12 rounded-xl bg-muted/50 border-transparent focus-visible:ring-primary"
                data-testid="login-email-input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-bold text-xs uppercase tracking-wider">Password</Label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password" type="password" required value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="pl-10 h-12 rounded-xl bg-muted/50 border-transparent focus-visible:ring-primary"
                data-testid="login-password-input"
              />
            </div>
          </div>

          <Button
            type="submit" disabled={loading}
            className="w-full h-12 rounded-xl font-bold shadow-coral btn-bump"
            data-testid="login-submit-btn"
          >
            {loading ? "Signing in..." : <>Sign in <ArrowRight className="ml-2 w-4 h-4" /></>}
          </Button>

          <div className="text-sm text-center text-muted-foreground font-medium">
            New to NexTalk?{" "}
            <Link to="/register" className="font-bold text-primary link-underline" data-testid="goto-register-link">
              Create an account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
