import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bot, Send, Sparkles, ShieldCheck, History, Activity, Lightbulb, CheckCircle2 } from 'lucide-react';
import { copilotApi } from '../services/api';
import { CopilotResponse } from '../types';

export const RiskCopilot: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('query') || '';

  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<CopilotResponse | null>(null);

  const samplePrompts = [
    "Which suppliers are currently high risk?",
    "Why is Apex Industrial Components high risk?",
    "Has Apex Industrial Components had similar problems before?",
    "What happened the last time Apex had delivery delays?",
    "Which suppliers have increasing prices?",
    "Find alternatives for Apex Industrial Components.",
    "Which suppliers are affected by recent news?"
  ];

  useEffect(() => {
    if (initialQuery) {
      handleAsk(initialQuery);
    }
  }, [initialQuery]);

  const handleAsk = async (userQuery: string) => {
    if (!userQuery.trim()) return;
    setLoading(true);
    try {
      const res = await copilotApi.query(userQuery);
      setResponse(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 p-6 rounded-3xl border border-indigo-500/30 shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase">
              AI Procurement Copilot
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Hindsight Persistent Memory Active</span>
          </div>
          <h1 className="text-xl font-extrabold text-white">Risk Copilot Assistant</h1>
          <p className="text-xs text-slate-400">Ask natural language procurement questions. Synthesizes real database records & recalled Hindsight memories.</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
          <Bot className="w-7 h-7 text-white" />
        </div>
      </div>

      {/* Query Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(query);
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Sparkles className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask Copilot e.g. Why is Apex Industrial Components high risk?"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? 'Analyzing...' : 'Query'}</span>
          </button>
        </form>

        {/* Quick Sample Prompts */}
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-400 self-center">Try asking:</span>
          {samplePrompts.map((p) => (
            <button
              key={p}
              onClick={() => {
                setQuery(p);
                handleAsk(p);
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
            >
              "{p}"
            </button>
          ))}
        </div>
      </div>

      {/* Response Card Container */}
      {loading && (
        <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
          <Bot className="w-8 h-8 text-indigo-400 animate-bounce" />
          <p>Synthesizing database records, news signals & Hindsight memories...</p>
        </div>
      )}

      {response && !loading && (
        <div className="space-y-6">
          {/* Main Answer Box */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>Copilot Decision Support Answer</span>
              </span>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Confidence: {response.confidence}%
              </span>
            </div>
            <p className="text-sm font-semibold text-white leading-relaxed">{response.answer}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Database Evidence */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Verified Database Evidence</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {response.evidence.map((ev, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">•</span>
                    <span>{ev}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Hindsight Historical Memories */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wide flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                <span>Hindsight Recalled Memories</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {response.historical_context.map((hc, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{hc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommendation */}
          {response.recommendation && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide">Procurement Action Recommendation</h4>
                <p className="text-xs text-slate-200 mt-1 font-semibold">{response.recommendation}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
