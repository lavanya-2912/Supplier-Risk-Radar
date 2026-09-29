import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ChevronRight, Bot } from 'lucide-react';
import { predictionApi } from '../services/api';

export const DisruptionPredictionPage: React.FC = () => {
  const [disruptions, setDisruptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDisruptions();
  }, []);

  const loadDisruptions = async () => {
    setLoading(true);
    try {
      const data = await predictionApi.getDisruptions();
      setDisruptions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <span>AI Disruption Prediction & Synthesis Center</span>
          </h1>
          <p className="text-xs text-slate-400">
            30-day forward-looking disruption probability estimations powered by Scikit-Learn ML and Groq LPU™ AI Synthesis.
          </p>
        </div>

        <Link
          to="/copilot"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg"
        >
          <Bot className="w-4 h-4" />
          <span>Ask Copilot For Evidence</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-16 text-center text-slate-400 text-xs">Loading AI disruption predictions...</div>
        ) : disruptions.length === 0 ? (
          <div className="col-span-2 py-16 text-center text-slate-400 text-xs">No disruption predictions recorded.</div>
        ) : (
          disruptions.map((item) => {
            const supplier = item.supplier || { id: item.supplier_id, name: `Supplier #${item.supplier_id}`, category: 'Supply', country: 'Global' };
            const prob = item.disruption_probability;
            return (
              <div key={item.supplier_id} className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm text-white">{supplier.name}</h3>
                    <p className="text-[10px] text-slate-400">{supplier.category} • {supplier.country}</p>
                  </div>
                  <span className={`text-xs font-black px-3 py-1 rounded-full border ${
                    prob >= 70 ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                    prob >= 40 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {prob}% Disruption Prob.
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Confidence: <strong>{item.confidence}%</strong></span>
                    <span>Horizon: <strong>{item.prediction_horizon}</strong></span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${prob >= 70 ? 'bg-red-500' : 'bg-amber-500'}`}
                      style={{ width: `${prob}%` }}
                    ></div>
                  </div>
                </div>

                {item.ai_synthesis && (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-950/40 to-amber-950/20 border border-orange-500/30 space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-extrabold text-orange-400">
                      <span>⚡ Groq LPU™ Disruption Synthesis</span>
                      {item.disruption_category && (
                        <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                          {item.disruption_category}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-amber-200/90 leading-relaxed font-medium">
                      {item.ai_synthesis}
                    </p>
                  </div>
                )}

                <p className="text-xs text-slate-300 leading-relaxed font-mono text-[11px]">{item.explanation}</p>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">{item.model_type}</span>
                  <Link to={`/suppliers/${supplier.id}`} className="text-blue-400 font-bold hover:underline inline-flex items-center gap-1">
                    View Full Profile <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
