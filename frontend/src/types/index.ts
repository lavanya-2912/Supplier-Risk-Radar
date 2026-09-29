export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  current_price: number;
}

export interface Supplier {
  id: number;
  supplier_code: string;
  name: string;
  category: string;
  country: string;
  city: string;
  address?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  status: string;
  contract_value: number;
  currency: string;
  lead_time: number;
  capacity: string;
  payment_terms?: string;
  created_at: string;
  updated_at: string;
  current_risk_score: number;
  current_risk_level: string;
  on_time_delivery_pct: number;
  defect_rate_pct: number;
  recent_price_change_pct: number;
  products: Product[];
}

export interface Delivery {
  id: number;
  supplier_id: number;
  purchase_order: string;
  expected_date: string;
  actual_date: string;
  delay_days: number;
  reason?: string;
  severity: string;
  notes?: string;
  created_at: string;
}

export interface QualityIncident {
  id: number;
  supplier_id: number;
  product_id?: number;
  defect_type: string;
  defect_quantity: number;
  total_quantity: number;
  defect_rate: number;
  severity: string;
  inspection_result: string;
  date: string;
  notes?: string;
}

export interface PriceHistory {
  id: number;
  supplier_id: number;
  product_id?: number;
  previous_price: number;
  new_price: number;
  change_percentage: number;
  effective_date: string;
  reason?: string;
}

export interface NewsArticle {
  id: number;
  supplier_id: number;
  title: string;
  source?: string;
  url?: string;
  published_at: string;
  category: string;
  sentiment: string;
  risk_score: number;
  summary?: string;
}

export interface RiskComponent {
  name: string;
  weight_pct: number;
  score: number;
  contribution_pct: number;
  description: string;
}

export interface AiRiskDriver {
  category: string;
  description: string;
}

export interface AiNarrative {
  executive_summary: string;
  emerging_signals: string[];
  risk_drivers: AiRiskDriver[];
  recommended_actions: string[];
}

export interface RiskAnalysis {
  supplier_id: number;
  score: number;
  risk_level: string;
  delivery_score: number;
  quality_score: number;
  price_score: number;
  historical_score: number;
  news_score: number;
  explanation: string;
  components: RiskComponent[];
  positive_signals: string[];
  negative_signals: string[];
  calculated_at: string;
  ai_narrative?: AiNarrative;
  ai_executive_summary?: string;
  ai_emerging_signals?: string[];
  ai_risk_drivers?: AiRiskDriver[];
  ai_recommended_actions?: string[];
}

export interface DisruptionPrediction {
  supplier_id: number;
  disruption_probability: number;
  confidence: number;
  risk_level: string;
  prediction_horizon: string;
  model_type: string;
  explanation: string;
  evidence: string[];
  limitations: string;
  created_at: string;
  ai_synthesis?: string;
  disruption_category?: string;
  sentiment?: string;
  severity_weight?: string;
}

export interface BackupCandidate {
  supplier_id: number;
  name: string;
  supplier_code: string;
  category: string;
  country: string;
  match_score: number;
  on_time_delivery_pct: number;
  defect_rate_pct: number;
  risk_score: number;
  lead_time: number;
  capacity: string;
  contract_value: number;
  reasons: string[];
  concerns: string[];
  ai_rationale?: string;
}

export interface CopilotResponse {
  answer: string;
  evidence: string[];
  historical_context: string[];
  current_signals: string[];
  recommendation?: string;
  confidence: number;
}

export interface AlertItem {
  id: number;
  supplier_id: number;
  supplier_name: string;
  type: string;
  severity: string;
  message: string;
  status: string;
  created_at: string;
}

export interface IntegrationHealth {
  status: string;
  database: { status: string; type: string; url: string };
  hindsight: { status: string; connected: boolean; bank_id: string; message: string };
  news_api: { status: string; configured: boolean };
  risk_engine: { status: string; weights: Record<string, number> };
  ml_model: { status: string; type: string };
}
