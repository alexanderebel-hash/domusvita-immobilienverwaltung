import { useState, useEffect } from "react";
import axios from "axios";
import {
  FileText,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  X,
  Edit2,
  Trash2,
  Building2,
  Users,
  Euro,
  RefreshCw,
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

const contractTypes = ["Mietvertrag", "Hauptmietvertrag", "Versicherung", "Wartungsvertrag"];
const typeColors = {
  Mietvertrag: "bg-blue-50 text-blue-500 border-blue-500/30",
  Hauptmietvertrag: "bg-emerald-50 text-emerald-500 border-emerald-500/30",
  Versicherung: "bg-purple-50 text-purple-500 border-purple-500/30",
  Wartungsvertrag: "bg-amber-50 text-amber-500 border-amber-500/30",
};

export default function Vertraege() {
  const [contracts, setContracts] = useState([]);
  const [properties, setProperties] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [expiringFilter, setExpiringFilter] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    property_id: "",
    contact_id: "",
    contract_type: "Mietvertrag",
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    monthly_amount: 0,
    is_active: true,
    auto_renew: false,
    notice_period_days: 30,
  });

  useEffect(() => {
    fetchData();
  }, [typeFilter, expiringFilter]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.append("contract_type", typeFilter);
      if (expiringFilter) params.append("expiring_soon", "true");
      
      const [contractsRes, propsRes, contactsRes] = await Promise.all([
        axios.get(`${API}/contracts?${params.toString()}`),
        axios.get(`${API}/properties`),
        axios.get(`${API}/contacts`),
      ]);
      setContracts(contractsRes.data);
      setProperties(propsRes.data);
      setContacts(contactsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Fehler beim Laden der Verträge");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.property_id || !formData.title || !formData.start_date) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        contact_id: formData.contact_id || null,
      };
      
      if (editingContract) {
        await axios.put(`${API}/contracts/${editingContract.id}`, payload);
        toast.success("Vertrag aktualisiert");
      } else {
        await axios.post(`${API}/contracts`, payload);
        toast.success("Vertrag erstellt");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving contract:", error);
      toast.error("Fehler beim Speichern");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (contract) => {
    setEditingContract(contract);
    setFormData({
      property_id: contract.property_id || "",
      contact_id: contract.contact_id || "",
      contract_type: contract.contract_type || "Mietvertrag",
      title: contract.title || "",
      description: contract.description || "",
      start_date: contract.start_date ? contract.start_date.split("T")[0] : "",
      end_date: contract.end_date ? contract.end_date.split("T")[0] : "",
      monthly_amount: contract.monthly_amount || 0,
      is_active: contract.is_active ?? true,
      auto_renew: contract.auto_renew ?? false,
      notice_period_days: contract.notice_period_days || 30,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/contracts/${id}`);
      toast.success("Vertrag gelöscht");
      fetchData();
    } catch (error) {
      console.error("Error deleting contract:", error);
      toast.error("Fehler beim Löschen");
    }
  };

  const resetForm = () => {
    setEditingContract(null);
    setFormData({
      property_id: "",
      contact_id: "",
      contract_type: "Mietvertrag",
      title: "",
      description: "",
      start_date: "",
      end_date: "",
      monthly_amount: 0,
      is_active: true,
      auto_renew: false,
      notice_period_days: 30,
    });
  };

  const getExpiryStatus = (daysUntilExpiry) => {
    if (daysUntilExpiry === null || daysUntilExpiry === undefined) return { icon: CheckCircle2, color: "text-gray-400", label: "Unbefristet" };
    if (daysUntilExpiry < 0) return { icon: AlertTriangle, color: "text-red-500", label: "Abgelaufen" };
    if (daysUntilExpiry <= 30) return { icon: AlertTriangle, color: "text-amber-500", label: `${daysUntilExpiry} Tage` };
    if (daysUntilExpiry <= 90) return { icon: Clock, color: "text-blue-500", label: `${daysUntilExpiry} Tage` };
    return { icon: CheckCircle2, color: "text-emerald-500", label: `${daysUntilExpiry} Tage` };
  };

  const expiringCount = contracts.filter((c) => c.days_until_expiry !== null && c.days_until_expiry <= 30 && c.days_until_expiry >= 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" className="overflow-x-hidden" data-testid="vertraege-loading">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" className="overflow-x-hidden" data-testid="vertraege-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-['Manrope']">Verträge</h1>
          <p className="text-gray-400 mt-1">{contracts.length} Verträge verwalten</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="btn-primary flex items-center gap-2" className="overflow-x-hidden" data-testid="create-contract-btn">
              <Plus className="w-4 h-4" />
              Neuer Vertrag
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0A0A0A] border-gray-200 text-gray-900 max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-['Manrope']">
                {editingContract ? "Vertrag bearbeiten" : "Neuer Vertrag"}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {editingContract ? "Aktualisieren Sie die Vertragsdaten." : "Erfassen Sie einen neuen Vertrag."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <Label className="text-white/70">Immobilie *</Label>
                <Select value={formData.property_id} onValueChange={(v) => setFormData({ ...formData, property_id: v })}>
                  <SelectTrigger className="mt-1 bg-white border-gray-200 text-gray-900" className="overflow-x-hidden" data-testid="contract-property-select">
                    <SelectValue placeholder="Immobilie wählen" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-gray-200">
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-gray-900 hover:bg-gray-50">{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/70">Vertragsart *</Label>
                  <Select value={formData.contract_type} onValueChange={(v) => setFormData({ ...formData, contract_type: v })}>
                    <SelectTrigger className="mt-1 bg-white border-gray-200 text-gray-900" className="overflow-x-hidden" data-testid="contract-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-gray-200">
                      {contractTypes.map((t) => (
                        <SelectItem key={t} value={t} className="text-gray-900 hover:bg-gray-50">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white/70">Vertragspartner</Label>
                  <Select value={formData.contact_id} onValueChange={(v) => setFormData({ ...formData, contact_id: v })}>
                    <SelectTrigger className="mt-1 bg-white border-gray-200 text-gray-900">
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-gray-200">
                      <SelectItem value="none" className="text-gray-900 hover:bg-gray-50">Keiner</SelectItem>
                      {contacts.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-gray-900 hover:bg-gray-50">{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-white/70">Titel *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Vertragstitel"
                  className="mt-1 bg-white border-gray-200 text-gray-900"
                  className="overflow-x-hidden" data-testid="contract-title-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/70">Beginn *</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="mt-1 bg-white border-gray-200 text-gray-900"
                    className="overflow-x-hidden" data-testid="contract-start-date"
                  />
                </div>
                <div>
                  <Label className="text-white/70">Ende</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="mt-1 bg-white border-gray-200 text-gray-900"
                    className="overflow-x-hidden" data-testid="contract-end-date"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/70">Monatlicher Betrag (€)</Label>
                  <Input
                    type="number"
                    value={formData.monthly_amount}
                    onChange={(e) => setFormData({ ...formData, monthly_amount: parseFloat(e.target.value) || 0 })}
                    className="mt-1 bg-white border-gray-200 text-gray-900"
                  />
                </div>
                <div>
                  <Label className="text-white/70">Kündigungsfrist (Tage)</Label>
                  <Input
                    type="number"
                    value={formData.notice_period_days}
                    onChange={(e) => setFormData({ ...formData, notice_period_days: parseInt(e.target.value) || 30 })}
                    className="mt-1 bg-white border-gray-200 text-gray-900"
                  />
                </div>
              </div>
              <div>
                <Label className="text-white/70">Beschreibung</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Vertragsbeschreibung..."
                  className="mt-1 bg-white border-gray-200 text-gray-900 resize-none"
                  rows={2}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch checked={formData.is_active} onCheckedChange={(v) => setFormData({ ...formData, is_active: v })} />
                  <Label className="text-white/70">Aktiv</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={formData.auto_renew} onCheckedChange={(v) => setFormData({ ...formData, auto_renew: v })} />
                  <Label className="text-white/70">Auto-Verlängerung</Label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} className="bg-white border-gray-200 text-gray-900 hover:bg-gray-50">
                  Abbrechen
                </Button>
                <Button type="submit" disabled={submitting} className="btn-primary" className="overflow-x-hidden" data-testid="submit-contract-btn">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingContract ? "Speichern" : "Erstellen"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alert Banner */}
      {expiringCount > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4 border-l-4 border-amber-500 flex items-center gap-4" className="overflow-x-hidden" data-testid="expiring-alert">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
          <div className="flex-1">
            <p className="text-gray-900 font-medium">{expiringCount} Verträge laufen in den nächsten 30 Tagen ab</p>
            <p className="text-gray-400 text-sm">Überprüfen Sie diese Verträge und handeln Sie rechtzeitig.</p>
          </div>
          <Button variant="outline" onClick={() => setExpiringFilter(true)} className="bg-amber-50 border-amber-500/30 text-amber-500 hover:bg-amber-500/30">
            Anzeigen
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-4" className="overflow-x-hidden" data-testid="vertraege-filters">
        <div className="flex flex-col md:flex-row gap-4">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px] bg-white border-gray-200 text-gray-900" className="overflow-x-hidden" data-testid="filter-type">
              <FileText className="w-4 h-4 mr-2 text-gray-400" />
              <SelectValue placeholder="Alle Vertragsarten" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-gray-200">
              <SelectItem value="all" className="text-gray-900 hover:bg-gray-50">Alle Vertragsarten</SelectItem>
              {contractTypes.map((t) => (
                <SelectItem key={t} value={t} className="text-gray-900 hover:bg-gray-50">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={expiringFilter ? "default" : "outline"}
            onClick={() => setExpiringFilter(!expiringFilter)}
            className={expiringFilter ? "bg-amber-500 hover:bg-amber-600" : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50"}
          >
            <AlertTriangle className="w-4 h-4 mr-2" /> Ablaufend
          </Button>
          {(typeFilter || expiringFilter) && (
            <Button variant="ghost" onClick={() => { setTypeFilter(""); setExpiringFilter(false); }} className="text-gray-500 hover:text-gray-900">
              <X className="w-4 h-4 mr-1" /> Filter zurücksetzen
            </Button>
          )}
        </div>
      </div>

      {/* Contracts List */}
      {contracts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center" className="overflow-x-hidden" data-testid="no-contracts">
          <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Verträge gefunden</h3>
          <p className="text-gray-400 mb-4">Erfassen Sie Ihren ersten Vertrag</p>
          <Button onClick={() => setIsDialogOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" /> Vertrag erstellen
          </Button>
        </div>
      ) : (
        <div className="space-y-4" className="overflow-x-hidden" data-testid="contracts-list">
          {contracts.map((contract, idx) => {
            const expiry = getExpiryStatus(contract.days_until_expiry);
            const ExpiryIcon = expiry.icon;
            
            return (
              <div
                key={contract.id}
                className="bg-white rounded-2xl shadow-sm p-5 hover:bg-gray-50 transition-all opacity-0 animate-fade-in"
                style={{ animationDelay: `${idx * 0.05}s` }}
                data-testid={`contract-card-${contract.id}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Main Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs border ${typeColors[contract.contract_type]}`}>
                        {contract.contract_type}
                      </span>
                      {contract.auto_renew && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <RefreshCw className="w-3 h-3" /> Auto
                        </span>
                      )}
                      {!contract.is_active && (
                        <span className="px-2 py-0.5 rounded text-xs bg-red-50 text-red-500">Inaktiv</span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 font-['Manrope']">{contract.title}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        <span>{contract.property_name}</span>
                      </div>
                      {contract.contact_name && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{contract.contact_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Dates & Amount */}
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 uppercase">Beginn</p>
                      <p className="text-gray-900 font-medium">
                        {new Date(contract.start_date).toLocaleDateString("de-DE")}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400 uppercase">Ende</p>
                      <p className="text-gray-900 font-medium">
                        {contract.end_date ? new Date(contract.end_date).toLocaleDateString("de-DE") : "—"}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400 uppercase">Monatlich</p>
                      <p className="text-gray-900 font-medium flex items-center gap-1">
                        <Euro className="w-4 h-4" />
                        {contract.monthly_amount?.toLocaleString("de-DE")}
                      </p>
                    </div>
                    <div className="text-center min-w-[100px]">
                      <p className="text-xs text-gray-400 uppercase">Status</p>
                      <div className={`flex items-center gap-1 justify-center ${expiry.color}`}>
                        <ExpiryIcon className="w-4 h-4" />
                        <span className="font-medium">{expiry.label}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(contract)} className="text-gray-500 hover:text-gray-900 hover:bg-gray-50">
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
                          <AlertDialogTitle className="text-gray-900">Vertrag löschen?</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-500">
                            Möchten Sie "{contract.title}" wirklich löschen?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-white border-gray-200 text-gray-900 hover:bg-gray-50">Abbrechen</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(contract.id)} className="bg-red-500 hover:bg-red-600 text-gray-900">Löschen</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
