import React, { useState } from "react";
import { PrepSession, TopicType, DifficultyType } from "../types";
import { 
  FolderGit, 
  Trash2, 
  Bookmark, 
  BookmarkCheck, 
  ChevronRight, 
  History, 
  Calendar,
  Layers,
  Search,
  BookOpen,
  HelpCircle,
  XCircle,
  Clock
} from "lucide-react";

interface SessionHistoryProps {
  sessions: PrepSession[];
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  currentSessionId?: string | null;
}

const topicColors: Record<TopicType, string> = {
  "DSA": "bg-blue-50 text-blue-800 border-blue-100",
  "DBMS": "bg-purple-50 text-purple-800 border-purple-100",
  "OS": "bg-amber-50 text-amber-800 border-amber-100",
  "System Design": "bg-pink-50 text-pink-800 border-pink-100",
  "OOPs": "bg-emerald-50 text-emerald-800 border-emerald-100"
};

const diffColors: Record<DifficultyType, string> = {
  "Easy": "text-emerald-700 bg-emerald-55 border-emerald-100",
  "Medium": "text-yellow-700 bg-yellow-55 border-yellow-100",
  "Hard": "text-red-700 bg-red-55 border-red-100"
};

export default function SessionHistory({
  sessions,
  onSelectSession,
  onDeleteSession,
  onToggleBookmark,
  currentSessionId
}: SessionHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all"); // 'all', 'bookmarked', 'DSA', etc.

  // Date formatting helper
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  const filteredSessions = sessions.filter(session => {
    // Search query
    const matchSearch = 
      session.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.difficulty.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter toggle
    if (selectedFilter === "bookmarked") {
      return matchSearch && session.bookmarked;
    } else if (selectedFilter !== "all") {
      return matchSearch && session.topic === selectedFilter;
    }

    return matchSearch;
  });

  return (
    <div id="session-history-container" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-800 text-sm md:text-base flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500" /> Past Evaluations Stack
        </h4>
        <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
          {sessions.length}
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by query..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent"
          />
        </div>

        {/* Quick scrollable tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 text-xs no-scrollbar">
          <button
            onClick={() => setSelectedFilter("all")}
            className={`px-2.5 py-1 rounded-full border transition-all shrink-0 cursor-pointer ${
              selectedFilter === "all"
                ? "bg-slate-900 border-slate-900 text-white font-medium"
                : "bg-slate-50 border-slate-100 text-slate-650 hover:bg-slate-100 hover:border-slate-300"
            }`}
          >
            All Runs
          </button>
          <button
            onClick={() => setSelectedFilter("bookmarked")}
            className={`px-2.5 py-1 rounded-full border transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
              selectedFilter === "bookmarked"
                ? "bg-slate-900 border-slate-900 text-white font-medium"
                : "bg-slate-50 border-slate-100 text-slate-650 hover:bg-slate-100 hover:border-slate-300"
            }`}
          >
            <Bookmark className="w-3 h-3 fill-current" /> Saved ONLY
          </button>
          {(["DSA", "DBMS", "OS", "System Design", "OOPs"] as TopicType[]).map((top) => (
            <button
              key={top}
              onClick={() => setSelectedFilter(top)}
              className={`px-2.5 py-1 rounded-full border transition-all shrink-0 cursor-pointer ${
                selectedFilter === top
                  ? "bg-slate-900 border-slate-900 text-white font-medium"
                  : "bg-slate-50 border-slate-100 text-slate-650 hover:bg-slate-100 hover:border-slate-300"
              }`}
            >
              {top}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions list */}
      <div className="space-y-2.5 overflow-y-auto max-h-[460px] pr-1 dark-scrollbar">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-medium text-xs">No matching sessions found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Start a premium mock run to populate this timeline!</p>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isActive = currentSessionId === session.id;
            return (
              <div
                key={session.id}
                className={`group p-3.5 rounded-xl border transition-all relative flex flex-col justify-between gap-3 ${
                  isActive 
                    ? "border-slate-900 bg-slate-50/75 shadow-sm ring-2 ring-slate-800/5" 
                    : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-thin"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    onClick={() => onSelectSession(session.id)}
                    className="text-left flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${topicColors[session.topic] || "bg-slate-100 text-slate-800 border-slate-200"}`}>
                        {session.topic}
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {session.language}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-1.5 text-slate-450 text-[11px]">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{formatDate(session.createdAt)}</span>
                    </div>
                  </button>

                  {/* Bookmark and delete controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onToggleBookmark(session.id)}
                      className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-amber-500 transition-colors"
                      title={session.bookmarked ? "Remove bookmark" : "Bookmark session"}
                    >
                      {session.bookmarked ? (
                        <BookmarkCheck className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      ) : (
                        <Bookmark className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => onDeleteSession(session.id)}
                      className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                  <span className={`px-1.5 py-0.2 rounded font-medium border text-[10px] ${diffColors[session.difficulty] || "text-slate-600 bg-slate-50"}`}>
                    {session.difficulty}
                  </span>
                  
                  <button
                    onClick={() => onSelectSession(session.id)}
                    className="text-slate-800 hover:text-indigo-600 font-bold flex items-center gap-0.5 select-none"
                  >
                    Load Prep <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
