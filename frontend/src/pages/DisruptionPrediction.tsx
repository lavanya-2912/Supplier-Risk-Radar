import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ShieldAlert, AlertTriangle, CheckCircle, Activity, ChevronRight, Bot } from 'lucide-react';
import { supplierApi, predictionApi } from '../services/api';
import { Supplier, DisruptionPrediction } from '../types';

export const DisruptionPredictionPage: React.FC = () => {
  const [predictions, setPredictions] = useState<{ supplier: Supplier; pred: DisruptionPrediction }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    setLoading(true);
    try {
      const suppliers = await supplierApi.getSuppliers();
      const results = await Promise.all(
        suppliers.slice(0, 10).map(async (s) => {
          const pred = await predictionApi.getPrediction(s.id);
          return { supplier: s, pred };
        })
      );
      results.sort((a, b) => b.pred.disruption_probability - a.pred.disruption_probability);
      setPredictions(results);
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
            <span>Machine Learning Disruption Prediction Center</span>
          </h1>
          <p className="text-xs text-slate-400">
            30-day forward-looking disruption probability estimations powered by Scikit-Learn Random Forest and Hindsight Memory.
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
          <div className="col-span-2 py-16 text-center text-slate-400 text-xs">Loading disruption predictions...</div>
        ) : (
          predictions.map(({ supplier, pred }) => (
            <div key={supplier.id} className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-sm text-white">{supplier.name}</h3>
                  <p className="text-[10px] text-slate-400">{supplier.category} • {supplier.country}</p>
                </div>
                <span className={`text-xs font-black px-3 py-1 rounded-full border ${
                  pred.disruption_probability >= 70 ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                  pred.disruption_probability >= 40 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}>
                  {pred.disruption_probability}% Disruption Prob.
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Model Confidence: <strong>{pred.confidence}%</strong></span>
                  <span>Horizon: <strong>{pred.prediction_horizon}</strong></span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${pred.disruption_probability >= 70 ? 'bg-red-500' : 'bg-amber-500'}`}
                    style={{ width: `${pred.disruption_probability}%` }}
                  ></div>
                </div>
              </div>

              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{pred.explanation}</p>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">{pred.model_type}</span>
                <Link to={`/suppliers/${supplier.id}`} className="text-blue-400 font-bold hover:underline inline-flex items-center gap-1">
                  View Full Profile <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
