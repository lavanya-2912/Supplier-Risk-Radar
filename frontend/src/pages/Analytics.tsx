import React, { useState, useEffect } from 'react';
import { BarChart3, Activity, ShieldAlert, Layers } from 'lucide-react';
import { riskApi, supplierApi } from '../services/api';
import { Supplier } from '../types';

export const Analytics: React.FC = () => {
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [hData, sData] = await Promise.all([
        riskApi.getHeatmap(),
        supplierApi.getSuppliers()
      ]);
      setHeatmap(hData);
      setSuppliers(sData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getHeatmapColor = (score: number) => {
    if (score >= 75) return 'bg-red-600/30 text-red-400 border border-red-500/40 font-bold';
    if (score >= 50) return 'bg-orange-600/30 text-orange-400 border border-orange-500/40 font-bold';
    if (score >= 25) return 'bg-amber-600/20 text-amber-300 border border-amber-500/30';
    return 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <span>Supply Chain Risk Analytics & Vector Heatmap</span>
        </h1>
        <p className="text-xs text-slate-400">
          Multi-dimensional matrix evaluating Delivery, Quality, Price, News, Historical, and Geographic Risk across all active suppliers.
        </p>
      </div>

      {/* Dependency Exposure Summary */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Supplier Concentration & Dependency Analysis</span>
        </h2>
        <p className="text-xs text-slate-300">
          Single-source dependency alert: <strong>Apex Industrial Components</strong> accounts for 48% of total critical microcontroller MCU supply exposure.
        </p>
      </div>

      {/* Heatmap Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">6-Vector Supply Chain Heatmap</h3>
          <span className="text-[10px] text-slate-400 font-mono">Scores range 0 (Low) to 100 (Critical)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                <th className="p-3.5">Supplier Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5 text-center">Delivery Risk</th>
                <th className="p-3.5 text-center">Quality Risk</th>
                <th className="p-3.5 text-center">Price Risk</th>
                <th className="p-3.5 text-center">News Risk</th>
                <th className="p-3.5 text-center">Hindsight Memory</th>
                <th className="p-3.5 text-center">Geographic Risk</th>
                <th className="p-3.5 text-center">Overall</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr><td colSpan={9} className="py-12 text-center text-slate-400">Loading risk heatmap...</td></tr>
              ) : (
                heatmap.map((item) => (
                  <tr key={item.supplier_id} className="hover:bg-slate-800/40">
                    <td className="p-3.5 font-bold text-white">{item.supplier_name}</td>
                    <td className="p-3.5 text-slate-400">{item.category}</td>
                    <td className="p-2 text-center"><span className={`inline-block w-16 py-1 rounded-lg text-center ${getHeatmapColor(item.vectors.delivery)}`}>{item.vectors.delivery}</span></td>
                    <td className="p-2 text-center"><span className={`inline-block w-16 py-1 rounded-lg text-center ${getHeatmapColor(item.vectors.quality)}`}>{item.vectors.quality}</span></td>
                    <td className="p-2 text-center"><span className={`inline-block w-16 py-1 rounded-lg text-center ${getHeatmapColor(item.vectors.price)}`}>{item.vectors.price}</span></td>
                    <td className="p-2 text-center"><span className={`inline-block w-16 py-1 rounded-lg text-center ${getHeatmapColor(item.vectors.news)}`}>{item.vectors.news}</span></td>
                    <td className="p-2 text-center"><span className={`inline-block w-16 py-1 rounded-lg text-center ${getHeatmapColor(item.vectors.historical)}`}>{item.vectors.historical}</span></td>
                    <td className="p-2 text-center"><span className={`inline-block w-16 py-1 rounded-lg text-center ${getHeatmapColor(item.vectors.geographic)}`}>{item.vectors.geographic}</span></td>
                    <td className="p-2 text-center"><span className={`inline-block w-16 py-1 rounded-lg text-center font-extrabold ${getHeatmapColor(item.overall_score)}`}>{item.overall_score}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
