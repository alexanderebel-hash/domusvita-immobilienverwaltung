import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Building2, Home, ClipboardList, Calendar, Plus, MessageSquare,
  AlertTriangle, Info, CheckCircle2, Send, Loader2, ArrowRight,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      await axios.post(`${API}/seed`);
      const [statsRes, insightsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/dashboard/insights`),
      ]);
      setStats(statsRes.data);
      setInsights(insightsRes.data);
    } catch (error) {
      toast.error("Fehler beim Laden der Dashboard-Daten");
    } finally { setLoading(false); }
  };

  const handleAiQuery = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResponse("");
    try {
      const res = await axios.post(`${API}/ai/query`, { query: aiQuery });
      setAiResponse(res.data.response);
    } catch (error) { toast.error("KI-Anfrage fehlgeschlagen"); }
    finally { setAiLoading(false); }
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case "warning": return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "success": return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      default: return <Info className="w-5 h-5 text-cyan-500" />;
    }
  };

  const getInsightClass = (type) => {
    switch (type) {
      case "warning": return "insight-warning";
      case "success": return "insight-success";
      default: return "insight-info";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-testid="dashboard-loading">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in overflow-x-hidden" data-testid="dashboard">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 font-manrope">Willkommen zurück</h1>
          <p className="text-slate-500 mt-0.5 text-sm">Hier ist Ihr Überblick für heute</p>
        </div>
        <Button onClick={() => navigate("/immobilien")} className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl" data-testid="add-property-btn">
          <Plus className="w-4 h-4 mr-1.5" /> Immobilie
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Immobilien", value: stats?.total_properties || 0, icon: Building2, color: "cyan", sub: "Gesamt" },
          { label: "Leerstehend", value: stats?.vacant_units || 0, icon: Home, color: "amber", sub: "Einheiten" },
          { label: "Aufgaben", value: stats?.pending_tasks || 0, icon: ClipboardList, color: "emerald", sub: "Offen" },
          { label: "Fristen", value: stats?.upcoming_deadlines || 0, icon: Calendar, color: "rose", sub: "Bald fällig" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-soft border border-slate-100" data-testid={`stat-${s.label.toLowerCase()}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-${s.color}-50 flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 text-${s.color}-500`} strokeWidth={1.5} />
              </div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">{s.sub}</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{s.value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* AI + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-soft border border-slate-100" data-testid="ai-assistant-card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <MessageSquare className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">KI-Assistent</h2>
              <p className="text-xs text-slate-400">Fragen Sie alles über Ihre Immobilien</p>
            </div>
          </div>
          <form onSubmit={handleAiQuery} className="flex gap-2 mb-4">
            <Input value={aiQuery} onChange={(e) => setAiQuery(e.target.value)} placeholder="z.B. Wie viele Einheiten stehen leer?" className="flex-1 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl" data-testid="ai-query-input" />
            <Button type="submit" disabled={aiLoading} className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl" data-testid="ai-query-submit">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
          {aiResponse && (
            <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-100" data-testid="ai-response">
              <p className="text-slate-700 text-sm leading-relaxed">{aiResponse}</p>
            </div>
          )}
          {!aiResponse && (
            <div className="grid grid-cols-2 gap-2">
              {["Wie ist die aktuelle Belegungsrate?", "Welche Wartungsaufgaben sind offen?"].map((q, i) => (
                <button key={i} onClick={() => setAiQuery(q)} className="p-3 text-left text-sm text-slate-500 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all" data-testid={`ai-suggestion-${i+1}`}>"{q}"</button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100" data-testid="insights-card">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Einblicke</h2>
          <div className="space-y-2.5">
            {insights.map((insight, i) => (
              <div key={i} className={`insight-card ${getInsightClass(insight.type)}`} data-testid={`insight-${i}`}>
                {getInsightIcon(insight.type)}
                <p className="text-sm text-slate-700">{insight.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Schnellaktionen</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button onClick={() => navigate("/immobilien")} className="quick-action-btn group" data-testid="quick-action-properties">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center"><Building2 className="w-5 h-5 text-cyan-500" strokeWidth={1.5} /></div>
            <div className="flex-1 text-left"><p className="text-sm font-medium text-slate-900">Immobilien</p><p className="text-xs text-slate-400">Alle Objekte anzeigen</p></div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" strokeWidth={1.5} />
          </button>
          <button onClick={() => navigate("/instandhaltung")} className="quick-action-btn group" data-testid="quick-action-maintenance">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><ClipboardList className="w-5 h-5 text-emerald-500" strokeWidth={1.5} /></div>
            <div className="flex-1 text-left"><p className="text-sm font-medium text-slate-900">Instandhaltung</p><p className="text-xs text-slate-400">Tickets verwalten</p></div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" strokeWidth={1.5} />
          </button>
          <button onClick={() => navigate("/pflege-wgs")} className="quick-action-btn group" data-testid="quick-action-pflege">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center"><Home className="w-5 h-5 text-rose-500" strokeWidth={1.5} /></div>
            <div className="flex-1 text-left"><p className="text-sm font-medium text-slate-900">Pflege-WGs</p><p className="text-xs text-slate-400">Klientenmanagement</p></div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
