import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageSquare, Mail, Lock, User, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/store/useAuth";

export default function Register() {
  const nav = useNavigate();
  const setAuth = useAuth((s) => s.setAuth);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", form);
      setAuth(data.token, data.user);
      toast.success(`Welcome to NexTalk, ${data.user.name}!`);
      nav("/app");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* ===== LEFT BRAND PANEL ===== */}
      <div className="hidden lg:flex relative bg-foreground text-background p-12 flex-col justify-between overflow-hidden grain">
        <div className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-primary opacity-90" />
        <div className="absolute -bottom-28 -left-20 w-72 h-72 rounded-full bg-accent" />
        <div className="absolute top-32 -right-14 w-32 h-32 rounded-2xl bg-secondary -rotate-12" />

        <Link to="/" className="flex items-center gap-2.5 relative z-10" data-testid="brand-logo">
          <div className="w-9 h-9 rounded-xl bg-background text-foreground flex items-center justify-center">
            <MessageSquare className="w-5 h-5" strokeWidth={2.6} />
          </div>
          <span className="font-display font-black text-xl tracking-tighter">NexTalk</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <Zap className="w-7 h-7 mb-4" />
          <h2 className="h-display text-4xl xl:text-5xl">
            Join the<br />conversation today.
          </h2>
          <p className="mt-4 opacity-80 font-medium">
            One account. All your chats. Built for speed, designed for delight.
          </p>
        </div>

        <div className="relative z-10 text-xs opacity-70 font-semibold">© NexTalk · Free forever for personal use</div>
      </div>

      {/* ===== RIGHT FORM ===== */}
      <div className="flex items-center justify-center p-6 lg:p-12 relative">
        <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
        <form
          onSubmit={submit}
          className="w-full max-w-md bento p-8 lg:p-10 space-y-5 relative shadow-xl"
          data-testid="register-form"
        >
          <div>
            <div className="eyebrow text-primary mb-2">// Create account</div>
            <h1 className="h-display text-3xl sm:text-4xl">Let&apos;s talk.</h1>
            <p className="text-muted-foreground text-sm mt-1.5 font-medium">It takes less than 60 seconds.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="font-bold text-xs uppercase tracking-wider">Full name</Label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input id="name" required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ada Lovelace"
                className="pl-10 h-12 rounded-xl bg-muted/50 border-transparent focus-visible:ring-primary"
                data-testid="register-name-input" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="font-bold text-xs uppercase tracking-wider">Email</Label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="pl-10 h-12 rounded-xl bg-muted/50 border-transparent focus-visible:ring-primary"
                data-testid="register-email-input" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-bold text-xs uppercase tracking-wider">Password</Label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type="password" required minLength={6} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="At least 6 characters"
                className="pl-10 h-12 rounded-xl bg-muted/50 border-transparent focus-visible:ring-primary"
                data-testid="register-password-input" />
            </div>
          </div>

          <Button
            type="submit" disabled={loading}
            className="w-full h-12 rounded-xl font-bold shadow-coral btn-bump"
            data-testid="register-submit-btn"
          >
            {loading ? "Creating account..." : <>Create account <ArrowRight className="ml-2 w-4 h-4" /></>}
          </Button>

          <div className="text-sm text-center text-muted-foreground font-medium">
            Already a member?{" "}
            <Link to="/login" className="font-bold text-primary link-underline" data-testid="goto-login-link">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
