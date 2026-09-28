import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Users, Radar, TrendingUp, UserCheck,
  Newspaper, BarChart3, Bell, FileText, Bot, Settings,
  Activity, Search, Sun, Moon, LogOut, ShieldAlert, ChevronRight, Menu, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { alertApi, supplierApi } from '../services/api';
import { Supplier, AlertItem } from '../types';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState<number>(0);
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Supplier[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, [location.pathname]);

  const fetchAlerts = async () => {
    try {
      const alerts: AlertItem[] = await alertApi.getAlerts('Active');
      setUnreadAlerts(alerts.length);
    } catch (e) {
      console.error('Failed to fetch alerts count', e);
    }
  };

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setGlobalSearch(query);
    if (query.trim().length > 1) {
      setIsSearching(true);
      try {
        const suppliers = await supplierApi.getSuppliers({ search: query });
        setSearchResults(suppliers.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Suppliers', path: '/suppliers', icon: Users },
    { name: 'Risk Radar', path: '/risk-radar', icon: Radar },
    { name: 'Disruption Prediction', path: '/predictions', icon: TrendingUp },
    { name: 'Backup Suppliers', path: '/backup-suppliers', icon: UserCheck },
    { name: 'News Intelligence', path: '/news', icon: Newspaper },
    { name: 'Analytics & Heatmap', path: '/analytics', icon: BarChart3 },
    { name: 'Alerts', path: '/alerts', icon: Bell, badge: unreadAlerts > 0 ? unreadAlerts : undefined },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Risk Copilot', path: '/copilot', icon: Bot, highlight: true },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Integration Health', path: '/health', icon: Activity },
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex`}>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col w-64 border-r ${theme === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'} sticky top-0 h-screen z-30`}>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Radar className="w-6 h-6 text-white animate-spin-slow" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-white bg-clip-text text-transparent">
              SUPPLIER RISK RADAR
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">
              PREDICT DISRUPTION
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                } ${item.highlight ? 'bg-indigo-950/40 border border-indigo-500/30 text-indigo-300' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : (item.highlight ? 'text-indigo-400' : 'text-slate-400')}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="bg-red-500/20 text-red-400 border border-red-500/40 font-bold px-2 py-0.5 rounded-full text-[10px]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer User Info */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-900/40">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-blue-400">
              {user?.name ? user.name[0] : 'P'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Procurement Lead'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || 'demo@supplierrisk.com'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className={`sticky top-0 z-20 border-b ${theme === 'dark' ? 'bg-slate-950/80 border-slate-800/80 backdrop-blur-md' : 'bg-white/80 border-slate-200 backdrop-blur-md'} px-4 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Global Search Bar */}
            <div className="relative w-64 md:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={globalSearch}
                onChange={handleSearchChange}
                placeholder="Global search supplier, product, category, location..."
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-2 border-b border-slate-800 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Suppliers Found ({searchResults.length})
                  </div>
                  {searchResults.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        navigate(`/suppliers/${s.id}`);
                        setGlobalSearch('');
                        setSearchResults([]);
                      }}
                      className="p-3 hover:bg-slate-800 cursor-pointer flex items-center justify-between transition border-b border-slate-800/40 last:border-0"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-200">{s.name}</p>
                        <p className="text-[10px] text-slate-400">{s.category} • {s.country}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.current_risk_level === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                        s.current_risk_level === 'HIGH' ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {s.current_risk_score} {s.current_risk_level}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Health Indicator Badge */}
            <Link to="/health" className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/20 transition">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Integration Health: ONLINE
            </Link>

            {/* Quick Copilot Launch */}
            <Link to="/copilot" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-xs hover:shadow-lg hover:shadow-blue-500/25 transition">
              <Bot className="w-3.5 h-3.5" />
              <span>Risk Copilot</span>
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-blue-400" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{item.badge}</span>}
                </Link>
              );
            })}
          </div>
        )}

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
