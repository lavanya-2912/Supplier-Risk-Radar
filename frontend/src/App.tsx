import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './layouts/AppLayout';

import { Dashboard } from './pages/Dashboard';
import { Suppliers } from './pages/Suppliers';
import { SupplierDetail } from './pages/SupplierDetail';
import { RiskRadar } from './pages/RiskRadar';
import { DisruptionPredictionPage } from './pages/DisruptionPrediction';
import { BackupSuppliers } from './pages/BackupSuppliers';
import { NewsIntelligence } from './pages/NewsIntelligence';
import { Analytics } from './pages/Analytics';
import { AlertsPage } from './pages/AlertsPage';
import { ReportsPage } from './pages/ReportsPage';
import { RiskCopilot } from './pages/RiskCopilot';
import { SettingsPage } from './pages/SettingsPage';
import { IntegrationHealthPage } from './pages/IntegrationHealthPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="suppliers/:id" element={<SupplierDetail />} />
              <Route path="risk-radar" element={<RiskRadar />} />
              <Route path="predictions" element={<DisruptionPredictionPage />} />
              <Route path="backup-suppliers" element={<BackupSuppliers />} />
              <Route path="news" element={<NewsIntelligence />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="copilot" element={<RiskCopilot />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="health" element={<IntegrationHealthPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

