import React from "react";
import { 
  TopicType, 
  LanguageType, 
  DifficultyType,
  AiEngineType
} from "../types";
import { 
  Terminal, 
  Database, 
  Cpu, 
  Layers, 
  Code2, 
  Brain, 
  Zap,
  Flame,
  Gauge,
  Sparkles,
  Settings,
  Cpu as CpuIcon
} from "lucide-react";
import { motion } from "motion/react";

interface TopicSelectorProps {
  selectedTopic: TopicType;
  setSelectedTopic: (t: TopicType) => void;
  selectedLanguage: LanguageType;
  setSelectedLanguage: (l: LanguageType) => void;
  selectedDifficulty: DifficultyType;
  setSelectedDifficulty: (d: DifficultyType) => void;
  selectedAiEngine: AiEngineType;
  setSelectedAiEngine: (e: AiEngineType) => void;
  onGenerate: () => void;
  loading: boolean;
}

const topicsList: { value: TopicType; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  {
    value: "DSA",
    label: "Data Structures & Algos",
    desc: "Arrays, Linked Lists, Trees, Graphs, Dynamic Programming, and Sorting.",
    icon: <Terminal className="w-5 h-5" />,
    color: "from-blue-500/10 to-blue-600/10 text-blue-600 border-blue-200"
  },
  {
    value: "DBMS",
    label: "Database Systems",
    desc: "Indexing, Transactions, ACID Properties, SQL Queries, and Normalization.",
    icon: <Database className="w-5 h-5" />,
    color: "from-purple-500/10 to-purple-600/10 text-purple-600 border-purple-200"
  },
  {
    value: "OS",
    label: "Operating Systems",
    desc: "Process Scheduling, Memory Management, Deadlocks, Inter-Process Comm.",
    icon: <Cpu className="w-5 h-5" />,
    color: "from-amber-500/10 to-amber-600/10 text-amber-600 border-amber-200"
  },
  {
    value: "System Design",
    label: "System Design",
    desc: "High Availability, Load Balancing, CDN, Microservices, and Databases scaling.",
    icon: <Layers className="w-5 h-5" />,
    color: "from-pink-500/10 to-pink-600/10 text-pink-600 border-pink-200"
  },
  {
    value: "OOPs",
    label: "Object-Oriented Programming",
    desc: "Inheritance, Polymorphism, Encapsulation, Interface segregation, Design patterns.",
    icon: <Code2 className="w-5 h-5" />,
    color: "from-emerald-500/10 to-emerald-600/10 text-emerald-600 border-emerald-200"
  }
];

const languagesList: { value: LanguageType; colorClass: string; badgeColor: string }[] = [
  { value: "Python", colorClass: "border-blue-300 hover:bg-blue-50 text-blue-800 bg-blue-50/50", badgeColor: "bg-blue-500" },
  { value: "JavaScript", colorClass: "border-amber-300 hover:bg-amber-50 text-amber-800 bg-amber-50/50", badgeColor: "bg-amber-500" },
  { value: "Java", colorClass: "border-red-300 hover:bg-red-50 text-red-800 bg-red-50/50", badgeColor: "bg-red-500" },
  { value: "C++", colorClass: "border-indigo-300 hover:bg-indigo-50 text-indigo-800 bg-indigo-50/50", badgeColor: "bg-indigo-600" },
  { value: "Go", colorClass: "border-cyan-300 hover:bg-cyan-50 text-cyan-800 bg-cyan-50/50", badgeColor: "bg-cyan-500" }
];

const difficultiesList: { value: DifficultyType; icon: React.ReactNode; color: string; desc: string }[] = [
  { value: "Easy", icon: <Gauge className="w-4 h-4 text-emerald-500" />, color: "border-emerald-200 text-emerald-700 bg-emerald-50/30 hover:bg-emerald-50", desc: "Core syntax, simple reasoning." },
  { value: "Medium", icon: <Zap className="w-4 h-4 text-yellow-500" />, color: "border-yellow-200 text-yellow-700 bg-yellow-50/30 hover:bg-yellow-50", desc: "Complex logic, tricky edge cases." },
  { value: "Hard", icon: <Flame className="w-4 h-4 text-red-500" />, color: "border-red-200 text-red-700 bg-red-50/30 hover:bg-red-50", desc: "Advanced systems, optimization constraints." }
];

const enginesList: { value: AiEngineType; title: string; desc: string; badge: string; color: string }[] = [
  { value: "Auto", title: "Auto Fallback", desc: "Attempts DeepSeek, falls back to Gemini on credit errors.", badge: "Recommended", color: "border-sky-200 text-sky-800 bg-sky-50/20 hover:bg-sky-50" },
  { value: "Gemini", title: "Gemini Pro/Flash", desc: "Bypasses DeepSeek. Instant response & highly stable.", badge: "Fastest", color: "border-violet-200 text-violet-800 bg-violet-50/20 hover:bg-violet-50" },
  { value: "DeepSeek", title: "DeepSeek Chat", desc: "Uses DeepSeek models directly. Requires active balance.", badge: "Advanced", color: "border-teal-200 text-teal-800 bg-teal-50/20 hover:bg-teal-50" }
];

export default function TopicSelector({
  selectedTopic,
  setSelectedTopic,
  selectedLanguage,
  setSelectedLanguage,
  selectedDifficulty,
  setSelectedDifficulty,
  selectedAiEngine,
  setSelectedAiEngine,
  onGenerate,
  loading
}: TopicSelectorProps) {
  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      {/* Introduction Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Brain className="w-48 h-48 animate-pulse text-white" />
        </div>
        <div className="max-w-2xl relative z-10 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-400/30">
            <Sparkles className="w-3.5 h-3.5" /> Next Gen Mock Preps
          </span>
          <h2 className="text-2xl md:text-3.5xl font-bold tracking-tight">Configure Your Personal Mock Interview</h2>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Select your target concepts, favorite coding language, and challenging difficulty levels. Our AI interviewer acts as a gatekeeper to generate highly accurate questions, follow-ups, and interactive coding files.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Step 1: Select Topic */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-sm">1</span>
            <h3 className="font-semibold text-slate-800 text-lg">Choose Your Core Concept</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {topicsList.map((topic) => {
              const isSelected = selectedTopic === topic.value;
              return (
                <button
                  key={topic.value}
                  onClick={() => setSelectedTopic(topic.value)}
                  disabled={loading}
                  className={`text-left p-4.5 rounded-xl border transition-all duration-200 relative overflow-hidden group h-full flex flex-col justify-between ${
                    isSelected 
                      ? "border-slate-900 bg-slate-900 text-white shadow-md ring-2 ring-slate-800/20" 
                      : "border-slate-200 bg-white hover:border-slate-400 hover:shadow-sm"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${isSelected ? "bg-white/10 text-white" : "bg-slate-100 text-slate-700"}`}>
                        {topic.icon}
                      </div>
                      {isSelected && (
                        <span className="flex w-2.5 h-2.5 bg-sky-400 rounded-full animate-ping" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm md:text-base">{topic.label}</h4>
                      <p className={`text-xs mt-1 leading-relaxed ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                        {topic.desc}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Step 4: Choose AI Engine */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-sm">4</span>
              <h3 className="font-semibold text-slate-800 text-lg flex items-center gap-2">
                <CpuIcon className="w-5 h-5 text-slate-700" /> Select AI Generation Engine
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Control which LLM processes your interview question creation and code diagnostics. If you encounter credit balance errors (e.g. 402 error) with DeepSeek, toggle to <strong>Gemini Pro/Flash</strong>.
            </p>
            <div className="grid grid-cols-1 gap-2.5">
              {enginesList.map((engine) => {
                const isSelected = selectedAiEngine === engine.value;
                return (
                  <button
                    key={engine.value}
                    type="button"
                    onClick={() => setSelectedAiEngine(engine.value)}
                    disabled={loading}
                    className={`text-left p-4 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected 
                        ? `${engine.color} border-2 ring-2 ring-slate-800/10` 
                        : "border-slate-200 bg-white hover:border-slate-350 hover:shadow-sm"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-800">{engine.title}</h4>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                          engine.value === "Auto" 
                            ? "bg-sky-100 text-sky-800" 
                            : engine.value === "Gemini"
                            ? "bg-violet-100 text-violet-800"
                            : "bg-teal-100 text-teal-800"
                        }`}>
                          {engine.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        {engine.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 2 & 3: Language & Difficulty */}
        <div className="space-y-8">
          {/* Step 2: Language */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-sm">2</span>
              <h3 className="font-semibold text-slate-800 text-lg">Select Language</h3>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5">
              {languagesList.map((lang) => {
                const isSelected = selectedLanguage === lang.value;
                return (
                  <button
                    key={lang.value}
                    onClick={() => setSelectedLanguage(lang.value)}
                    disabled={loading}
                    className={`p-3 rounded-lg border text-left font-medium text-xs md:text-sm flex items-center gap-2.5 transition-all outline-none ${
                      isSelected 
                        ? `${lang.colorClass} border-2 ring-2 ring-slate-700/10 font-bold scale-[1.02]` 
                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${lang.badgeColor}`} />
                    {lang.value}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Difficulty */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-sm">3</span>
              <h3 className="font-semibold text-slate-800 text-lg">Pick Target Difficulty</h3>
            </div>
            
            <div className="space-y-2.5">
              {difficultiesList.map((diff) => {
                const isSelected = selectedDifficulty === diff.value;
                return (
                  <button
                    key={diff.value}
                    onClick={() => setSelectedDifficulty(diff.value)}
                    disabled={loading}
                    className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-all outline-none ${
                      isSelected 
                        ? `${diff.color} border-2 font-bold ring-2 ring-slate-700/5` 
                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {diff.icon}
                      <div>
                        <p className="text-xs md:text-sm font-semibold">{diff.value}</p>
                        <p className="text-[11px] text-slate-500 font-normal">{diff.desc}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-left">
          <p className="text-xs text-slate-500 font-medium">Selected Configurations</p>
          <p className="text-sm font-semibold text-slate-800 mt-0.5">
            {selectedTopic} &bull; {selectedLanguage} &bull; <span className="text-indigo-600">{selectedDifficulty}</span> &bull; <span className="text-emerald-600">Engine: {selectedAiEngine}</span>
          </p>
        </div>
        
        <button
          onClick={onGenerate}
          disabled={loading}
          className={`w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer`}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Generating AI Questions...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Launch Prep Session</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
