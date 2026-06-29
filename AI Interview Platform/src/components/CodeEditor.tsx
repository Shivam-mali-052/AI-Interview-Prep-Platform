import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Sparkles, 
  Activity, 
  Lightbulb,
  CornerDownRight,
  Code,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { CodingChallenge, CodeEvaluation, AiEngineType } from "../types";

interface CodeEditorProps {
  challenge: CodingChallenge;
  language: string;
  onSaveAttempt: (code: string, evaluation: CodeEvaluation) => void;
  savedAttempt?: { code: string; evaluation?: CodeEvaluation };
  aiEngine?: AiEngineType;
}

const languageMapping: Record<string, string> = {
  "Python": "python",
  "JavaScript": "javascript",
  "Java": "java",
  "C++": "cpp",
  "Go": "go"
};

export default function CodeEditor({ challenge, language, onSaveAttempt, savedAttempt, aiEngine }: CodeEditorProps) {
  const [code, setCode] = useState<string>(challenge.starterCode);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<CodeEvaluation | null>(null);
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [showImproved, setShowImproved] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>("");

  const editorLanguage = languageMapping[language] || "javascript";

  // Reset editor when challenge or savedAttempt changes
  useEffect(() => {
    if (savedAttempt?.code) {
      setCode(savedAttempt.code);
    } else {
      setCode(challenge.starterCode);
    }

    if (savedAttempt?.evaluation) {
      setEvaluation(savedAttempt.evaluation);
    } else {
      setEvaluation(null);
    }
    
    setErrorText("");
    setShowSolution(false);
    setShowImproved(false);
  }, [challenge, savedAttempt]);

  const handleReset = () => {
    setCode(challenge.starterCode);
    setEvaluation(null);
    setErrorText("");
    setShowSolution(false);
    setShowImproved(false);
  };

  const handleEvaluate = async () => {
    if (!code || !code.trim()) {
      setErrorText("Please write some code before requesting AI evaluation.");
      return;
    }

    setEvaluating(true);
    setErrorText("");
    setEvaluation(null);

    try {
      const response = await fetch("/api/evaluate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          language,
          problem: challenge.problem,
          aiEngine
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Evaluation service encountered a request barrier.");
      }

      const result: CodeEvaluation = await response.json();
      setEvaluation(result);
      onSaveAttempt(code, result);
    } catch (err: any) {
      setErrorText(err.message || "Failed to analyze code configuration. Please try again.");
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div id="code-editor-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      
      {/* Left Column: Problem context & Starter templates */}
      <div className="lg:col-span-4 space-y-5 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Code className="w-3.5 h-3.5" /> Interactive Challenge
            </span>
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {language}
            </span>
          </div>

          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <h4 className="font-bold text-slate-800 text-sm mb-2">Coding Problem</h4>
            <p className="text-slate-600 text-xs md:text-sm whitespace-pre-wrap leading-relaxed">
              {challenge.problem}
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Ground Rules & Edge Cases
            </h5>
            <ul className="text-xs text-slate-500 space-y-1.5 list-disc pl-4 leading-normal">
              <li>Ensure you cover empty inputs, negative integers, or overflow bounds.</li>
              <li>Aim for optimal time complexity to satisfy scale criteria.</li>
              <li>Write clean variable names and keep side effects contained.</li>
            </ul>
          </div>
        </div>

        {/* Buttons to view AI Reference Answers */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <button
            onClick={() => setShowSolution(!showSolution)}
            className="w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between border transition-all text-slate-700 border-slate-200 hover:bg-slate-50"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-500" />
              {showSolution ? "Hide AI Answer Solution" : "Reveal Reference Solution"}
            </span>
            <ArrowRight className={`w-3.5 h-3.5 transition-transform ${showSolution ? "rotate-90" : ""}`} />
          </button>

          {showSolution && (
            <div className="p-3 bg-slate-900 rounded-lg text-xs text-slate-300 font-mono overflow-auto max-h-48 border border-slate-800">
              <div className="absolute top-1 right-1 text-[10px] text-emerald-400 font-sans">Reference Only</div>
              <pre className="whitespace-pre-wrap">{challenge.solution}</pre>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Code Editor + AI Evaluation Interface */}
      <div className="lg:col-span-8 space-y-4 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-slate-950 px-4 py-2.5 rounded-t-xl text-slate-400 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-white font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="ml-2">workspace.{editorLanguage}</span>
            </span>
            <button 
              onClick={handleReset}
              className="hover:text-white transition-colors flex items-center gap-1"
              title="Reset code template"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="border border-t-0 border-slate-200 rounded-b-xl overflow-hidden shadow-inner" style={{ height: "320px" }}>
            <Editor
              height="100%"
              language={editorLanguage}
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || "")}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 12 },
                lineNumbers: "on",
                fontFamily: "JetBrains Mono",
                automaticLayout: true,
              }}
            />
          </div>
        </div>

        {/* Action Controls & Error Warnings */}
        <div className="space-y-3">
          {errorText && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <p>{errorText}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-slate-400">
              *Your submission is audited dynamically using Gemini. Hit Evaluate to review.
            </p>
            <button
              onClick={handleEvaluate}
              disabled={evaluating}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                evaluating
                  ? "bg-slate-200 text-slate-400 pointer-events-none"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/10 active:scale-95"
              }`}
            >
              {evaluating ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Auditing Code...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Evaluate Submission</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Comprehensive Diagnostics UI */}
        {evaluation && (
          <div className="p-5 bg-slate-55 border border-indigo-100 rounded-xl bg-slate-50/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                  evaluation.score >= 80 
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                    : evaluation.score >= 50
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-red-100 text-red-800 border border-red-200"
                }`}>
                  {evaluation.score}
                </span>
                <div>
                  <h5 className="font-bold text-slate-800 text-sm">Interactive Code Score</h5>
                  <div className="flex items-center gap-2 mt-0.5">
                    {evaluation.passed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" /> Correct Build
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                        <XCircle className="w-3 h-3" /> Logical Gaps / Fails
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Big-O Runtime Metadata Indicators */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded text-xs text-slate-700">
                  <span className="font-semibold text-slate-400">Time:</span> <code className="font-mono">{evaluation.timeComplexity}</code>
                </div>
                <div className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded text-xs text-slate-700">
                  <span className="font-semibold text-slate-400">Space:</span> <code className="font-mono">{evaluation.spaceComplexity}</code>
                </div>
              </div>
            </div>

            {/* Critique Feedback */}
            <div className="text-xs md:text-sm text-slate-650 leading-relaxed bg-white border border-slate-100 p-3.5 rounded-lg">
              <p className="font-semibold text-slate-800 mb-1">Critique Summary:</p>
              {evaluation.feedback}
            </div>

            {/* Suggestions list */}
            {evaluation.suggestions && evaluation.suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-indigo-500" /> Actionable Optimizations
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {evaluation.suggestions.map((sug, i) => (
                    <div key={i} className="flex gap-2 p-2 bg-white rounded border border-slate-100 hover:border-slate-200 text-slate-600 transition-all">
                      <CornerDownRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      <span>{sug}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Refactored Clean Code Option */}
            <div className="pt-2 border-t border-slate-200">
              <button
                onClick={() => setShowImproved(!showImproved)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {showImproved ? "Hide Improved Code Draft" : "Show AI Refactored Code Alternative"}
              </button>

              {showImproved && (
                <div className="mt-2.5 p-3.5 bg-slate-900 rounded-lg text-xs font-mono text-slate-300 relative overflow-x-auto max-h-72 border border-slate-800 dark-scrollbar">
                  <div className="absolute top-2 right-2 text-[10px] text-indigo-400 bg-slate-950 px-2 py-0.5 rounded font-sans uppercase">Suggested Refactoring</div>
                  <pre className="whitespace-pre">{evaluation.improvedCode || "// Check feedback suggestions for syntax optimizations"}</pre>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
