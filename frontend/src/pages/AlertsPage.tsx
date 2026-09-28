import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ShieldAlert, CheckCircle, ExternalLink, ArrowRightLeft, Radar } from 'lucide-react';
import { alertApi, riskApi } from '../services/api';
import { AlertItem } from '../types';

export const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    loadAlerts();
  }, [statusFilter]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await alertApi.getAlerts(statusFilter);
      setAlerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReviewed = async (alertId: number) => {
    try {
      await alertApi.updateAlert(alertId, 'Reviewed');
      loadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnalyze = async (supplierId: number) => {
    try {
      await riskApi.analyzeRisk(supplierId);
      navigate(`/suppliers/${supplierId}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            <span>Automated Risk Alert Command Center</span>
          </h1>
          <p className="text-xs text-slate-400">
            Real-time threshold alert notifications generated when supplier performance, quality, price creep, or news risk spikes.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2"
        >
          <option value="All">All Alerts</option>
          <option value="Active">Active Only</option>
          <option value="Reviewed">Reviewed Only</option>
        </select>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading active risk alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">No alerts found matching filter.</div>
        ) : (
          alerts.map((alt) => (
            <div key={alt.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    alt.severity === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {alt.severity}
                  </span>
                  <span className="text-xs font-bold text-white">{alt.supplier_name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({alt.type})</span>
                </div>
                <p className="text-xs text-slate-300">{alt.message}</p>
                <p className="text-[10px] text-slate-500">{new Date(alt.created_at).toLocaleString()}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link
                  to={`/suppliers/${alt.supplier_id}`}
                  className="px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 text-xs font-semibold"
                >
                  View Supplier
                </Link>

                <button
                  onClick={() => handleAnalyze(alt.supplier_id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold"
                >
                  Analyze Risk
                </button>

                <Link
                  to={`/backup-suppliers?target=${alt.supplier_id}`}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold"
                >
                  Compare Alternatives
                </Link>

                {alt.status === 'Active' && (
                  <button
                    onClick={() => handleMarkReviewed(alt.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs font-bold"
                  >
                    Mark Reviewed
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
