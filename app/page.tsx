'use client';

import { useAuth } from '@/components/providers/auth-provider';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  ShieldCheck,
  Database,
  FileText,
  Zap,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Users,
  Banknote,
  Brain,
  BarChart3,
  Globe,
  Lock,
  Clock,
  Star,
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

/* ─── Animation Variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] },
  }),
};

const scaleUp = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] },
  }),
};

const slideInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

const slideInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground overflow-x-hidden selection:bg-blue-600/20 selection:text-blue-700">

      {/* ═══════════ HEADER ═══════════ */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="px-6 py-4 flex items-center justify-between bg-background/70 backdrop-blur-2xl sticky top-0 z-50 w-full border-b border-border/30"
      >
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 3 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-[0_4px_14px_0_rgba(59,130,246,0.35)]"
          >
            <span className="text-white font-bold text-lg tracking-tight">SA</span>
          </motion.div>
          <span className="font-bold text-2xl tracking-tight">Sahayog{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-extrabold">AI</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/member-portal/login" className="hidden sm:inline-block">
            <Button variant="ghost" className="font-medium text-muted-foreground hover:text-foreground rounded-full px-4">
              Member Portal
            </Button>
          </Link>

          {isAuthenticated ? (
            <Link href={user?.role === 'PLATFORM_ADMIN' ? '/admin/tenants' : '/dashboard'}>
              <Button className="font-semibold rounded-full px-6">
                Dashboard <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-block">
                <Button variant="outline" className="font-semibold rounded-full px-6">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button className="font-semibold rounded-full px-6">
                  Register Society
                </Button>
              </Link>
            </>
          )}
        </div>
      </motion.header>

      <main className="flex-1 w-full relative">

        {/* ═══════════ HERO SECTION ═══════════ */}
        <section ref={heroRef} className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Animated gradient mesh background */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/15 dark:bg-blue-500/10 rounded-full blur-[120px] animate-blob" />
            <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-400/15 dark:bg-indigo-400/10 rounded-full blur-[120px] animate-blob animation-delay-2000" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-purple-400/10 dark:bg-purple-400/8 rounded-full blur-[120px] animate-blob animation-delay-4000" />
            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          </div>

          <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 px-6 text-center max-w-5xl mx-auto space-y-8 flex flex-col items-center">

            {/* Animated badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group"
            >
              <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-card/80 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/[0.03] text-sm font-semibold text-primary hover:shadow-xl hover:border-primary/30 transition-all duration-500 cursor-default">
                <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}>
                  <Sparkles className="w-4 h-4" />
                </motion.div>
                <span>Introducing Sahayog AI </span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              </div>
            </motion.div>

            {/* Hero heading */}
            <div className="space-y-3 overflow-hidden">
              <motion.h1
                custom={0}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black tracking-[-0.04em] leading-[1.05]"
              >
                Intelligent Finance for
              </motion.h1>
              <motion.h1
                custom={1}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black tracking-[-0.04em] leading-[1.05]"
              >
                <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_4s_ease_infinite]">
                  Modern Cooperatives
                </span>
              </motion.h1>
            </div>

            {/* Subheading */}
            <motion.p
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light"
            >
              Elevate your credit cooperative with AI-driven accounting, seamless loan origination,
              robust regulatory compliance, and stunning member experiences.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col sm:flex-row justify-center gap-4 pt-4 w-full sm:w-auto">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="xl" className="w-full rounded-full text-lg shadow-[0_8px_30px_rgb(59,130,246,0.25)] hover:shadow-[0_14px_40px_rgb(59,130,246,0.35)] hover:scale-[1.03] transition-all duration-300">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/member-portal/login" className="w-full sm:w-auto">
                <Button size="xl" variant="outline" className="w-full rounded-full text-lg transition-all duration-300">
                  Member Access <ChevronRight className="ml-2 w-5 h-5 opacity-40" />
                </Button>
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="pt-6 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm font-medium text-muted-foreground">
              {['No credit card required', 'Setup in minutes', 'Bank-grade security', 'RBI Compliant'].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{item}</span>
                </div>
              ))}
            </motion.div>

          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1.5"
            >
              <motion.div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
            </motion.div>
          </motion.div>
        </section>

        {/* ═══════════ STATS COUNTER STRIP ═══════════ */}
        <section className="py-20 px-6 relative">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6"
            >
              {[
                { value: '500+', label: 'Cooperatives', icon: <Users className="w-5 h-5" />, gradient: 'from-blue-500 to-indigo-500' },
                { value: '₹200Cr+', label: 'Managed AUM', icon: <Banknote className="w-5 h-5" />, gradient: 'from-emerald-500 to-green-500' },
                { value: '99.9%', label: 'Uptime SLA', icon: <ShieldCheck className="w-5 h-5" />, gradient: 'from-violet-500 to-purple-500' },
                { value: '50K+', label: 'Active Members', icon: <TrendingUp className="w-5 h-5" />, gradient: 'from-orange-400 to-amber-500' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={scaleUp}
                  className="group"
                >
                  <div className="text-center bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-8 hover:shadow-xl hover:shadow-primary/[0.04] hover:-translate-y-2 transition-all duration-500">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                      <span className="text-white">{stat.icon}</span>
                    </div>
                    <div className="text-4xl md:text-5xl font-black tracking-tight mb-1">{stat.value}</div>
                    <div className="text-sm font-medium text-muted-foreground">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══════════ FEATURES BENTO GRID ═══════════ */}
        <section className="py-24 px-6 relative">
          <div className="max-w-7xl mx-auto space-y-16">

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              className="text-center space-y-5"
            >
              <motion.div variants={fadeUp} custom={0}>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 dark:bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
                  <Zap className="w-3.5 h-3.5" />
                  Features
                </span>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Everything you need to <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">scale</span>
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto font-light">
                Replace fragmented legacy software with a unified, state-of-the-art platform.
              </motion.p>
            </motion.div>

            {/* Bento-style feature cards */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {[
                { title: 'Core Ledger', icon: <Database className="w-7 h-7" />, desc: 'Double-entry accounting, real-time GL posting matrix, and instant trial balances with automated reconciliation.', gradient: 'from-blue-500 to-cyan-400', bg: 'bg-blue-500/5 dark:bg-blue-500/10', span: 'lg:col-span-1' },
                { title: 'Loan Engine', icon: <Zap className="w-7 h-7" />, desc: 'End-to-end loan lifecycle from application to NPA, with dynamic EMI, penal interest, and automated provisioning.', gradient: 'from-purple-500 to-pink-400', bg: 'bg-purple-500/5 dark:bg-purple-500/10', span: 'lg:col-span-1' },
                { title: 'AI Risk Intelligence', icon: <Brain className="w-7 h-7" />, desc: 'ML-powered NPA prediction, transaction anomaly detection, and automated suspicious activity flagging.', gradient: 'from-amber-400 to-orange-500', bg: 'bg-amber-500/5 dark:bg-amber-500/10', span: 'lg:col-span-1' },
                { title: 'Auto-Compliance Engine', icon: <ShieldCheck className="w-7 h-7" />, desc: 'One-click NABARD Annual Reports, Registrar Returns, TDS 26Q, and real-time AML monitoring with STR auto-detection.', gradient: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-500/5 dark:bg-emerald-500/10', span: 'lg:col-span-2' },
                { title: 'Member Portal', icon: <Globe className="w-7 h-7" />, desc: 'Self-serve digital passbooks, EMI schedules, loan applications, and instant statements for members.', gradient: 'from-rose-400 to-pink-500', bg: 'bg-rose-500/5 dark:bg-rose-500/10', span: 'lg:col-span-1' },
              ].map((feature, i) => (
                <motion.div key={i} custom={i} variants={scaleUp} className={`group ${feature.span}`}>
                  <div className={`relative ${feature.bg} rounded-3xl border border-border/50 p-8 md:p-10 h-full flex flex-col items-start text-left space-y-5 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/[0.03] transition-all duration-500 overflow-hidden`}>

                    {/* Decorative gradient blob (top-right) */}
                    <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${feature.gradient} opacity-[0.06] dark:opacity-[0.08] rounded-full blur-3xl group-hover:opacity-[0.12] transition-opacity duration-700`} />

                    <motion.div
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className={`p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg`}
                    >
                      {feature.icon}
                    </motion.div>

                    <div className="relative z-10">
                      <h3 className="font-bold text-xl tracking-tight mb-2.5">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed text-[15px]">{feature.desc}</p>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 mt-auto pt-2">
                      Learn more <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══════════ WHY CHOOSE US ═══════════ */}
        <section className="py-24 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />

          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left: Text content */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={slideInLeft}
                className="space-y-8"
              >
                <div className="space-y-5">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 dark:bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
                    <Star className="w-3.5 h-3.5" />
                    Why Sahayog AI
                  </span>
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                    Built by cooperative <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">experts</span>,
                    for cooperatives
                  </h2>
                  <p className="text-muted-foreground text-lg font-light leading-relaxed">
                    We understand the unique challenges of credit cooperatives in India — from complex regulatory requirements to multi-tier governance structures.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { icon: <Lock className="w-5 h-5" />, title: 'Bank-Grade Security', desc: 'SOC 2 compliant, end-to-end encryption, and role-based access controls' },
                    { icon: <Clock className="w-5 h-5" />, title: '10x Faster Operations', desc: 'Automate day-end, month-end, and annual closing processes in minutes' },
                    { icon: <BarChart3 className="w-5 h-5" />, title: 'Real-Time Analytics', desc: 'Director dashboards, NPA trends, and predictive risk insights' },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className="flex gap-4 p-4 rounded-2xl hover:bg-card/80 transition-colors duration-300 group"
                    >
                      <div className="w-11 h-11 rounded-xl bg-primary/10 dark:bg-primary/15 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold mb-0.5">{item.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Right: Animated dashboard preview */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={slideInRight}
                className="relative"
              >
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-card via-card to-primary/5 border border-border/60 shadow-2xl shadow-primary/[0.04] p-1">
                  {/* Mock dashboard content */}
                  <div className="rounded-2xl bg-card p-6 space-y-4">
                    {/* Header bar */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600" />
                        <div className="space-y-1">
                          <div className="h-3 w-28 bg-foreground/15 rounded-full" />
                          <div className="h-2 w-20 bg-muted rounded-full" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-lg bg-muted" />
                        <div className="w-8 h-8 rounded-lg bg-muted" />
                      </div>
                    </div>
                    {/* KPI Row */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { color: 'from-blue-500 to-indigo-500', label: 'Members', val: '2,847' },
                        { color: 'from-emerald-500 to-green-500', label: 'Loans', val: '₹4.2Cr' },
                        { color: 'from-purple-500 to-pink-500', label: 'Deposits', val: '₹8.7Cr' },
                      ].map((kpi, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.6 + i * 0.15 }}
                          className="rounded-xl bg-muted/30 dark:bg-muted/50 p-4 space-y-2 border border-border/30"
                        >
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                            <span className="text-white text-xs">📊</span>
                          </div>
                          <div className="text-xl font-bold tracking-tight">{kpi.val}</div>
                          <div className="text-xs text-muted-foreground">{kpi.label}</div>
                        </motion.div>
                      ))}
                    </div>
                    {/* Chart placeholder */}
                    <div className="rounded-xl bg-muted/20 dark:bg-muted/40 border border-border/30 p-4 h-32 flex items-end gap-1.5">
                      {[40, 65, 35, 80, 55, 90, 45, 70, 60, 85, 50, 75].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h}%` }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.8 + i * 0.05, duration: 0.5, ease: 'easeOut' }}
                          className="flex-1 bg-gradient-to-t from-blue-600 to-indigo-400 rounded-t-sm opacity-80"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating badge */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="absolute -top-4 -right-4 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-bold shadow-lg"
                >
                  ✅ 99.9% Uptime
                </motion.div>

                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 1.5 }}
                  className="absolute -bottom-4 -left-4 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold shadow-lg"
                >
                  🔒 SOC 2 Certified
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════ SOCIAL PROOF / TESTIMONIAL ═══════════ */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleUp}
              custom={0}
              className="relative bg-card/80 backdrop-blur-sm rounded-3xl border border-border/50 p-10 md:p-14 text-center overflow-hidden"
            >
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl" />

              <div className="relative z-10">
                <div className="flex justify-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <blockquote className="text-xl md:text-2xl font-medium leading-relaxed mb-6 italic text-foreground/90">
                  &ldquo;Sahayog AI transformed our cooperative&apos;s operations completely. What used to take 3 days for month-end closing now takes 30 minutes. The AI-powered compliance features alone saved us from two potential regulatory issues.&rdquo;
                </blockquote>
                <div>
                  <p className="font-bold text-lg">Shri Ramesh Patil</p>
                  <p className="text-muted-foreground text-sm">President, Nagpur District Credit Co-operative Society</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════ FINAL CTA ═══════════ */}
        <section className="py-24 px-6 relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.93 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-5xl mx-auto relative rounded-[2.5rem] overflow-hidden"
          >
            {/* CTA Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950" />

            {/* Animated orbs */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/20 blur-[100px] rounded-full animate-blob" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/20 blur-[100px] rounded-full animate-blob animation-delay-2000" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full animate-blob animation-delay-4000" />

            {/* Dot grid */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

            <div className="relative z-10 p-12 md:p-20 text-center">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight"
              >
                Ready to modernize <br className="hidden md:block" />your operations?
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35 }}
                className="text-lg md:text-xl text-blue-200/70 font-light max-w-2xl mx-auto mb-10"
              >
                Join the growing network of cooperatives running efficiently on Sahayog AI.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row justify-center gap-4"
              >
                <Link href="/register">
                  <Button size="xl" className="rounded-full bg-white text-slate-900 hover:bg-slate-100 transition-all shadow-[0_4px_20px_rgba(255,255,255,0.15)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.25)] hover:scale-[1.03] text-lg font-bold">
                    Create Your Workspace
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="xl" variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10 hover:border-white/30 backdrop-blur-sm transition-all text-lg font-semibold">
                    Sign In
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>

      </main>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="border-t border-border/40 py-12 px-6 bg-card/50 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <Link href="/" className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">SA</span>
            </div>
            <span className="font-bold text-lg tracking-tight">
              Sahayog <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">AI</span>
            </span>
          </Link>
          <p className="text-muted-foreground font-medium text-sm">© {new Date().getFullYear()} Sentient Digital. All rights reserved.</p>
          <div className="flex gap-6 text-sm font-medium text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
