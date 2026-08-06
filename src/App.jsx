import React, { useState, useEffect, useContext, createContext, useRef, useMemo } from "react";
import {
  Home, BookOpen, Mic, BarChart3, FileText, User, Shield, LogOut, Search, Bell, Moon, Sun,
  Plus, Pencil, Trash2, X, CheckCircle2, Clock, Flame, TrendingUp, Upload, ChevronRight,
  ChevronLeft, Menu, Eye, EyeOff, Mail, Lock, ArrowRight, Award, Target,
  Briefcase, Users, Activity, Star, Filter, ChevronDown, Loader2, Sparkles, Calendar,
  LayoutDashboard, PlayCircle, RotateCcw, Trophy, AlertCircle, ChevronsUpDown
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from "recharts";
import {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "./services/questionService";
import {
  formatEnumValue,
  formatCategory,
  formatStatus,
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
    @keyframes sitFadeUp { from { opacity:0; transform:translateY(8px);} to {opacity:1; transform:translateY(0);} }
    .sit-fade-up{ animation: sitFadeUp .35s ease-out both; }
  `}</style>
);

/* ---------------------------- Mock data -------------------------------- */

const CATEGORIES = ["Java", "Spring Boot", "SQL", "React", "DSA", "System Design"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const STATUSES = ["Not Started", "Practicing", "Completed"];

const INITIAL_QUESTIONS = [
  { id: "q1", question: "What is dependency injection in Spring?", category: "Spring Boot", difficulty: "Medium", status: "Completed" },
  { id: "q2", question: "Explain the difference between HashMap and TreeMap.", category: "Java", difficulty: "Medium", status: "Practicing" },
  { id: "q3", question: "What are Java Stream API's map() and filter() used for?", category: "Java", difficulty: "Easy", status: "Completed" },
  { id: "q4", question: "How does indexing improve SQL query performance?", category: "SQL", difficulty: "Medium", status: "Practicing" },
  { id: "q5", question: "Explain the virtual DOM and reconciliation in React.", category: "React", difficulty: "Medium", status: "Not Started" },
  { id: "q6", question: "Reverse a linked list in-place. Walk through your approach.", category: "DSA", difficulty: "Hard", status: "Not Started" },
  { id: "q7", question: "Design a URL shortener — what are the key components?", category: "System Design", difficulty: "Hard", status: "Not Started" },
  { id: "q8", question: "What is the N+1 query problem and how do you avoid it?", category: "Spring Boot", difficulty: "Hard", status: "Practicing" },
  { id: "q9", question: "Write a query to find the second-highest salary per department.", category: "SQL", difficulty: "Medium", status: "Completed" },
  { id: "q10", question: "Explain useEffect's dependency array and common pitfalls.", category: "React", difficulty: "Easy", status: "Completed" },
  { id: "q11", question: "What is the time complexity of quicksort in the worst case?", category: "DSA", difficulty: "Medium", status: "Practicing" },
  { id: "q12", question: "Explain Spring Boot's auto-configuration mechanism.", category: "Spring Boot", difficulty: "Easy", status: "Not Started" },
];

const WEEKLY_ACTIVITY = [
  { day: "Mon", questions: 5 }, { day: "Tue", questions: 8 }, { day: "Wed", questions: 4 },
  { day: "Thu", questions: 10 }, { day: "Fri", questions: 7 }, { day: "Sat", questions: 3 },
  { day: "Sun", questions: 6 },
];

const CATEGORY_COLORS = {
  Java: "#0d9488", "Spring Boot": "#f97316", SQL: "#0ea5e9", React: "#8b5cf6",
  DSA: "#f43f5e", "System Design": "#eab308",
};

const INTERVIEW_HISTORY = [
  { id: "i1", date: "12 Jul 2026", technology: "Java", score: 85, duration: "30 minutes", result: "Passed" },
  { id: "i2", date: "08 Jul 2026", technology: "React", score: 72, duration: "22 minutes", result: "Passed" },
  { id: "i3", date: "03 Jul 2026", technology: "SQL", score: 58, duration: "18 minutes", result: "Needs Work" },
  { id: "i4", date: "27 Jun 2026", technology: "Spring Boot", score: 91, duration: "34 minutes", result: "Passed" },
  { id: "i5", date: "20 Jun 2026", technology: "Java", score: 64, duration: "25 minutes", result: "Needs Work" },
];

const RESUME_QUESTION_BANK = {
  Java: ["Explain checked vs unchecked exceptions.", "What is the difference between == and .equals()?", "Describe the Java memory model briefly."],
  "Spring Boot": ["What is dependency injection in Spring?", "Explain Spring Boot's auto-configuration mechanism.", "What is the N+1 query problem and how do you avoid it?"],
  SQL: ["How does indexing improve SQL query performance?", "Write a query to find the second-highest salary.", "Explain ACID properties of a transaction."],
  React: ["Explain the virtual DOM and reconciliation.", "What problem do React hooks solve?", "How would you optimize re-renders in a large list?"],
};

const TESTIMONIALS = [
  { name: "Ananya Rao", role: "SDE-2, hired at a fintech startup", quote: "The mock interviews forced me to think on my feet instead of just reading answers.", initials: "AR" },
  { name: "Karthik Iyer", role: "Backend Engineer", quote: "Watching my preparation percentage climb week over week kept me consistent.", initials: "KI" },
  { name: "Divya Menon", role: "Full Stack Developer", quote: "The resume analyzer caught gaps I'd never have noticed on my own.", initials: "DM" },
];

const uid = () => Math.random().toString(36).slice(2, 10);

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
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={dark ? "#1e293b" : "#e2e8f0"} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke="#f97316" strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset .6s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`font-display text-3xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>{value}%</span>
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
    <div className={`rounded-2xl border p-5 ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-sm`}>
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
    dark ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
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
            <button onClick={() => setPage("register")} className="px-4 py-2 rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 transition-colors">Start Preparing</button>
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
            <button onClick={() => setPage("register")} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-sm">
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
              <p className="font-display font-semibold">This week's readiness</p>
              <Badge tone="teal"><Flame size={12} /> 6-day streak</Badge>
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
              <p className="text-xs font-semibold">Mock interview passed</p>
              <p className={`text-[11px] ${dark ? "text-slate-500" : "text-slate-500"}`}>Spring Boot · 91%</p>
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
              <div key={f.title} className={`rounded-2xl border p-6 ${dark ? "bg-slate-900 border-slate-800" : "bg-stone-50 border-slate-200"}`}>
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

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-display text-2xl font-bold text-center">Trusted by developers who got the offer</h2>
        <div className="grid sm:grid-cols-3 gap-5 mt-10">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className={`rounded-2xl border p-6 ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex gap-0.5 text-orange-500 mb-3">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <p className={`text-sm leading-relaxed ${dark ? "text-slate-300" : "text-slate-700"}`}>"{t.quote}"</p>
              <div className="flex items-center gap-3 mt-5">
                <div className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-semibold">{t.initials}</div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className={`text-xs ${dark ? "text-slate-500" : "text-slate-500"}`}>{t.role}</p>
                </div>
              </div>
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
          <p className={`text-xs ${dark ? "text-slate-500" : "text-slate-500"}`}>Built for a Java Full Stack Developer portfolio · Mock data only</p>
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

function SocialButtons({ dark }) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-5">
      <button type="button" className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium ${dark ? "border-slate-700 hover:bg-slate-800" : "border-slate-300 hover:bg-slate-50"}`}>
        <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.3-1.7 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3 14.6 2 12 2 6.9 2 2.7 6.1 2.7 11.2S6.9 20.4 12 20.4c6.9 0 8.3-4.8 8.3-7.3 0-.5 0-.9-.1-1.3H12z"/></svg>
        Google
      </button>
      <button type="button" className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium ${dark ? "border-slate-700 hover:bg-slate-800" : "border-slate-300 hover:bg-slate-50"}`}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.71.5.09.68-.22.68-.49v-1.91c-2.78.62-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.93a9.3 9.3 0 0 1 2.5.35c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.89v2.81c0 .27.18.59.69.49A10.24 10.24 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z" />
        </svg>
        GitHub
      </button>
    </div>
  );
}

function LoginPage() {
  const { setPage, dark, setAuthed, showToast } = useApp();
  const [email, setEmail] = useState("raj@example.com");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Enter a valid email address.";
    if (pwd.length < 6) errs.pwd = "Password must be at least 6 characters.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setAuthed(true);
      setPage("dashboard");
      showToast("Welcome back, Raj!");
    }, 700);
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue your preparation." dark={dark}>
      <SocialButtons dark={dark} />
      <div className={`flex items-center gap-3 mb-5 text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>
        <div className={`h-px flex-1 ${dark ? "bg-slate-800" : "bg-slate-200"}`} /> or email <div className={`h-px flex-1 ${dark ? "bg-slate-800" : "bg-slate-200"}`} />
      </div>
      <form onSubmit={submit} noValidate>
        <Field label="Email" dark={dark}>
          <div className="relative">
            <Mail size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? "text-slate-500" : "text-slate-400"}`} />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputCls(dark)} pl-9`} placeholder="you@example.com" />
          </div>
          {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
        </Field>
        <Field label="Password" dark={dark}>
          <div className="relative">
            <Lock size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? "text-slate-500" : "text-slate-400"}`} />
            <input type={showPwd ? "text" : "password"} value={pwd} onChange={(e) => setPwd(e.target.value)} className={`${inputCls(dark)} pl-9 pr-9`} placeholder="••••••••" />
            <button type="button" onClick={() => setShowPwd((s) => !s)} aria-label={showPwd ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.pwd && <p className="text-xs text-rose-500 mt-1">{errors.pwd}</p>}
        </Field>
        <div className="flex items-center justify-between mb-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4 rounded accent-teal-600" />
            Remember me
          </label>
          <button type="button" className="text-sm font-medium text-teal-600 hover:underline">Forgot password?</button>
        </div>
        <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
          {loading ? <Spinner size={16} /> : "Login"}
        </button>
      </form>
      <p className={`text-sm text-center mt-6 ${dark ? "text-slate-400" : "text-slate-500"}`}>
        Don't have an account? <button onClick={() => setPage("register")} className="font-medium text-teal-600 hover:underline">Register</button>
      </p>
    </AuthShell>
  );
}

function RegisterPage() {
  const { setPage, dark, showToast } = useApp();
  const [form, setForm] = useState({ name: "", email: "", pwd: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = "Full name is required.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Enter a valid email address.";
    if (form.pwd.length < 6) errs.pwd = "Password must be at least 6 characters.";
    if (form.confirm !== form.pwd) errs.confirm = "Passwords don't match.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast("Account created — please log in.");
      setPage("login");
    }, 700);
  }

  return (
    <AuthShell title="Create your account" subtitle="Start tracking your interview preparation today." dark={dark}>
      <form onSubmit={submit} noValidate>
        <Field label="Full name" dark={dark}>
          <input value={form.name} onChange={set("name")} className={inputCls(dark)} placeholder="Raj Kumar" />
          {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
        </Field>
        <Field label="Email" dark={dark}>
          <input type="email" value={form.email} onChange={set("email")} className={inputCls(dark)} placeholder="you@example.com" />
          {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
        </Field>
        <Field label="Password" dark={dark}>
          <input type="password" value={form.pwd} onChange={set("pwd")} className={inputCls(dark)} placeholder="••••••••" />
          {errors.pwd && <p className="text-xs text-rose-500 mt-1">{errors.pwd}</p>}
        </Field>
        <Field label="Confirm password" dark={dark}>
          <input type="password" value={form.confirm} onChange={set("confirm")} className={inputCls(dark)} placeholder="••••••••" />
          {errors.confirm && <p className="text-xs text-rose-500 mt-1">{errors.confirm}</p>}
        </Field>
        <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 mt-2">
          {loading ? <Spinner size={16} /> : "Register"}
        </button>
      </form>
      <p className={`text-sm text-center mt-6 ${dark ? "text-slate-400" : "text-slate-500"}`}>
        Already have an account? <button onClick={() => setPage("login")} className="font-medium text-teal-600 hover:underline">Login</button>
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
  const { page, setPage, dark, setAuthed } = useApp();
  const nav = (key) => { setPage(key); setMobileOpen(false); };
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-slate-950/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={`fixed lg:sticky top-0 h-screen z-40 w-64 shrink-0 border-r flex flex-col transition-transform duration-200 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className="h-16 flex items-center gap-2 px-5 border-b shrink-0" style={{ borderColor: dark ? "#1e293b" : "#e2e8f0" }}>
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center"><Target size={18} /></div>
          <span className="font-display font-bold">Interview Tracker</span>
        </div>
        <nav className="flex-1 overflow-y-auto sit-scroll px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = page === item.key;
            return (
              <button key={item.key} onClick={() => nav(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? "bg-teal-600 text-white" : dark ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"
                }`}>
                <item.icon size={17} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t" style={{ borderColor: dark ? "#1e293b" : "#e2e8f0" }}>
          <button onClick={() => { setAuthed(false); setPage("landing"); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${dark ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"}`}>
            <LogOut size={17} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}

function Topbar({ setMobileOpen }) {
  const { dark, toggleDark, showToast } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifs = [
    { id: 1, text: "You're 2 questions away from a 7-day streak.", time: "2h ago" },
    { id: 2, text: "New Spring Boot questions added to the bank.", time: "1d ago" },
    { id: 3, text: "Your last mock interview score: 85%.", time: "3d ago" },
  ];
  return (
    <header className={`h-16 sticky top-0 z-20 flex items-center gap-3 px-4 sm:px-6 border-b backdrop-blur ${dark ? "bg-slate-950/90 border-slate-800" : "bg-stone-50/90 border-slate-200"}`}>
      <button onClick={() => setMobileOpen(true)} className={`lg:hidden w-9 h-9 rounded-lg flex items-center justify-center border ${dark ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-600"}`} aria-label="Open menu">
        <Menu size={18} />
      </button>
      <div className="relative flex-1 max-w-md">
        <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? "text-slate-500" : "text-slate-400"}`} />
        <input placeholder="Search questions, interviews..." className={`${inputCls(dark)} pl-9 py-2`} />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button onClick={toggleDark} aria-label="Toggle dark mode" className={`w-9 h-9 rounded-lg flex items-center justify-center border ${dark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-white"}`}>
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div className="relative">
          <button onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }} aria-label="Notifications" className={`w-9 h-9 rounded-lg flex items-center justify-center border relative ${dark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-white"}`}>
            <Bell size={16} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-orange-500 border-2 border-white" style={{ borderColor: dark ? "#020617" : "#fafaf9" }} />
          </button>
          {notifOpen && (
            <div className={`absolute right-0 mt-2 w-72 rounded-xl border shadow-lg sit-fade-up ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <p className={`px-4 py-3 text-sm font-semibold border-b ${dark ? "border-slate-800" : "border-slate-200"}`}>Notifications</p>
              {notifs.map((n) => (
                <div key={n.id} className={`px-4 py-3 text-sm border-b last:border-0 ${dark ? "border-slate-800 text-slate-300" : "border-slate-100 text-slate-600"}`}>
                  <p>{n.text}</p>
                  <p className={`text-xs mt-0.5 ${dark ? "text-slate-500" : "text-slate-400"}`}>{n.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <button onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }} className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-800/10">
            <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-semibold">RK</div>
            <ChevronDown size={14} className={dark ? "text-slate-400" : "text-slate-500"} />
          </button>
          {profileOpen && (
            <div className={`absolute right-0 mt-2 w-48 rounded-xl border shadow-lg sit-fade-up overflow-hidden ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className={`px-4 py-3 border-b ${dark ? "border-slate-800" : "border-slate-200"}`}>
                <p className="text-sm font-semibold">Raj Kumar</p>
                <p className={`text-xs ${dark ? "text-slate-500" : "text-slate-500"}`}>raj@example.com</p>
              </div>
              <button onClick={() => showToast("Opening profile...")} className={`w-full text-left px-4 py-2.5 text-sm ${dark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-50 text-slate-600"}`}>View profile</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function AppShell({ children }) {
  const { dark } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className={`min-h-screen font-body flex ${dark ? "bg-slate-950 text-slate-100" : "bg-stone-50 text-slate-900"}`}>
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar setMobileOpen={setMobileOpen} />
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

/* ============================== Dashboard =============================== */

function DashboardPage() {
  const { dark, questions, setPage } = useApp();
  const completed = questions.filter((q) => q.status === "Completed").length;
  const prepPct = Math.round((completed / questions.length) * 100);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  const catData = CATEGORIES.map((c) => ({ name: c, value: questions.filter((q) => q.category === c).length })).filter((d) => d.value > 0);
  const recent = [
    { icon: CheckCircle2, text: "Completed Java Stream API questions", time: "Today" },
    { icon: Plus, text: "Added 5 Spring Boot questions", time: "Yesterday" },
    { icon: Mic, text: "Finished Mock Interview — Java, 85%", time: "2 days ago" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">{greeting}, Raj 👋</h1>
          <p className={`text-sm mt-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>Here's how your preparation is going this week.</p>
        </div>
        <button onClick={() => setPage("mock-interview")} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors text-sm">
          <PlayCircle size={16} /> Start Mock Interview
        </button>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Total Questions Practiced" value={questions.length} sub="+3 this week" tone="teal" dark={dark} />
        <StatCard icon={Mic} label="Interviews Completed" value={INTERVIEW_HISTORY.length} sub="2 passed recently" tone="sky" dark={dark} />
        <StatCard icon={Flame} label="Current Streak" value="6 days" sub="Personal best: 11" tone="orange" dark={dark} />
        <StatCard icon={Target} label="Preparation Percentage" value={`${prepPct}%`} sub="On track" tone="violet" dark={dark} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className={`rounded-2xl border p-5 lg:col-span-2 ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-display font-semibold">Weekly preparation activity</p>
            <Badge tone="teal"><TrendingUp size={12} /> +18% vs last week</Badge>
          </div>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={WEEKLY_ACTIVITY} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1e293b" : "#e2e8f0"} vertical={false} />
                <XAxis dataKey="day" stroke={dark ? "#64748b" : "#94a3b8"} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={dark ? "#64748b" : "#94a3b8"} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: dark ? "#0f172a" : "#fff", border: `1px solid ${dark ? "#1e293b" : "#e2e8f0"}`, borderRadius: 10, fontSize: 13 }} />
                <Line type="monotone" dataKey="questions" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 4, fill: "#0d9488" }} activeDot={{ r: 6 }} name="Questions practiced" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`rounded-2xl border p-5 flex flex-col items-center justify-center ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <p className="font-display font-semibold self-start mb-2">Readiness</p>
          <ReadinessRing value={prepPct} dark={dark} />
          <p className={`text-xs mt-4 text-center ${dark ? "text-slate-400" : "text-slate-500"}`}>{questions.length - completed} questions left to complete</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className={`rounded-2xl border p-5 lg:col-span-2 ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <p className="font-display font-semibold mb-4">Question category distribution</p>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={catData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {catData.map((entry) => <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name]} />)}
                </Pie>
                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: 12, color: dark ? "#cbd5e1" : "#475569" }} />
                <Tooltip contentStyle={{ background: dark ? "#0f172a" : "#fff", border: `1px solid ${dark ? "#1e293b" : "#e2e8f0"}`, borderRadius: 10, fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`rounded-2xl border p-5 ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <p className="font-display font-semibold mb-4">Recent activity</p>
          <ul className="space-y-4">
            {recent.map((r, i) => (
              <li key={i} className="flex gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${dark ? "bg-teal-900/40 text-teal-400" : "bg-teal-50 text-teal-600"}`}>
                  <r.icon size={15} />
                </div>
                <div>
                  <p className="text-sm leading-snug">{r.text}</p>
                  <p className={`text-xs mt-0.5 ${dark ? "text-slate-500" : "text-slate-400"}`}>{r.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ============================== Questions page ============================ */

function QuestionCard({ q, onEdit, onDelete, dark }) {
  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-3 sit-fade-up ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
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
 } = useApp();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [diffFilter, setDiffFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modal, setModal] = useState(null); // { mode: 'add'|'edit', data }
  const [page, setPageNum] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const perPage = 6;

  const filtered = useMemo(() => questions.filter((q) =>
    (catFilter === "All" || q.category === catFilter) &&
    (diffFilter === "All" || q.difficulty === diffFilter) &&
    (statusFilter === "All" || q.status === statusFilter) &&
    q.question.toLowerCase().includes(search.toLowerCase())
  ), [questions, search, catFilter, diffFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

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
        const response = await createQuestion(requestBody);

       const createdQuestion = formatQuestionResponse(response.data);
        setQuestions((qs) => [createdQuestion, ...qs]);
        showToast("Question added.");
      } else {
        const response = await updateQuestion(form.id, requestBody);

        const updatedQuestion = formatQuestionResponse(response.data);
        setQuestions((qs) =>
          qs.map((question) =>
            question.id === updatedQuestion.id
              ? updatedQuestion
              : question
          )
        );

        showToast("Question updated.");
      }

      setModal(null);
    } catch (error) {
      console.error("Unable to save question:", error);
      showToast("Unable to save the question.", "error");
    }
  }

 async function confirmDelete() {
   try {
     await deleteQuestion(deleteId);

     setQuestions((qs) =>
       qs.filter((question) => question.id !== deleteId)
     );

     setDeleteId(null);
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
          <p className={`text-sm mt-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>{filtered.length} of {questions.length} questions</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors text-sm">
          <Plus size={16} /> Add Question
        </button>
      </div>

      <div className={`rounded-2xl border p-4 flex flex-col md:flex-row gap-3 ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className="relative flex-1">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? "text-slate-500" : "text-slate-400"}`} />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPageNum(1); }} placeholder="Search questions..." className={`${inputCls(dark)} pl-9 py-2`} />
        </div>
        <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPageNum(1); }} className={selectCls}>
          <option>All</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={diffFilter} onChange={(e) => { setDiffFilter(e.target.value); setPageNum(1); }} className={selectCls}>
          <option>All</option>{DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPageNum(1); }} className={selectCls}>
          <option>All</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {pageItems.length === 0 ? (
        <EmptyState icon={Filter} title="No questions found" sub="Try adjusting your filters or search terms, or add a new question." dark={dark} />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {pageItems.map((q) => <QuestionCard key={q.id} q={q} onEdit={openEdit} onDelete={setDeleteId} dark={dark} />)}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={setPageNum} dark={dark} />

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
  const { dark, showToast } = useApp();
  const [tech, setTech] = useState("Java");
  const [stage, setStage] = useState("setup"); // setup | active | result
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [seconds, setSeconds] = useState(15 * 60);
  const techs = ["Java", "Spring Boot", "SQL", "React"];

  const questionSet = useMemo(() => {
    const bank = RESUME_QUESTION_BANK[tech] || [];
    return Array.from({ length: 10 }, (_, i) => bank[i % bank.length] || `${tech} interview question ${i + 1}: explain a core concept and give an example.`);
  }, [tech]);

  useEffect(() => {
    if (stage !== "active") return;
    if (seconds <= 0) { finish(); return; }
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, seconds]);

  function start() {
    setIdx(0); setAnswers({}); setSeconds(15 * 60); setStage("active");
  }
  function finish() {
    setStage("result");
  }
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  if (stage === "setup") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Mock Interview</h1>
          <p className={`text-sm mt-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>Choose a technology to start a timed, 10-question simulated interview.</p>
        </div>
        <div className={`rounded-2xl border p-6 ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <p className="text-sm font-medium mb-3">Select technology</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {techs.map((t) => (
              <button key={t} onClick={() => setTech(t)}
                className={`py-3 rounded-xl border text-sm font-semibold transition-colors ${tech === t ? "bg-teal-600 border-teal-600 text-white" : dark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
                {t}
              </button>
            ))}
          </div>
          <div className={`rounded-xl p-4 mb-6 text-sm flex gap-3 ${dark ? "bg-slate-800/60 text-slate-300" : "bg-stone-50 text-slate-600"}`}>
            <Clock size={16} className="shrink-0 mt-0.5" />
            <span>10 questions · 15 minutes total · you can move between questions before submitting.</span>
          </div>
          <button onClick={start} className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors">
            <PlayCircle size={18} /> Start Interview
          </button>
        </div>
      </div>
    );
  }

  if (stage === "result") {
    const answered = Object.values(answers).filter((a) => a && a.trim()).length;
    const score = Math.round((answered / questionSet.length) * 100);
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className={`rounded-2xl border p-8 text-center ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex justify-center mb-4"><ReadinessRing value={score} dark={dark} label="Score" /></div>
          <h2 className="font-display text-xl font-bold">{score >= 60 ? "Nice work — interview submitted!" : "Interview submitted"}</h2>
          <p className={`text-sm mt-2 ${dark ? "text-slate-400" : "text-slate-500"}`}>{tech} · {answered} of {questionSet.length} questions answered</p>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStage("setup")} className={`flex-1 py-2.5 rounded-lg text-sm font-medium border ${dark ? "border-slate-700 text-slate-300" : "border-slate-300 text-slate-700"}`}>
              <RotateCcw size={14} className="inline mr-1.5 -mt-0.5" /> Try Again
            </button>
            <button onClick={() => { showToast("Saved to interview history."); }} className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-700">
              View History
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <Badge tone="teal">{idx + 1}/{questionSet.length}</Badge>
        <div className={`font-mono flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${seconds < 60 ? "bg-rose-100 text-rose-600" : dark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700"}`}>
          <Clock size={14} /> {fmt(seconds)}
        </div>
      </div>
      <ProgressBar value={((idx + 1) / questionSet.length) * 100} dark={dark} />
      <div className={`rounded-2xl border p-6 ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <Badge tone={categoryTone(tech === "Spring Boot" ? "Spring Boot" : tech)}>{tech}</Badge>
        <p className="font-display font-semibold text-lg mt-3 leading-snug">{questionSet[idx]}</p>
        <textarea rows={7} value={answers[idx] || ""} onChange={(e) => setAnswers((a) => ({ ...a, [idx]: e.target.value }))}
          placeholder="Type your answer here..." className={`${inputCls(dark)} mt-4`} />
      </div>
      <div className="flex gap-3">
        <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium border disabled:opacity-40 ${dark ? "border-slate-700 text-slate-300" : "border-slate-300 text-slate-700"}`}>
          Previous
        </button>
        {idx < questionSet.length - 1 ? (
          <button onClick={() => setIdx((i) => Math.min(questionSet.length - 1, i + 1))} className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-700">
            Next
          </button>
        ) : (
          <button onClick={finish} className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600">
            Submit Interview
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================== History page =============================== */

function HistoryPage() {
  const { dark } = useApp();
  const [techFilter, setTechFilter] = useState("All");
  const techs = ["All", "Java", "Spring Boot", "SQL", "React"];
  const rows = INTERVIEW_HISTORY.filter((r) => techFilter === "All" || r.technology === techFilter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Interview History</h1>
          <p className={`text-sm mt-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>Review your past mock interviews and track improvement.</p>
        </div>
        <select value={techFilter} onChange={(e) => setTechFilter(e.target.value)} className={inputCls(dark) + " py-2 w-44"}>
          {techs.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Clock} title="No interviews yet" sub="Start a mock interview to see your history here." dark={dark} />
      ) : (
        <div className={`rounded-2xl border overflow-hidden ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-left border-b ${dark ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Technology</th>
                  <th className="px-5 py-3 font-medium">Score</th>
                  <th className="px-5 py-3 font-medium">Duration</th>
                  <th className="px-5 py-3 font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className={`border-b last:border-0 ${dark ? "border-slate-800" : "border-slate-100"}`}>
                    <td className={`px-5 py-3.5 flex items-center gap-2 ${dark ? "text-slate-300" : "text-slate-700"}`}><Calendar size={14} className="text-slate-400" />{r.date}</td>
                    <td className="px-5 py-3.5"><Badge tone={categoryTone(r.technology)}>{r.technology}</Badge></td>
                    <td className={`px-5 py-3.5 font-mono font-semibold ${dark ? "text-slate-200" : "text-slate-800"}`}>{r.score}%</td>
                    <td className={`px-5 py-3.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>{r.duration}</td>
                    <td className="px-5 py-3.5"><Badge tone={r.result === "Passed" ? "teal" : "rose"}>{r.result}</Badge></td>
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
  const [fileName, setFileName] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (f) { setFileName(f.name); setResult(null); }
  }

  function analyze() {
    if (!fileName) { showToast("Upload a resume first.", "error"); return; }
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setResult({
        score: 85,
        skills: ["Java", "Spring Boot", "MySQL", "React"],
        suggestions: ["Add more project descriptions", "Improve technical skills section", "Quantify impact with metrics (e.g. reduced latency by 30%)"],
      });
      showToast("Resume analyzed.");
    }, 1400);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Resume Analyzer</h1>
        <p className={`text-sm mt-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>Upload your resume to get a readiness score and improvement suggestions.</p>
      </div>

      <div className={`rounded-2xl border p-6 ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <button onClick={() => inputRef.current?.click()}
          className={`w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-10 gap-2 transition-colors ${dark ? "border-slate-700 hover:border-teal-600" : "border-slate-300 hover:border-teal-500"}`}>
          <Upload size={26} className={dark ? "text-slate-500" : "text-slate-400"} />
          <p className="text-sm font-medium">{fileName || "Click to upload your resume (PDF)"}</p>
          <p className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>Max 5MB</p>
        </button>
        <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
        <button onClick={analyze} disabled={analyzing} className="w-full mt-4 inline-flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors disabled:opacity-70">
          {analyzing ? <><Spinner size={16} /> Analyzing...</> : <><Sparkles size={16} /> Analyze</>}
        </button>
      </div>

      {result && (
        <div className={`rounded-2xl border p-6 sit-fade-up ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex items-center gap-6 flex-wrap">
            <ReadinessRing value={result.score} dark={dark} label="Resume Score" size={116} />
            <div className="flex-1 min-w-[180px]">
              <p className="text-sm font-medium mb-2">Skills detected</p>
              <div className="flex flex-wrap gap-1.5">
                {result.skills.map((s) => <Badge key={s} tone="teal">{s}</Badge>)}
              </div>
            </div>
          </div>
          <div className={`mt-6 pt-6 border-t ${dark ? "border-slate-800" : "border-slate-200"}`}>
            <p className="text-sm font-medium mb-3">Suggestions</p>
            <ul className="space-y-2.5">
              {result.suggestions.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                  <span className={dark ? "text-slate-300" : "text-slate-600"}>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================== Profile page =============================== */

function ProfilePage() {
  const { dark, showToast } = useApp();
  const [form, setForm] = useState({
    name: "Raj Kumar", email: "raj@example.com", skills: "Java, Spring Boot, MySQL, React",
    level: "Mid-level (2-4 yrs)", github: "github.com/rajkumar", linkedin: "linkedin.com/in/rajkumar",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Profile</h1>
        <p className={`text-sm mt-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>Manage your personal details and links.</p>
      </div>
      <div className={`rounded-2xl border p-6 ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-orange-500 text-white flex items-center justify-center text-xl font-display font-bold">RK</div>
          <div>
            <button className="text-sm font-medium text-teal-600 hover:underline">Change photo</button>
            <p className={`text-xs mt-0.5 ${dark ? "text-slate-500" : "text-slate-400"}`}>JPG or PNG, max 2MB</p>
          </div>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); showToast("Profile updated."); }}>
          <div className="grid sm:grid-cols-2 gap-x-4">
            <Field label="Full name" dark={dark}><input value={form.name} onChange={set("name")} className={inputCls(dark)} /></Field>
            <Field label="Email" dark={dark}><input type="email" value={form.email} onChange={set("email")} className={inputCls(dark)} /></Field>
          </div>
          <Field label="Skills" dark={dark}><input value={form.skills} onChange={set("skills")} className={inputCls(dark)} placeholder="Comma-separated" /></Field>
          <Field label="Experience level" dark={dark}>
            <select value={form.level} onChange={set("level")} className={inputCls(dark)}>
              {["Entry-level (0-1 yrs)", "Mid-level (2-4 yrs)", "Senior (5+ yrs)"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <div className="grid sm:grid-cols-2 gap-x-4">
            <Field label="GitHub" dark={dark}>
              <div className="relative"><Github size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? "text-slate-500" : "text-slate-400"}`} /><input value={form.github} onChange={set("github")} className={`${inputCls(dark)} pl-9`} /></div>
            </Field>
            <Field label="LinkedIn" dark={dark}>
<div className="relative">
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={`absolute left-3 top-1/2 -translate-y-1/2 ${
      dark ? "text-slate-500" : "text-slate-400"
    }`}
  >
    <path d="M6.5 8.5H3.2V19h3.3V8.5ZM4.85 3A1.91 1.91 0 1 0 4.85 6.82 1.91 1.91 0 0 0 4.85 3ZM20.8 12.97c0-3.17-1.69-4.65-3.95-4.65a3.43 3.43 0 0 0-3.12 1.72V8.5h-3.3V19h3.3v-5.2c0-1.37.26-2.7 1.96-2.7 1.68 0 1.7 1.57 1.7 2.79V19h3.3l.11-6.03Z" />
  </svg>

  <input
    value={form.linkedin}
    onChange={set("linkedin")}
    className={`${inputCls(dark)} pl-9`}
  />
</div>            </Field>
          </div>
          <button type="submit" className="w-full mt-2 py-2.5 rounded-lg font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors">Save Changes</button>
        </form>
      </div>
    </div>
  );
}

/* ============================== Admin page =============================== */

function AdminPage() {
  const { dark } = useApp();
  const users = [
    { name: "Raj Kumar", email: "raj@example.com", role: "User", status: "Active", joined: "Jan 2026" },
    { name: "Ananya Rao", email: "ananya@example.com", role: "User", status: "Active", joined: "Feb 2026" },
    { name: "Karthik Iyer", email: "karthik@example.com", role: "User", status: "Inactive", joined: "Mar 2026" },
    { name: "Admin User", email: "admin@example.com", role: "Admin", status: "Active", joined: "Dec 2025" },
  ];
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
        <p className={`text-sm mt-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>Manage users, monitor activity, and oversee the question database.</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Users" value="248" sub="+12 this month" tone="teal" dark={dark} />
        <StatCard icon={Activity} label="Active Today" value="63" sub="25% of user base" tone="sky" dark={dark} />
        <StatCard icon={BookOpen} label="Questions in Bank" value="1,204" sub="Across 6 categories" tone="orange" dark={dark} />
      </div>
      <div className={`rounded-2xl border overflow-hidden ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <p className={`px-5 py-4 font-display font-semibold border-b ${dark ? "border-slate-800" : "border-slate-200"}`}>Users</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-left border-b ${dark ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.email} className={`border-b last:border-0 ${dark ? "border-slate-800" : "border-slate-100"}`}>
                  <td className={`px-5 py-3.5 font-medium ${dark ? "text-slate-200" : "text-slate-800"}`}>{u.name}</td>
                  <td className={`px-5 py-3.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>{u.email}</td>
                  <td className="px-5 py-3.5"><Badge tone={u.role === "Admin" ? "violet" : "slate"}>{u.role}</Badge></td>
                  <td className="px-5 py-3.5"><Badge tone={u.status === "Active" ? "teal" : "slate"}>{u.status}</Badge></td>
                  <td className={`px-5 py-3.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>{u.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ================================== App ================================== */

export default function App() {
  const [page, setPage] = useState("landing");
  const [authed, setAuthed] = useState(false);
  const [dark, setDark] = useState(false);
const [questions, setQuestions] = useState([]);
const [questionsLoading, setQuestionsLoading] = useState(true);
const [questionsError, setQuestionsError] = useState("");
useEffect(() => {
  async function loadQuestions() {
    try {
      setQuestionsLoading(true);
      setQuestionsError("");

      const response = await getQuestions();

      const formattedQuestions = response.data.map(formatQuestionResponse);

      setQuestions(formattedQuestions);
    } catch (error) {
      console.error("Failed to load questions:", error);
      setQuestionsError("Unable to load questions from the backend.");
    } finally {
      setQuestionsLoading(false);
    }
  }

  loadQuestions();
}, []);
  const [toasts, setToasts] = useState([]);

  function showToast(message, type = "success") {
    const id = uid();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }
  const toggleDark = () => setDark((d) => !d);

const ctx = {
  page,
  setPage,
  authed,
  setAuthed,
  dark,
  toggleDark,
  questions,
  setQuestions,
  questionsLoading,
  questionsError,
  toasts,
  showToast,
};
  let content;
  if (!authed) {
    if (page === "login") content = <LoginPage />;
    else if (page === "register") content = <RegisterPage />;
    else content = <LandingPage />;
  } else {
    const pages = {
      dashboard: <DashboardPage />,
      questions: <QuestionsPage />,
      "mock-interview": <MockInterviewPage />,
      history: <HistoryPage />,
      resume: <ResumeAnalyzerPage />,
      profile: <ProfilePage />,
      admin: <AdminPage />,
    };
    content = <AppShell>{pages[page] || <DashboardPage />}</AppShell>;
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
