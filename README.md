# 🛡️ Supplier Risk Radar

> **"Predict disruption. Protect your supply chain."**

Supplier Risk Radar is an enterprise-grade, AI-powered supply chain risk intelligence platform designed for procurement leads, supply chain managers, and risk auditors. The platform aggregates multi-source operational metrics—including shipment delivery delays, quality inspection defect surges, price creep trends, and macro news signals—to calculate explainable risk scores, predict 30-day disruption probabilities, retain persistent historical memories via Hindsight Cloud, and recommend pre-qualified backup suppliers.

---

## 🌟 Key Capabilities & Features

1. **📊 Executive Control Tower Dashboard**
   - Live KPI monitoring: Total Suppliers, Critical/High Risk counts, Disruption Threats, Average Risk Index, and Contract Exposure ($).
   - Real-time visualizations: Risk Distribution Donut, 30-Day Risk Escalation Line Chart, Category-wise Delivery Performance, Quality Defect Rate Trends, and Component Price Creep Index.
   - High-risk supplier watchlist with instant intervention shortcuts.

2. **🧠 5-Vector Explainable Risk Engine**
   - Weighted algorithmic risk model evaluating five core operational vectors:
     - 🚚 **Delivery Performance (30%)**: Delay frequency, average delay days, and critical PO delays.
     - 🔬 **Quality Defect Rate (25%)**: Defect percentages and failed inspection ratio.
     - 📈 **Price Creep (15%)**: Cumulative price increases and margin impact.
     - 📜 **Historical Context (15%)**: Recurring historical incident pattern penalty.
     - 📰 **News Signals (15%)**: Real-time logistics, labor strike, and geopolitical news sentiment.
   - Transparent risk breakdowns with positive operational factors and negative risk indicators.

3. **🤖 Hindsight Cloud Persistent AI Memory Integration**
   - Remembers past supplier disruptions, quality failures, price hikes, and news events across time.
   - Prevents memory loss across sessions and feeds historical context directly into Risk Copilot queries and PDF audit reports.

4. **🔮 Machine Learning Disruption Prediction Center**
   - Scikit-Learn Random Forest Classifier predicting 30-day forward-looking disruption probability for each supplier.
   - Includes model confidence rating, prediction horizon (30 days), limitations, and empirical supporting evidence.

5. **🎯 Interactive Risk Radar Matrix (2D Scatter Plot)**
   - Maps suppliers on a 2D matrix: **Disruption Probability (X-axis)** vs **Business Impact Index (Y-axis)**.
   - Bubble sizing reflects **Contract Value Exposure ($)** with color-coded risk severity.
   - Clickable bubbles navigate directly to detailed supplier risk profiles.

6. **🔄 Intelligent Backup Supplier Recommendation & Comparison**
   - Multi-attribute matching algorithm recommending optimal replacement suppliers when primary suppliers face risk.
   - 3-Column side-by-side comparison matrix comparing Risk Score, On-Time Delivery %, Defect Rate %, Lead Time, Capacity, and Contract Exposure.

7. **💬 AI Procurement Risk Copilot**
   - Natural language Decision Support Assistant answering complex procurement queries.
   - Synthesizes live database records, external news signals, and recalled Hindsight memories to provide confidence-rated answers and actionable recommendations.

8. **⚡ What-If Risk Stress Simulator**
   - Interactive sliders to model hypothetical delivery delay spikes, quality defect rate increases, price escalations, and news risk levels without mutating real records.

9. **🚨 Automated Risk Alert Command Center**
   - Triggers real-time alerts when risk thresholds are breached.
   - Quick actions to mark alerts as reviewed, re-analyze risk engines, or navigate to backup candidate selection.

10. **📄 Executive Intelligence Report Generator**
    - One-click export of formal **PDF Audit Documents** (formatted with ReportLab) and **CSV Datasets**.

11. **💚 System Integration Health Dashboard**
    - Real-time operational monitoring for Database connectivity, Hindsight Cloud Memory Bank, News API status, Explainable Risk Engine, and ML Model status.

---

## 🛠️ Technology Stack

### **Backend**
- **Framework**: Python 3.10+, FastAPI (ASGI)
- **Database & ORM**: SQLite / PostgreSQL with SQLAlchemy ORM
- **Machine Learning**: Scikit-learn (Random Forest Classifier & Feature Engineering)
- **PDF Generation**: ReportLab
- **Authentication**: OAuth2 JWT Bearer tokens with Passlib (Bcrypt) hashing
- **Data Schemas**: Pydantic v2

### **Frontend**
- **Framework**: React 18 with TypeScript 5
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS, Lucide Icons, Glassmorphism UI tokens
- **Data Visualization**: Recharts (Line, Bar, Donut, Scatter Plot Matrix)
- **HTTP Client**: Axios with JWT request interceptors
- **Routing**: React Router v6

---

## 📁 Project Structure

```
Supplier-Risk-Radar/
├── README.md                   # Complete Platform Documentation
├── .env.example                # Shared Environment Variables Example
├── backend/
│   ├── app/
│   │   ├── auth/               # Security, Passwords, JWT Tokens & Dependencies
│   │   ├── ml/                 # Scikit-learn Model, Feature Engineering & Predictor
│   │   ├── models/             # SQLAlchemy DB Models (Supplier, Risk, Delivery, Quality, Price, News, User, Setting)
│   │   ├── routers/            # FastAPI Endpoints (Suppliers, Risk, Copilot, Alerts, Reports, etc.)
│   │   ├── schemas/            # Pydantic Schemas for Validation
│   │   ├── scripts/            # Seed script with realistic fictional procurement demo data
│   │   ├── services/           # Business Logic Services (Risk, Hindsight, Copilot, Recommendation, Report)
│   │   ├── config.py           # App Configuration
│   │   ├── database.py         # SQLAlchemy Engine & Session Setup
│   │   └── main.py             # FastAPI App Entrypoint
│   ├── requirements.txt        # Python Dependencies
│   └── supplier_risk_radar.db  # SQLite Database (Auto-created and seeded)
└── frontend/
    ├── src/
    │   ├── context/            # AuthContext & ThemeContext (Light/Dark Mode)
    │   ├── layouts/            # AppLayout (Sidebar, Search, Header Navigation)
    │   ├── pages/              # UI Pages (Dashboard, Suppliers, SupplierDetail, RiskRadar, Copilot, etc.)
    │   ├── services/           # Axios API Services Interface
    │   ├── types/              # TypeScript Interfaces
    │   ├── App.tsx             # Main Router Setup
    │   └── main.tsx            # React DOM Entrypoint
    ├── package.json            # Node.js Dependencies & Scripts
    ├── tailwind.config.js      # Tailwind Styling Config
    └── vite.config.ts          # Vite Server Proxy Config
```

---

## 🚀 Quick Setup & Installation

### **1. Prerequisites**
- Python 3.10+ installed
- Node.js 18+ and npm installed

---

### **2. Backend Setup**

Navigate to the `backend` directory:
```bash
cd backend
```

Create and activate a virtual environment (optional but recommended):
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/macOS
python3 -m venv venv
source venv/bin/activate
```

Install backend dependencies:
```bash
pip install -r requirements.txt
```

Launch the FastAPI dev server:
```bash
python -m uvicorn app.main:app --reload --port 8000
```
> 💡 *On initial startup, the backend automatically seeds realistic fictional demo data into `supplier_risk_radar.db`.*

Interactive API documentation will be available at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

### **3. Frontend Setup**

In a new terminal window, navigate to the `frontend` directory:
```bash
cd frontend
```

Install frontend dependencies:
```bash
npm install
```

Start the Vite development server:
```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:5173
```

---

## 🔑 Default Demo Credentials

You can sign in using the pre-seeded Procurement Lead demo account:

- **Email**: `demo@supplierrisk.com`
- **Password**: `Demo@123`

---

## 📡 Core API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token |
| `GET` | `/api/suppliers` | List suppliers with search, category & risk filters |
| `POST` | `/api/suppliers` | Onboard new supplier & record baseline memory |
| `GET` | `/api/suppliers/{id}` | Get full supplier profile details |
| `POST` | `/api/suppliers/{id}/risk/analyze` | Execute 5-vector explainable risk analysis |
| `POST` | `/api/suppliers/{id}/what-if` | Run What-If stress simulation |
| `GET` | `/api/suppliers/risk/matrix/all` | Fetch 2D Risk Radar scatter plot data |
| `GET` | `/api/suppliers/risk/heatmap/all` | Fetch 6-vector supply chain heatmap matrix |
| `GET` | `/api/suppliers/{id}/prediction` | Fetch 30-day ML disruption prediction |
| `GET` | `/api/suppliers/{id}/alternatives` | Recommend pre-qualified backup suppliers |
| `POST` | `/api/suppliers/{id}/compare` | Generate side-by-side comparison matrix |
| `POST` | `/api/copilot/query` | Ask natural language query to Risk Copilot |
| `POST` | `/api/news/sync` | Synchronize external macro news signals |
| `GET` | `/api/alerts` | List active & reviewed threshold alerts |
| `POST` | `/api/reports/generate` | Generate downloadable PDF or CSV report |
| `GET` | `/api/integrations/health` | Check backend & memory engine health status |

---

## 🧠 Hindsight Cloud AI Memory Architecture

Supplier Risk Radar integrates with **Hindsight Cloud** (with a structured local memory fallback when an API key is not specified):
- **Memory Retention**: Automatically captures key operational events (supplier onboarding, delivery delays > 3 days, quality inspection failures, price increases > 5%, and critical news alerts).
- **Memory Recall**: Recalls past incident history per supplier to calculate the **Historical Risk Score** vector and supply context to **Risk Copilot**.

---

## 🧪 Verification & Build Commands

- **Build Frontend Bundle**:
  ```bash
  cd frontend
  npm run build
  ```
- **Test Backend Import & Start**:
  ```bash
  cd backend
  python -c "import app.main; print('Backend loaded clean')"
  ```

---

## 📢 Project Articles & LinkedIn Posts

1. [Supplier Risk Radar – LinkedIn Post](https://www.linkedin.com/posts/mahankalikomala_supplierrisk-supplychain-ai-activity-7510390579537768448-uo3-)
2. [Supplier Risk Radar – Kashifa Shaik](https://www.linkedin.com/posts/kashifa-shaik-690358340_supplierriskradar-supplychain-datascience-activity-7510571667736416257-fDks)
3. [Supplier Risk Radar – LinkedIn Article](https://lnkd.in/p/dHA3DzX7)
4. [Supplier Risk Radar – Sai Divya Nanganam](https://www.linkedin.com/posts/sai-divya-nanganam-596844419_supplierriskradar-supplychainmanagement-artificialintelligence-ugcPost-7510577322995929088-qayt/)
5. [Supplier Risk Radar – LinkedIn Article](https://lnkd.in/p/d-ifX3wX)

---

## 🔗 Project Repository

- [https://github.com/lavanya-2912/Supplier-Risk-Radar](https://github.com/lavanya-2912/Supplier-Risk-Radar)

---

## 📄 License

Internal Enterprise Tool — Confidential & Proprietary. Developed for Supplier Risk Management.
