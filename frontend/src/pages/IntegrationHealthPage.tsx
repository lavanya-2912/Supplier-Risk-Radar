import React, { useState, useEffect } from 'react';
import { Activity, Database, Newspaper, Cpu, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { healthApi } from '../services/api';
import { IntegrationHealth } from '../types';

export const IntegrationHealthPage: React.FC = () => {
  const [health, setHealth] = useState<IntegrationHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealth();
  }, []);

  const loadHealth = async () => {
    setLoading(true);
    try {
      const data = await healthApi.getHealth();
      setHealth(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !health) {
    return <div className="py-12 text-center text-xs text-slate-400">Checking system health...</div>;
  }

  const services = [
    {
      name: 'Database Layer (PostgreSQL / SQLite)',
      status: health.database.status,
      details: `Type: ${health.database.type} (${health.database.url})`,
      icon: Database,
      ok: health.database.status === 'CONNECTED'
    },
    {
      name: 'Hindsight Cloud AI Memory Bank',
      status: health.hindsight.status,
      details: `${health.hindsight.message} (Bank ID: ${health.hindsight.bank_id})`,
      icon: Activity,
      ok: health.hindsight.connected
    },
    {
      name: 'External News API Engine',
      status: health.news_api.status,
      details: health.news_api.configured ? 'External News API key active' : 'Operating in local news signal fallback mode',
      icon: Newspaper,
      ok: health.news_api.configured
    },
    {
      name: 'Explainable Risk Engine',
      status: health.risk_engine.status,
      details: '5-Vector Weighted Algorithm (Delivery 30%, Quality 25%, Price 15%, Historical 15%, News 15%)',
      icon: Cpu,
      ok: true
    },
    {
      name: 'Scikit-Learn ML Model',
      status: health.ml_model.status,
      details: health.ml_model.type,
      icon: Cpu,
      ok: true
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span>System Integration Health Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400">Live operational status of backend services, database connections, and AI memory engines.</p>
        </div>
        <button onClick={loadHealth} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {services.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4 shadow-md">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  s.ok ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{s.name}</h3>
                  <p className="text-xs text-slate-400">{s.details}</p>
                </div>
              </div>

              <span className={`text-xs font-black px-3 py-1 rounded-full border ${
                s.ok ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {s.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
