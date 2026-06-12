import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MessageSquare, Zap, Lock, Users, Sparkles, ArrowRight, Check, Bell,
  Phone, Video, Smile, Globe2, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ---- Stable framer-motion props ----
const HERO_INITIAL = { opacity: 0, y: 24 };
const HERO_ANIMATE = { opacity: 1, y: 0 };
const HERO_TRANSITION = { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] };

const FEATURE_INITIAL = { opacity: 0, y: 18 };
const FEATURE_INVIEW = { opacity: 1, y: 0 };
const FEATURE_VIEWPORT = { once: true, amount: 0.4 };

// ---- Content ----
const features = [
  { icon: Zap,          title: "Real-time delivery",     desc: "Messages arrive the instant they're sent — backed by WebSockets, not polling.", span: "md:col-span-7", tint: "bg-accent" },
  { icon: Users,        title: "Groups, done right",     desc: "Roles, admins, mentions, media galleries. All the power, none of the clutter.", span: "md:col-span-5", tint: "bg-secondary/20" },
  { icon: Phone,        title: "Crystal-clear calls",    desc: "WebRTC voice & video. PiP self-view, mute, end-call. Just one tap.", span: "md:col-span-5", tint: "bg-primary/10" },
  { icon: Smile,        title: "Reactions & replies",    desc: "React with emoji, reply in-thread, edit, delete. Conversations stay readable.", span: "md:col-span-7", tint: "bg-accent/40" },
  { icon: Bell,         title: "Smart presence",         desc: "Online dot, last-seen, typing indicators, read receipts — the works.", span: "md:col-span-4", tint: "bg-primary/15" },
  { icon: Lock,         title: "Secure by default",      desc: "JWT sessions, bcrypt hashing, HTTPS-only. Your conversations stay yours.", span: "md:col-span-4", tint: "bg-secondary/15" },
  { icon: Sparkles,     title: "Dark, light & system",   desc: "Three themes. One tap. Auto follows your OS preference.", span: "md:col-span-4", tint: "bg-accent/60" },
];

const logos = ["Acme", "Northwind", "Globex", "Initech", "Soylent", "Umbrella", "Vandelay"];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ===== NAV ===== */}
      <header className="glass sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5" data-testid="brand-logo">
            <div className="w-9 h-9 rounded-xl bg-primary shadow-coral flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary-foreground" strokeWidth={2.6} />
            </div>
            <span className="font-display font-black text-xl tracking-tighter">NexTalk</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
            <a href="#features" className="link-underline">Features</a>
            <a href="#how" className="link-underline">How it works</a>
            <a href="#testimonials" className="link-underline">Loved by</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" data-testid="nav-login-btn">
              <Button variant="ghost" className="font-bold">Sign in</Button>
            </Link>
            <Link to="/register" data-testid="nav-signup-btn">
              <Button className="rounded-xl font-bold shadow-coral btn-bump">
                Get started <ArrowRight className="ml-1 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="relative">
        <div className="absolute inset-0 dot-grid opacity-50 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-40 -left-32 w-[360px] h-[360px] rounded-full bg-accent/40 blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28 grid lg:grid-cols-12 gap-12 items-center relative">
          <div className="lg:col-span-7 space-y-7">
            <motion.span
              initial={HERO_INITIAL} animate={HERO_ANIMATE} transition={HERO_TRANSITION}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-xs eyebrow"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              v1.1 — Voice &amp; Video calls live
            </motion.span>

            <motion.h1
              initial={HERO_INITIAL} animate={HERO_ANIMATE} transition={{ ...HERO_TRANSITION, delay: 0.06 }}
              className="h-display text-[clamp(2.75rem,7vw,5.5rem)]"
            >
              Connect.<br />
              <span className="relative inline-block">
                <span className="absolute inset-0 -rotate-2 bg-accent rounded-md -z-0" aria-hidden />
                <span className="relative px-3">Communicate.</span>
              </span><br />
              <span className="text-primary">Instantly.</span>
            </motion.h1>

            <motion.p
              initial={HERO_INITIAL} animate={HERO_ANIMATE} transition={{ ...HERO_TRANSITION, delay: 0.12 }}
              className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed font-medium"
            >
              The open, modern messaging platform built for teams, communities &amp; friends.
              Real-time chat, group calls, ridiculous speed.
            </motion.p>

            <motion.div
              initial={HERO_INITIAL} animate={HERO_ANIMATE} transition={{ ...HERO_TRANSITION, delay: 0.18 }}
              className="flex flex-wrap gap-3"
            >
              <Link to="/register" data-testid="hero-cta-signup">
                <Button size="lg" className="rounded-xl font-bold text-base px-7 py-6 shadow-coral-lg btn-bump">
                  Start chatting free <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link to="/login" data-testid="hero-cta-login">
                <Button size="lg" variant="outline" className="rounded-xl font-bold text-base px-7 py-6 btn-bump">
                  I have an account
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={HERO_INITIAL} animate={HERO_ANIMATE} transition={{ ...HERO_TRANSITION, delay: 0.24 }}
              className="flex items-center gap-6 pt-2 text-sm text-muted-foreground font-medium"
            >
              <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-secondary" /> No credit card</div>
              <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-secondary" /> 1:1 + groups</div>
              <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-secondary" /> Calls included</div>
            </motion.div>
          </div>

          {/* Right: floating chat preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1], delay: 0.1 }}
            className="lg:col-span-5 relative"
          >
            <div className="absolute -top-8 -left-6 w-28 h-28 rounded-2xl bg-secondary -rotate-6 shadow-lg" />
            <div className="absolute -bottom-10 -right-6 w-32 h-32 rounded-full bg-accent shadow-lg" />
            <div className="bento p-6 relative shadow-2xl">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="relative">
                  <div className="w-11 h-11 rounded-full bg-secondary text-white flex items-center justify-center font-black">AL</div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-secondary ring-2 ring-card" />
                </div>
                <div>
                  <div className="font-display font-extrabold text-base">Alex Lin</div>
                  <div className="text-[11px] text-secondary font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Active now
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="p-1.5 rounded-lg bg-muted"><Phone className="w-3.5 h-3.5" /></span>
                  <span className="p-1.5 rounded-lg bg-muted"><Video className="w-3.5 h-3.5" /></span>
                </div>
              </div>
              <div className="space-y-2.5 py-4">
                <div className="bubble-received px-3.5 py-2 inline-block max-w-[80%] text-sm">Hey, did you ship NexTalk?</div>
                <div className="text-right">
                  <div className="bubble-sent px-3.5 py-2 inline-block max-w-[80%] text-sm">Just deployed. Try it 🚀</div>
                </div>
                <div className="text-right">
                  <div className="bubble-sent px-3.5 py-2 inline-block max-w-[80%] text-sm">v1.1 has voice + video calls now</div>
                </div>
                <div className="bubble-received px-3.5 py-2 inline-flex items-center gap-1 text-sm text-primary">
                  <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                </div>
              </div>
              <div className="pt-3 border-t border-border flex items-center gap-2">
                <div className="flex-1 h-10 rounded-xl bg-muted px-4 flex items-center text-sm text-muted-foreground font-medium">
                  Type a message…
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary shadow-coral flex items-center justify-center text-primary-foreground">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== LOGO MARQUEE ===== */}
      <section className="border-y border-border py-6 bg-card/30 overflow-hidden">
        <div className="eyebrow text-center text-muted-foreground mb-4">Trusted by curious people at</div>
        <div className="marquee whitespace-nowrap">
          {[...logos, ...logos].map((l, i) => (
            <span key={i} className="font-display font-black text-2xl tracking-tighter text-muted-foreground/60 hover:text-primary transition-colors">
              {l}.
            </span>
          ))}
        </div>
      </section>

      {/* ===== FEATURES BENTO ===== */}
      <section id="features" className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="eyebrow text-primary mb-3">// Features</div>
            <h2 className="h-display text-4xl sm:text-5xl lg:text-6xl">
              Everything you need.<br />Nothing you don&apos;t.
            </h2>
          </div>
          <p className="md:max-w-xs text-muted-foreground font-medium">
            Each feature is opinionated and built to feel obvious — no settings panel safari required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={FEATURE_INITIAL}
              whileInView={FEATURE_INVIEW}
              viewport={FEATURE_VIEWPORT}
              transition={{ delay: i * 0.05, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
              className={`bento p-7 lg:p-8 relative overflow-hidden ${f.span}`}
              data-testid={`feature-card-${i}`}
            >
              <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full ${f.tint} blur-2xl opacity-70`} />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-foreground text-background flex items-center justify-center mb-5">
                  <f.icon className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <h3 className="font-display font-extrabold text-xl mb-1.5 tracking-tight">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how" className="max-w-7xl mx-auto px-6 lg:px-10 pb-24">
        <div className="bento p-10 lg:p-14 bg-primary text-primary-foreground grain relative overflow-hidden">
          <div className="grid lg:grid-cols-3 gap-10 items-center relative">
            <div className="lg:col-span-2">
              <div className="eyebrow opacity-80 mb-3">// In 60 seconds</div>
              <h2 className="h-display text-4xl lg:text-6xl">
                Sign up, find people,<br />start chatting.
              </h2>
              <p className="mt-5 max-w-lg opacity-90 font-medium">
                No phone number, no friction. Just email, password, and your conversations.
              </p>
            </div>
            <div className="space-y-3">
              {["Create your account", "Find people you know", "Start a conversation"].map((s, i) => (
                <div key={s} className="flex items-center gap-3 bg-background text-foreground p-4 rounded-2xl">
                  <div className="w-9 h-9 rounded-xl bg-foreground text-background flex items-center justify-center font-black text-sm shrink-0">{i + 1}</div>
                  <span className="font-bold">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section id="testimonials" className="max-w-7xl mx-auto px-6 lg:px-10 pb-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="eyebrow text-primary mb-3">// Loved by</div>
          <h2 className="h-display text-4xl sm:text-5xl lg:text-6xl">Real people, real messages.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { name: "Priya M.",  role: "Engineering lead", text: "Switched our standup chat to NexTalk. Feels faster than Slack and the calls Just Work." },
            { name: "Marcus T.", role: "Indie hacker",     text: "I built my entire side-project community here. Group chats + calls in one. No bloat." },
            { name: "Ana R.",    role: "Designer",         text: "The bubbles, the typing dots, the typography — it feels like someone actually cared." },
          ].map((t) => (
            <div key={t.name} className="bento p-7">
              <div className="flex gap-1 text-accent mb-3">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-accent" />)}
              </div>
              <p className="text-base font-medium leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3 border-t border-border pt-4">
                <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center font-black">{t.name[0]}</div>
                <div>
                  <div className="font-bold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-24">
        <div className="bento p-12 lg:p-20 text-center bg-foreground text-background grain relative overflow-hidden">
          <Globe2 className="mx-auto w-12 h-12 mb-6 opacity-80" />
          <h2 className="h-display text-4xl lg:text-6xl">Ready to talk?</h2>
          <p className="mt-4 text-base opacity-80 max-w-lg mx-auto font-medium">
            Free forever for personal use. No card. No catch.
          </p>
          <Link to="/register" className="inline-block mt-8" data-testid="footer-cta-signup">
            <Button size="lg" className="rounded-xl font-bold text-base px-9 py-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-coral-lg btn-bump">
              Create my account <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-bold">
            <MessageSquare className="w-4 h-4 text-primary" /> NexTalk © {new Date().getFullYear()}
          </div>
          <div className="text-xs text-muted-foreground font-semibold">Connect. Communicate. Instantly.</div>
        </div>
      </footer>
    </div>
  );
}
