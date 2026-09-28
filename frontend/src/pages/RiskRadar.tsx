import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { Radar, Filter, RefreshCw } from 'lucide-react';
import { riskApi } from '../services/api';

export const RiskRadar: React.FC = () => {
  const navigate = useNavigate();
  const [matrixData, setMatrixData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    loadMatrix();
  }, []);

  const loadMatrix = async () => {
    setLoading(true);
    try {
      const data = await riskApi.getMatrix();
      setMatrixData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = categoryFilter === 'All' ? matrixData : matrixData.filter(d => d.category === categoryFilter);

  const getBubbleColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return '#dc2626';
      case 'HIGH': return '#ea580c';
      case 'MEDIUM': return '#ca8a04';
      default: return '#16a34a';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Radar className="w-5 h-5 text-blue-400" />
            <span>Interactive Risk Matrix Radar</span>
          </h1>
          <p className="text-xs text-slate-400">
            2D Risk Matrix mapping Probability of Disruption (X) vs Business Impact (Y). Bubble size represents Contract Exposure.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2"
          >
            <option value="All">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Automotive">Automotive</option>
            <option value="Pharmaceuticals">Pharmaceuticals</option>
            <option value="Food">Food</option>
            <option value="Packaging">Packaging</option>
            <option value="Raw Materials">Raw Materials</option>
          </select>
          <button onClick={loadMatrix} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Radar Matrix Chart Container */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
        <div className="h-[450px]">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading Risk Matrix...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  type="number"
                  dataKey="probability"
                  name="Disruption Probability %"
                  unit="%"
                  domain={[0, 100]}
                  stroke="#64748b"
                  fontSize={11}
                  label={{ value: 'Disruption Probability % (Lower Risk → Higher Risk)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="business_impact"
                  name="Business Impact Index"
                  domain={[0, 10]}
                  stroke="#64748b"
                  fontSize={11}
                  label={{ value: 'Business Impact (Contract Value Exposure)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
                />
                <ZAxis type="number" dataKey="exposure" range={[100, 1000]} name="Contract Value" />
                <RechartsTooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-2xl text-xs space-y-1">
                          <p className="font-bold text-white">{data.name} ({data.supplier_code})</p>
                          <p className="text-slate-400">{data.category} • {data.country}</p>
                          <p className="text-slate-300">Probability: <strong>{data.probability}%</strong></p>
                          <p className="text-slate-300">Business Impact: <strong>{data.business_impact}/10</strong></p>
                          <p className="text-slate-300">Contract Exposure: <strong>${data.exposure?.toLocaleString()}</strong></p>
                          <p className={`font-bold mt-1 ${
                            data.risk_level === 'CRITICAL' ? 'text-red-400' : 'text-emerald-400'
                          }`}>Risk Score: {data.risk_score} ({data.risk_level})</p>
                          <p className="text-[10px] text-blue-400 italic">Click bubble to open details</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter
                  data={filteredData}
                  onClick={(entry) => navigate(`/suppliers/${entry.id}`)}
                  className="cursor-pointer"
                >
                  {filteredData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBubbleColor(entry.risk_level)} stroke="#ffffff" strokeWidth={1} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 border-t border-slate-800/60 text-xs">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span><span className="text-slate-300">Low Risk (0-24)</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span><span className="text-slate-300">Medium Risk (25-49)</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500"></span><span className="text-slate-300">High Risk (50-74)</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-600"></span><span className="text-slate-300">Critical Risk (75-100)</span></div>
        </div>
      </div>
    </div>
  );
};
