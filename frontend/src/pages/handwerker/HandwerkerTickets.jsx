import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Wrench,
  LogOut,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Phone,
  ChevronRight,
  Loader2,
  RefreshCw,
  Filter,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusColors = {
  Offen: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "In Bearbeitung": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Erledigt: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const priorityColors = {
  Niedrig: "bg-gray-500/20 text-gray-400",
  Normal: "bg-blue-500/20 text-blue-400",
  Hoch: "bg-amber-500/20 text-amber-400",
  Dringend: "bg-red-500/20 text-red-400",
};

export default function HandwerkerTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [handwerkerName, setHandwerkerName] = useState("");
  const [handwerkerId, setHandwerkerId] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("handwerker_token");
    const name = localStorage.getItem("handwerker_name");
    const id = localStorage.getItem("handwerker_id");

    if (!token || !id) {
      navigate("/handwerker");
      return;
    }

    setHandwerkerName(name || "Handwerker");
    setHandwerkerId(id);
    fetchTickets(id);
  }, [navigate]);

  const fetchTickets = async (id, showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const params = activeFilter !== "all" ? `?status=${activeFilter}` : "";
      const res = await axios.get(`${API}/handwerker/tickets/${id}${params}`);
      setTickets(res.data);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast.error("Fehler beim Laden der Aufträge");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (handwerkerId) {
      fetchTickets(handwerkerId);
    }
  }, [activeFilter, handwerkerId]);

  const handleLogout = () => {
    localStorage.removeItem("handwerker_token");
    localStorage.removeItem("handwerker_id");
    localStorage.removeItem("handwerker_name");
    navigate("/handwerker");
  };

  const handleRefresh = () => {
    fetchTickets(handwerkerId, true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Offen":
        return <Clock className="w-4 h-4" />;
      case "In Bearbeitung":
        return <Wrench className="w-4 h-4" />;
      case "Erledigt":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const openCount = tickets.filter((t) => t.status === "Offen").length;
  const inProgressCount = tickets.filter((t) => t.status === "In Bearbeitung").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]" data-testid="handwerker-tickets">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#050505]/95 backdrop-blur-xl border-b border-white/10">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold font-['Manrope']">{handwerkerName}</p>
              <p className="text-white/50 text-xs">{tickets.length} Aufträge</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-white/60 hover:text-white hover:bg-white/10"
              data-testid="logout-button"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 pb-4 flex gap-3">
          <div className="flex-1 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-2xl font-bold text-amber-400">{openCount}</p>
            <p className="text-xs text-amber-400/70">Offen</p>
          </div>
          <div className="flex-1 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-2xl font-bold text-blue-400">{inProgressCount}</p>
            <p className="text-xs text-blue-400/70">In Arbeit</p>
          </div>
          <div className="flex-1 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-2xl font-bold text-emerald-400">
              {tickets.filter((t) => t.status === "Erledigt").length}
            </p>
            <p className="text-xs text-emerald-400/70">Erledigt</p>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
          {["all", "Offen", "In Bearbeitung", "Erledigt"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === filter
                  ? "bg-blue-500 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
              data-testid={`filter-${filter}`}
            >
              {filter === "all" ? "Alle" : filter}
            </button>
          ))}
        </div>
      </header>

      {/* Ticket List */}
      <main className="p-4 space-y-3 pb-20">
        {tickets.length === 0 ? (
          <div className="text-center py-12">
            <Wrench className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50">Keine Aufträge gefunden</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => navigate(`/handwerker/ticket/${ticket.id}`)}
              className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 active:bg-white/10 transition-all cursor-pointer"
              data-testid={`ticket-card-${ticket.id}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[ticket.status]}`}>
                    {getStatusIcon(ticket.status)}
                    <span className="ml-1">{ticket.status}</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs ${priorityColors[ticket.priority]}`}>
                    {ticket.priority}
                  </span>
                </div>
                {ticket.priority === "Dringend" && (
                  <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
                )}
              </div>

              <h3 className="text-white font-semibold mb-1">{ticket.title}</h3>
              
              <div className="space-y-1 text-sm text-white/60">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{ticket.property_name}</span>
                </div>
                <p className="text-white/40 truncate">{ticket.property_address}</p>
              </div>

              {ticket.tenant_phone && (
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Phone className="w-4 h-4" />
                    <span>{ticket.tenant_name || "Mieter"}</span>
                  </div>
                  <a
                    href={`tel:${ticket.tenant_phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium"
                  >
                    Anrufen
                  </a>
                </div>
              )}

              {ticket.photos?.length > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {ticket.photos.slice(0, 3).map((photo, idx) => (
                      <img
                        key={photo.id}
                        src={photo.thumbnail_url || photo.photo_url}
                        alt=""
                        className="w-8 h-8 rounded-lg border-2 border-[#050505] object-cover"
                      />
                    ))}
                  </div>
                  {ticket.photos.length > 3 && (
                    <span className="text-xs text-white/40">+{ticket.photos.length - 3}</span>
                  )}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between text-xs text-white/40">
                <span>{ticket.category || "Allgemein"}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
