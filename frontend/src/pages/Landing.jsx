import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquare, Zap, Lock, Users, Sparkles, ArrowRight, Check, Globe2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Zap, title: "Real-time messaging", desc: "Powered by WebSockets. Messages arrive the instant they're sent.", color: "bg-[#FFF4B3]" },
  { icon: Users, title: "Group chats", desc: "Bring your team, family or guild together. Admins, members, roles.", color: "bg-[#E0F4E8]" },
  { icon: Lock, title: "End-to-end auth", desc: "JWT-secured sessions, bcrypt password hashing, and 24/7 presence.", color: "bg-[#D4C5FF]" },
  { icon: Bell, title: "Smart notifications", desc: "Typing indicators, read receipts, and unread badges keep you in flow.", color: "bg-[#FFD9C7]" },
];

// Stable framer-motion props (extracted to avoid creating new objects each render)
const HERO_INITIAL = { opacity: 0, y: 24 };
const HERO_ANIMATE = { opacity: 1, y: 0 };
const HERO_TRANSITION = { duration: 0.6, ease: "easeOut" };
const FEATURE_INITIAL = { opacity: 0, y: 16 };
const FEATURE_INVIEW = { opacity: 1, y: 0 };
const FEATURE_VIEWPORT = { once: true };

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="glass sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="brand-logo">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary-foreground" strokeWidth={2.4} />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">NexTalk</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#how" className="hover:text-primary transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" data-testid="nav-login-btn">Sign in</Button></Link>
            <Link to="/register">
              <Button className="rounded-xl font-bold" data-testid="nav-signup-btn">
                Get started <ArrowRight className="ml-1 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-60 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28 grid lg:grid-cols-12 gap-12 items-center relative">
          <div className="lg:col-span-7 space-y-7">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold uppercase tracking-[0.18em]">
              <Sparkles className="w-3.5 h-3.5" /> v1.0 — now live
            </span>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[0.95] tracking-tight">
              Connect. <br />
              <span className="inline-block bg-primary text-primary-foreground px-3 -rotate-1">Communicate.</span>{" "}
              <br />
              Instantly.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              NexTalk is the open, modern messaging platform built for teams, communities and friends.
              Real-time, beautiful, and ridiculously fast.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/register">
                <Button size="lg" className="rounded-xl font-bold text-base px-7 py-6" data-testid="hero-cta-signup">
                  Start chatting free <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="rounded-xl font-bold text-base px-7 py-6" data-testid="hero-cta-login">
                  I have an account
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-6 pt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> No credit card</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> 1:1 + groups</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Dark mode</div>
            </div>
          </div>

          {/* Right: floating chat preview */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={HERO_INITIAL}
              animate={HERO_ANIMATE}
              transition={HERO_TRANSITION}
              className="relative"
            >
              <div className="absolute -top-6 -left-6 w-24 h-24 rounded-2xl bg-secondary -rotate-6" />
              <div className="absolute -bottom-8 -right-4 w-32 h-32 rounded-full bg-accent" />
              <div className="bento p-6 relative">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold">AL</div>
                  <div>
                    <div className="font-bold">Alex Lin</div>
                    <div className="text-xs text-green-600 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active now
                    </div>
                  </div>
                </div>
                <div className="space-y-3 py-4">
                  <div className="bubble-received px-4 py-2 inline-block max-w-[80%] text-sm">Hey, did you ship NexTalk yet?</div>
                  <div className="text-right">
                    <div className="bubble-sent px-4 py-2 inline-block max-w-[80%] text-sm">Just deployed. Try it now 🚀</div>
                  </div>
                  <div className="bubble-received px-4 py-2 inline-flex items-center gap-1 text-sm">
                    <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                  </div>
                </div>
                <div className="pt-3 border-t border-border flex items-center gap-2">
                  <div className="flex-1 h-10 rounded-xl bg-muted px-4 flex items-center text-sm text-muted-foreground">
                    Type a message…
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURES BENTO */}
      <section id="features" className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-3">Features</div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
            Everything you need.<br />Nothing you don&apos;t.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={FEATURE_INITIAL}
              whileInView={FEATURE_INVIEW}
              viewport={FEATURE_VIEWPORT}
              transition={{ delay: i * 0.08 }}
              className="bento p-7"
              data-testid={`feature-card-${i}`}
            >
              <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-5`}>
                <f.icon className="w-6 h-6 text-black" strokeWidth={1.8} />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <div className="bento p-10 lg:p-16 bg-primary/40">
          <div className="grid lg:grid-cols-3 gap-10 items-center">
            <div className="lg:col-span-2">
              <h2 className="font-display text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                Start chatting in less than <span className="bg-accent px-2 -rotate-1 inline-block">60 seconds</span>.
              </h2>
              <p className="mt-4 text-muted-foreground max-w-xl">
                Create an account, find people by name or email, and start a conversation.
                No phone number, no friction.
              </p>
            </div>
            <div className="space-y-3">
              {["Create your account", "Find people you know", "Send your first message"].map((s, i) => (
                <div key={s} className="flex items-center gap-3 bg-card p-4 rounded-xl border border-border">
                  <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-sm">{i + 1}</div>
                  <span className="font-semibold text-sm">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <div className="bento p-12 lg:p-20 text-center bg-foreground text-background">
          <Globe2 className="mx-auto w-12 h-12 mb-6 opacity-80" />
          <h2 className="font-display text-4xl lg:text-6xl font-bold leading-none tracking-tight">
            Ready to talk?
          </h2>
          <p className="mt-4 text-base opacity-80 max-w-lg mx-auto">
            Free forever for personal use. No card. No catch.
          </p>
          <Link to="/register" className="inline-block mt-8">
            <Button size="lg" className="rounded-xl font-bold text-base px-8 py-6 bg-accent text-accent-foreground hover:bg-accent/90" data-testid="footer-cta-signup">
              Create my account <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <MessageSquare className="w-4 h-4" /> NexTalk © {new Date().getFullYear()}
          </div>
          <div className="text-xs text-muted-foreground">Connect. Communicate. Instantly.</div>
        </div>
      </footer>
    </div>
  );
}
