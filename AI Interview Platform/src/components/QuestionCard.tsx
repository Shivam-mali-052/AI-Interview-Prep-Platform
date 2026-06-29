import React, { useState } from "react";
import { Question, CodeEvaluation, AiEngineType } from "../types";
import { 
  HelpCircle, 
  MessageSquare, 
  HelpCircleIcon, 
  ChevronDown, 
  Sparkles, 
  Lightbulb, 
  Trophy,
  CodeXml,
  ChevronRight,
  UserCheck
} from "lucide-react";
import CodeEditor from "./CodeEditor";

interface QuestionCardProps {
  question: Question;
  language: string;
  onSaveAttempt: (questionId: number, code: string, evaluation: CodeEvaluation) => void;
  savedAttempt?: { code: string; evaluation?: CodeEvaluation };
  aiEngine?: AiEngineType;
}

export default function QuestionCard({ question, language, onSaveAttempt, savedAttempt, aiEngine }: QuestionCardProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);

  return (
    <div id={`question-node-${question.id}`} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200">
      
      {/* Header Panel */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-start gap-4">
          <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 shadow-sm">
            Q{question.id}
          </span>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-800 text-sm md:text-base leading-snug">
              {question.question}
            </h4>
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="inline-flex items-center gap-1 text-[10px] bg-sky-50 text-sky-800 border border-sky-100 font-semibold px-2 py-0.5 rounded uppercase">
                <Lightbulb className="w-3 h-3 text-sky-500" /> Interview Concept
              </span>
              {savedAttempt?.evaluation && (
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                  savedAttempt.evaluation.passed 
                    ? "bg-emerald-50 text-emerald-800 border-none"
                    : "bg-red-50 text-red-800 border-none"
                }`}>
                  <Trophy className="w-3 h-3" /> Score: {savedAttempt.evaluation.score}/100
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Space */}
      <div className="p-5 space-y-5">
        
        {/* Answer section */}
        <div className="space-y-2">
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors py-1 outline-none"
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              <span>Expert Reference Answer & Explanations</span>
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showAnswer ? "rotate-180" : ""}`} />
          </button>

          {showAnswer && (
            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 text-xs md:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              <p className="font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> AI Interrogator Solution:
              </p>
              {question.answer}
            </div>
          )}
        </div>

        {/* Follow-up Question section */}
        <div className="p-4 bg-amber-50/20 rounded-xl border border-amber-100/60 text-xs">
          <p className="font-bold text-amber-800 uppercase tracking-wide flex items-center gap-1.5 mb-1">
            <UserCheck className="w-3.5 h-3.5" /> Follow-Up Interview Question
          </p>
          <p className="text-slate-600 italic">
            &ldquo;{question.followUp}&rdquo;
          </p>
        </div>

        {/* Coding Challenge Launcher */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => setShowChallenge(!showChallenge)}
            className={`w-full py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-between transition-all outline-none ${
              showChallenge 
                ? "bg-slate-900 text-white border-slate-900" 
                : "bg-white text-slate-705 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <CodeXml className={`w-4 h-4 ${showChallenge ? "text-sky-400" : "text-slate-500"}`} />
              <span>Interactive Coding Challenge {showChallenge ? "Active" : "Closed"}</span>
            </span>
            <div className="flex items-center gap-2">
              {savedAttempt && (
                <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20">
                  Attempt Done
                </span>
              )}
              <ChevronRight className={`w-4 h-4 transition-transform ${showChallenge ? "rotate-90" : ""}`} />
            </div>
          </button>

          {showChallenge && (
            <div className="mt-4 animate-fadeIn">
              <CodeEditor
                challenge={question.codingChallenge}
                language={language}
                onSaveAttempt={(code, evalResult) => onSaveAttempt(question.id, code, evalResult)}
                savedAttempt={savedAttempt}
                aiEngine={aiEngine}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
