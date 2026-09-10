"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Box,
  Cpu,
  Layers,
  Sparkles,
  AlertCircle,
  Loader2,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal";

const CORPORATE_PERSONAS = [
  {
    name: "Dharun Kumar",
    email: "dharunkumar.j@solidpro-es.com",
    role: "System Admin",
    badge: "ADMIN",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
  },
  {
    name: "Jothi Bash",
    email: "jothibash.n@solidpro-es.com",
    role: "QC & Batch Lead",
    badge: "LEAD",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    name: "Aathithya Kathiresan",
    email: "aathithyakathiresan.s@solidpro-es.com",
    role: "QC Lead",
    badge: "LEAD",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    name: "Keerthana A",
    email: "keerthana.a@solidpro-es.com",
    role: "QC Lead",
    badge: "LEAD",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    name: "Suchitra J",
    email: "suchitra.j@solidpro-es.com",
    role: "CAD Engineer",
    badge: "ENGINEER",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
  },
  {
    name: "Aafrin H",
    email: "zubaithaaafrin.h@solidpro-es.com",
    role: "CAD Engineer",
    badge: "ENGINEER",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
  },
  {
    name: "Vishnu R",
    email: "vishnu.r@solidpro-es.com",
    role: "CAD Engineer",
    badge: "ENGINEER",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
  },
  {
    name: "Godwin D",
    email: "godwinmanogin.d@solidpro-es.com",
    role: "CAD Engineer",
    badge: "ENGINEER",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
  },
  {
    name: "Shyam N",
    email: "shyamganesh.n@solidpro-es.com",
    role: "CAD Engineer",
    badge: "ENGINEER",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("dharunkumar.j@solidpro-es.com");
  const [password, setPassword] = useState("Welcome@123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email.trim().toLowerCase(), password);
      router.push("/");
    } catch (err: any) {
      setError(
        err?.message ||
          "Invalid email or password. Use default password Welcome@123 or reset via Forgot Password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPersona = (pEmail: string) => {
    setEmail(pEmail);
    setPassword("Welcome@123");
    setError(null);
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F8FAFC]">
      {/* LEFT SIDE: Solid Edge CAD Hero Visual (50% on desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 overflow-hidden flex-col justify-between p-12 text-white select-none">
        {/* Background CAD Image with Gradient Overlays */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/solidedge_cad_hero.jpg"
            alt="Siemens Solid Edge 3D CAD Sheet Metal Modeling & Inspection"
            fill
            priority
            className="object-cover object-center opacity-45 scale-105 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-blue-950/60" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.25),transparent_60%)]" />
        </div>

        {/* Top Header & Branding */}
        <div className="relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 ring-1 ring-white/20">
              <Box className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">C2L CAD QC</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Solid Edge Sync
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">SolidPro Engineering Solutions</p>
            </div>
          </div>

          <div className="mt-8 max-w-lg">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold mb-4 backdrop-blur-xs">
              <Cpu className="w-3.5 h-3.5" />
              <span>Solid Edge 3D CAD Automation & Batch Control</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight">
              Precision CAD Cleanup, Audit & Quality Control Pipeline
            </h1>
            <p className="text-sm text-slate-300 mt-3 leading-relaxed">
              Industrial batch workflow automation platform for Siemens Solid Edge CAD models, sheet metal sheet inspection, master worklogs, and team performance tracking.
            </p>
          </div>
        </div>

        {/* Middle Feature Chips */}
        <div className="relative z-10 grid grid-cols-2 gap-4 max-w-lg my-6">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold mb-1">
              <Layers className="w-4 h-4" />
              <span>165+ Batch Statuses</span>
            </div>
            <p className="text-xs text-slate-300">
              Live phase tracking from In-Progress to Hold & Completed.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>QC Auditing & Issues</span>
            </div>
            <p className="text-xs text-slate-300">
              Direct QC reference logs with role-based owner visibility.
            </p>
          </div>
        </div>

        {/* Bottom Status / Footer */}
        <div className="relative z-10 border-t border-white/10 pt-6 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>FastAPI & Next.js Core Online</span>
          </div>
          <span>v2.4 Enterprise Edition</span>
        </div>
      </div>

      {/* RIGHT SIDE: Shadcn-Styled Authentication Form (50% on desktop) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-16 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo Branding */}
          <div className="lg:hidden flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md text-white">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base text-slate-900">C2L CAD QC Portal</span>
              <p className="text-xs text-slate-500">SolidPro Engineering Solutions</p>
            </div>
          </div>

          {/* Form Header */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Sign In to Your Workspace
            </h2>
            <p className="text-xs text-slate-600">
              Enter your corporate <code className="text-blue-700 font-semibold">@solidpro-es.com</code> credentials below.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* Form Container (Shadcn style card) */}
          <form
            onSubmit={handleLogin}
            className="space-y-4 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-sm"
          >
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@solidpro-es.com"
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span className="text-xs text-slate-600 font-medium">Keep me signed in</span>
              </label>

              <span className="text-[11px] text-slate-400">
                Default: <span className="font-mono text-slate-600">Welcome@123</span>
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Persona Selector for Testing */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Quick Team Persona Autofill</span>
              </span>
              <span className="text-[11px] text-slate-400">Click to test roles</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CORPORATE_PERSONAS.map((p) => {
                const isSelected = email === p.email;
                return (
                  <button
                    key={p.email}
                    type="button"
                    onClick={() => handleSelectPersona(p.email)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 border-blue-500 shadow-xs ring-1 ring-blue-400"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${p.badgeColor}`}
                      >
                        {p.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        defaultEmail={email}
        onSuccessReset={(newEmail) => {
          setEmail(newEmail);
        }}
      />
    </div>
  );
}
