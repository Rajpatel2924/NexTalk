import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageSquare, Mail, Lock, User, ArrowRight } from "lucide-react";
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
      <div className="hidden lg:flex relative bg-secondary/60 dot-grid p-12 flex-col justify-between overflow-hidden">
        <Link to="/" className="flex items-center gap-2 relative z-10" data-testid="brand-logo">
          <div className="w-9 h-9 rounded-xl bg-foreground text-background flex items-center justify-center">
            <MessageSquare className="w-5 h-5" strokeWidth={2.4} />
          </div>
          <span className="font-display font-bold text-xl">NexTalk</span>
        </Link>
        <div className="relative z-10">
          <h2 className="font-display text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
            Join the<br /> conversation today.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-md">
            One account. All your chats. Built for speed, designed for delight.
          </p>
        </div>
        <div className="absolute -top-10 -left-10 w-56 h-56 rounded-full bg-primary" />
        <div className="absolute bottom-10 -right-12 w-48 h-48 rounded-2xl bg-accent -rotate-6" />
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <form onSubmit={submit} className="w-full max-w-md bento p-8 lg:p-10 space-y-5" data-testid="register-form">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Create account</h1>
            <p className="text-muted-foreground text-sm mt-1">It takes less than 60 seconds.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input id="name" required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ada Lovelace" className="pl-9 h-11 rounded-xl"
                data-testid="register-name-input" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com" className="pl-9 h-11 rounded-xl"
                data-testid="register-email-input" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type="password" required minLength={6} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="At least 6 characters" className="pl-9 h-11 rounded-xl"
                data-testid="register-password-input" />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl font-bold" data-testid="register-submit-btn">
            {loading ? "Creating account..." : <>Create account <ArrowRight className="ml-2 w-4 h-4" /></>}
          </Button>

          <div className="text-sm text-center text-muted-foreground">
            Already a member?{" "}
            <Link to="/login" className="font-bold text-foreground hover:text-primary" data-testid="goto-login-link">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
