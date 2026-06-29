import React, { useState, useEffect } from "react";
import { 
  PrepSession, 
  TopicType, 
  LanguageType, 
  DifficultyType, 
  AiEngineType,
  Question, 
  CodeEvaluation 
} from "./types";
import TopicSelector from "./components/TopicSelector";
import QuestionCard from "./components/QuestionCard";
import SessionHistory from "./components/SessionHistory";
import { 
  Sparkles, 
  BrainCircuit, 
  Bookmark, 
  TrendingUp, 
  Terminal, 
  Layers, 
  Database,
  Cpu,
  GraduationCap,
  HelpCircle,
  Home,
  LogOut,
  ChevronLeft,
  Calendar,
  AlertCircle,
  UserCheck,
  CheckCircle,
  Clock,
  Briefcase
} from "lucide-react";

export default function App() {
  // Session Configuration State
  const [topic, setTopic] = useState<TopicType>("DSA");
  const [language, setLanguage] = useState<LanguageType>("JavaScript");
  const [difficulty, setDifficulty] = useState<DifficultyType>("Medium");
  const [aiEngine, setAiEngine] = useState<AiEngineType>("Auto");

  // App Level State
  const [sessions, setSessions] = useState<PrepSession[]>([]);
  const [activeSession, setActiveSession] = useState<PrepSession | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>("");
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);

  // Tab View for overall analysis
  const [viewTab, setViewTab] = useState<"dashboard" | "statistics" | "help">("dashboard");

  // Fetch all historic mock run entries on load
  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error("Failed to load historic sessions", err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Set the current URL to configure secrets advice
  const geminiSecretAdvice = "Please make sure you have loaded your valid GEMINI_API_KEY in the visual 'Secrets' manager on the bottom left side of the workspace to operate cloud generation services correctly.";

  // Generate 5 custom questions from Gemini
  const handleGenerateQuestions = async () => {
    setLoading(true);
    setErrorText("");
    try {
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          language,
          difficulty,
          aiEngine
        }),
      });

      if (!response.ok) {
        const errPayload = await response.json();
        throw new Error(errPayload.error || "The AI compiler network rejected the generation request.");
      }

      const generatedQuestions: Question[] = await response.json();
      
      if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
        throw new Error("Invalid format returned by the AI platform. Please relaunch creation.");
      }

      // Build out the high fidelity PrepSession entity
      const newSession: PrepSession = {
        id: "session_" + Date.now(),
        topic,
        language,
        difficulty,
        questions: generatedQuestions,
        createdAt: new Date().toISOString(),
        bookmarked: false,
        userAttempts: {}
      };

      // Persist new session back to database storage (JSON)
      const saveResponse = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSession),
      });

      if (!saveResponse.ok) {
        throw new Error("Questions generated successfully but database storage persistence failed.");
      }

      // Update clients
      setSessions(prev => [newSession, ...prev]);
      setActiveSession(newSession);
      setActiveQuestionIndex(0);
      setViewTab("dashboard");
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "Encountered a server configuration barrier. Verify your GEMINI_API_KEY is defined.");
    } finally {
      setLoading(false);
    }
  };

  // Save specific coding attempts to session
  const handleSaveAttempt = async (questionId: number, code: string, evaluation: CodeEvaluation) => {
    if (!activeSession) return;

    try {
      const updatedAttempts = {
        ...(activeSession.userAttempts || {}),
        [questionId]: {
          code,
          evaluation,
          timestamp: new Date().toISOString()
        }
      };

      const updatedSession: PrepSession = {
        ...activeSession,
        userAttempts: updatedAttempts
      };

      // Persist the edited score attempt back to server
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedSession)
      });

      if (res.ok) {
        const payload = await res.json();
        setActiveSession(updatedSession);
        // Refresh local session overview stack
        setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
      }
    } catch (err) {
      console.error("Failed to persist code attempt", err);
    }
  };

  // Select item from timeline
  const handleSelectSession = (id: string) => {
    const found = sessions.find(s => s.id === id);
    if (found) {
      setActiveSession(found);
      setActiveQuestionIndex(0);
      setViewTab("dashboard");
    }
  };

  // Delete item from timeline
  const handleDeleteSession = async (id: string) => {
    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== id));
        if (activeSession?.id === id) {
          setActiveSession(null);
        }
      }
    } catch (err) {
      console.error("Delete operation rejected by database", err);
    }
  };

  // Toggle bookmarked status
  const handleToggleBookmark = async (id: string) => {
    try {
      const res = await fetch(`/api/sessions/${id}/bookmark`, {
        method: "POST"
      });
      if (res.ok) {
        const payload = await res.json();
        setSessions(prev => prev.map(s => {
          if (s.id === id) {
            return { ...s, bookmarked: payload.bookmarked };
          }
          return s;
        }));

        if (activeSession?.id === id) {
          setActiveSession(prev => prev ? { ...prev, bookmarked: payload.bookmarked } : null);
        }
      }
    } catch (err) {
      console.error("Bookmark toggle failed", err);
    }
  };

  // Stats calculation
  const totalSubmissions = sessions.reduce((acc, sess) => acc + Object.keys(sess.userAttempts || {}).length, 0);
  const averageScores = (() => {
    let sum = 0;
    let count = 0;
    sessions.forEach(sess => {
      if (sess.userAttempts) {
        Object.values(sess.userAttempts).forEach((attempt: any) => {
          if (attempt.evaluation?.score) {
            sum += attempt.evaluation.score;
            count++;
          }
        });
      }
    });
    return count > 0 ? Math.round(sum / count) : 0;
  })();

  const solvedCorrectly = (() => {
    let count = 0;
    sessions.forEach(sess => {
      if (sess.userAttempts) {
        Object.values(sess.userAttempts).forEach((attempt: any) => {
          if (attempt.evaluation?.passed) {
            count++;
          }
        });
      }
    });
    return count;
  })();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased">
      
      {/* Top Navigation Frame */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm px-4 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 p-2 text-white flex items-center justify-center shadow-md">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-md md:text-lg font-bold tracking-tight flex items-center gap-2">
                AI Interview Prep Platform <span className="text-[10px] uppercase font-mono bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-400/20">Beta</span>
              </h1>
              <p className="text-[11px] text-slate-400">Powered by Gemini &bull; Real-time Code Evaluations</p>
            </div>
          </div>

          {/* Quick Menu Selection */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => { setViewTab("dashboard"); if(!activeSession) setActiveSession(null); }}
              className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewTab === "dashboard" && !activeSession
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Home className="w-3.5 h-3.5" /> Configure
            </button>
            <button
              onClick={() => setViewTab("statistics")}
              className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewTab === "statistics"
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> Progress Tracker
            </button>
            <button
              onClick={() => setViewTab("help")}
              className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewTab === "help"
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" /> Help Guides
            </button>
          </div>

        </div>
      </header>

      {/* Primary Grid Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interactive Navigation & Sidebar History */}
        <section className="lg:col-span-4 space-y-6">
          <SessionHistory
            sessions={sessions}
            onSelectSession={handleSelectSession}
            onDeleteSession={handleDeleteSession}
            onToggleBookmark={handleToggleBookmark}
            currentSessionId={activeSession?.id}
          />

          {/* Quick Realtime metrics widget */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <TrendingUp className="w-24 h-24" />
            </div>
            
            <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" /> Practice Analytics
            </h5>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-805/50 border border-slate-800 rounded-lg p-2.5">
                <p className="text-xl font-bold text-sky-400">{sessions.length}</p>
                <p className="text-[9px] text-slate-400 uppercase mt-0.5">Prep Runs</p>
              </div>
              <div className="bg-slate-805/50 border border-slate-800 rounded-lg p-2.5">
                <p className="text-xl font-bold text-amber-400">{averageScores}%</p>
                <p className="text-[9px] text-slate-400 uppercase mt-0.5">Avg Score</p>
              </div>
              <div className="bg-slate-805/50 border border-slate-800 rounded-lg p-2.5">
                <p className="text-xl font-bold text-emerald-400">{solvedCorrectly}</p>
                <p className="text-[9px] text-slate-400 uppercase mt-0.5">Passed</p>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-normal text-center italic">
              Keep practicing multiple languages and algorithms to improve score levels.
            </p>
          </div>
        </section>

        {/* Right Column: Key Activity Center */}
        <section className="lg:col-span-8 space-y-6">
          
          {errorText && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-650 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">System Conflict Detected</p>
                <p className="text-xs text-red-700 leading-relaxed mt-1">{errorText}</p>
                <div className="mt-2.5 p-2.5 bg-red-100/50 rounded-lg text-xs leading-normal font-medium max-w-lg">
                  {geminiSecretAdvice}
                </div>
              </div>
            </div>
          )}

          {/* Render Tab Pages */}
          {viewTab === "statistics" ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div>
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="w-5 h-5 text-indigo-600" /> Interactive Prep Analytics
                </h3>
                <p className="text-xs text-slate-500 mt-1">Diagnostic summaries covering your entire technical workspace attempts.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-4.5 space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Language Prevalence</h4>
                  {sessions.length === 0 ? (
                    <p className="text-xs text-slate-500">Not enough session history loaded yet.</p>
                  ) : (
                    <div className="space-y-2 pt-2">
                      {["Python", "JavaScript", "Java", "C++", "Go"].map(l => {
                        const count = sessions.filter(s => s.language === l).length;
                        const percentage = sessions.length ? Math.round((count / sessions.length) * 100) : 0;
                        if (count === 0) return null;
                        return (
                          <div key={l} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium text-slate-700">
                              <span>{l}</span>
                              <span>{count} runs ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-slate-250 h-1.5 rounded-full overflow-hidden bg-slate-200">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-4.5 space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Core Subject Coverage</h4>
                  {sessions.length === 0 ? (
                    <p className="text-xs text-slate-500">Practice topics to populate metrics diagrams.</p>
                  ) : (
                    <div className="space-y-2 pt-2">
                      {["DSA", "DBMS", "OS", "System Design", "OOPs"].map(t => {
                        const count = sessions.filter(s => s.topic === t).length;
                        const percentage = sessions.length ? Math.round((count / sessions.length) * 100) : 0;
                        if (count === 0) return null;
                        return (
                          <div key={t} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium text-slate-700">
                              <span>{t}</span>
                              <span>{count} runs ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-indigo-250 h-1.5 rounded-full overflow-hidden bg-slate-200">
                              <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Grid timeline logs */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-indigo-500" /> Session History Audit Ledger
                </h4>
                {sessions.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Timeline is empty.</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {sessions.map((sess) => {
                      const attemptsCount = Object.keys(sess.userAttempts || {}).length;
                      return (
                        <div key={sess.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                          <div className="space-y-1">
                            <p className="font-bold text-slate-800">{sess.topic} Mock Run</p>
                            <p className="text-slate-500 text-[11px]">{sess.language} &bull; {sess.difficulty} &bull; {new Date(sess.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              {attemptsCount} challenge attempts
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : viewTab === "help" ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div>
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-1.5">
                  <GraduationCap className="w-5 h-5 text-indigo-600" /> Platform Knowledgebase & Guides
                </h3>
                <p className="text-xs text-slate-500 mt-1">Information on how to configure secrets, utilize prompts, and review coding diagnostics.</p>
              </div>

              <div className="space-y-5 divide-y divide-slate-100">
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-violet-500" /> What is the AI Interview Prep Platform?
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed pl-3.5">
                    It is an offline-first and durable cloud sandbox that generates custom technical interview question packets. Each packet has 5 unique items covering conceptual queries, comprehensive explanations, and active interactive code editor modules.
                  </p>
                </div>

                <div className="space-y-2 pt-4">
                  <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-violet-500" /> Configuring Secrets keys
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed pl-3.5">
                    The platform references your personal <code>GEMINI_API_KEY</code> environment variable to call state-of-the-art LLMs. If you encounter errors, open your "Settings" panel, go to "Secrets", list <code>GEMINI_API_KEY</code>, and paste your key.
                  </p>
                </div>

                <div className="space-y-2 pt-4">
                  <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-violet-500" /> How does Code Evaluation work?
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed pl-3.5">
                    Inside every active question card, click the "Interactive Coding Challenge" button to open the Monaco Editor wrapper for your designated language. Type your solution, and click <strong>Evaluate Submission</strong>. Gemini evaluates your code's runtime complexity (Big-O), space bounds, correctness, and returns optimized code versions.
                  </p>
                </div>
              </div>
            </div>
          ) : activeSession ? (
            /* Active prep mock session rendering panel */
            <div className="space-y-6">
              {/* Back to selector Header banner */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveSession(null)}
                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                    title="Exit back to dashboard and select new topic"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {activeSession.topic} Prep Run
                      </span>
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {activeSession.language}
                      </span>
                    </div>
                    <p className="text-xs text-slate-450 mt-1">Generated: {new Date(activeSession.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleBookmark(activeSession.id)}
                    className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${activeSession.bookmarked ? "fill-amber-500 text-amber-500" : ""}`} />
                    <span>{activeSession.bookmarked ? "Bookmarked" : "Bookmark pack"}</span>
                  </button>
                  <button
                    onClick={() => setActiveSession(null)}
                    className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>Configure New</span>
                  </button>
                </div>
              </div>

              {/* Question list pagination tabs */}
              <div className="flex items-center gap-2 bg-white/70 p-1 rounded-xl border border-slate-200">
                {activeSession.questions.map((q, idx) => {
                  const isCur = activeQuestionIndex === idx;
                  const hasAttempt = activeSession.userAttempts?.[q.id];
                  const hasPassed = hasAttempt?.evaluation?.passed;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setActiveQuestionIndex(idx)}
                      className={`flex-1 py-2 px-2 rounded-lg font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all outline-none ${
                        isCur
                          ? "bg-slate-950 text-white shadow-sm font-black"
                          : "text-slate-600 hover:bg-white"
                      }`}
                    >
                      <span>Q{q.id}</span>
                      {hasAttempt && (
                        <span className={`w-2 h-2 rounded-full ${hasPassed ? "bg-emerald-500" : "bg-red-500"}`} title="Evaluation attempt registered" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected question detail */}
              <QuestionCard
                question={activeSession.questions[activeQuestionIndex]}
                language={activeSession.language}
                onSaveAttempt={handleSaveAttempt}
                savedAttempt={activeSession.userAttempts?.[activeSession.questions[activeQuestionIndex].id]}
                aiEngine={aiEngine}
              />

              {/* Progress Summary cards panel */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-left">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-sky-400" /> Session Checklist
                  </h4>
                  <p className="text-xs text-slate-300">
                    You have evaluated <strong>{Object.keys(activeSession.userAttempts || {}).length}</strong> out of <strong>5</strong> coding challenges inside this prep session.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-slate-400">Total Run Accuracy:</span>
                  <span className="text-sm font-black bg-slate-805 px-2.5 py-1 rounded border border-slate-800 text-sky-400">
                    {(() => {
                      const attempts = Object.values(activeSession.userAttempts || {});
                      if (attempts.length === 0) return "N/A";
                      let totalScore = 0;
                      let count = 0;
                      attempts.forEach((att: any) => {
                        if (att?.evaluation?.score !== undefined) {
                          totalScore += Number(att.evaluation.score);
                          count++;
                        }
                      });
                      if (count === 0) return "N/A";
                      return `${Math.round(totalScore / count)}%`;
                    })()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Topic selection dashboard landing view */
            <div className="space-y-6">
              <TopicSelector
                selectedTopic={topic}
                setSelectedTopic={setTopic}
                selectedLanguage={language}
                setSelectedLanguage={setLanguage}
                selectedDifficulty={difficulty}
                setSelectedDifficulty={setDifficulty}
                selectedAiEngine={aiEngine}
                setSelectedAiEngine={setAiEngine}
                onGenerate={handleGenerateQuestions}
                loading={loading}
              />
            </div>
          )}

        </section>

      </main>

      {/* Footer Branding Area */}
      <footer className="mt-auto py-6 bg-slate-900 text-slate-400 border-t border-slate-800 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p>&bull; Core AI Sandbox &bull; Built with premium Gemini Models &bull;</p>
          <p className="text-[10px] text-slate-500">Perfect mock evaluations designed for professional programmers.</p>
        </div>
      </footer>

    </div>
  );
}
