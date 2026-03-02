'use client';

import { useAuth } from '@/components/providers/auth-provider';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShieldCheck, Database, FileText, Zap, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
};

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 overflow-x-hidden selection:bg-blue-600/20 selection:text-blue-600">

      {/* Premium Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="px-6 py-4 flex items-center justify-between border-b border-slate-200/60 bg-white/70 backdrop-blur-xl sticky top-0 z-50 w-full shadow-sm"
      >
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] group-hover:shadow-[0_6px_20px_rgba(59,130,246,0.5)] transition-all duration-500">
            <span className="text-white font-bold text-lg tracking-tight">SA</span>
          </div>
          <span className="font-bold text-2xl tracking-tight text-slate-900">Sahayog <span className="text-blue-600 font-semibold">AI</span></span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/member-portal/login" className="hidden sm:inline-block">
            <Button variant="ghost" className="font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              Member Portal
            </Button>
          </Link>

          {isAuthenticated ? (
            <Link href={user?.role === 'PLATFORM_ADMIN' ? '/admin/tenants' : '/dashboard'}>
              <Button className="font-semibold shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.5)] transition-all rounded-full px-6 text-white bg-blue-600 hover:bg-blue-700">
                Dashboard <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-block">
                <Button variant="outline" className="font-semibold border-slate-300 hover:bg-slate-100 text-slate-700 rounded-full px-6">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button className="font-semibold shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.5)] transition-all rounded-full px-6 bg-blue-600 text-white hover:bg-blue-700">
                  Register Society
                </Button>
              </Link>
            </>
          )}
        </div>
      </motion.header>

      <main className="flex-1 w-full mx-auto relative">
        {/* Ambient Background Glow (Subtle for Light Theme) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-100/50 rounded-full blur-[100px] -z-10 pointer-events-none" />
        <div className="absolute top-20 -left-64 w-[500px] h-[500px] bg-blue-50/80 rounded-full blur-[100px] -z-10 pointer-events-none" />
        <div className="absolute top-40 -right-64 w-[500px] h-[500px] bg-indigo-50/80 rounded-full blur-[100px] -z-10 pointer-events-none" />

        {/* Hero Section */}
        <section className="relative pt-32 pb-24 px-6 text-center max-w-5xl mx-auto space-y-10 z-10">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-8 flex flex-col items-center">

            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-slate-200 shadow-sm backdrop-blur-sm text-sm font-semibold text-blue-600">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
              Introducing Sahayog AI 2.0
            </motion.div>

            <motion.h1 variants={fadeIn} className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-slate-900 leading-[1.05]">
              Intelligent Finance for <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500">
                Modern Cooperatives
              </span>
            </motion.h1>

            <motion.p variants={fadeIn} className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-light">
              Elevate your credit cooperative society with AI-driven accounting, seamless loan origination, robust regulatory compliance, and stunning member experiences.
            </motion.p>

            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row justify-center gap-4 pt-8 w-full sm:w-auto">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="h-14 px-8 text-lg font-semibold w-full rounded-full bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 transition-all shadow-[0_8px_30px_rgb(59,130,246,0.3)]">
                  Start Your Free Trial
                </Button>
              </Link>
              <Link href="/member-portal/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold w-full rounded-full border-slate-300 bg-white/80 backdrop-blur-md hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm">
                  Member Access <ChevronRight className="ml-2 w-5 h-5 text-slate-400" />
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={fadeIn} className="pt-10 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-semibold text-slate-500">
              {['No credit card required', 'Setup in minutes', 'Bank-grade security', 'RBI Compliant'].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  {item}
                </div>
              ))}
            </motion.div>

          </motion.div>
        </section>

        {/* Features Showcase */}
        <section className="py-32 px-6 border-t border-slate-200/60 bg-white/40 relative">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-multiply pointer-events-none"></div>

          <div className="max-w-7xl mx-auto space-y-20 relative z-10">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeIn}
              className="text-center space-y-4"
            >
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">Everything you need to scale</h2>
              <p className="text-slate-600 text-xl max-w-2xl mx-auto font-light">Replace fragmented legacy software with a unified, state-of-the-art platform designed for scale.</p>
            </motion.div>

            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {[
                { title: 'Core Ledger', icon: <Database className="w-6 h-6" />, desc: 'Double-entry accounting, real-time GL posting matrix, and instant trial balances.', color: 'from-blue-500 to-cyan-400 text-blue-600' },
                { title: 'Loan Engine', icon: <Zap className="w-6 h-6" />, desc: 'End-to-end processing, dynamic EMI collection, and automated NPA classification.', color: 'from-purple-500 to-pink-400 text-purple-600' },
                { title: 'Auto-Compliance', icon: <ShieldCheck className="w-6 h-6" />, desc: 'One-click NABARD Annual Reports, Registrar Returns, and AI-powered STR detection.', color: 'from-emerald-400 to-teal-500 text-emerald-600' },
                { title: 'Member App', icon: <FileText className="w-6 h-6" />, desc: 'Give members self-serve access to digital passbooks, EMI schedules, and statements.', color: 'from-orange-400 to-amber-500 text-orange-600' }
              ].map((feature, i) => (
                <motion.div key={i} variants={fadeIn} className="group relative">
                  <div className="absolute inset-0 bg-white rounded-3xl -z-10 group-hover:scale-[1.02] transition-transform duration-500 ease-out shadow-lg shadow-slate-200/50 border border-slate-100" />

                  <div className="p-8 h-full flex flex-col items-start text-left space-y-6">
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${feature.color.split(' ').slice(0, 2).join(' ')} bg-opacity-10 shadow-sm border border-${feature.color.split(' ')[2].split('-')[1]}-100`}>
                      <div className={feature.color.split(' ').pop()}>{feature.icon}</div>
                    </div>
                    <div>
                      <h3 className="font-bold text-2xl tracking-tight text-slate-900 mb-3">{feature.title}</h3>
                      <p className="text-slate-600 leading-relaxed font-light">{feature.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Call to Action Bar */}
        <section className="py-24 px-6 relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-5xl mx-auto bg-slate-900 border border-slate-800 p-12 md:p-16 rounded-[3rem] text-center shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/20 blur-[100px] rounded-full pointer-events-none" />

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight relative z-10">Ready to modernize your operations?</h2>
            <p className="text-xl text-slate-300 font-light max-w-2xl mx-auto mb-10 relative z-10">Join the growing network of cooperatives running efficiently on Sahayog AI.</p>

            <div className="relative z-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="h-14 px-10 text-lg font-bold rounded-full bg-white text-slate-900 hover:bg-slate-100 transition-all shadow-xl hover:shadow-2xl">
                  Create Your Workspace
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

      </main>

      <footer className="border-t border-slate-200 py-12 px-6 bg-white relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity">
            <span className="font-bold text-xl tracking-tight text-slate-900">Sahayog <span className="text-blue-600 font-semibold">AI</span></span>
          </div>
          <p className="text-slate-500 font-medium text-sm">© {new Date().getFullYear()} Sentient Digital. All rights reserved.</p>
          <div className="flex gap-6 text-sm font-medium text-slate-500">
            <Link href="#" className="hover:text-slate-900 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
