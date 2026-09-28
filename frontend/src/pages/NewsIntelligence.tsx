import React, { useState, useEffect } from 'react';
import { Newspaper, RefreshCw, ExternalLink, ShieldAlert, Plus, X } from 'lucide-react';
import { newsApi, supplierApi } from '../services/api';
import { NewsArticle, Supplier } from '../types';

export const NewsIntelligence: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Manual Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number>(1);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('Logistics disruption');

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    try {
      const [nData, sData] = await Promise.all([
        newsApi.getAllNews(),
        supplierApi.getSuppliers()
      ]);
      setArticles(nData);
      setSuppliers(sData);
      if (sData.length > 0) setSelectedSupplierId(sData[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNews = async () => {
    setSyncing(true);
    try {
      await newsApi.syncNews();
      await loadNews();
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const handleAddManualNews = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await newsApi.addManualNews(selectedSupplierId, { title, summary, category });
      setShowAddModal(false);
      setTitle('');
      setSummary('');
      loadNews();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-blue-400" />
            <span>External News Intelligence Radar</span>
          </h1>
          <p className="text-xs text-slate-400">
            Real-time automated scanning and risk classification of macro logistics, labor, port, and geopolitical signals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Link Manual News Signal</span>
          </button>
          <button
            onClick={handleSyncNews}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Synchronizing...' : 'Sync News API Signals'}</span>
          </button>
        </div>
      </div>

      {/* News Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center py-16 text-slate-400 text-xs">Loading news signals...</div>
        ) : (
          articles.map((art) => {
            const supplier = suppliers.find(s => s.id === art.supplier_id);
            return (
              <div key={art.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-md">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {art.category}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    art.sentiment === 'Critical' || art.sentiment === 'Risk' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {art.sentiment} ({art.risk_score}/100)
                  </span>
                </div>

                <h3 className="font-bold text-sm text-white leading-snug">{art.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{art.summary}</p>

                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <span>Target: <strong className="text-white">{supplier?.name || `Supplier #${art.supplier_id}`}</strong></span>
                  <span>{new Date(art.published_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Manual Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">Link External News Signal</h3>
              <button onClick={() => setShowAddModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddManualNews} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Target Supplier</label>
                <select value={selectedSupplierId} onChange={e => setSelectedSupplierId(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200">
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Article Headline</label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Port congestion causes 10-day delay" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200" />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Risk Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200">
                  <option value="Logistics disruption">Logistics disruption</option>
                  <option value="Factory shutdown">Factory shutdown</option>
                  <option value="Strike">Strike</option>
                  <option value="Financial distress">Financial distress</option>
                  <option value="Cyber incident">Cyber incident</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Summary / Context</label>
                <textarea value={summary} onChange={e => setSummary(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 h-20"></textarea>
              </div>
              <button type="submit" className="w-full py-2 bg-blue-600 text-white font-bold rounded-xl">Save & Impact Risk Score</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
