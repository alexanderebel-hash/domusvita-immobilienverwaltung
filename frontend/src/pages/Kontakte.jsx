import { useState, useEffect } from "react";
import axios from "axios";
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Star,
  Loader2,
  Building2,
  Wrench,
  Briefcase,
  Building,
  X,
  Edit2,
  Trash2,
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
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const roleOptions = ["Mieter", "Eigentümer", "Handwerker", "Versorger", "Behörde"];
const roleIcons = {
  Mieter: Users,
  Eigentümer: Building2,
  Handwerker: Wrench,
  Versorger: Briefcase,
  Behörde: Building,
};
const roleColors = {
  Mieter: "bg-blue-50 text-blue-500 border-blue-500/30",
  Eigentümer: "bg-emerald-50 text-emerald-500 border-emerald-500/30",
  Handwerker: "bg-amber-50 text-amber-500 border-amber-500/30",
  Versorger: "bg-purple-50 text-purple-500 border-purple-500/30",
  Behörde: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

export default function Kontakte() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    role: "Mieter",
    email: "",
    phone: "",
    address: "",
    company: "",
    specialty: "",
    rating: 0,
    notes: "",
  });

  useEffect(() => {
    fetchContacts();
  }, [roleFilter]);

  const fetchContacts = async () => {
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.append("role", roleFilter);
      const res = await axios.get(`${API}/contacts?${params.toString()}`);
      setContacts(res.data);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast.error("Fehler beim Laden der Kontakte");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Bitte geben Sie einen Namen ein");
      return;
    }

    setSubmitting(true);
    try {
      if (editingContact) {
        await axios.put(`${API}/contacts/${editingContact.id}`, formData);
        toast.success("Kontakt aktualisiert");
      } else {
        await axios.post(`${API}/contacts`, formData);
        toast.success("Kontakt erstellt");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchContacts();
    } catch (error) {
      console.error("Error saving contact:", error);
      toast.error("Fehler beim Speichern");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name || "",
      role: contact.role || "Mieter",
      email: contact.email || "",
      phone: contact.phone || "",
      address: contact.address || "",
      company: contact.company || "",
      specialty: contact.specialty || "",
      rating: contact.rating || 0,
      notes: contact.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/contacts/${id}`);
      toast.success("Kontakt gelöscht");
      fetchContacts();
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Fehler beim Löschen");
    }
  };

  const resetForm = () => {
    setEditingContact(null);
    setFormData({
      name: "",
      role: "Mieter",
      email: "",
      phone: "",
      address: "",
      company: "",
      specialty: "",
      rating: 0,
      notes: "",
    });
  };

  const filteredContacts = contacts.filter((c) =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedContacts = roleOptions.reduce((acc, role) => {
    acc[role] = filteredContacts.filter((c) => c.role === role);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-testid="kontakte-loading">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" data-testid="kontakte-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-['Manrope']">Kontakte</h1>
          <p className="text-gray-400 mt-1">{contacts.length} Kontakte verwalten</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="btn-primary flex items-center gap-2" data-testid="create-contact-btn">
              <Plus className="w-4 h-4" />
              Neuer Kontakt
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0A0A0A] border-gray-200 text-gray-900 max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-['Manrope']">
                {editingContact ? "Kontakt bearbeiten" : "Neuer Kontakt"}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {editingContact ? "Aktualisieren Sie die Kontaktdaten." : "Fügen Sie einen neuen Kontakt hinzu."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <Label className="text-white/70">Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Vollständiger Name"
                  className="mt-1 bg-white border-gray-200 text-gray-900"
                  data-testid="contact-name-input"
                />
              </div>
              <div>
                <Label className="text-white/70">Rolle</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                  <SelectTrigger className="mt-1 bg-white border-gray-200 text-gray-900" data-testid="contact-role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-gray-200">
                    {roleOptions.map((role) => (
                      <SelectItem key={role} value={role} className="text-gray-900 hover:bg-gray-50">{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/70">E-Mail</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@beispiel.de"
                    className="mt-1 bg-white border-gray-200 text-gray-900"
                    data-testid="contact-email-input"
                  />
                </div>
                <div>
                  <Label className="text-white/70">Telefon</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+49 30 12345678"
                    className="mt-1 bg-white border-gray-200 text-gray-900"
                    data-testid="contact-phone-input"
                  />
                </div>
              </div>
              <div>
                <Label className="text-white/70">Firma / Organisation</Label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Firmenname"
                  className="mt-1 bg-white border-gray-200 text-gray-900"
                />
              </div>
              {formData.role === "Handwerker" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/70">Fachgebiet</Label>
                    <Input
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      placeholder="z.B. Elektrik"
                      className="mt-1 bg-white border-gray-200 text-gray-900"
                    />
                  </div>
                  <div>
                    <Label className="text-white/70">Bewertung (1-5)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) || 0 })}
                      className="mt-1 bg-white border-gray-200 text-gray-900"
                    />
                  </div>
                </div>
              )}
              <div>
                <Label className="text-white/70">Adresse</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Straße, PLZ, Stadt"
                  className="mt-1 bg-white border-gray-200 text-gray-900 resize-none"
                  rows={2}
                />
              </div>
              <div>
                <Label className="text-white/70">Notizen</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Zusätzliche Informationen..."
                  className="mt-1 bg-white border-gray-200 text-gray-900 resize-none"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} className="bg-white border-gray-200 text-gray-900 hover:bg-gray-50">
                  Abbrechen
                </Button>
                <Button type="submit" disabled={submitting} className="btn-primary" data-testid="submit-contact-btn">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingContact ? "Speichern" : "Erstellen"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-4" data-testid="kontakte-filters">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Suchen nach Name, E-Mail oder Firma..."
              className="pl-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-300"
              data-testid="search-contacts-input"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px] bg-white border-gray-200 text-gray-900" data-testid="filter-role">
              <Users className="w-4 h-4 mr-2 text-gray-400" />
              <SelectValue placeholder="Alle Rollen" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-gray-200">
              <SelectItem value="all" className="text-gray-900 hover:bg-gray-50">Alle Rollen</SelectItem>
              {roleOptions.map((role) => (
                <SelectItem key={role} value={role} className="text-gray-900 hover:bg-gray-50">{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(roleFilter || searchTerm) && (
            <Button variant="ghost" onClick={() => { setRoleFilter(""); setSearchTerm(""); }} className="text-gray-500 hover:text-gray-900">
              <X className="w-4 h-4 mr-1" /> Filter zurücksetzen
            </Button>
          )}
        </div>
      </div>

      {/* Contacts by Role */}
      {filteredContacts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center" data-testid="no-contacts">
          <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Kontakte gefunden</h3>
          <p className="text-gray-400 mb-4">Fügen Sie Ihren ersten Kontakt hinzu</p>
          <Button onClick={() => setIsDialogOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" /> Kontakt hinzufügen
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {roleOptions.map((role) => {
            const roleContacts = groupedContacts[role];
            if (roleContacts.length === 0 && roleFilter) return null;
            if (roleContacts.length === 0) return null;
            
            const RoleIcon = roleIcons[role];
            
            return (
              <div key={role} className="space-y-4" data-testid={`contacts-group-${role.toLowerCase()}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${roleColors[role].split(" ")[0]}`}>
                    <RoleIcon className={`w-4 h-4 ${roleColors[role].split(" ")[1]}`} />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 font-['Manrope']">{role}</h2>
                  <span className="text-sm text-gray-400">({roleContacts.length})</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roleContacts.map((contact, idx) => (
                    <div
                      key={contact.id}
                      className="bg-white rounded-2xl shadow-sm p-5 hover:bg-gray-50 transition-all opacity-0 animate-fade-in"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                      data-testid={`contact-card-${contact.id}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-gray-900 font-semibold">
                            {contact.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-gray-900 font-medium">{contact.name}</h3>
                            {contact.company && <p className="text-gray-400 text-sm">{contact.company}</p>}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs border ${roleColors[contact.role]}`}>
                          {contact.role}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        {contact.email && (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{contact.email}</span>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Phone className="w-4 h-4" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                        {contact.address && (
                          <div className="flex items-center gap-2 text-gray-500">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{contact.address}</span>
                          </div>
                        )}
                        {contact.role === "Handwerker" && contact.rating > 0 && (
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < contact.rating ? "text-amber-500 fill-amber-400" : "text-white/20"}`} />
                            ))}
                            {contact.specialty && <span className="ml-2 text-gray-400">• {contact.specialty}</span>}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(contact)} className="flex-1 text-gray-500 hover:text-gray-900 hover:bg-gray-50">
                          <Edit2 className="w-4 h-4 mr-1" /> Bearbeiten
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-300 hover:bg-red-500/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-[#0A0A0A] border-gray-200">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-gray-900">Kontakt löschen?</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-500">
                                Möchten Sie "{contact.name}" wirklich löschen?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-white border-gray-200 text-gray-900 hover:bg-gray-50">Abbrechen</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(contact.id)} className="bg-red-500 hover:bg-red-600 text-gray-900">Löschen</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
