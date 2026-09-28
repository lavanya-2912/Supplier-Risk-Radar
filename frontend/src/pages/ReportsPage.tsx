import React, { useState } from 'react';
import { FileText, Download, CheckSquare, Square, FileSpreadsheet } from 'lucide-react';
import { reportApi, supplierApi } from '../services/api';
import { Supplier } from '../types';

export const ReportsPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<'pdf' | 'csv'>('pdf');

  React.useEffect(() => {
    supplierApi.getSuppliers().then(data => {
      setSuppliers(data);
      setSelectedIds(data.map(s => s.id));
    });
  }, []);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const blob = await reportApi.generateReport({
        supplier_ids: selectedIds,
        format
      });

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `supplier_risk_report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          <span>Executive Intelligence Report Generator</span>
        </h1>
        <p className="text-xs text-slate-400">
          Export formal PDF or CSV risk intelligence audit reports including Hindsight historical memory context and disruption predictions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Report Options Card */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <h2 className="text-sm font-bold text-white">Export Options</h2>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">File Format</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 ${
                  format === 'pdf' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>PDF Document</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 ${
                  format === 'csv' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>CSV Dataset</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleDownload}
            disabled={loading || selectedIds.length === 0}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{loading ? 'Generating Report...' : `Download ${format.toUpperCase()} Report`}</span>
          </button>
        </div>

        {/* Supplier Selection List */}
        <div className="md:col-span-2 p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white">Include Suppliers ({selectedIds.length} / {suppliers.length})</h2>
            <button
              onClick={() => setSelectedIds(selectedIds.length === suppliers.length ? [] : suppliers.map(s => s.id))}
              className="text-xs text-blue-400 font-semibold hover:underline"
            >
              {selectedIds.length === suppliers.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {suppliers.map(s => (
              <div
                key={s.id}
                onClick={() => toggleSelect(s.id)}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer flex items-center justify-between hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  {selectedIds.includes(s.id) ? (
                    <CheckSquare className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                  <div>
                    <p className="text-xs font-bold text-white">{s.name}</p>
                    <p className="text-[10px] text-slate-400">{s.category} • {s.country}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-300">{s.current_risk_score} {s.current_risk_level}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
