import React, { useState, useEffect, useContext, createContext, useRef, useMemo } from "react";
import axios from "axios";
import {
  BookOpen, Mic, BarChart3, FileText, User, Shield, LogOut, Search, Moon, Sun,
  Plus, Pencil, Trash2, X, CheckCircle2, Clock, Flame, TrendingUp, Upload, ChevronRight,
  ChevronLeft, Menu, Eye, EyeOff, Mail, Lock, ArrowRight, Target,
  Users, Filter, ChevronDown, Loader2, Sparkles, Calendar,
  LayoutDashboard, PlayCircle, RotateCcw, Trophy, AlertCircle
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "./services/questionService";
import { getMyProfile, updateMyProfile, changeMyPassword } from "./services/profileService";
import { getDashboard } from "./services/dashboardService";
import { startInterview, completeInterview, getInterviewHistory } from "./services/interviewService";
import { analyzeResume, getResumeHistory, deleteResumeAnalysis } from "./services/resumeService";
import { getAdminStats, getAdminUsers } from "./services/adminService";
import {
  formatEnumValue,
  formatCategory,
  formatStatus,
  toBackendEnum,
  toQuestionRequest,
  formatQuestionResponse,
} from "./utils/questionUtils";

/* ======================================================================
   DESIGN TOKENS
   Primary: teal-600  (confidence / growth / "ready")
   Accent:  orange-500 (streaks, CTAs, energy)
   Ink:     slate-900/950 (dark surfaces, headings)
   Surface: stone-50 (warm off-white canvas)
   Display face: Space Grotesk · Body: Inter · Data/mono: JetBrains Mono
   ====================================================================== */

const FONTS = (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');
    .font-display{ font-family:'Space Grotesk', sans-serif; }
    .font-body{ font-family:'Inter', sans-serif; }
    .font-mono{ font-family:'JetBrains Mono', monospace; }
    * { scrollbar-width: thin; }
    .sit-scroll::-webkit-scrollbar{ width:6px; height:6px; }
    .sit-scroll::-webkit-scrollbar-thumb{ background:#94a3b8; border-radius:4px; }
    @keyframes sitFadeUp {
      from { opacity:0; transform:translateY(10px); }
      to { opacity:1; transform:translateY(0); }
    }
    @keyframes sitPageIn {
      from { opacity:0; transform:translateY(6px); }
      to { opacity:1; transform:translateY(0); }
    }
    @keyframes sitPop {
      0% { opacity:0; transform:scale(.96); }
      100% { opacity:1; transform:scale(1); }
    }
    .sit-fade-up{ animation:sitFadeUp .32s cubic-bezier(.2,.8,.2,1) both; }
    .sit-page{ animation:sitPageIn .24s ease-out both; }
    .sit-pop{ animation:sitPop .24s ease-out both; }
    .sit-lift{
      transition:transform .2s ease, box-shadow .2s ease, border-color .2s ease;
    }
    .sit-lift:hover{ transform:translateY(-2px); }
    .sit-press{ transition:transform .12s ease, opacity .15s ease; }
    .sit-press:active{ transform:scale(.98); }
    .sit-stagger > *{ animation:sitFadeUp .36s ease-out both; }
    .sit-stagger > *:nth-child(1){ animation-delay:.02s; }
    .sit-stagger > *:nth-child(2){ animation-delay:.07s; }
    .sit-stagger > *:nth-child(3){ animation-delay:.12s; }
    .sit-stagger > *:nth-child(4){ animation-delay:.17s; }
    @media (prefers-reduced-motion: reduce) {
      .sit-fade-up,.sit-page,.sit-pop,.sit-stagger > *{
        animation:none !important;
      }
      .sit-lift,.sit-press,*{
        scroll-behavior:auto !important;
      }
      .sit-lift:hover,.sit-press:active{
        transform:none !important;
      }
    }
  `}</style>
);

/* ---------------------------- UI constants ----------------------------- */

const CATEGORIES = ["Java", "Spring Boot", "SQL", "React", "DSA", "System Design"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const STATUSES = ["Not Started", "Practicing", "Completed"];


const CATEGORY_COLORS = {
  Java: "#0d9488", "Spring Boot": "#f97316", SQL: "#0ea5e9", React: "#8b5cf6",
  DSA: "#f43f5e", "System Design": "#eab308",
};




const uid = () => Math.random().toString(36).slice(2, 10);

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function getStoredAuth() {
  const raw =
    localStorage.getItem("sit_auth") ||
    sessionStorage.getItem("sit_auth");

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem("sit_auth");
    sessionStorage.removeItem("sit_auth");
    return null;
  }
}

function applyAuthToken(token) {
  if (token) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common.Authorization;
  }
}

function getInitials(name = "") {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "U";
}

/* ---------------------------- App context ------------------------------ */

const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

/* ============================== Shared UI =============================== */

function Badge({ children, tone = "slate", dark }) {
  const tones = {
    slate: dark ? "bg-slate-800 text-slate-300 border-slate-700" : "bg-slate-100 text-slate-600 border-slate-200",
    teal: dark ? "bg-teal-900/40 text-teal-300 border-teal-800" : "bg-teal-50 text-teal-700 border-teal-200",
    orange: dark ? "bg-orange-900/40 text-orange-300 border-orange-800" : "bg-orange-50 text-orange-700 border-orange-200",
    rose: dark ? "bg-rose-900/40 text-rose-300 border-rose-800" : "bg-rose-50 text-rose-700 border-rose-200",
    amber: dark ? "bg-amber-900/40 text-amber-300 border-amber-800" : "bg-amber-50 text-amber-700 border-amber-200",
    sky: dark ? "bg-sky-900/40 text-sky-300 border-sky-800" : "bg-sky-50 text-sky-700 border-sky-200",
    violet: dark ? "bg-violet-900/40 text-violet-300 border-violet-800" : "bg-violet-50 text-violet-700 border-violet-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${tones[tone] || tones.slate}`}>
      {children}
    </span>
  );
}

function difficultyTone(d) { return d === "Easy" ? "teal" : d === "Medium" ? "amber" : "rose"; }
function statusTone(s) { return s === "Completed" ? "teal" : s === "Practicing" ? "sky" : "slate"; }
function categoryTone(c) {
  return { Java: "orange", "Spring Boot": "teal", SQL: "sky", React: "violet", DSA: "rose", "System Design": "amber" }[c] || "slate";
}

function Spinner({ size = 18, className = "" }) {
  return <Loader2 size={size} className={`animate-spin ${className}`} />;
}

function ProgressBar({ value, dark, tone = "teal" }) {
  const toneMap = { teal: "bg-teal-600", orange: "bg-orange-500" };
  return (
    <div className={`w-full h-2 rounded-full overflow-hidden ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
      <div className={`h-full rounded-full ${toneMap[tone]} transition-all duration-500`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

/* Signature element: circular "readiness ring" gauge */
function ReadinessRing({ value, size = 132, dark, label = "Ready" }) {
  const target = Number.isFinite(Number(value)) ? Math.max(0, Math.min(100, Number(value))) : 0;
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    if (reduceMotion) {
      setAnimatedValue(target);
      return;
    }

    let frame;
    const startedAt = performance.now();
    const duration = 650;

    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(Math.round(target * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    setAnimatedValue(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (animatedValue / 100) * c;

  return (
    <div className="relative flex items-center justify-center sit-pop" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={dark ? "#1e293b" : "#e2e8f0"} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#f97316"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset .12s linear" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`font-display text-3xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>{animatedValue}%</span>
        <span className={`text-xs font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>{label}</span>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, tone = "teal", dark }) {
  const toneBg = { teal: dark ? "bg-teal-900/40 text-teal-400" : "bg-teal-50 text-teal-600",
    orange: dark ? "bg-orange-900/40 text-orange-400" : "bg-orange-50 text-orange-600",
    sky: dark ? "bg-sky-900/40 text-sky-400" : "bg-sky-50 text-sky-600",
    violet: dark ? "bg-violet-900/40 text-violet-400" : "bg-violet-50 text-violet-600" }[tone];
  return (
    <div className={`rounded-2xl border p-5 sit-lift ${dark ? "bg-slate-900 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:border-slate-300"} shadow-sm hover:shadow-md`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${toneBg}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className={`font-display text-2xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>{value}</p>
      <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
      {sub && <p className={`text-xs mt-1 font-medium ${dark ? "text-teal-400" : "text-teal-600"}`}>{sub}</p>}
    </div>
  );
}

function Modal({ title, onClose, children, dark, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-2xl border shadow-xl sit-fade-up max-h-[85vh] overflow-y-auto sit-scroll ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b sticky top-0 ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <h3 className={`font-display font-semibold text-lg ${dark ? "text-white" : "text-slate-900"}`}>{title}</h3>
          <button onClick={onClose} aria-label="Close dialog" className={`w-9 h-9 rounded-lg flex items-center justify-center hover:bg-slate-100 ${dark ? "hover:bg-slate-800 text-slate-400" : "text-slate-500"}`}>
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function ToastStack() {
  const { toasts } = useApp();
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-72">
      {toasts.map((t) => (
        <div key={t.id} className={`sit-fade-up flex items-start gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
          t.type === "error" ? "bg-rose-600 text-white border-rose-700" : "bg-slate-900 text-white border-slate-800"
        }`}>
          {t.type === "error" ? <AlertCircle size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-teal-400" />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

function Field({ label, children, dark }) {
  return (
    <label className="block mb-4">
      <span className={`block text-sm font-medium mb-1.5 ${dark ? "text-slate-300" : "text-slate-700"}`}>{label}</span>
      {children}
    </label>
  );
}

function inputCls(dark) {
  return `w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 ${
    dark
      ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
      : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
  }`;
}

function Pagination({ page, totalPages, onChange, dark }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1.5 mt-6">
      <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}
        className={`w-9 h-9 rounded-lg flex items-center justify-center border disabled:opacity-40 ${dark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
        <ChevronLeft size={16} />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <button key={n} onClick={() => onChange(n)}
          className={`w-9 h-9 rounded-lg text-sm font-medium border ${n === page ? "bg-teal-600 text-white border-teal-600" : dark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
          {n}
        </button>
      ))}
      <button onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
        className={`w-9 h-9 rounded-lg flex items-center justify-center border disabled:opacity-40 ${dark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function EmptyState({ icon: Icon, title, sub, dark }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-dashed ${dark ? "border-slate-700" : "border-slate-300"}`}>
      <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${dark ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-400"}`}>
        <Icon size={24} />
      </div>
      <p className={`font-display font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{title}</p>
      <p className={`text-sm mt-1 max-w-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{sub}</p>
    </div>
  );
}

/* ============================== Landing page ============================= */

function LandingPage() {
  const { setPage, dark, toggleDark } = useApp();
  const features = [
    { icon: BookOpen, title: "Question Management", desc: "Organize, tag, and track every interview question by category, difficulty, and status." },
    { icon: TrendingUp, title: "Progress Tracking", desc: "See your preparation percentage and streak climb with every practice session." },
    { icon: Mic, title: "Mock Interviews", desc: "Timed, simulated interviews across Java, Spring Boot, SQL, and React." },
    { icon: BarChart3, title: "Performance Analytics", desc: "Weekly activity trends and category breakdowns, visualized clearly." },
    { icon: FileText, title: "Resume Analysis", desc: "Upload your resume and get a readiness score with concrete suggestions." },
  ];
  return (
    <div className={`min-h-screen font-body ${dark ? "bg-slate-950 text-slate-100" : "bg-stone-50 text-slate-900"}`}>
      {/* Nav */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur ${dark ? "bg-slate-950/80 border-slate-800" : "bg-stone-50/80 border-slate-200"}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-display font-bold text-lg">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <Target size={18} />
            </div>
            Smart Interview Tracker
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleDark} aria-label="Toggle dark mode" className={`w-9 h-9 rounded-lg flex items-center justify-center border ${dark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-white"}`}>
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={() => setPage("login")} className={`hidden sm:inline-flex px-4 py-2 rounded-lg text-sm font-medium ${dark ? "text-slate-200 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"}`}>Login</button>
            <button onClick={() => setPage("register")} className="px-4 py-2 rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 transition-colors sit-press">Start Preparing</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <Badge tone="orange">
            <Flame size={12} /> Built for job-seeking developers
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl font-bold leading-[1.1] mt-5">
            Prepare Smarter. <span className="text-teal-600">Crack Interviews</span> Faster.
          </h1>
          <p className={`mt-5 text-lg leading-relaxed max-w-lg ${dark ? "text-slate-400" : "text-slate-600"}`}>
            Track your preparation, practice interview questions, and improve your success rate with an intelligent interview management platform.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => setPage("register")} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-sm sit-press">
              Start Preparing <ArrowRight size={16} />
            </button>
            <button onClick={() => setPage("login")} className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border transition-colors ${dark ? "border-slate-700 text-slate-200 hover:bg-slate-900" : "border-slate-300 text-slate-700 hover:bg-white"}`}>
              Login
            </button>
          </div>
          <div className="mt-10 flex items-center gap-8">
            {[["6", "tech tracks"], ["10", "Qs per mock round"], ["24/7", "practice access"]].map(([n, l]) => (
              <div key={l}>
                <p className="font-display text-2xl font-bold">{n}</p>
                <p className={`text-xs ${dark ? "text-slate-500" : "text-slate-500"}`}>{l}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className={`rounded-2xl border shadow-xl p-6 ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className="flex items-center justify-between mb-6">
              <p className="font-display font-semibold">Preparation workspace preview</p>
              <Badge tone="teal"><Target size={12} /> Sample preview</Badge>
            </div>
            <div className="flex items-center justify-center py-4">
              <ReadinessRing value={78} dark={dark} />
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {["Java", "React", "SQL"].map((c) => (
                <div key={c} className={`rounded-xl p-3 text-center border ${dark ? "bg-slate-800/60 border-slate-700" : "bg-stone-50 border-slate-200"}`}>
                  <p className="font-display font-bold text-sm">{c}</p>
                  <p className={`text-xs mt-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>on track</p>
                </div>
              ))}
            </div>
          </div>
          <div className={`absolute -bottom-5 -left-5 rounded-xl border shadow-lg px-4 py-3 hidden sm:flex items-center gap-2 ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <Trophy size={18} className="text-orange-500" />
            <div>
              <p className="text-xs font-semibold">Mock interview feedback</p>
              <p className={`text-[11px] ${dark ? "text-slate-500" : "text-slate-500"}`}>Timed practice · saved history</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={`border-y ${dark ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-white"}`}>
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="font-display text-2xl font-bold text-center">Everything you need to walk in ready</h2>
          <p className={`text-center mt-2 ${dark ? "text-slate-400" : "text-slate-500"}`}>One workspace for questions, mocks, analytics, and your resume.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
            {features.map((f) => (
              <div key={f.title} className={`rounded-2xl border p-6 sit-lift hover:shadow-md ${dark ? "bg-slate-900 border-slate-800 hover:border-slate-700" : "bg-stone-50 border-slate-200 hover:border-slate-300"}`}>
                <div className="w-10 h-10 rounded-xl bg-teal-600/10 text-teal-600 flex items-center justify-center mb-4">
                  <f.icon size={20} />
                </div>
                <p className="font-display font-semibold">{f.title}</p>
                <p className={`text-sm mt-1.5 leading-relaxed ${dark ? "text-slate-400" : "text-slate-600"}`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="max-w-6xl mx-auto px-6 py-16 sit-page">
        <div className="text-center max-w-2xl mx-auto">
          <Badge tone="teal">One preparation workflow</Badge>
          <h2 className="font-display text-2xl font-bold mt-4">Practice, measure, improve, repeat</h2>
          <p className={`mt-2 ${dark ? "text-slate-400" : "text-slate-500"}`}>
            Your questions, mock interviews, resume checks, and progress stay connected in one workspace.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5 mt-10 sit-stagger">
          {[
            ["1", "Build your question bank", "Save the topics you need to prepare and track each question from not started to completed."],
            ["2", "Test yourself", "Run timed mock interviews and keep your interview history tied to your account."],
            ["3", "Measure progress", "Use dashboard activity and resume analysis to decide what to work on next."],
          ].map(([step, title, desc]) => (
            <div key={step} className={`rounded-2xl border p-6 sit-lift hover:shadow-md ${dark ? "bg-slate-900 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:border-slate-300"}`}>
              <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center font-display font-bold text-sm">{step}</div>
              <h3 className="font-display font-semibold mt-4">{title}</h3>
              <p className={`text-sm mt-2 leading-relaxed ${dark ? "text-slate-400" : "text-slate-600"}`}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t ${dark ? "border-slate-800" : "border-slate-200"}`}>
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-display font-semibold">
            <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center"><Target size={14} /></div>
            Smart Interview Tracker
          </div>
          <p className={`text-xs ${dark ? "text-slate-500" : "text-slate-500"}`}>Java full-stack interview preparation platform</p>
        </div>
      </footer>
    </div>
  );
}

/* ============================== Auth pages ============================= */

function AuthShell({ title, subtitle, children, dark }) {
  return (
    <div className={`min-h-screen font-body flex items-center justify-center p-6 ${dark ? "bg-slate-950 text-slate-100" : "bg-stone-50 text-slate-900"}`}>
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 font-display font-bold text-lg justify-center mb-8">
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center"><Target size={18} /></div>
          Smart Interview Tracker
        </div>
        <div className={`rounded-2xl border shadow-sm p-7 ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <h1 className="font-display text-xl font-bold">{title}</h1>
          <p className={`text-sm mt-1 mb-6 ${dark ? "text-slate-400" : "text-slate-500"}`}>{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

function LoginPage() {
  const { setPage, dark, loginUser, showToast } = useApp();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();

    const errs = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      errs.email = "Enter a valid email address.";
    }
    if (!pwd) {
      errs.pwd = "Password is required.";
    }

    setErrors(errs);
    if (Object.keys(errs).length) return;

    try {
      setLoading(true);
      await loginUser(email, pwd, remember);
    } catch (error) {
      const message =
        error.response?.status === 401 || error.response?.status === 403
          ? "Invalid email or password."
          : error.response?.data?.message ||
            "Unable to login. Please check that the backend is running.";

      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue your preparation." dark={dark}>
      <form onSubmit={submit} noValidate>
        <Field label="Email" dark={dark}>
          <div className="relative">
            <Mail size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? "text-slate-500" : "text-slate-400"}`} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputCls(dark)} pl-9`}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
        </Field>

        <Field label="Password" dark={dark}>
          <div className="relative">
            <Lock size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? "text-slate-500" : "text-slate-400"}`} />
            <input
              type={showPwd ? "text" : "password"}
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              className={`${inputCls(dark)} pl-9 pr-9`}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              aria-label={showPwd ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.pwd && <p className="text-xs text-rose-500 mt-1">{errors.pwd}</p>}
        </Field>

        <div className="flex items-center justify-between mb-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded accent-teal-600"
            />
            Remember me
          </label>
          <span className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>
            JWT secured
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading ? <Spinner size={16} /> : "Login"}
        </button>
      </form>

      <p className={`text-sm text-center mt-6 ${dark ? "text-slate-400" : "text-slate-500"}`}>
        Don't have an account?{" "}
        <button onClick={() => setPage("register")} className="font-medium text-teal-600 hover:underline">
          Register
        </button>
      </p>
    </AuthShell>
  );
}

function RegisterPage() {
  const { setPage, dark, registerUser, showToast } = useApp();
  const [form, setForm] = useState({ name: "", email: "", pwd: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();

    const errs = {};
    if (!form.name.trim()) errs.name = "Full name is required.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Enter a valid email address.";
    if (form.pwd.length < 8) errs.pwd = "Password must be at least 8 characters.";
    if (form.confirm !== form.pwd) errs.confirm = "Passwords don't match.";

    setErrors(errs);
    if (Object.keys(errs).length) return;

    try {
      setLoading(true);
      await registerUser(form.name, form.email, form.pwd);
    } catch (error) {
      const backendMessage =
        error.response?.data?.message ||
        error.response?.data?.error;

      const message =
        error.response?.status === 400
          ? backendMessage || "Please check the registration details."
          : backendMessage || "Unable to create account. Please try again.";

      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Start tracking your interview preparation today." dark={dark}>
      <form onSubmit={submit} noValidate>
        <Field label="Full name" dark={dark}>
          <input
            value={form.name}
            onChange={set("name")}
            className={inputCls(dark)}
            placeholder="Your name"
            autoComplete="name"
          />
          {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
        </Field>

        <Field label="Email" dark={dark}>
          <input
            type="email"
            value={form.email}
            onChange={set("email")}
            className={inputCls(dark)}
            placeholder="you@example.com"
            autoComplete="email"
          />
          {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
        </Field>

        <Field label="Password" dark={dark}>
          <input
            type="password"
            value={form.pwd}
            onChange={set("pwd")}
            className={inputCls(dark)}
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
          />
          {errors.pwd && <p className="text-xs text-rose-500 mt-1">{errors.pwd}</p>}
        </Field>

        <Field label="Confirm password" dark={dark}>
          <input
            type="password"
            value={form.confirm}
            onChange={set("confirm")}
            className={inputCls(dark)}
            placeholder="Repeat password"
            autoComplete="new-password"
          />
          {errors.confirm && <p className="text-xs text-rose-500 mt-1">{errors.confirm}</p>}
        </Field>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
        >
          {loading ? <Spinner size={16} /> : "Register"}
        </button>
      </form>

      <p className={`text-sm text-center mt-6 ${dark ? "text-slate-400" : "text-slate-500"}`}>
        Already have an account?{" "}
        <button onClick={() => setPage("login")} className="font-medium text-teal-600 hover:underline">
          Login
        </button>
      </p>
    </AuthShell>
  );
}

/* ============================== App shell =============================== */

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "questions", label: "Questions", icon: BookOpen },
  { key: "mock-interview", label: "Mock Interview", icon: Mic },
  { key: "history", label: "History", icon: Clock },
  { key: "resume", label: "Resume Analyzer", icon: FileText },
  { key: "profile", label: "Profile", icon: User },
  { key: "admin", label: "Admin", icon: Shield },
];

function Sidebar({ mobileOpen, setMobileOpen }) {
  const { page, setPage, dark, logout, authUser } = useApp();
  const nav = (key) => {
    setPage(key);
    setMobileOpen(false);
  };

  const visibleNavItems =
    authUser?.role === "ADMIN"
      ? NAV_ITEMS
      : NAV_ITEMS.filter((item) => item.key !== "admin");

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`fixed lg:sticky top-0 h-screen z-40 w-64 shrink-0 border-r flex flex-col transition-transform duration-200 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <div
          className="h-16 flex items-center gap-2 px-5 border-b shrink-0"
          style={{ borderColor: dark ? "#1e293b" : "#e2e8f0" }}
        >
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
            <Target size={18} />
          </div>
          <span className="font-display font-bold">Interview Tracker</span>
        </div>

        <nav className="flex-1 overflow-y-auto sit-scroll px-3 py-4 space-y-1">
          {visibleNavItems.map((item) => {
            const active = page === item.key;

            return (
              <button
                key={item.key}
                onClick={() => nav(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-teal-600 text-white"
                    : dark
                      ? "text-slate-300 hover:bg-slate-800"
                      : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <item.icon size={17} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div
          className="p-3 border-t"
          style={{ borderColor: dark ? "#1e293b" : "#e2e8f0" }}
        >
          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
              dark
                ? "text-slate-300 hover:bg-slate-800"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <LogOut size={17} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}

function Topbar({ setMobileOpen }) {
  const { dark, toggleDark, authUser, setPage, page } = useApp();
  const [profileOpen, setProfileOpen] = useState(false);

  const pageTitle = {
    dashboard: "Dashboard",
    questions: "Question Bank",
    "mock-interview": "Mock Interview",
    history: "Interview History",
    resume: "Resume Analyzer",
    profile: "Profile",
    admin: "Admin Dashboard",
  }[page] || "Smart Interview Tracker";

  return (
    <header className={`h-16 sticky top-0 z-20 flex items-center gap-3 px-4 sm:px-6 border-b backdrop-blur ${dark ? "bg-slate-950/90 border-slate-800" : "bg-stone-50/90 border-slate-200"}`}>
      <button
        onClick={() => setMobileOpen(true)}
        className={`lg:hidden w-9 h-9 rounded-lg flex items-center justify-center border sit-press ${dark ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-600"}`}
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      <div className="min-w-0">
        <p className={`text-[11px] uppercase tracking-[0.16em] font-semibold ${dark ? "text-slate-500" : "text-slate-400"}`}>
          Smart Interview Tracker
        </p>
        <p className="font-display font-semibold truncate">{pageTitle}</p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={toggleDark}
          aria-label="Toggle dark mode"
          className={`w-9 h-9 rounded-lg flex items-center justify-center border sit-press ${dark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-white"}`}
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setProfileOpen((value) => !value)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-800/10 sit-press"
            aria-label="Open profile menu"
          >
            <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-semibold">
              {getInitials(authUser?.name)}
            </div>
            <ChevronDown size={14} className={dark ? "text-slate-400" : "text-slate-500"} />
          </button>

          {profileOpen && (
            <div className={`absolute right-0 mt-2 w-52 rounded-xl border shadow-lg sit-pop overflow-hidden ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className={`px-4 py-3 border-b ${dark ? "border-slate-800" : "border-slate-200"}`}>
                <p className="text-sm font-semibold truncate">{authUser?.name || "User"}</p>
                <p className={`text-xs truncate ${dark ? "text-slate-500" : "text-slate-500"}`}>{authUser?.email || ""}</p>
              </div>
              <button
                onClick={() => {
                  setPage("profile");
                  setProfileOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm ${dark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-50 text-slate-600"}`}
              >
                View profile
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function AppShell({ children }) {
  const { dark, page } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={`min-h-screen font-body flex ${dark ? "bg-slate-950 text-slate-100" : "bg-stone-50 text-slate-900"}`}>
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar setMobileOpen={setMobileOpen} />
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          <div key={page} className="sit-page">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ============================== Dashboard =============================== */

function DashboardPage() {
  const { dark, setPage, authUser, dashboardData, dashboardLoading, dashboardError } = useApp();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  if (dashboardLoading) return <div className="flex justify-center items-center min-h-[300px]"><Spinner size={28} /></div>;
  if (dashboardError) return <EmptyState icon={AlertCircle} title="Unable to load dashboard" sub={dashboardError} dark={dark} />;
  const data = dashboardData || {totalQuestions:0,completed:0,practicing:0,notStarted:0,preparationPercentage:0,interviewsCompleted:0,currentStreak:0,categoryDistribution:[],weeklyActivity:[],recentActivity:[]};
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="font-display text-2xl font-bold">{greeting}, {authUser?.name?.split(" ")[0] || "there"} 👋</h1><p className={`text-sm mt-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>Your live preparation progress.</p></div><button onClick={() => setPage("mock-interview")} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold bg-orange-500 text-white hover:bg-orange-600 text-sm"><PlayCircle size={16}/> Start Mock Interview</button></div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 sit-stagger"><StatCard icon={BookOpen} label="Total Questions" value={data.totalQuestions} sub={`${data.completed} completed`} tone="teal" dark={dark}/><StatCard icon={Mic} label="Interviews Completed" value={data.interviewsCompleted} sub="Saved mock sessions" tone="sky" dark={dark}/><StatCard icon={Flame} label="Current Streak" value={`${data.currentStreak} days`} sub="Based on question activity" tone="orange" dark={dark}/><StatCard icon={Target} label="Preparation Percentage" value={`${data.preparationPercentage}%`} sub={`${data.practicing} practicing`} tone="violet" dark={dark}/></div>
      <div className="grid lg:grid-cols-3 gap-4"><div className={`rounded-2xl border p-5 lg:col-span-2 ${dark?"bg-slate-900 border-slate-800":"bg-white border-slate-200"}`}><p className="font-display font-semibold mb-4">Weekly question activity</p><div style={{width:"100%",height:240}}><ResponsiveContainer><LineChart data={data.weeklyActivity||[]} margin={{left:-20,right:10}}><CartesianGrid strokeDasharray="3 3" stroke={dark?"#1e293b":"#e2e8f0"} vertical={false}/><XAxis dataKey="day" stroke={dark?"#64748b":"#94a3b8"} fontSize={12} tickLine={false} axisLine={false}/><YAxis allowDecimals={false} stroke={dark?"#64748b":"#94a3b8"} fontSize={12} tickLine={false} axisLine={false}/><Tooltip/><Line type="monotone" dataKey="questions" stroke="#0d9488" strokeWidth={2.5} dot={{r:4,fill:"#0d9488"}}/></LineChart></ResponsiveContainer></div></div><div className={`rounded-2xl border p-5 flex flex-col items-center justify-center ${dark?"bg-slate-900 border-slate-800":"bg-white border-slate-200"}`}><p className="font-display font-semibold self-start mb-2">Readiness</p><ReadinessRing value={data.preparationPercentage} dark={dark}/><p className={`text-xs mt-4 ${dark?"text-slate-400":"text-slate-500"}`}>{data.notStarted+data.practicing} questions still in progress</p></div></div>
      <div className="grid lg:grid-cols-3 gap-4"><div className={`rounded-2xl border p-5 lg:col-span-2 ${dark?"bg-slate-900 border-slate-800":"bg-white border-slate-200"}`}><p className="font-display font-semibold mb-4">Question category distribution</p>{data.categoryDistribution?.length?<div style={{width:"100%",height:240}}><ResponsiveContainer><PieChart><Pie data={data.categoryDistribution} dataKey="count" nameKey="category" innerRadius={55} outerRadius={85}>{data.categoryDistribution.map(x=><Cell key={x.category} fill={CATEGORY_COLORS[x.category]||"#64748b"}/>)}</Pie><Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle"/><Tooltip/></PieChart></ResponsiveContainer></div>:<p className="text-sm py-16 text-center text-slate-400">Add questions to see category distribution.</p>}</div><div className={`rounded-2xl border p-5 ${dark?"bg-slate-900 border-slate-800":"bg-white border-slate-200"}`}><p className="font-display font-semibold mb-4">Recent activity</p><ul className="space-y-4">{(data.recentActivity||[]).map(x=><li key={x.questionId} className="flex gap-3"><CheckCircle2 size={16} className="text-teal-600 shrink-0 mt-0.5"/><div><p className="text-sm line-clamp-2">{x.text}</p><p className="text-xs text-slate-400 mt-0.5">{x.status}</p></div></li>)}</ul></div></div>
    </div>
  );
}

/* ============================== Questions page ============================ */

function QuestionCard({ q, onEdit, onDelete, dark }) {
  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-3 sit-fade-up sit-lift ${dark ? "bg-slate-900 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:border-slate-300"} hover:shadow-md`}>
      <p className={`text-sm font-medium leading-relaxed ${dark ? "text-slate-100" : "text-slate-800"}`}>{q.question}</p>
      <div className="flex flex-wrap gap-1.5">
        <Badge tone={categoryTone(q.category)}>{q.category}</Badge>
        <Badge tone={difficultyTone(q.difficulty)}>{q.difficulty}</Badge>
        <Badge tone={statusTone(q.status)}>{q.status}</Badge>
      </div>
      <div className="flex gap-2 mt-1 pt-3 border-t" style={{ borderColor: dark ? "#1e293b" : "#e2e8f0" }}>
        <button onClick={() => onEdit(q)} className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border ${dark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
          <Pencil size={13} /> Edit
        </button>
        <button onClick={() => onDelete(q.id)} className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border border-rose-200 text-rose-600 hover:bg-rose-50 ${dark ? "border-rose-900/60 hover:bg-rose-900/20" : ""}`}>
          <Trash2 size={13} /> Delete
        </button>
      </div>
    </div>
  );
}

function QuestionFormFields({ form, setForm, dark }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <>
      <Field label="Question" dark={dark}>
        <textarea rows={3} value={form.question} onChange={set("question")} className={inputCls(dark)} placeholder="e.g. What is dependency injection in Spring?" />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Category" dark={dark}>
          <select value={form.category} onChange={set("category")} className={inputCls(dark)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Difficulty" dark={dark}>
          <select value={form.difficulty} onChange={set("difficulty")} className={inputCls(dark)}>
            {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="Status" dark={dark}>
          <select value={form.status} onChange={set("status")} className={inputCls(dark)}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>
    </>
  );
}

function QuestionsPage() {
 const {
   dark,
   questions,
   setQuestions,
   questionsLoading,
   questionsError,
   showToast,

   searchInput,
   setSearchInput,
   questionSearch,
   setQuestionSearch,
   questionCategory,
   setQuestionCategory,
   questionDifficulty,
   setQuestionDifficulty,
   questionStatus,
   setQuestionStatus,

   currentPage,
   setCurrentPage,
   totalPages,
   totalElements,
   setQuestionRefreshKey,

   questionSortBy,
   setQuestionSortBy,
   questionDirection,
   setQuestionDirection,
 } = useApp();




  const [modal, setModal] = useState(null); // { mode: 'add'|'edit', data }
  const [deleteId, setDeleteId] = useState(null);
  const perPage = 6;





  function openAdd() { setModal({ mode: "add", data: { question: "", category: "Java", difficulty: "Easy", status: "Not Started" } }); }
  function openEdit(q) { setModal({ mode: "edit", data: { ...q } }); }

  async function save(form) {
    if (!form.question.trim()) {
      showToast("Question text can't be empty.", "error");
      return;
    }

    try {
      const requestBody = toQuestionRequest(form);

      if (modal.mode === "add") {
        await createQuestion(requestBody);
        showToast("Question added.");
      } else {
        await updateQuestion(form.id, requestBody);
        showToast("Question updated.");
      }

      setModal(null);

      // Return to the first page and reload data from Spring Boot
      setCurrentPage(0);
      setQuestionRefreshKey((previousKey) => previousKey + 1);
    } catch (error) {
      console.error("Unable to save question:", error);
      showToast("Unable to save the question.", "error");
    }
  }

 async function confirmDelete() {
   try {
     await deleteQuestion(deleteId);

     setDeleteId(null);

     if (questions.length === 1 && currentPage > 0) {
       setCurrentPage((previousPage) => previousPage - 1);
     } else {
       setQuestionRefreshKey((previousKey) => previousKey + 1);
     }

     showToast("Question deleted.");
   } catch (error) {
     console.error("Unable to delete question:", error);
     showToast("Unable to delete the question.", "error");
   }
 }
  const selectCls = inputCls(dark) + " py-2";

  if (questionsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Spinner size={28} />
      </div>
    );
  }

  if (questionsError) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Unable to load questions"
        sub={questionsError}
        dark={dark}
      />
    );
  }



  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Question Bank</h1>
          <p className={`text-sm mt-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>{questions.length} of {totalElements} questions</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors text-sm">
          <Plus size={16} /> Add Question
        </button>
      </div>
<div
  className={`rounded-2xl border p-4 flex flex-col xl:flex-row gap-3 ${
    dark
      ? "bg-slate-900 border-slate-800"
      : "bg-white border-slate-200"
  }`}
>
<div className="flex flex-col sm:flex-row gap-2 flex-1 min-w-[320px]">
  <div className="relative flex-1">
    <Search
      size={18}
      className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
        dark ? "text-slate-500" : "text-slate-400"
      }`}
    />

    <input
      value={searchInput}
      onChange={(event) => {
        setSearchInput(event.target.value);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          setQuestionSearch(searchInput.trim());
           setCurrentPage(0);
        }
      }}
      placeholder="Search questions..."
      className={`${inputCls(dark)} pl-10 py-3`}
    />
  </div>

  <button
    type="button"
    onClick={() => {
      setQuestionSearch(searchInput.trim());
       setCurrentPage(0);
    }}
    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors"
  >
    <Search size={16} />
    Search
  </button>

  <button
    type="button"
    onClick={() => {
      setSearchInput("");
      setQuestionSearch("");
       setCurrentPage(0);
    }}
    className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
      dark
        ? "border-slate-700 text-slate-300 hover:bg-slate-800"
        : "border-slate-300 text-slate-700 hover:bg-slate-50"
    }`}
  >
    <X size={16} />
    Clear
  </button>
</div>
        <select
          value={questionCategory}
          onChange={(event) => {
            setQuestionCategory(event.target.value);
             setCurrentPage(0);
          }}
          className={selectCls}
        >
          <option>All</option>
          {CATEGORIES.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
        <select
          value={questionDifficulty}
          onChange={(event) => {
            setQuestionDifficulty(event.target.value);
             setCurrentPage(0);
          }}
          className={selectCls}
        >
          <option>All</option>
          {DIFFICULTIES.map((difficulty) => (
            <option key={difficulty}>{difficulty}</option>
          ))}
        </select>
        <select
          value={questionStatus}
          onChange={(event) => {
            setQuestionStatus(event.target.value);
             setCurrentPage(0);
          }}
          className={selectCls}
        >
          <option>All</option>
          {STATUSES.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
        <select
          value={`${questionSortBy}-${questionDirection}`}
          onChange={(event) => {
            const [sortBy, direction] = event.target.value.split("-");
            setQuestionSortBy(sortBy);
            setQuestionDirection(direction);
            setCurrentPage(0);
          }}
          className={selectCls}
          aria-label="Sort questions"
        >
          <option value="createdAt-desc">Newest first</option>
          <option value="createdAt-asc">Oldest first</option>
          <option value="category-asc">Category A-Z</option>
          <option value="difficulty-asc">Difficulty A-Z</option>
          <option value="status-asc">Status A-Z</option>
        </select>
      </div>

      {questions.length === 0 ? (
        <EmptyState icon={Filter} title="No questions found" sub="Try adjusting your filters or search terms, or add a new question." dark={dark} />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {questions.map((q) => (
            <QuestionCard key={q.id} q={q} onEdit={openEdit} onDelete={setDeleteId} dark={dark} />
          ))}
        </div>
      )}
      <Pagination
        page={currentPage + 1}
        totalPages={totalPages}
        onChange={(pageNumber) =>
          setCurrentPage(pageNumber - 1)
        }
        dark={dark}
      />

      {modal && (
        <Modal title={modal.mode === "add" ? "Add Question" : "Edit Question"} onClose={() => setModal(null)} dark={dark}>
          <QuestionFormBody initial={modal.data} onSave={save} onCancel={() => setModal(null)} dark={dark} />
        </Modal>
      )}

      {deleteId && (
        <Modal title="Delete question?" onClose={() => setDeleteId(null)} dark={dark}>
          <p className={`text-sm mb-6 ${dark ? "text-slate-400" : "text-slate-600"}`}>This action can't be undone. The question will be permanently removed from your bank.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteId(null)} className={`flex-1 py-2.5 rounded-lg text-sm font-medium border ${dark ? "border-slate-700 text-slate-300" : "border-slate-300 text-slate-700"}`}>Cancel</button>
            <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-rose-600 text-white hover:bg-rose-700">Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function QuestionFormBody({ initial, onSave, onCancel, dark }) {
  const [form, setForm] = useState(initial);
  return (
    <>
      <QuestionFormFields form={form} setForm={setForm} dark={dark} />
      <div className="flex gap-3 mt-2">
        <button onClick={onCancel} className={`flex-1 py-2.5 rounded-lg text-sm font-medium border ${dark ? "border-slate-700 text-slate-300" : "border-slate-300 text-slate-700"}`}>Cancel</button>
        <button onClick={() => onSave(form)} className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-700">Save</button>
      </div>
    </>
  );
}

/* ============================== Mock Interview ============================ */

function MockInterviewPage() {
  const { dark, showToast, setPage, setDashboardRefreshKey } = useApp();
  const [tech, setTech] = useState("Java");
  const [stage, setStage] = useState("setup"); // setup | active | result
  const [interview, setInterview] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [seconds, setSeconds] = useState(15 * 60);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const techs = ["Java", "Spring Boot", "SQL", "React"];

  const questionSet = interview?.questions || [];

  useEffect(() => {
    if (stage !== "active") return;

    if (seconds <= 0) {
      finish();
      return;
    }

    const timer = setInterval(
      () => setSeconds((current) => current - 1),
      1000
    );

    return () => clearInterval(timer);
  }, [stage, seconds]);

  async function start() {
    try {
      setStarting(true);

      const response = await startInterview(tech);

      setInterview(response.data);
      setIdx(0);
      setAnswers({});
      setSeconds(response.data.durationSeconds || 15 * 60);
      setResult(null);
      setStage("active");
    } catch (error) {
      showToast(
        error.response?.data?.message || "Unable to start interview.",
        "error"
      );
    } finally {
      setStarting(false);
    }
  }

  async function finish() {
    if (!interview || submitting || stage !== "active") return;

    try {
      setSubmitting(true);

      const answered = Object.values(answers)
        .filter((answer) => answer && answer.trim())
        .length;

      const elapsed = Math.max(
        0,
        (interview.durationSeconds || 15 * 60) - seconds
      );

      const response = await completeInterview(
        interview.interviewId,
        {
          answeredQuestions: answered,
          durationSeconds: elapsed,
        }
      );

      setResult(response.data);
      setStage("result");
      setDashboardRefreshKey((key) => key + 1);
    } catch (error) {
      showToast(
        error.response?.data?.message || "Unable to submit interview.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  const fmt = (value) =>
    `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(
      value % 60
    ).padStart(2, "0")}`;

  if (stage === "setup") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Mock Interview</h1>
          <p className={`text-sm mt-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>
            Choose a technology to start a timed, 10-question interview.
          </p>
        </div>

        <div className={`rounded-2xl border p-6 ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <p className="text-sm font-medium mb-3">Select technology</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {techs.map((item) => (
              <button
                key={item}
                onClick={() => setTech(item)}
                className={`py-3 rounded-xl border text-sm font-semibold transition-colors ${
                  tech === item
                    ? "bg-teal-600 border-teal-600 text-white"
                    : dark
                      ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className={`rounded-xl p-4 mb-6 text-sm flex gap-3 ${dark ? "bg-slate-800/60 text-slate-300" : "bg-stone-50 text-slate-600"}`}>
            <Clock size={16} className="shrink-0 mt-0.5" />
            <span>
              10 questions · 15 minutes · answers are currently scored by completion.
              Semantic/AI answer grading can be added in a later phase.
            </span>
          </div>

          <button
            onClick={start}
            disabled={starting}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-70"
          >
            {starting ? <Spinner size={18} /> : <PlayCircle size={18} />}
            {starting ? "Starting..." : "Start Interview"}
          </button>
        </div>
      </div>
    );
  }

  if (stage === "result" && result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className={`rounded-2xl border p-8 text-center ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex justify-center mb-4">
            <ReadinessRing value={result.score} dark={dark} label="Score" />
          </div>

          <h2 className="font-display text-xl font-bold">
            {result.result === "Passed"
              ? "Nice work — interview completed!"
              : "Interview completed"}
          </h2>

          <p className={`text-sm mt-2 ${dark ? "text-slate-400" : "text-slate-500"}`}>
            {result.technology} · {result.answeredQuestions} of{" "}
            {result.totalQuestions} questions answered
          </p>

          <p className={`text-xs mt-2 ${dark ? "text-slate-500" : "text-slate-400"}`}>
            Duration: {fmt(result.durationSeconds)}
          </p>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setStage("setup");
                setInterview(null);
                setResult(null);
              }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border ${
                dark
                  ? "border-slate-700 text-slate-300"
                  : "border-slate-300 text-slate-700"
              }`}
            >
              <RotateCcw size={14} className="inline mr-1.5 -mt-0.5" />
              Try Again
            </button>

            <button
              onClick={() => setPage("history")}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-700"
            >
              View History
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questionSet[idx];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <Badge tone="teal">
          {idx + 1}/{questionSet.length}
        </Badge>

        <div className={`font-mono flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${
          seconds < 60
            ? "bg-rose-100 text-rose-600"
            : dark
              ? "bg-slate-800 text-slate-200"
              : "bg-slate-100 text-slate-700"
        }`}>
          <Clock size={14} /> {fmt(seconds)}
        </div>
      </div>

      <ProgressBar
        value={questionSet.length ? ((idx + 1) / questionSet.length) * 100 : 0}
        dark={dark}
      />

      <div className={`rounded-2xl border p-6 ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <Badge tone={categoryTone(tech)}>{tech}</Badge>

        <p className="font-display font-semibold text-lg mt-3 leading-snug">
          {currentQuestion?.question || "Loading question..."}
        </p>

        <textarea
          rows={7}
          value={answers[idx] || ""}
          onChange={(event) =>
            setAnswers((current) => ({
              ...current,
              [idx]: event.target.value,
            }))
          }
          placeholder="Type your answer here..."
          className={`${inputCls(dark)} mt-4`}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setIdx((current) => Math.max(0, current - 1))}
          disabled={idx === 0}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium border disabled:opacity-40 ${
            dark
              ? "border-slate-700 text-slate-300"
              : "border-slate-300 text-slate-700"
          }`}
        >
          Previous
        </button>

        {idx < questionSet.length - 1 ? (
          <button
            onClick={() =>
              setIdx((current) =>
                Math.min(questionSet.length - 1, current + 1)
              )
            }
            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-700"
          >
            Next
          </button>
        ) : (
          <button
            onClick={finish}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {submitting ? <Spinner size={15} /> : null}
            {submitting ? "Submitting..." : "Submit Interview"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================== History page =============================== */

function HistoryPage() {
  const { dark, showToast } = useApp();
  const [techFilter, setTechFilter] = useState("All");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const techs = ["All", "Java", "Spring Boot", "SQL", "React"];

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        setLoading(true);
        const response = await getInterviewHistory(techFilter);

        if (!cancelled) {
          setRows(response.data);
        }
      } catch (error) {
        if (!cancelled) {
          showToast(
            error.response?.data?.message || "Unable to load interview history.",
            "error"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [techFilter]);

  const formatDate = (value) => {
    if (!value) return "—";

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor((seconds || 0) / 60);
    const remainder = (seconds || 0) % 60;

    return remainder
      ? `${minutes}m ${remainder}s`
      : `${minutes} minutes`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Interview History</h1>
          <p className={`text-sm mt-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>
            Review mock interviews saved to your account.
          </p>
        </div>

        <select
          value={techFilter}
          onChange={(event) => setTechFilter(event.target.value)}
          className={inputCls(dark) + " py-2 w-44"}
        >
          {techs.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[240px]">
          <Spinner size={28} />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No interviews yet"
          sub="Start a mock interview to see your history here."
          dark={dark}
        />
      ) : (
        <div className={`rounded-2xl border overflow-hidden ${
          dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-left border-b ${
                  dark
                    ? "border-slate-800 text-slate-400"
                    : "border-slate-200 text-slate-500"
                }`}>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Technology</th>
                  <th className="px-5 py-3 font-medium">Answered</th>
                  <th className="px-5 py-3 font-medium">Score</th>
                  <th className="px-5 py-3 font-medium">Duration</th>
                  <th className="px-5 py-3 font-medium">Result</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-b last:border-0 ${
                      dark ? "border-slate-800" : "border-slate-100"
                    }`}
                  >
                    <td className={`px-5 py-3.5 ${
                      dark ? "text-slate-300" : "text-slate-700"
                    }`}>
                      <span className="inline-flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        {formatDate(row.finishedAt)}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <Badge tone={categoryTone(row.technology)}>
                        {row.technology}
                      </Badge>
                    </td>

                    <td className={`px-5 py-3.5 ${
                      dark ? "text-slate-300" : "text-slate-600"
                    }`}>
                      {row.answeredQuestions}/{row.totalQuestions}
                    </td>

                    <td className={`px-5 py-3.5 font-mono font-semibold ${
                      dark ? "text-slate-200" : "text-slate-800"
                    }`}>
                      {row.score}%
                    </td>

                    <td className={`px-5 py-3.5 ${
                      dark ? "text-slate-400" : "text-slate-500"
                    }`}>
                      {formatDuration(row.durationSeconds)}
                    </td>

                    <td className="px-5 py-3.5">
                      <Badge tone={row.result === "Passed" ? "teal" : "rose"}>
                        {row.result}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================== Resume Analyzer ============================ */

function ResumeAnalyzerPage() {
  const { dark, showToast } = useApp();
  const [file,setFile]=useState(null),[analyzing,setAnalyzing]=useState(false),[progress,setProgress]=useState(0);
  const [result,setResult]=useState(null),[history,setHistory]=useState([]),[loading,setLoading]=useState(true);
  const inputRef=useRef(null);
  useEffect(()=>{(async()=>{try{setHistory((await getResumeHistory()).data);}catch(e){showToast(e.response?.data?.message||"Unable to load resume history.","error");}finally{setLoading(false);}})();},[]);
  function choose(e){const f=e.target.files?.[0];if(!f)return;if((f.type&&f.type!=="application/pdf")||!f.name.toLowerCase().endsWith(".pdf")){showToast("Please select a PDF resume.","error");e.target.value="";return;}if(f.size>5*1024*1024){showToast("Resume must be 5MB or smaller.","error");e.target.value="";return;}setFile(f);setResult(null);setProgress(0);}
  async function analyze(){if(!file)return showToast("Upload a resume first.","error");try{setAnalyzing(true);const r=await analyzeResume(file,e=>{if(e.total)setProgress(Math.round(e.loaded*100/e.total));});setResult(r.data);setHistory(h=>[r.data,...h.filter(x=>x.id!==r.data.id)]);showToast("Resume analyzed and saved.");}catch(e){showToast(e.response?.data?.message||"Unable to analyze this resume.","error");}finally{setAnalyzing(false);}}
  async function remove(id){try{await deleteResumeAnalysis(id);setHistory(h=>h.filter(x=>x.id!==id));if(result?.id===id)setResult(null);showToast("Resume analysis deleted.");}catch(e){showToast(e.response?.data?.message||"Unable to delete analysis.","error");}}
  const date=v=>v?new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(v)):"—";
  return <div className="max-w-3xl mx-auto space-y-5">
    <div><h1 className="font-display text-2xl font-bold">Resume Analyzer</h1><p className={`text-sm mt-1 ${dark?"text-slate-400":"text-slate-500"}`}>Upload a text-based PDF for deterministic ATS-readiness checks. The PDF itself is not permanently stored.</p></div>
    <div className={`rounded-2xl border p-6 ${dark?"bg-slate-900 border-slate-800":"bg-white border-slate-200"}`}>
      <button type="button" onClick={()=>inputRef.current?.click()} className={`w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-10 gap-2 ${dark?"border-slate-700 hover:border-teal-600":"border-slate-300 hover:border-teal-500"}`}><Upload size={26}/><p className="text-sm font-medium">{file?.name||"Click to upload your resume (PDF)"}</p><p className="text-xs text-slate-400">PDF only · Max 5MB</p></button>
      <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={choose}/>
      {analyzing&&progress>0&&<div className="mt-4"><ProgressBar value={progress} dark={dark}/></div>}
      <button onClick={analyze} disabled={analyzing||!file} className="w-full mt-4 inline-flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-teal-600 text-white disabled:opacity-50">{analyzing?<><Spinner size={16}/> Analyzing...</>:<><Sparkles size={16}/> Analyze Resume</>}</button>
    </div>
    {result&&<div className={`rounded-2xl border p-6 sit-fade-up ${dark?"bg-slate-900 border-slate-800":"bg-white border-slate-200"}`}>
      <div className="flex items-center gap-6 flex-wrap"><ReadinessRing value={result.score} dark={dark} label="ATS Score" size={116}/><div className="flex-1 min-w-[220px]"><p className="font-display font-semibold">{result.fileName}</p><p className="text-xs text-slate-400 mt-1">{result.wordCount} extracted words</p><p className="text-sm font-medium mt-4 mb-2">Skills detected</p><div className="flex flex-wrap gap-1.5">{result.detectedSkills.length?result.detectedSkills.map(x=><Badge key={x} tone="teal">{x}</Badge>):<span className="text-sm text-slate-400">No tracked skills detected.</span>}</div></div></div>
      <div className={`grid sm:grid-cols-2 gap-5 mt-6 pt-6 border-t ${dark?"border-slate-800":"border-slate-200"}`}><div><p className="text-sm font-medium mb-2">Sections detected</p><div className="flex flex-wrap gap-1.5">{result.detectedSections.map(x=><Badge key={x} tone="sky">{x}</Badge>)}</div></div><div><p className="text-sm font-medium mb-2">Missing core sections</p><div className="flex flex-wrap gap-1.5">{result.missingSections.length?result.missingSections.map(x=><Badge key={x} tone="rose">{x}</Badge>):<Badge tone="teal">None</Badge>}</div></div></div>
      <div className={`mt-6 pt-6 border-t ${dark?"border-slate-800":"border-slate-200"}`}><p className="text-sm font-medium mb-3">Suggestions</p><ul className="space-y-2.5">{result.suggestions.map((x,i)=><li key={i} className="flex gap-2 text-sm"><AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5"/><span>{x}</span></li>)}</ul></div>
    </div>}
    <div className={`rounded-2xl border overflow-hidden ${dark?"bg-slate-900 border-slate-800":"bg-white border-slate-200"}`}><div className={`px-5 py-4 border-b ${dark?"border-slate-800":"border-slate-200"}`}><h2 className="font-display font-semibold">Analysis History</h2></div>
      {loading?<div className="flex justify-center py-10"><Spinner size={24}/></div>:history.length===0?<p className="text-sm text-center py-10 text-slate-400">No resume analyses yet.</p>:history.map(x=><div key={x.id} className={`px-5 py-4 flex items-center gap-4 border-b last:border-0 ${dark?"border-slate-800":"border-slate-100"}`}><div className="w-11 h-11 rounded-xl bg-teal-600/10 text-teal-600 flex items-center justify-center"><FileText size={19}/></div><button className="min-w-0 flex-1 text-left" onClick={()=>setResult(x)}><p className="text-sm font-semibold truncate">{x.fileName}</p><p className="text-xs text-slate-400 mt-0.5">{date(x.createdAt)} · Score {x.score}%</p></button><button onClick={()=>remove(x.id)} className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500"><Trash2 size={16}/></button></div>)}
    </div>
  </div>;
}

/* ============================== Profile page =============================== */

function ProfilePage() {
  const { dark, showToast, authUser, profile, profileLoading, refreshProfile, saveProfile } = useApp();
  const [form,setForm]=useState({name:"",skills:"",experienceLevel:"Entry-level (0-1 yrs)",github:"",linkedin:""});
  const [pw,setPw]=useState({currentPassword:"",newPassword:"",confirmPassword:""});
  const [saving,setSaving]=useState(false); const [changing,setChanging]=useState(false);
  useEffect(()=>{refreshProfile();},[]);
  useEffect(()=>{if(profile)setForm({name:profile.name||"",skills:profile.skills||"",experienceLevel:profile.experienceLevel||"Entry-level (0-1 yrs)",github:profile.github||"",linkedin:profile.linkedin||""});},[profile]);
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value})); const setP=k=>e=>setPw(f=>({...f,[k]:e.target.value}));
  async function save(e){e.preventDefault();try{setSaving(true);await saveProfile(form);showToast("Profile updated.");}catch(err){showToast(err.response?.data?.message||"Unable to update profile.","error");}finally{setSaving(false);}}
  async function change(e){e.preventDefault();if(pw.newPassword.length<8)return showToast("New password must be at least 8 characters.","error");if(pw.newPassword!==pw.confirmPassword)return showToast("New passwords do not match.","error");try{setChanging(true);await changeMyPassword({currentPassword:pw.currentPassword,newPassword:pw.newPassword});setPw({currentPassword:"",newPassword:"",confirmPassword:""});showToast("Password changed successfully.");}catch(err){showToast(err.response?.data?.message||"Unable to change password.","error");}finally{setChanging(false);}}
  if(profileLoading&&!profile)return <div className="flex justify-center items-center min-h-[300px]"><Spinner size={28}/></div>;
  return <div className="max-w-2xl mx-auto space-y-5"><div><h1 className="font-display text-2xl font-bold">Profile</h1><p className={`text-sm mt-1 ${dark?"text-slate-400":"text-slate-500"}`}>Stored securely in your backend account.</p></div><div className={`rounded-2xl border p-6 ${dark?"bg-slate-900 border-slate-800":"bg-white border-slate-200"}`}><div className="flex items-center gap-4 mb-6"><div className="w-16 h-16 rounded-full bg-orange-500 text-white flex items-center justify-center text-xl font-display font-bold">{getInitials(profile?.name||authUser?.name)}</div><div><p className="font-semibold">{profile?.name||authUser?.name}</p><p className="text-xs text-slate-400">{profile?.role||authUser?.role} account</p></div></div><form onSubmit={save}><div className="grid sm:grid-cols-2 gap-x-4"><Field label="Full name" dark={dark}><input value={form.name} onChange={set("name")} className={inputCls(dark)}/></Field><Field label="Email" dark={dark}><input value={profile?.email||authUser?.email||""} readOnly className={`${inputCls(dark)} opacity-75 cursor-not-allowed`}/></Field></div><Field label="Skills" dark={dark}><input value={form.skills} onChange={set("skills")} className={inputCls(dark)} placeholder="Java, Spring Boot, MySQL, React"/></Field><Field label="Experience level" dark={dark}><select value={form.experienceLevel} onChange={set("experienceLevel")} className={inputCls(dark)}><option>Entry-level (0-1 yrs)</option><option>Mid-level (2-4 yrs)</option><option>Senior (5+ yrs)</option></select></Field><div className="grid sm:grid-cols-2 gap-x-4"><Field label="GitHub" dark={dark}><input value={form.github} onChange={set("github")} className={inputCls(dark)} placeholder="github.com/username"/></Field><Field label="LinkedIn" dark={dark}><input value={form.linkedin} onChange={set("linkedin")} className={inputCls(dark)} placeholder="linkedin.com/in/username"/></Field></div><button disabled={saving} className="w-full py-2.5 rounded-lg font-semibold bg-teal-600 text-white disabled:opacity-70">{saving?<Spinner size={16}/>:"Save Profile"}</button></form></div><div className={`rounded-2xl border p-6 ${dark?"bg-slate-900 border-slate-800":"bg-white border-slate-200"}`}><h2 className="font-display font-semibold mb-4">Change password</h2><form onSubmit={change}><Field label="Current password" dark={dark}><input type="password" value={pw.currentPassword} onChange={setP("currentPassword")} className={inputCls(dark)}/></Field><Field label="New password" dark={dark}><input type="password" value={pw.newPassword} onChange={setP("newPassword")} className={inputCls(dark)}/></Field><Field label="Confirm new password" dark={dark}><input type="password" value={pw.confirmPassword} onChange={setP("confirmPassword")} className={inputCls(dark)}/></Field><button disabled={changing} className={`w-full py-2.5 rounded-lg font-semibold border ${dark?"border-slate-700":"border-slate-300"}`}>{changing?<Spinner size={16}/>:"Change Password"}</button></form></div></div>;
}

/* ============================== Admin page =============================== */

function AdminPage() {
  const { dark, showToast, authUser } = useApp();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const [statsResponse, usersResponse] = await Promise.all([
          getAdminStats(),
          getAdminUsers(),
        ]);
        if (!alive) return;
        setStats(statsResponse.data);
        setUsers(usersResponse.data || []);
      } catch (error) {
        if (!alive) return;
        const message =
          error.response?.status === 403
            ? "Admin access is required."
            : error.response?.data?.message || "Unable to load admin dashboard.";
        showToast(message, "error");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.name, u.email, u.role].some((v) => String(v || "").toLowerCase().includes(q))
    );
  }, [users, search]);

  const joined = (value) => value
    ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value))
    : "—";

  if (authUser?.role !== "ADMIN") {
    return <EmptyState icon={Shield} title="Admin access required" sub="This page is available only to administrator accounts." dark={dark} />;
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-[300px]"><Spinner size={28} /></div>;
  }

  const data = stats || {
    totalUsers: 0, userAccounts: 0, adminAccounts: 0, totalQuestions: 0,
    totalInterviews: 0, completedInterviews: 0, resumeAnalyses: 0
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
        <p className={`text-sm mt-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>
          Live platform statistics and registered accounts.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={data.totalUsers} sub={`${data.userAccounts} users · ${data.adminAccounts} admins`} tone="teal" dark={dark} />
        <StatCard icon={BookOpen} label="Total Questions" value={data.totalQuestions} sub="Across all accounts" tone="orange" dark={dark} />
        <StatCard icon={Mic} label="Completed Interviews" value={data.completedInterviews} sub={`${data.totalInterviews} interview records`} tone="sky" dark={dark} />
        <StatCard icon={FileText} label="Resume Analyses" value={data.resumeAnalyses} sub="Across all accounts" tone="violet" dark={dark} />
      </div>

      <div className={`rounded-2xl border overflow-hidden ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className={`px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${dark ? "border-slate-800" : "border-slate-200"}`}>
          <div>
            <p className="font-display font-semibold">Registered Users</p>
            <p className="text-xs text-slate-400 mt-0.5">{filteredUsers.length} shown · {users.length} total</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email or role..."
              className={`${inputCls(dark)} pl-9 py-2`} />
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">No matching users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-left border-b ${dark ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id ?? u.email} className={`border-b last:border-0 ${dark ? "border-slate-800" : "border-slate-100"}`}>
                    <td className={`px-5 py-3.5 font-medium ${dark ? "text-slate-200" : "text-slate-800"}`}>{u.name}</td>
                    <td className={`px-5 py-3.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>{u.email}</td>
                    <td className="px-5 py-3.5"><Badge tone={u.role === "ADMIN" ? "violet" : "slate"}>{u.role === "ADMIN" ? "Admin" : "User"}</Badge></td>
                    <td className={`px-5 py-3.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>{joined(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================== App ================================== */

export default function App() {
  const initialAuth = getStoredAuth();

  const [page, setPage] = useState(initialAuth ? "dashboard" : "landing");
  const [authed, setAuthed] = useState(Boolean(initialAuth?.accessToken));
  const [authUser, setAuthUser] = useState(initialAuth?.user || null);
  const [accessToken, setAccessToken] = useState(initialAuth?.accessToken || "");
  const [dark, setDark] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(6);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState("");

  const [questionSearch, setQuestionSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [questionCategory, setQuestionCategory] = useState("All");
  const [questionDifficulty, setQuestionDifficulty] = useState("All");
  const [questionStatus, setQuestionStatus] = useState("All");
  const [questionRefreshKey, setQuestionRefreshKey] = useState(0);
  const [questionSortBy, setQuestionSortBy] = useState("createdAt");
  const [questionDirection, setQuestionDirection] = useState("desc");
  const [profile,setProfile]=useState(null);
  const [profileLoading,setProfileLoading]=useState(false);
  const [dashboardData,setDashboardData]=useState(null);
  const [dashboardLoading,setDashboardLoading]=useState(false);
  const [dashboardError,setDashboardError]=useState("");
  const [dashboardRefreshKey,setDashboardRefreshKey]=useState(0);

  const [toasts, setToasts] = useState([]);

  function showToast(message, type = "success") {
    const id = uid();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(
      () => setToasts((t) => t.filter((x) => x.id !== id)),
      3000
    );
  }

  function storeAuth(auth, remember) {
    localStorage.removeItem("sit_auth");
    sessionStorage.removeItem("sit_auth");

    const storage = remember ? localStorage : sessionStorage;
    storage.setItem("sit_auth", JSON.stringify(auth));
  }

  function establishSession(data, remember = true) {
    const session = {
      accessToken: data.accessToken,
      user: {
        id: data.userId,
        name: data.name,
        email: data.email,
        role: data.role,
      },
    };

    applyAuthToken(session.accessToken);
    storeAuth(session, remember);

    setAccessToken(session.accessToken);
    setAuthUser(session.user);
    setAuthed(true);
    setPage("dashboard");
    setQuestionsError("");

    return session;
  }

  async function loginUser(email, password, remember = true) {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/login`,
      {
        email: email.trim().toLowerCase(),
        password,
      }
    );

    const session = establishSession(response.data, remember);
    showToast(`Welcome back, ${session.user.name}!`);
    return session;
  }

  async function registerUser(name, email, password) {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/register`,
      {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      }
    );

    const session = establishSession(response.data, true);
    showToast(`Account created. Welcome, ${session.user.name}!`);
    return session;
  }

  async function refreshProfile(){if(!accessToken)return;try{setProfileLoading(true);const r=await getMyProfile();setProfile(r.data);setAuthUser(u=>{const n={...(u||{}),id:r.data.id,name:r.data.name,email:r.data.email,role:r.data.role};const stored=getStoredAuth();if(stored?.accessToken){const remember=Boolean(localStorage.getItem("sit_auth"));storeAuth({...stored,user:n},remember);}return n;});return r.data;}finally{setProfileLoading(false);}}
  async function saveProfile(payload){const r=await updateMyProfile(payload);setProfile(r.data);setAuthUser(u=>{const n={...(u||{}),id:r.data.id,name:r.data.name,email:r.data.email,role:r.data.role};const stored=getStoredAuth();if(stored?.accessToken){const remember=Boolean(localStorage.getItem("sit_auth"));storeAuth({...stored,user:n},remember);}return n;});return r.data;}
  async function refreshDashboard(){if(!accessToken)return;try{setDashboardLoading(true);setDashboardError("");const r=await getDashboard();setDashboardData(r.data);}catch(err){if(err.response?.status===401||err.response?.status===403){logout(false);showToast("Your session is invalid or expired. Please login again.","error");return;}setDashboardError("Unable to load dashboard data from the backend.");}finally{setDashboardLoading(false);}}

  function logout(showMessage = true) {
    localStorage.removeItem("sit_auth");
    sessionStorage.removeItem("sit_auth");
    applyAuthToken(null);

    setAccessToken("");
    setAuthUser(null);
    setAuthed(false);
    setQuestions([]);
    setTotalPages(0);
    setTotalElements(0);
    setCurrentPage(0);
    setQuestionSearch("");
    setSearchInput("");
    setQuestionCategory("All");
    setQuestionDifficulty("All");
    setQuestionStatus("All");
    setQuestionsError("");
    setProfile(null);
    setDashboardData(null);
    setDashboardError("");
    setPage("login");

    if (showMessage) {
      showToast("Logged out successfully.");
    }
  }

  useEffect(() => {
    applyAuthToken(accessToken);
  }, [accessToken]);

  useEffect(()=>{if(authed&&accessToken)refreshProfile().catch(console.error);},[authed,accessToken]);
  useEffect(()=>{if(authed&&accessToken)refreshDashboard();},[authed,accessToken,dashboardRefreshKey,questionRefreshKey]);

  useEffect(() => {
    if (!authed || !accessToken) {
      setQuestionsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      async function loadQuestions() {
        try {
          setQuestionsLoading(true);
          setQuestionsError("");

          const params = {
            page: currentPage,
            size: pageSize,
            sortBy: questionSortBy,
            direction: questionDirection,
          };

          if (questionSearch.trim()) {
            params.keyword = questionSearch.trim();
          }

          if (questionCategory !== "All") {
            params.category = toBackendEnum(questionCategory);
          }

          if (questionDifficulty !== "All") {
            params.difficulty = toBackendEnum(questionDifficulty);
          }

          if (questionStatus !== "All") {
            params.status = toBackendEnum(questionStatus);
          }

          const response = await getQuestions(params);

          setQuestions(
            response.data.content.map(formatQuestionResponse)
          );
          setTotalPages(response.data.totalPages);
          setTotalElements(response.data.totalElements);
        } catch (error) {
          console.error("Failed to load questions:", error);

          if (error.response?.status === 401 || error.response?.status === 403) {
            logout(false);
            showToast("Your session is invalid or expired. Please login again.", "error");
            return;
          }

          setQuestionsError(
            "Unable to load questions from the backend."
          );
        } finally {
          setQuestionsLoading(false);
        }
      }

      loadQuestions();
    }, 200);

    return () => clearTimeout(timer);
  }, [
    authed,
    accessToken,
    currentPage,
    pageSize,
    questionSearch,
    questionCategory,
    questionDifficulty,
    questionStatus,
    questionRefreshKey,
    questionSortBy,
    questionDirection,
  ]);

  const toggleDark = () => setDark((d) => !d);

  const ctx = {
    page,
    setPage,
    authed,
    setAuthed,
    authUser,
    setAuthUser,
    accessToken,
    profile,
    profileLoading,
    refreshProfile,
    saveProfile,
    dashboardData,
    dashboardLoading,
    dashboardError,
    refreshDashboard,
    setDashboardRefreshKey,
    loginUser,
    registerUser,
    logout,
    dark,
    toggleDark,
    questions,
    setQuestions,
    questionsLoading,
    questionsError,
    toasts,
    showToast,
    questionSearch,
    setQuestionSearch,
    questionCategory,
    setQuestionCategory,
    questionDifficulty,
    setQuestionDifficulty,
    questionStatus,
    setQuestionStatus,
    currentPage,
    setCurrentPage,
    pageSize,
    totalPages,
    totalElements,
    searchInput,
    setSearchInput,
    questionRefreshKey,
    setQuestionRefreshKey,
    questionSortBy,
    setQuestionSortBy,
    questionDirection,
    setQuestionDirection,
  };

  let content;

  if (!authed) {
    if (page === "login") {
      content = <LoginPage />;
    } else if (page === "register") {
      content = <RegisterPage />;
    } else {
      content = <LandingPage />;
    }
  } else {
    const pages = {
      dashboard: <DashboardPage />,
      questions: <QuestionsPage />,
      "mock-interview": <MockInterviewPage />,
      history: <HistoryPage />,
      resume: <ResumeAnalyzerPage />,
      profile: <ProfilePage />,
      ...(authUser?.role === "ADMIN" ? { admin: <AdminPage /> } : {}),
    };

    content = (
      <AppShell>
        {pages[page] || <DashboardPage />}
      </AppShell>
    );
  }

  return (
    <AppCtx.Provider value={ctx}>
      {FONTS}
      <div className="font-body">
        {content}
        <ToastStack />
      </div>
    </AppCtx.Provider>
  );
}