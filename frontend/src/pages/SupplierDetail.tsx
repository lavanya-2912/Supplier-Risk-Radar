import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldAlert, AlertTriangle, CheckCircle, Clock, DollarSign,
  TrendingUp, Activity, Plus, Radar, Bot, Sliders, Newspaper,
  UserCheck, History, ArrowLeft, RefreshCw, X
} from 'lucide-react';
import {
  supplierApi, deliveryApi, qualityApi, priceApi, riskApi,
  predictionApi, hindsightApi, alternativeApi, newsApi
} from '../services/api';
import {
  Supplier, Delivery, QualityIncident, PriceHistory,
  RiskAnalysis, DisruptionPrediction, BackupCandidate, NewsArticle
} from '../types';

export const SupplierDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const supplierId = Number(id);

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [quality, setQuality] = useState<QualityIncident[]>([]);
  const [prices, setPrices] = useState<PriceHistory[]>([]);
  const [risk, setRisk] = useState<RiskAnalysis | null>(null);
  const [prediction, setPrediction] = useState<DisruptionPrediction | null>(null);
  const [memories, setMemories] = useState<any[]>([]);
  const [alternatives, setAlternatives] = useState<BackupCandidate[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'overview' | 'deliveries' | 'quality' | 'prices' | 'timeline' | 'prediction' | 'backups' | 'simulator'>('overview');

  // Modals state
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);

  // Delivery Modal Form
  const [delForm, setDelForm] = useState({
    purchase_order: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    expected_date: new Date().toISOString().split('T')[0],
    actual_date: new Date(Date.now() + 5*86400000).toISOString().split('T')[0],
    reason: 'Customs clearance delay',
    severity: 'Medium',
    notes: ''
  });

  // Quality Modal Form
  const [qualForm, setQualForm] = useState({
    defect_type: 'Microscopic Crack',
    defect_quantity: 45,
    total_quantity: 1000,
    severity: 'High',
    inspection_result: 'Failed',
    notes: ''
  });

  // Price Modal Form
  const [priceForm, setPriceForm] = useState({
    previous_price: 100,
    new_price: 112,
    reason: 'Freight surcharge'
  });

  // Simulator State
  const [simDelay, setSimDelay] = useState(5);
  const [simDefect, setSimDefect] = useState(2.5);
  const [simPrice, setSimPrice] = useState(8.0);
  const [simNews, setSimNews] = useState('High');
  const [simResult, setSimResult] = useState<any>(null);
  const [regeneratingAi, setRegeneratingAi] = useState(false);

  const handleRegenerateAi = async () => {
    setRegeneratingAi(true);
    try {
      const updatedRisk = await riskApi.generateAiRiskAssessment(supplierId);
      setRisk(updatedRisk);
    } catch (err) {
      console.error('Failed to regenerate AI analysis:', err);
    } finally {
      setRegeneratingAi(false);
    }
  };


  useEffect(() => {
    if (supplierId) {
      loadAllSupplierData();
    }
  }, [supplierId]);

  const loadAllSupplierData = async () => {
    setLoading(true);
    try {
      const [sData, dData, qData, pData, rData, predData, memData, altData, nData] = await Promise.all([
        supplierApi.getSupplier(supplierId),
        deliveryApi.getDeliveries(supplierId),
        qualityApi.getIncidents(supplierId),
        priceApi.getHistory(supplierId),
        riskApi.analyzeRisk(supplierId),
        predictionApi.getPrediction(supplierId),
        hindsightApi.getMemories(supplierId),
        alternativeApi.getAlternatives(supplierId, 3),
        newsApi.getSupplierNews(supplierId)
      ]);

      setSupplier(sData);
      setDeliveries(dData);
      setQuality(qData);
      setPrices(pData);
      setRisk(rData);
      setPrediction(predData);
      setMemories(memData.memories || []);
      setAlternatives(altData);
      setNews(nData);

      if (pData.length > 0) {
        setPriceForm(prev => ({ ...prev, previous_price: pData[0].new_price, new_price: pData[0].new_price * 1.08 }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    await deliveryApi.createDelivery(supplierId, delForm);
    setShowDeliveryModal(false);
    loadAllSupplierData();
  };

  const handleAddQuality = async (e: React.FormEvent) => {
    e.preventDefault();
    await qualityApi.createIncident(supplierId, qualForm);
    setShowQualityModal(false);
    loadAllSupplierData();
  };

  const handleAddPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    await priceApi.createPriceRecord(supplierId, priceForm);
    setShowPriceModal(false);
    loadAllSupplierData();
  };

  const handleRunSimulator = async () => {
    try {
      const res = await riskApi.runWhatIf(supplierId, {
        additional_delay_days: simDelay,
        defect_rate_change_pct: simDefect,
        price_increase_pct: simPrice,
        news_risk_level: simNews
      });
      setSimResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !supplier) {
    return (
      <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-xs">Loading Supplier Risk Intelligence Profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/suppliers" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Suppliers Directory</span>
      </Link>

      {/* Supplier Profile Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black text-white">{supplier.name}</h1>
            <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              {supplier.supplier_code}
            </span>
            <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
              risk?.risk_level === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
              risk?.risk_level === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
              risk?.risk_level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
              'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              {risk?.score} {risk?.risk_level} RISK
            </span>
          </div>

          <p className="text-xs text-slate-400">
            {supplier.category} • {supplier.city}, {supplier.country} • Contract: ${supplier.contract_value.toLocaleString()} ({supplier.currency})
          </p>

          <div className="flex flex-wrap gap-4 text-xs text-slate-300 pt-2 border-t border-slate-800/60">
            <div><span className="text-slate-500 font-medium">Lead Time:</span> <strong className="text-white">{supplier.lead_time} Days</strong></div>
            <div><span className="text-slate-500 font-medium">Capacity:</span> <strong className="text-white">{supplier.capacity}</strong></div>
            <div><span className="text-slate-500 font-medium">Payment:</span> <strong className="text-white">{supplier.payment_terms}</strong></div>
            <div><span className="text-slate-500 font-medium">Contact:</span> <strong className="text-white">{supplier.contact_person || 'N/A'}</strong> ({supplier.email})</div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
          <button
            onClick={() => riskApi.analyzeRisk(supplierId).then(r => setRisk(r))}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 text-xs font-bold transition"
          >
            <Radar className="w-4 h-4" />
            <span>Re-Analyze Risk Engine</span>
          </button>
          <Link
            to={`/copilot?query=Why is ${supplier.name} risky?`}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition"
          >
            <Bot className="w-4 h-4" />
            <span>Query Copilot</span>
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 overflow-x-auto text-xs font-semibold gap-1">
        {[
          { id: 'overview', label: 'Risk Breakdown' },
          { id: 'deliveries', label: `Deliveries (${deliveries.length})` },
          { id: 'quality', label: `Quality Defects (${quality.length})` },
          { id: 'prices', label: `Price History (${prices.length})` },
          { id: 'timeline', label: `Hindsight Memory (${memories.length})` },
          { id: 'prediction', label: 'Disruption Prediction' },
          { id: 'backups', label: `Backup Alternatives (${alternatives.length})` },
          { id: 'simulator', label: 'What-If Simulator' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 border-b-2 font-bold whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & EXPLAINABLE RISK BREAKDOWN */}
      {activeTab === 'overview' && risk && (
        <div className="space-y-6">
          {/* AI Risk Insights (Powered by Groq LPU™) Card */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 p-6 rounded-3xl shadow-2xl relative overflow-hidden space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-amber-500/20 shrink-0">
                  ⚡
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <span>AI Risk Insights</span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      Powered by Groq LPU™
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">LLaMA 3.3 70B Real-time Executive Narrative & Strategic Recommendations</p>
                </div>
              </div>

              <button
                onClick={handleRegenerateAi}
                disabled={regeneratingAi}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${regeneratingAi ? 'animate-spin' : ''}`} />
                <span>{regeneratingAi ? 'Analyzing on Groq LPU...' : 'Regenerate AI Analysis'}</span>
              </button>
            </div>

            {/* AI Executive Disruption Summary */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide">AI Executive Disruption Summary</h4>
              <p className="text-xs text-slate-200 leading-relaxed font-medium bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                {risk.ai_executive_summary || risk.ai_narrative?.executive_summary || risk.explanation}
              </p>
            </div>

            {/* Risk Drivers Breakdown & Tactical Recommendations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Risk Drivers */}
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 space-y-2">
                <h5 className="text-[11px] font-bold text-orange-400 uppercase tracking-wide">AI Risk Drivers Breakdown</h5>
                <ul className="space-y-2 text-xs text-slate-300">
                  {((risk.ai_risk_drivers && risk.ai_risk_drivers.length > 0)
                    ? risk.ai_risk_drivers
                    : (risk.ai_narrative?.risk_drivers || [
                        { category: "Delivery Delays", description: `On-time delivery score at ${risk.delivery_score}/100.` },
                        { category: "Quality Incidents", description: `Quality defect score at ${risk.quality_score}/100.` }
                      ])
                  ).map((driver: any, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-orange-400 font-bold">•</span>
                      <div>
                        <strong className="text-slate-200">{driver.category}: </strong>
                        <span>{driver.description}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tactical Action Recommendations */}
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 space-y-2">
                <h5 className="text-[11px] font-bold text-blue-400 uppercase tracking-wide">Recommended Strategic Actions</h5>
                <ul className="space-y-2 text-xs text-slate-300">
                  {((risk.ai_recommended_actions && risk.ai_recommended_actions.length > 0)
                    ? risk.ai_recommended_actions
                    : (risk.ai_narrative?.recommended_actions || [
                        `Initiate dual-sourcing review for ${supplier.name}.`,
                        "Issue formal CAPA request for quality & lead time compliance."
                      ])
                  ).map((action: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">✓</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Explanation Banner */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-1">Baseline Risk Engine Summary</h3>
            <p className="text-sm font-semibold text-slate-100">{risk.explanation}</p>
          </div>

          {/* 5 Risk Vector Component Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {risk.components.map((comp) => (
              <div key={comp.name} className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                <p className="text-xs font-semibold text-slate-400 truncate">{comp.name}</p>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-2xl font-black text-white">{comp.score}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Weight: {comp.weight_pct}%</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      comp.score > 75 ? 'bg-red-500' : comp.score > 50 ? 'bg-orange-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${comp.score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Positive vs Negative Signals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Positive Operational Factors</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {risk.positive_signals.map((sig, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{sig}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>Negative Risk Indicators</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {risk.negative_signals.map((sig, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">•</span>
                    <span>{sig}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DELIVERIES */}
      {activeTab === 'deliveries' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">Shipment & Delivery History</h3>
            <button
              onClick={() => setShowDeliveryModal(true)}
              className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Delivery Incident</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-3">PO Number</th>
                  <th className="p-3">Expected Date</th>
                  <th className="p-3">Actual Date</th>
                  <th className="p-3">Delay Days</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {deliveries.map(d => (
                  <tr key={d.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-white">{d.purchase_order}</td>
                    <td className="p-3">{new Date(d.expected_date).toLocaleDateString()}</td>
                    <td className="p-3">{new Date(d.actual_date).toLocaleDateString()}</td>
                    <td className="p-3 font-bold text-amber-400">{d.delay_days} days</td>
                    <td className="p-3">{d.reason}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        d.severity === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>{d.severity}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: QUALITY INCIDENTS */}
      {activeTab === 'quality' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">Quality Inspection Log</h3>
            <button
              onClick={() => setShowQualityModal(true)}
              className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Quality Incident</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Defect Type</th>
                  <th className="p-3">Defective / Total Qty</th>
                  <th className="p-3">Defect Rate %</th>
                  <th className="p-3">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {quality.map(q => (
                  <tr key={q.id} className="hover:bg-slate-800/40">
                    <td className="p-3">{new Date(q.date).toLocaleDateString()}</td>
                    <td className="p-3 font-bold text-white">{q.defect_type}</td>
                    <td className="p-3 font-mono">{q.defect_quantity} / {q.total_quantity}</td>
                    <td className="p-3 font-bold text-red-400">{q.defect_rate}%</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        q.inspection_result === 'Failed' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>{q.inspection_result}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PRICE CREEP */}
      {activeTab === 'prices' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">Historical Price Adjustments</h3>
            <button
              onClick={() => setShowPriceModal(true)}
              className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Price Change</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-3">Effective Date</th>
                  <th className="p-3">Previous Price</th>
                  <th className="p-3">New Price</th>
                  <th className="p-3">Change %</th>
                  <th className="p-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {prices.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="p-3">{new Date(p.effective_date).toLocaleDateString()}</td>
                    <td className="p-3 font-mono">${p.previous_price}</td>
                    <td className="p-3 font-mono font-bold text-white">${p.new_price}</td>
                    <td className="p-3 font-bold text-purple-400">+{p.change_percentage}%</td>
                    <td className="p-3">{p.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: HINDSIGHT INTELLIGENT MEMORY TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-center gap-3">
            <History className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-indigo-300">Hindsight Persistent AI Memory Store</h4>
              <p className="text-[11px] text-slate-300">
                Intelligent memory bank retaining historical delivery delays, quality incidents, price creep, and news risk signals across time.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {memories.length === 0 ? (
              <p className="text-xs text-slate-400">No memories recalled.</p>
            ) : (
              memories.map((mem, index) => (
                <div key={index} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0"></span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{mem.event_type}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{new Date(mem.timestamp).toLocaleString()}</span>
                      <span className="text-[9px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                        {mem.source || 'Hindsight Cloud'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 font-mono">{mem.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: DISRUPTION PREDICTION */}
      {activeTab === 'prediction' && prediction && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row justify-between gap-6">
            <div>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">30-Day Disruption Probability</span>
              <h2 className="text-3xl font-black text-white mt-1">{prediction.disruption_probability}% Probability</h2>
              <p className="text-xs text-slate-400 mt-1">Model Confidence: <strong>{prediction.confidence}%</strong> ({prediction.model_type})</p>
              <p className="text-xs text-slate-300 mt-3">{prediction.explanation}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 max-w-xs text-xs space-y-2">
              <span className="font-bold text-slate-400 uppercase text-[10px]">Model Horizon & Constraints</span>
              <p className="text-slate-300">Horizon: <strong>{prediction.prediction_horizon}</strong></p>
              <p className="text-slate-400 text-[11px]">{prediction.limitations}</p>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
            <h4 className="text-xs font-bold text-white mb-3">Supporting Empirical Evidence</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {prediction.evidence.map((ev, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                  <span>{ev}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* TAB 7: BACKUP ALTERNATIVE CANDIDATES */}
      {activeTab === 'backups' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white">Recommended Backup Replacement Suppliers</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {alternatives.map((alt) => (
              <div key={alt.supplier_id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-white">{alt.name}</h4>
                    <p className="text-[10px] text-slate-400">{alt.category} • {alt.country}</p>
                  </div>
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {alt.match_score}% Match
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-300">
                  <p>✓ On-Time Delivery: <strong>{alt.on_time_delivery_pct}%</strong></p>
                  <p>✓ Defect Rate: <strong>{alt.defect_rate_pct}%</strong></p>
                  <p>✓ Lead Time: <strong>{alt.lead_time} Days</strong></p>
                  <p>✓ Risk Score: <strong>{alt.risk_score}/100</strong></p>
                </div>

                {alt.ai_rationale && (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-950/40 to-amber-950/20 border border-orange-500/30 space-y-1">
                    <span className="text-[10px] font-bold text-orange-400 block">⚡ Groq LPU™ Selection Rationale</span>
                    <p className="text-[11px] text-amber-200/90 leading-relaxed">{alt.ai_rationale}</p>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  <p className="font-semibold text-amber-400">Potential Concern:</p>
                  <p>{alt.concerns[0]}</p>
                </div>

                <Link
                  to={`/backup-suppliers?target=${supplier.id}&alt=${alt.supplier_id}`}
                  className="block w-full py-2 text-center bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold hover:bg-blue-600/30"
                >
                  Compare Side-by-Side
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: WHAT-IF RISK SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-400" />
              <span>What-If Risk Stress Simulator</span>
            </h3>
            <p className="text-xs text-slate-400">Simulate projected risk impact without modifying actual records.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Additional Delivery Delay: {simDelay} days</label>
              <input type="range" min="0" max="30" value={simDelay} onChange={e => setSimDelay(Number(e.target.value))} className="w-full" />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Defect Rate Increase: +{simDefect}%</label>
              <input type="range" min="0" max="15" step="0.5" value={simDefect} onChange={e => setSimDefect(Number(e.target.value))} className="w-full" />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Price Escalation: +{simPrice}%</label>
              <input type="range" min="0" max="30" value={simPrice} onChange={e => setSimPrice(Number(e.target.value))} className="w-full" />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">News Risk Level</label>
              <select value={simNews} onChange={e => setSimNews(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200">
                <option value="Neutral">Neutral</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleRunSimulator}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30"
          >
            Execute Stress Simulation
          </button>

          {simResult && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-4 text-sm font-extrabold">
                <span className="text-slate-400">Current: {simResult.current_score} ({simResult.current_risk_level})</span>
                <span className="text-red-400">Projected: {simResult.projected_score} ({simResult.projected_risk_level})</span>
                <span className="text-amber-400">Delta: +{simResult.delta} pts</span>
              </div>
              <p className="text-xs text-slate-300">{simResult.explanation}</p>
            </div>
          )}
        </div>
      )}

      {/* Delivery Incident Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">Log Delivery Incident</h3>
              <button onClick={() => setShowDeliveryModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddDelivery} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Purchase Order</label>
                <input type="text" value={delForm.purchase_order} onChange={e => setDelForm({...delForm, purchase_order: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Expected Date</label>
                  <input type="date" value={delForm.expected_date} onChange={e => setDelForm({...delForm, expected_date: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200" />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Actual Date</label>
                  <input type="date" value={delForm.actual_date} onChange={e => setDelForm({...delForm, actual_date: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200" />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Reason for Delay</label>
                <input type="text" value={delForm.reason} onChange={e => setDelForm({...delForm, reason: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200" />
              </div>
              <button type="submit" className="w-full py-2 bg-blue-600 text-white font-bold rounded-xl">Save & Recalculate Risk</button>
            </form>
          </div>
        </div>
      )}

      {/* Quality Incident Modal */}
      {showQualityModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">Log Quality Defect Incident</h3>
              <button onClick={() => setShowQualityModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddQuality} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Defect Type</label>
                <input type="text" value={qualForm.defect_type} onChange={e => setQualForm({...qualForm, defect_type: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Defective Qty</label>
                  <input type="number" value={qualForm.defect_quantity} onChange={e => setQualForm({...qualForm, defect_quantity: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200" />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Total Quantity</label>
                  <input type="number" value={qualForm.total_quantity} onChange={e => setQualForm({...qualForm, total_quantity: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200" />
                </div>
              </div>
              <button type="submit" className="w-full py-2 bg-blue-600 text-white font-bold rounded-xl">Save & Recalculate Risk</button>
            </form>
          </div>
        </div>
      )}

      {/* Price Creep Modal */}
      {showPriceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">Log Price Adjustment</h3>
              <button onClick={() => setShowPriceModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddPrice} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Previous Price ($)</label>
                  <input type="number" value={priceForm.previous_price} onChange={e => setPriceForm({...priceForm, previous_price: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200" />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">New Price ($)</label>
                  <input type="number" value={priceForm.new_price} onChange={e => setPriceForm({...priceForm, new_price: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200" />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Reason</label>
                <input type="text" value={priceForm.reason} onChange={e => setPriceForm({...priceForm, reason: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200" />
              </div>
              <button type="submit" className="w-full py-2 bg-blue-600 text-white font-bold rounded-xl">Save & Recalculate Risk</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
