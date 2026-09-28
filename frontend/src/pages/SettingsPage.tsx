import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, RefreshCw, Key, Database, Activity } from 'lucide-react';
import { settingsApi } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingHindsight, setTestingHindsight] = useState(false);
  const [hindsightTestResult, setHindsightTestResult] = useState<any>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsApi.getSettings();
      setSettings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await settingsApi.updateSettings({
        risk_threshold_high: settings.risk_threshold_high,
        risk_threshold_critical: settings.risk_threshold_critical,
        price_creep_normal: settings.price_creep_normal,
        price_creep_significant: settings.price_creep_significant,
        currency: settings.currency
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestHindsight = async () => {
    setTestingHindsight(true);
    try {
      const res = await settingsApi.testHindsight();
      setHindsightTestResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setTestingHindsight(false);
    }
  };

  if (loading || !settings) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" />
          <span>Platform Risk Thresholds & Integrations</span>
        </h1>
        <p className="text-xs text-slate-400">Configure global risk scoring thresholds and test Hindsight Cloud connection.</p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-between shadow-lg">
          <span>✓ Settings and platform risk thresholds saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Risk Thresholds Card */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-lg">
          <h2 className="text-sm font-bold text-white">Risk Scoring Thresholds</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">High Risk Threshold Score</label>
              <input
                type="number"
                value={settings.risk_threshold_high}
                onChange={e => setSettings({...settings, risk_threshold_high: Number(e.target.value)})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Critical Risk Threshold Score</label>
              <input
                type="number"
                value={settings.risk_threshold_critical}
                onChange={e => setSettings({...settings, risk_threshold_critical: Number(e.target.value)})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Hindsight Connection Integration Card */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>Hindsight Cloud Persistent Memory Configuration</span>
            </h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
              Bank ID: {settings.hindsight.bank_id}
            </span>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-2">
            <p className="text-slate-400">API Endpoint: <strong className="text-slate-200">{settings.hindsight.api_url}</strong></p>
            <p className="text-slate-400">API Key Status: <strong className="text-emerald-400">{settings.hindsight.api_key_configured ? 'Configured in backend .env' : 'Not Set (Operating in Local Structured Memory Fallback)'}</strong></p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTestHindsight}
              disabled={testingHindsight}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <Activity className={`w-3.5 h-3.5 ${testingHindsight ? 'animate-spin' : ''}`} />
              <span>Test Hindsight Connection</span>
            </button>
          </div>

          {hindsightTestResult && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
              <p className="text-indigo-400">Status: {hindsightTestResult.status}</p>
              <p className="text-slate-300">{hindsightTestResult.message}</p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </form>
    </div>
  );
};
