import axios from 'axios';
import {
  User, Supplier, Delivery, QualityIncident, PriceHistory,
  NewsArticle, RiskAnalysis, DisruptionPrediction, BackupCandidate,
  CopilotResponse, AlertItem, IntegrationHealth
} from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('srr_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (credentials: any) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  register: async (userData: any) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export const supplierApi = {
  getSuppliers: async (params?: any): Promise<Supplier[]> => {
    const res = await api.get('/suppliers', { params });
    return res.data;
  },
  getSupplier: async (id: number): Promise<Supplier> => {
    const res = await api.get(`/suppliers/${id}`);
    return res.data;
  },
  createSupplier: async (data: any): Promise<Supplier> => {
    const res = await api.post('/suppliers', data);
    return res.data;
  },
  updateSupplier: async (id: number, data: any): Promise<Supplier> => {
    const res = await api.put(`/suppliers/${id}`, data);
    return res.data;
  },
  deleteSupplier: async (id: number) => {
    const res = await api.delete(`/suppliers/${id}`);
    return res.data;
  },
};

export const deliveryApi = {
  getDeliveries: async (supplierId: number): Promise<Delivery[]> => {
    const res = await api.get(`/suppliers/${supplierId}/deliveries`);
    return res.data;
  },
  createDelivery: async (supplierId: number, data: any): Promise<Delivery> => {
    const res = await api.post(`/suppliers/${supplierId}/deliveries`, data);
    return res.data;
  },
};

export const qualityApi = {
  getIncidents: async (supplierId: number): Promise<QualityIncident[]> => {
    const res = await api.get(`/suppliers/${supplierId}/quality`);
    return res.data;
  },
  createIncident: async (supplierId: number, data: any): Promise<QualityIncident> => {
    const res = await api.post(`/suppliers/${supplierId}/quality`, data);
    return res.data;
  },
};

export const priceApi = {
  getHistory: async (supplierId: number): Promise<PriceHistory[]> => {
    const res = await api.get(`/suppliers/${supplierId}/prices`);
    return res.data;
  },
  createPriceRecord: async (supplierId: number, data: any): Promise<PriceHistory> => {
    const res = await api.post(`/suppliers/${supplierId}/prices`, data);
    return res.data;
  },
};

export const riskApi = {
  getRisk: async (supplierId: number): Promise<RiskAnalysis> => {
    const res = await api.get(`/suppliers/${supplierId}/risk`);
    return res.data;
  },
  analyzeRisk: async (supplierId: number): Promise<RiskAnalysis> => {
    const res = await api.post(`/suppliers/${supplierId}/risk/analyze`);
    return res.data;
  },
  generateAiRiskAssessment: async (supplierId: number): Promise<RiskAnalysis> => {
    const res = await api.post(`/suppliers/${supplierId}/ai-risk-assessment`);
    return res.data;
  },
  runWhatIf: async (supplierId: number, data: any) => {
    const res = await api.post(`/suppliers/${supplierId}/what-if`, data);
    return res.data;
  },
  getMatrix: async () => {
    const res = await api.get('/suppliers/risk/matrix/all');
    return res.data;
  },
  getHeatmap: async () => {
    const res = await api.get('/suppliers/risk/heatmap/all');
    return res.data;
  },
};

export const predictionApi = {
  getPrediction: async (supplierId: number): Promise<DisruptionPrediction> => {
    const res = await api.get(`/suppliers/${supplierId}/prediction`);
    return res.data;
  },
  runPrediction: async (supplierId: number): Promise<DisruptionPrediction> => {
    const res = await api.post(`/suppliers/${supplierId}/prediction`);
    return res.data;
  },
  getDisruptions: async (): Promise<any[]> => {
    const res = await api.get('/disruptions');
    return res.data;
  },
};

export const newsApi = {
  getSupplierNews: async (supplierId: number): Promise<NewsArticle[]> => {
    const res = await api.get(`/suppliers/${supplierId}/news`);
    return res.data;
  },
  getAllNews: async (): Promise<NewsArticle[]> => {
    const res = await api.get('/news/all');
    return res.data;
  },
  syncNews: async (supplierId?: number) => {
    const res = await api.post('/news/sync', { supplier_id: supplierId });
    return res.data;
  },
  addManualNews: async (supplierId: number, data: any): Promise<NewsArticle> => {
    const res = await api.post(`/suppliers/${supplierId}/news`, data);
    return res.data;
  },
};

export const hindsightApi = {
  getMemories: async (supplierId: number) => {
    const res = await api.get(`/suppliers/${supplierId}/memory`);
    return res.data;
  },
  searchMemory: async (supplierId: number, query: string) => {
    const res = await api.post(`/suppliers/${supplierId}/memory/search`, { query });
    return res.data;
  },
};

export const alternativeApi = {
  getAlternatives: async (supplierId: number, limit = 4): Promise<BackupCandidate[]> => {
    const res = await api.get(`/suppliers/${supplierId}/alternatives?limit=${limit}`);
    return res.data;
  },
  getRecommendations: async (supplierId: number, limit = 4): Promise<BackupCandidate[]> => {
    const res = await api.get(`/suppliers/${supplierId}/recommendations?limit=${limit}`);
    return res.data;
  },
  compare: async (supplierId: number, alternativeIds: number[]) => {
    const res = await api.post(`/suppliers/${supplierId}/compare`, { alternative_ids: alternativeIds });
    return res.data;
  },
};

export const copilotApi = {
  query: async (query: string, supplierId?: number): Promise<CopilotResponse> => {
    const res = await api.post('/copilot/query', { query, supplier_id: supplierId });
    return res.data;
  },
};

export const alertApi = {
  getAlerts: async (statusFilter?: string): Promise<AlertItem[]> => {
    const res = await api.get('/alerts', { params: { status_filter: statusFilter } });
    return res.data;
  },
  updateAlert: async (id: number, status: string): Promise<AlertItem> => {
    const res = await api.put(`/alerts/${id}`, { status });
    return res.data;
  },
};

export const reportApi = {
  generateReport: async (payload: { supplier_ids?: number[]; format: string }) => {
    const response = await api.post('/reports/generate', payload, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export const healthApi = {
  getHealth: async (): Promise<IntegrationHealth> => {
    const res = await api.get('/integrations/health');
    return res.data;
  },
};

export const settingsApi = {
  getSettings: async () => {
    const res = await api.get('/settings');
    return res.data;
  },
  updateSettings: async (data: any) => {
    const res = await api.put('/settings', data);
    return res.data;
  },
  testHindsight: async () => {
    const res = await api.post('/settings/test-hindsight');
    return res.data;
  },
};
