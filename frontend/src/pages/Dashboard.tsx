import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, Legend
} from 'recharts';
import {
  Users, AlertTriangle, ShieldAlert, TrendingUp, DollarSign, Activity,
  ArrowUpRight, RefreshCw, Bot, ExternalLink, ChevronRight, CheckCircle, Clock
} from 'lucide-react';
import { supplierApi, alertApi, riskApi } from '../services/api';
import { Supplier, AlertItem } from '../types';

export const Dashboard: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendDays, setTrendDays] = useState<7 | 30 | 90>(30);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [supData, alertData] = await Promise.all([
        supplierApi.getSuppliers(),
        alertApi.getAlerts('Active')
      ]);
      setSuppliers(supData);
      setAlerts(alertData);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  // Executive Metrics Calculations from real DB data
  const totalSuppliers = suppliers.length;
  const criticalCount = suppliers.filter((s) => s.current_risk_level === 'CRITICAL').length;
  const highRiskCount = suppliers.filter((s) => s.current_risk_level === 'HIGH').length;
  const avgRisk = totalSuppliers > 0 ? (suppliers.reduce((acc, s) => acc + s.current_risk_score, 0) / totalSuppliers).toFixed(1) : '0.0';
  const totalExposure = suppliers.reduce((acc, s) => acc + s.contract_value, 0);
  const potentialDisruptions = suppliers.filter((s) => s.current_risk_score >= 60 || s.status === 'High Risk').length;

  // Donut Chart Data
  const riskDistData = [
    { name: 'Low', value: suppliers.filter((s) => s.current_risk_level === 'LOW').length, color: '#16A34A' },
    { name: 'Medium', value: suppliers.filter((s) => s.current_risk_level === 'MEDIUM').length, color: '#CA8A04' },
    { name: 'High', value: suppliers.filter((s) => s.current_risk_level === 'HIGH').length, color: '#EA580C' },
    { name: 'Critical', value: suppliers.filter((s) => s.current_risk_level === 'CRITICAL').length, color: '#DC2626' },
  ].filter(d => d.value > 0);

  // Delivery Performance Chart Data
  const deliveryBarData = [
    { category: 'Electronics', OnTime: 92, Delayed: 6, CriticalDelay: 2 },
    { category: 'Automotive', OnTime: 85, Delayed: 10, CriticalDelay: 5 },
    { category: 'Raw Materials', OnTime: 88, Delayed: 9, CriticalDelay: 3 },
    { category: 'Pharma', OnTime: 96, Delayed: 3, CriticalDelay: 1 },
    { category: 'Packaging', OnTime: 94, Delayed: 5, CriticalDelay: 1 },
  ];

  // Quality Defect Rate Trend
  const qualityTrendData = [
    { month: 'Jan', defectRate: 1.2 },
    { month: 'Feb', defectRate: 1.4 },
    { month: 'Mar', defectRate: 2.1 },
    { month: 'Apr', defectRate: 4.8 },
    { month: 'May', defectRate: 3.5 },
    { month: 'Jun', defectRate: 5.2 },
    { month: 'Jul', defectRate: 4.1 },
    { month: 'Aug', defectRate: 6.8 },
  ];

  // Price Creep Trend
  const priceCreepData = [
    { month: 'Jan', index: 100 },
    { month: 'Feb', index: 101.5 },
    { month: 'Mar', index: 103.2 },
    { month: 'Apr', index: 105.0 },
    { month: 'May', index: 108.4 },
    { month: 'Jun', index: 111.0 },
    { month: 'Jul', index: 114.2 },
    { month: 'Aug', index: 120.0 },
  ];

  // Risk Trend Line Data
  const riskTrendData = [
    { day: 'Wk 1', avgRisk: 24, highRiskCount: 2 },
    { day: 'Wk 2', avgRisk: 28, highRiskCount: 3 },
    { day: 'Wk 3', avgRisk: 31, highRiskCount: 4 },
    { day: 'Wk 4', avgRisk: 39, highRiskCount: 5 },
    { day: 'Wk 5', avgRisk: 44, highRiskCount: 6 },
    { day: 'Wk 6', avgRisk: 48, highRiskCount: 7 },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold tracking-wide uppercase">
              Executive Control Tower
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Live Sync</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Global Supplier Risk Overview</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Real-time procurement intelligence monitoring historical delay patterns, quality defect surges, price creep, and news disruption signals.
          </p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
          <Link
            to="/copilot"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition"
          >
            <Bot className="w-4 h-4" />
            <span>Ask Risk Copilot</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Suppliers */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Suppliers</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white">{totalSuppliers}</p>
          <p className="text-[10px] text-slate-400 mt-1">15 Active Monitored</p>
        </div>

        {/* Critical Risk */}
        <div className="bg-slate-900/80 border border-red-500/30 p-4 rounded-2xl shadow-md bg-gradient-to-b from-red-950/20 to-transparent">
          <div className="flex items-center justify-between text-red-400 mb-2">
            <span className="text-xs font-medium">Critical Risk</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-black text-red-400">{criticalCount}</p>
          <p className="text-[10px] text-red-400/80 mt-1">Immediate Action Req.</p>
        </div>

        {/* High Risk */}
        <div className="bg-slate-900/80 border border-orange-500/30 p-4 rounded-2xl shadow-md bg-gradient-to-b from-orange-950/20 to-transparent">
          <div className="flex items-center justify-between text-orange-400 mb-2">
            <span className="text-xs font-medium">High Risk</span>
            <AlertTriangle className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-2xl font-black text-orange-400">{highRiskCount}</p>
          <p className="text-[10px] text-orange-400/80 mt-1">Under Review</p>
        </div>

        {/* Potential Disruptions */}
        <div className="bg-slate-900/80 border border-amber-500/30 p-4 rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-medium">Disruption Threat</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300">{potentialDisruptions}</p>
          <p className="text-[10px] text-slate-400 mt-1">Predicted &gt;60% prob.</p>
        </div>

        {/* Average Risk */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Average Risk</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white">{avgRisk}<span className="text-xs text-slate-400 font-normal">/100</span></p>
          <p className="text-[10px] text-emerald-400 mt-1">Weighted 5-vector score</p>
        </div>

        {/* Contract Exposure */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Contract Value</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-black text-emerald-400">${(totalExposure / 1000000).toFixed(1)}M</p>
          <p className="text-[10px] text-slate-400 mt-1">Total Monitored Spend</p>
        </div>
      </div>

      {/* Main Charts Row 1: Donut Distribution & Risk Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Distribution Donut */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 p-5 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Risk Level Breakdown</span>
              <span className="text-[10px] text-slate-400 font-normal">Active Suppliers</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Supplier categorization by risk score</p>
          </div>

          <div className="h-48 my-2 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-extrabold text-white">{totalSuppliers}</span>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60">
            {riskDistData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs px-2 py-1 rounded-lg bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-slate-300 text-[11px] font-medium">{item.name} Risk</span>
                </div>
                <span className="font-bold text-white text-[11px]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Trend Line Chart */}
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 p-5 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Supplier Risk Index Trend</h2>
              <p className="text-[11px] text-slate-400">Average historical risk trajectory & high-risk count escalation</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px]">
              {([7, 30, 90] as const).map((days) => (
                <button
                  key={days}
                  onClick={() => setTrendDays(days)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    trendDays === days ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {days}D
                </button>
              ))}
            </div>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={riskTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Line type="monotone" dataKey="avgRisk" name="Avg Risk Index" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="highRiskCount" name="High Risk Suppliers" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Charts Row 2: Delivery, Quality, Price Creep */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Delivery Performance Bar */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl shadow-xl">
          <h2 className="text-sm font-bold text-white mb-1">On-Time Delivery Performance</h2>
          <p className="text-[11px] text-slate-400 mb-3">On-Time vs Delayed shipments by category</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deliveryBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={10} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px' }} />
                <Bar dataKey="OnTime" name="On-Time %" fill="#16a34a" stackId="a" />
                <Bar dataKey="Delayed" name="Delayed %" fill="#ea580c" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quality Defect Rate Trend */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl shadow-xl">
          <h2 className="text-sm font-bold text-white mb-1">Quality Defect Rate Trend</h2>
          <p className="text-[11px] text-slate-400 mb-3">Average defect percentage surge over time</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={qualityTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px' }} />
                <Line type="monotone" dataKey="defectRate" name="Defect Rate %" stroke="#f97316" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Price Creep Trend */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl shadow-xl">
          <h2 className="text-sm font-bold text-white mb-1">Price Creep Escalation</h2>
          <p className="text-[11px] text-slate-400 mb-3">Cumulative component price index growth</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceCreepData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px' }} />
                <Line type="monotone" dataKey="index" name="Price Index" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Critical Watchlist & Active Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* High Risk Suppliers Watchlist */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 p-5 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>High-Risk Supplier Watchlist</span>
              </h2>
              <p className="text-[11px] text-slate-400">Suppliers requiring immediate intervention & alternative backup evaluation</p>
            </div>
            <Link to="/suppliers" className="text-xs text-blue-400 font-semibold hover:underline flex items-center gap-1">
              View All Suppliers <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {suppliers.filter(s => s.current_risk_level === 'CRITICAL' || s.current_risk_level === 'HIGH').slice(0, 4).map((sup) => (
              <div
                key={sup.id}
                className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">{sup.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({sup.supplier_code})</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      sup.current_risk_level === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    }`}>
                      {sup.current_risk_score} {sup.current_risk_level}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {sup.category} • {sup.country} • Contract: ${sup.contract_value.toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/suppliers/${sup.id}`}
                    className="px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 text-xs font-semibold transition"
                  >
                    Details & Risk
                  </Link>
                  <Link
                    to={`/backup-suppliers?target=${sup.id}`}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                  >
                    Find Backups
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Automated Alerts */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 p-5 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Active Risk Alerts ({alerts.length})</span>
                </h2>
                <p className="text-[11px] text-slate-400">Automated signal threshold breaches</p>
              </div>
              <Link to="/alerts" className="text-xs text-blue-400 font-semibold hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {alerts.slice(0, 4).map((alt) => (
                <div key={alt.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    alt.severity === 'Critical' ? 'bg-red-400 animate-pulse' : 'bg-amber-400'
                  }`}></span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 truncate">{alt.supplier_name}</span>
                      <span className="text-[9px] text-slate-500">{new Date(alt.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{alt.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800/60 text-center">
            <Link to="/copilot" className="text-xs text-indigo-400 font-semibold hover:underline inline-flex items-center gap-1">
              Ask Copilot "Why are these suppliers high risk?" <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
