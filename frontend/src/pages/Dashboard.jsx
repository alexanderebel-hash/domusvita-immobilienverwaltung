import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Building2,
  Home,
  ClipboardList,
  Calendar,
  Plus,
  MessageSquare,
  AlertTriangle,
  Info,
  CheckCircle2,
  Send,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Seed database first
      await axios.post(`${API}/seed`);
      
      const [statsRes, insightsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/dashboard/insights`),
      ]);
      setStats(statsRes.data);
      setInsights(insightsRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Fehler beim Laden der Dashboard-Daten");
    } finally {
      setLoading(false);
    }
  };

  const handleAiQuery = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setAiLoading(true);
    setAiResponse("");
    try {
      const res = await axios.post(`${API}/ai/query`, { query: aiQuery });
      setAiResponse(res.data.response);
    } catch (error) {
      console.error("AI query error:", error);
      toast.error("KI-Anfrage fehlgeschlagen");
    } finally {
      setAiLoading(false);
    }
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getInsightClass = (type) => {
    switch (type) {
      case "warning":
        return "insight-warning";
      case "success":
        return "insight-success";
      default:
        return "insight-info";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-testid="dashboard-loading">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" data-testid="dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-['Manrope']">Dashboard</h1>
          <p className="text-white/50 mt-1">Willkommen zurück! Hier ist Ihre Übersicht.</p>
        </div>
        <Button 
          onClick={() => navigate("/immobilien")}
          className="btn-primary flex items-center gap-2"
          data-testid="add-property-btn"
        >
          <Plus className="w-4 h-4" />
          Immobilie hinzufügen
        </Button>
      </div>

      {/* Stats Grid - Bento Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Properties */}
        <div 
          className="glass-stat-card p-6 opacity-0 animate-fade-in stagger-1"
          data-testid="stat-properties"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-xs text-white/40 uppercase tracking-wider">Gesamt</span>
          </div>
          <p className="text-4xl font-bold text-white font-['Manrope']">{stats?.total_properties || 0}</p>
          <p className="text-sm text-white/50 mt-1">Immobilien</p>
        </div>

        {/* Vacant Units */}
        <div 
          className="glass-stat-card p-6 opacity-0 animate-fade-in stagger-2"
          data-testid="stat-vacant"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Home className="w-6 h-6 text-amber-400" />
            </div>
            <span className="text-xs text-white/40 uppercase tracking-wider">Leer</span>
          </div>
          <p className="text-4xl font-bold text-white font-['Manrope']">{stats?.vacant_units || 0}</p>
          <p className="text-sm text-white/50 mt-1">Leerstehende Einheiten</p>
        </div>

        {/* Pending Tasks */}
        <div 
          className="glass-stat-card p-6 opacity-0 animate-fade-in stagger-3"
          data-testid="stat-tasks"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-xs text-white/40 uppercase tracking-wider">Offen</span>
          </div>
          <p className="text-4xl font-bold text-white font-['Manrope']">{stats?.pending_tasks || 0}</p>
          <p className="text-sm text-white/50 mt-1">Offene Aufgaben</p>
        </div>

        {/* Upcoming Deadlines */}
        <div 
          className="glass-stat-card p-6 opacity-0 animate-fade-in stagger-4"
          data-testid="stat-deadlines"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-rose-400" />
            </div>
            <span className="text-xs text-white/40 uppercase tracking-wider">Bald</span>
          </div>
          <p className="text-4xl font-bold text-white font-['Manrope']">{stats?.upcoming_deadlines || 0}</p>
          <p className="text-sm text-white/50 mt-1">Anstehende Fristen</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Assistant - Takes 2 columns */}
        <div className="lg:col-span-2 glass-card p-6 opacity-0 animate-fade-in stagger-5" data-testid="ai-assistant-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white font-['Manrope']">KI-Assistent</h2>
              <p className="text-xs text-white/50">Fragen Sie alles über Ihre Immobilien</p>
            </div>
          </div>

          <form onSubmit={handleAiQuery} className="flex gap-3 mb-4">
            <Input
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="z.B. Wie viele Einheiten stehen leer?"
              className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500/50"
              data-testid="ai-query-input"
            />
            <Button 
              type="submit" 
              disabled={aiLoading}
              className="btn-primary"
              data-testid="ai-query-submit"
            >
              {aiLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>

          {aiResponse && (
            <div 
              className="p-4 rounded-xl bg-white/5 border border-white/10"
              data-testid="ai-response"
            >
              <p className="text-white/80 text-sm leading-relaxed">{aiResponse}</p>
            </div>
          )}

          {!aiResponse && (
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setAiQuery("Wie ist die aktuelle Belegungsrate?")}
                className="p-3 text-left text-sm text-white/60 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                data-testid="ai-suggestion-1"
              >
                "Wie ist die aktuelle Belegungsrate?"
              </button>
              <button 
                onClick={() => setAiQuery("Welche Wartungsaufgaben sind offen?")}
                className="p-3 text-left text-sm text-white/60 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                data-testid="ai-suggestion-2"
              >
                "Welche Wartungsaufgaben sind offen?"
              </button>
            </div>
          )}
        </div>

        {/* Insights */}
        <div className="glass-card p-6 opacity-0 animate-fade-in stagger-5" data-testid="insights-card">
          <h2 className="text-lg font-semibold text-white font-['Manrope'] mb-4">Einblicke</h2>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div 
                key={index}
                className={`insight-card ${getInsightClass(insight.type)}`}
                data-testid={`insight-${index}`}
              >
                {getInsightIcon(insight.type)}
                <p className="text-sm text-white/80">{insight.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6 opacity-0 animate-fade-in" style={{ animationDelay: "0.6s" }}>
        <h2 className="text-lg font-semibold text-white font-['Manrope'] mb-4">Schnellaktionen</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => navigate("/immobilien")}
            className="quick-action-btn group"
            data-testid="quick-action-properties"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Immobilien verwalten</p>
              <p className="text-xs text-white/50">Alle Objekte anzeigen</p>
            </div>
            <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
          </button>

          <button 
            className="quick-action-btn group opacity-50 cursor-not-allowed"
            data-testid="quick-action-maintenance"
            disabled
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Wartung erstellen</p>
              <p className="text-xs text-white/50">Neues Ticket anlegen</p>
            </div>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full">Bald</span>
          </button>

          <button 
            className="quick-action-btn group opacity-50 cursor-not-allowed"
            data-testid="quick-action-contract"
            disabled
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Vertrag prüfen</p>
              <p className="text-xs text-white/50">Ablaufende Verträge</p>
            </div>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full">Bald</span>
          </button>
        </div>
      </div>
    </div>
  );
}
