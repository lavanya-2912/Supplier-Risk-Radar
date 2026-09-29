import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { UserCheck, ArrowRightLeft, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';
import { supplierApi, alternativeApi } from '../services/api';
import { Supplier, BackupCandidate } from '../types';

export const BackupSuppliers: React.FC = () => {
  const [searchParams] = useSearchParams();
  const targetIdParam = searchParams.get('target');

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<number>(targetIdParam ? Number(targetIdParam) : 1);
  const [alternatives, setAlternatives] = useState<BackupCandidate[]>([]);
  const [selectedAltIds, setSelectedAltIds] = useState<number[]>([]);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    if (selectedTargetId) {
      loadAlternatives(selectedTargetId);
    }
  }, [selectedTargetId]);

  const loadSuppliers = async () => {
    try {
      const data = await supplierApi.getSuppliers();
      setSuppliers(data);
      if (data.length > 0 && !targetIdParam) {
        // Default to first high-risk supplier or first supplier
        const highRisk = data.find(s => s.status === 'High Risk' || s.current_risk_level === 'CRITICAL');
        setSelectedTargetId(highRisk ? highRisk.id : data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAlternatives = async (targetId: number) => {
    setLoading(true);
    try {
      const recs = await alternativeApi.getAlternatives(targetId, 3);
      setAlternatives(recs);
      const altIds = recs.map(r => r.supplier_id);
      setSelectedAltIds(altIds);
      if (altIds.length > 0) {
        const comp = await alternativeApi.compare(targetId, altIds);
        setComparisonData(comp);
      }
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
            <UserCheck className="w-5 h-5 text-blue-400" />
            <span>Intelligent Backup Supplier Recommendation & Comparison</span>
          </h1>
          <p className="text-xs text-slate-400">
            Automated multi-attribute matching algorithm to identify pre-qualified backup suppliers when primary suppliers face risk.
          </p>
        </div>
      </div>

      {/* Target Supplier Selector */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
        <label className="text-xs font-bold text-slate-300 whitespace-nowrap">Select Primary At-Risk Supplier:</label>
        <select
          value={selectedTargetId}
          onChange={e => setSelectedTargetId(Number(e.target.value))}
          className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl px-4 py-2 flex-1 focus:outline-none focus:border-blue-500"
        >
          {suppliers.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.supplier_code}) — {s.category} • Risk: {s.current_risk_score} ({s.current_risk_level})
            </option>
          ))}
        </select>
      </div>

      {/* Recommended Alternatives Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">Computing backup supplier matches...</div>
        ) : alternatives.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">No suitable backup candidates found.</div>
        ) : (
          alternatives.map((alt) => (
            <div key={alt.supplier_id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-sm text-white">{alt.name}</h3>
                  <p className="text-[10px] text-slate-400">{alt.category} • {alt.country}</p>
                </div>
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {alt.match_score}% Match
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-300">
                {alt.reasons.map((r, i) => (
                  <p key={i} className="text-emerald-400 text-[11px]">{r}</p>
                ))}
              </div>

              {alt.ai_rationale && (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-950/40 to-amber-950/20 border border-orange-500/30 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-orange-400">
                    <span>⚡ Groq LPU™ Selection Rationale</span>
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed font-medium">
                    {alt.ai_rationale}
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                <p className="font-semibold text-amber-400">Potential Concern:</p>
                <p>{alt.concerns[0]}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Side-by-Side 3-Column Comparison Table */}
      {comparisonData && comparisonData.target_supplier && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-blue-400" />
            <span>Side-by-Side Procurement Matrix (Current vs Alternatives)</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                  <th className="p-3 w-1/4">Evaluation Vector</th>
                  <th className="p-3 w-1/4 text-red-400 bg-red-950/20">Current: {comparisonData.target_supplier.name}</th>
                  {comparisonData.alternatives.map((alt: any, i: number) => (
                    <th key={alt.id} className="p-3 w-1/4 text-emerald-400 bg-emerald-950/20">
                      Alt {i+1}: {alt.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                <tr>
                  <td className="p-3 font-semibold text-slate-400">
                    <span className="flex items-center gap-1 text-orange-400 font-bold">⚡ Groq LPU™ Rationale</span>
                  </td>
                  <td className="p-3 bg-red-950/10 text-[11px] text-slate-400 italic">Primary supplier undergoing risk mitigation</td>
                  {comparisonData.alternatives.map((alt: any) => (
                    <td key={alt.id} className="p-3 bg-emerald-950/10 text-[11px] text-amber-200/90 font-medium leading-relaxed">
                      {alt.ai_rationale || 'Recommended backup supplier.'}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-400">Risk Score & Level</td>
                  <td className="p-3 bg-red-950/10 font-bold text-red-400">{comparisonData.target_supplier.risk_score}/100</td>
                  {comparisonData.alternatives.map((alt: any) => (
                    <td key={alt.id} className="p-3 bg-emerald-950/10 font-bold text-emerald-400">{alt.risk_score}/100</td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-400">On-Time Delivery %</td>
                  <td className="p-3 bg-red-950/10 font-bold">{comparisonData.target_supplier.otd_pct}%</td>
                  {comparisonData.alternatives.map((alt: any) => (
                    <td key={alt.id} className="p-3 bg-emerald-950/10 font-bold text-emerald-400">{alt.otd_pct}%</td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-400">Defect Rate %</td>
                  <td className="p-3 bg-red-950/10">{comparisonData.target_supplier.defect_rate}%</td>
                  {comparisonData.alternatives.map((alt: any) => (
                    <td key={alt.id} className="p-3 bg-emerald-950/10">{alt.defect_rate}%</td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-400">Lead Time</td>
                  <td className="p-3 bg-red-950/10">{comparisonData.target_supplier.lead_time} Days</td>
                  {comparisonData.alternatives.map((alt: any) => (
                    <td key={alt.id} className="p-3 bg-emerald-950/10">{alt.lead_time} Days</td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-400">Production Capacity</td>
                  <td className="p-3 bg-red-950/10">{comparisonData.target_supplier.capacity}</td>
                  {comparisonData.alternatives.map((alt: any) => (
                    <td key={alt.id} className="p-3 bg-emerald-950/10">{alt.capacity}</td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-400">Contract Exposure</td>
                  <td className="p-3 bg-red-950/10">${comparisonData.target_supplier.contract_value?.toLocaleString()}</td>
                  {comparisonData.alternatives.map((alt: any) => (
                    <td key={alt.id} className="p-3 bg-emerald-950/10">${alt.contract_value?.toLocaleString()}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
