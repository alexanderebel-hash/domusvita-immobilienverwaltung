import { useState, useEffect } from "react";
import axios from "axios";
import {
  Wrench,
  Plus,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Loader2,
  X,
  Edit2,
  Trash2,
  Building2,
  User,
  Calendar,
  Euro,
  RefreshCw,
  Filter,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusOptions = ["Offen", "In Bearbeitung", "Erledigt"];
const priorityOptions = ["Niedrig", "Normal", "Hoch", "Dringend"];
const categoryOptions = ["Heizung", "Sanitär", "Elektrik", "Dach", "Fassade", "Garten", "Reinigung", "Sonstiges"];

const statusColors = {
  Offen: "bg-amber-50 text-amber-500 border-amber-500/30",
  "In Bearbeitung": "bg-blue-50 text-blue-500 border-blue-500/30",
  Erledigt: "bg-emerald-50 text-emerald-500 border-emerald-500/30",
};

const priorityColors = {
  Niedrig: "bg-gray-500/20 text-gray-400",
  Normal: "bg-blue-50 text-blue-500",
  Hoch: "bg-amber-50 text-amber-500",
  Dringend: "bg-red-50 text-red-500",
};

export default function Instandhaltung() {
  const [tickets, setTickets] = useState([]);
  const [properties, setProperties] = useState([]);
  const [handwerker, setHandwerker] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    property_id: "",
    assigned_to_id: "",
    title: "",
    description: "",
    status: "Offen",
    priority: "Normal",
    category: "",
    scheduled_date: "",
    cost: 0,
    is_recurring: false,
    recurrence_interval_days: 0,
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, [statusFilter, priorityFilter]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (priorityFilter) params.append("priority", priorityFilter);
      
      const [ticketsRes, propsRes, contactsRes] = await Promise.all([
        axios.get(`${API}/maintenance?${params.toString()}`),
        axios.get(`${API}/properties`),
        axios.get(`${API}/contacts?role=Handwerker`),
      ]);
      setTickets(ticketsRes.data);
      setProperties(propsRes.data);
      setHandwerker(contactsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Fehler beim Laden der Wartungsaufgaben");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.property_id || !formData.title) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        scheduled_date: formData.scheduled_date ? new Date(formData.scheduled_date).toISOString() : null,
        assigned_to_id: formData.assigned_to_id || null,
      };
      
      if (editingTicket) {
        await axios.put(`${API}/maintenance/${editingTicket.id}`, payload);
        toast.success("Ticket aktualisiert");
      } else {
        await axios.post(`${API}/maintenance`, payload);
        toast.success("Ticket erstellt");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving ticket:", error);
      toast.error("Fehler beim Speichern");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await axios.put(`${API}/maintenance/${ticketId}/status?status=${newStatus}`);
      toast.success(`Status geändert: ${newStatus}`);
      fetchData();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Fehler beim Aktualisieren");
    }
  };

  const handleEdit = (ticket) => {
    setEditingTicket(ticket);
    setFormData({
      property_id: ticket.property_id || "",
      assigned_to_id: ticket.assigned_to_id || "",
      title: ticket.title || "",
      description: ticket.description || "",
      status: ticket.status || "Offen",
      priority: ticket.priority || "Normal",
      category: ticket.category || "",
      scheduled_date: ticket.scheduled_date ? ticket.scheduled_date.split("T")[0] : "",
      cost: ticket.cost || 0,
      is_recurring: ticket.is_recurring || false,
      recurrence_interval_days: ticket.recurrence_interval_days || 0,
      notes: ticket.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/maintenance/${id}`);
      toast.success("Ticket gelöscht");
      fetchData();
    } catch (error) {
      console.error("Error deleting ticket:", error);
      toast.error("Fehler beim Löschen");
    }
  };

  const resetForm = () => {
    setEditingTicket(null);
    setFormData({
      property_id: "",
      assigned_to_id: "",
      title: "",
      description: "",
      status: "Offen",
      priority: "Normal",
      category: "",
      scheduled_date: "",
      cost: 0,
      is_recurring: false,
      recurrence_interval_days: 0,
      notes: "",
    });
  };

  const openCount = tickets.filter((t) => t.status === "Offen").length;
  const urgentCount = tickets.filter((t) => t.priority === "Dringend" && t.status !== "Erledigt").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" className="overflow-x-hidden" data-testid="instandhaltung-loading">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" className="overflow-x-hidden" data-testid="instandhaltung-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-['Manrope']">Instandhaltung</h1>
          <p className="text-gray-400 mt-1">{tickets.length} Wartungsaufgaben</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="btn-primary flex items-center gap-2" className="overflow-x-hidden" data-testid="create-ticket-btn">
              <Plus className="w-4 h-4" />
              Neues Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0A0A0A] border-gray-200 text-gray-900 max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-['Manrope']">
                {editingTicket ? "Ticket bearbeiten" : "Neues Ticket"}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {editingTicket ? "Aktualisieren Sie das Wartungsticket." : "Erfassen Sie eine neue Wartungsaufgabe."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <Label className="text-white/70">Immobilie *</Label>
                <Select value={formData.property_id} onValueChange={(v) => setFormData({ ...formData, property_id: v })}>
                  <SelectTrigger className="mt-1 bg-white border-gray-200 text-gray-900" className="overflow-x-hidden" data-testid="ticket-property-select">
                    <SelectValue placeholder="Immobilie wählen" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-gray-200">
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-gray-900 hover:bg-gray-50">{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/70">Titel *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Kurze Beschreibung"
                  className="mt-1 bg-white border-gray-200 text-gray-900"
                  className="overflow-x-hidden" data-testid="ticket-title-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/70">Kategorie</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger className="mt-1 bg-white border-gray-200 text-gray-900">
                      <SelectValue placeholder="Wählen" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-gray-200">
                      {categoryOptions.map((c) => (
                        <SelectItem key={c} value={c} className="text-gray-900 hover:bg-gray-50">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white/70">Priorität</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger className="mt-1 bg-white border-gray-200 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-gray-200">
                      {priorityOptions.map((p) => (
                        <SelectItem key={p} value={p} className="text-gray-900 hover:bg-gray-50">{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/70">Handwerker zuweisen</Label>
                  <Select value={formData.assigned_to_id} onValueChange={(v) => setFormData({ ...formData, assigned_to_id: v })}>
                    <SelectTrigger className="mt-1 bg-white border-gray-200 text-gray-900">
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-gray-200">
                      <SelectItem value="none" className="text-gray-900 hover:bg-gray-50">Nicht zugewiesen</SelectItem>
                      {handwerker.map((h) => (
                        <SelectItem key={h.id} value={h.id} className="text-gray-900 hover:bg-gray-50">
                          {h.name} {h.specialty && `(${h.specialty})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white/70">Geplant für</Label>
                  <Input
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    className="mt-1 bg-white border-gray-200 text-gray-900"
                  />
                </div>
              </div>
              <div>
                <Label className="text-white/70">Beschreibung</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detaillierte Beschreibung..."
                  className="mt-1 bg-white border-gray-200 text-gray-900 resize-none"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/70">Kosten (€)</Label>
                  <Input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                    className="mt-1 bg-white border-gray-200 text-gray-900"
                  />
                </div>
                <div className="flex items-end gap-3">
                  <Switch checked={formData.is_recurring} onCheckedChange={(v) => setFormData({ ...formData, is_recurring: v })} />
                  <Label className="text-white/70 pb-2">Wiederkehrend</Label>
                </div>
              </div>
              {formData.is_recurring && (
                <div>
                  <Label className="text-white/70">Intervall (Tage)</Label>
                  <Input
                    type="number"
                    value={formData.recurrence_interval_days}
                    onChange={(e) => setFormData({ ...formData, recurrence_interval_days: parseInt(e.target.value) || 0 })}
                    placeholder="z.B. 30 für monatlich"
                    className="mt-1 bg-white border-gray-200 text-gray-900"
                  />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} className="bg-white border-gray-200 text-gray-900 hover:bg-gray-50">
                  Abbrechen
                </Button>
                <Button type="submit" disabled={submitting} className="btn-primary" className="overflow-x-hidden" data-testid="submit-ticket-btn">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingTicket ? "Speichern" : "Erstellen"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{openCount}</p>
              <p className="text-xs text-gray-400">Offen</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{urgentCount}</p>
              <p className="text-xs text-gray-400">Dringend</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {tickets.filter((t) => t.status === "In Bearbeitung").length}
              </p>
              <p className="text-xs text-gray-400">In Arbeit</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {tickets.filter((t) => t.status === "Erledigt").length}
              </p>
              <p className="text-xs text-gray-400">Erledigt</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-4" className="overflow-x-hidden" data-testid="maintenance-filters">
        <div className="flex flex-col md:flex-row gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-white border-gray-200 text-gray-900" className="overflow-x-hidden" data-testid="filter-status">
              <Filter className="w-4 h-4 mr-2 text-gray-400" />
              <SelectValue placeholder="Alle Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-gray-200">
              <SelectItem value="all" className="text-gray-900 hover:bg-gray-50">Alle Status</SelectItem>
              {statusOptions.map((s) => (
                <SelectItem key={s} value={s} className="text-gray-900 hover:bg-gray-50">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[180px] bg-white border-gray-200 text-gray-900" className="overflow-x-hidden" data-testid="filter-priority">
              <AlertTriangle className="w-4 h-4 mr-2 text-gray-400" />
              <SelectValue placeholder="Alle Prioritäten" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-gray-200">
              <SelectItem value="all" className="text-gray-900 hover:bg-gray-50">Alle Prioritäten</SelectItem>
              {priorityOptions.map((p) => (
                <SelectItem key={p} value={p} className="text-gray-900 hover:bg-gray-50">{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(statusFilter || priorityFilter) && (
            <Button variant="ghost" onClick={() => { setStatusFilter(""); setPriorityFilter(""); }} className="text-gray-500 hover:text-gray-900">
              <X className="w-4 h-4 mr-1" /> Filter zurücksetzen
            </Button>
          )}
        </div>
      </div>

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center" className="overflow-x-hidden" data-testid="no-tickets">
          <Wrench className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Wartungsaufgaben</h3>
          <p className="text-gray-400 mb-4">Erstellen Sie Ihr erstes Ticket</p>
          <Button onClick={() => setIsDialogOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" /> Ticket erstellen
          </Button>
        </div>
      ) : (
        <div className="space-y-3" className="overflow-x-hidden" data-testid="tickets-list">
          {tickets.map((ticket, idx) => (
            <div
              key={ticket.id}
              className="bg-white rounded-2xl shadow-sm p-5 hover:bg-gray-50 transition-all opacity-0 animate-fade-in"
              style={{ animationDelay: `${idx * 0.05}s` }}
              data-testid={`ticket-card-${ticket.id}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Main Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs border ${statusColors[ticket.status]}`}>
                      {ticket.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${priorityColors[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                    {ticket.category && (
                      <span className="text-xs text-gray-400">{ticket.category}</span>
                    )}
                    {ticket.is_recurring && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <RefreshCw className="w-3 h-3" /> Wiederkehrend
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 font-['Manrope']">{ticket.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      <span>{ticket.property_name}</span>
                    </div>
                    {ticket.assigned_to_name && (
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{ticket.assigned_to_name}</span>
                      </div>
                    )}
                    {ticket.scheduled_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(ticket.scheduled_date).toLocaleDateString("de-DE")}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Cost & Status Change */}
                <div className="flex items-center gap-4">
                  {ticket.cost > 0 && (
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Kosten</p>
                      <p className="text-gray-900 font-medium flex items-center gap-1">
                        <Euro className="w-4 h-4" />
                        {ticket.cost?.toLocaleString("de-DE")}
                      </p>
                    </div>
                  )}
                  
                  <Select value={ticket.status} onValueChange={(v) => handleStatusChange(ticket.id, v)}>
                    <SelectTrigger className="w-[160px] bg-white border-gray-200 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-gray-200">
                      {statusOptions.map((s) => (
                        <SelectItem key={s} value={s} className="text-gray-900 hover:bg-gray-50">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(ticket)} className="text-gray-500 hover:text-gray-900 hover:bg-gray-50">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-300 hover:bg-red-500/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#0A0A0A] border-gray-200">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900">Ticket löschen?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500">
                          Möchten Sie "{ticket.title}" wirklich löschen?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white border-gray-200 text-gray-900 hover:bg-gray-50">Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(ticket.id)} className="bg-red-500 hover:bg-red-600 text-gray-900">Löschen</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
