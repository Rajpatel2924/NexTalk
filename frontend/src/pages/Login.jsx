import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageSquare, Mail, Lock, ArrowRight } from "lucide-react";
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
      {/* left brand panel */}
      <div className="hidden lg:flex relative bg-primary/40 dot-grid p-12 flex-col justify-between overflow-hidden">
        <Link to="/" className="flex items-center gap-2 relative z-10" data-testid="brand-logo">
          <div className="w-9 h-9 rounded-xl bg-foreground text-background flex items-center justify-center">
            <MessageSquare className="w-5 h-5" strokeWidth={2.4} />
          </div>
          <span className="font-display font-bold text-xl">NexTalk</span>
        </Link>
        <div className="relative z-10">
          <h2 className="font-display text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
            Welcome back to the<br /> conversation.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-md">
            Sign in to pick up where you left off — your chats, groups, and friends are waiting.
          </p>
        </div>
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-accent" />
        <div className="absolute top-32 -right-10 w-40 h-40 rounded-2xl bg-secondary rotate-12" />
      </div>

      {/* right form */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <form
          onSubmit={submit}
          className="w-full max-w-md bento p-8 lg:p-10 space-y-6"
          data-testid="login-form"
        >
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Sign in</h1>
            <p className="text-muted-foreground text-sm mt-1">Enter your details to continue.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email" type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="pl-9 h-11 rounded-xl"
                data-testid="login-email-input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password" type="password" required value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="pl-9 h-11 rounded-xl"
                data-testid="login-password-input"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl font-bold" data-testid="login-submit-btn">
            {loading ? "Signing in..." : <>Sign in <ArrowRight className="ml-2 w-4 h-4" /></>}
          </Button>

          <div className="text-sm text-center text-muted-foreground">
            New to NexTalk?{" "}
            <Link to="/register" className="font-bold text-foreground hover:text-primary" data-testid="goto-register-link">
              Create an account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
