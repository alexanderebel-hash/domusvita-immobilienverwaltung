import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Camera,
  Send,
  Clock,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  Image,
  FileText,
  Loader2,
  X,
  Trash2,
  Navigation,
  Edit3,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusOptions = ["Unterwegs", "Vor Ort", "In Arbeit", "Erledigt", "Material fehlt"];
const photoCategories = ["Vorher", "Während", "Nachher"];

const statusColors = {
  Unterwegs: "bg-blue-500",
  "Vor Ort": "bg-amber-500",
  "In Arbeit": "bg-purple-500",
  Erledigt: "bg-emerald-500",
  "Material fehlt": "bg-red-500",
};

export default function HandwerkerTicketDetail() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoCategory, setPhotoCategory] = useState("Während");
  const [photoDescription, setPhotoDescription] = useState("");
  const [statusNote, setStatusNote] = useState("");
  
  const [reportData, setReportData] = useState({
    description: "",
    materials_used: "",
    work_hours: 0,
    material_cost: 0,
    labor_cost: 0,
    notes: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("handwerker_token");
    if (!token) {
      navigate("/handwerker");
      return;
    }
    fetchTicket();
  }, [ticketId, navigate]);

  const fetchTicket = async () => {
    try {
      const res = await axios.get(`${API}/handwerker/ticket/${ticketId}`);
      setTicket(res.data);
      
      // Pre-fill report if exists
      if (res.data.work_report) {
        setReportData({
          description: res.data.work_report.description || "",
          materials_used: res.data.work_report.materials_used || "",
          work_hours: res.data.work_report.work_hours || 0,
          material_cost: res.data.work_report.material_cost || 0,
          labor_cost: res.data.work_report.labor_cost || 0,
          notes: res.data.work_report.notes || "",
        });
      }
    } catch (error) {
      console.error("Error fetching ticket:", error);
      toast.error("Ticket nicht gefunden");
      navigate("/handwerker/tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      await axios.post(`${API}/handwerker/ticket/${ticketId}/status`, {
        ticket_id: ticketId,
        status: newStatus,
        note: statusNote,
      });
      toast.success(`Status: ${newStatus}`);
      setStatusNote("");
      fetchTicket();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Fehler beim Aktualisieren");
    } finally {
      setUpdating(false);
    }
  };

  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const handwerkerId = localStorage.getItem("handwerker_id");
      await axios.post(
        `${API}/handwerker/ticket/${ticketId}/photo?category=${photoCategory}&description=${encodeURIComponent(photoDescription)}&handwerker_id=${handwerkerId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      toast.success("Foto hochgeladen");
      setShowPhotoDialog(false);
      setPhotoCategory("Während");
      setPhotoDescription("");
      fetchTicket();
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Fehler beim Hochladen");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeletePhoto = async (photoId) => {
    try {
      await axios.delete(`${API}/handwerker/photo/${photoId}`);
      toast.success("Foto gelöscht");
      fetchTicket();
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast.error("Fehler beim Löschen");
    }
  };

  const handleSaveReport = async () => {
    if (!reportData.description) {
      toast.error("Bitte beschreiben Sie die durchgeführten Arbeiten");
      return;
    }
    
    setUpdating(true);
    try {
      await axios.post(`${API}/handwerker/ticket/${ticketId}/report`, {
        ticket_id: ticketId,
        ...reportData,
      });
      toast.success("Arbeitsbericht gespeichert");
      setShowReportDialog(false);
      fetchTicket();
    } catch (error) {
      console.error("Error saving report:", error);
      toast.error("Fehler beim Speichern");
    } finally {
      setUpdating(false);
    }
  };

  const openMaps = () => {
    if (ticket?.property_address) {
      const address = encodeURIComponent(ticket.property_address);
      window.open(`https://maps.google.com/?q=${address}`, "_blank");
    }
  };

  const callTenant = () => {
    if (ticket?.tenant_phone) {
      window.location.href = `tel:${ticket.tenant_phone}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!ticket) return null;

  const latestStatus = ticket.status_updates?.[0]?.status || ticket.status;

  return (
    <div className="min-h-screen bg-[#050505] pb-32" data-testid="handwerker-ticket-detail">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#050505]/95 backdrop-blur-xl border-b border-white/10">
        <div className="p-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/handwerker/tickets")}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-white font-semibold font-['Manrope'] truncate">{ticket.title}</h1>
            <p className="text-white/50 text-sm">{ticket.property_name}</p>
          </div>
          {ticket.priority === "Dringend" && (
            <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
          )}
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Status Banner */}
        <div className={`p-4 rounded-2xl ${statusColors[latestStatus] || "bg-gray-500"}`}>
          <p className="text-white/80 text-xs uppercase tracking-wider mb-1">Aktueller Status</p>
          <p className="text-white text-xl font-bold">{latestStatus}</p>
          {ticket.status_updates?.[0]?.note && (
            <p className="text-white/70 text-sm mt-1">{ticket.status_updates[0].note}</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={openMaps}
            className="p-4 rounded-xl bg-white/5 border border-white/10 active:bg-white/10 transition-all"
          >
            <Navigation className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-white/60 text-xs">Navigation</p>
          </button>
          <button
            onClick={callTenant}
            disabled={!ticket.tenant_phone}
            className="p-4 rounded-xl bg-white/5 border border-white/10 active:bg-white/10 transition-all disabled:opacity-50"
          >
            <Phone className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-white/60 text-xs">Anrufen</p>
          </button>
          <button
            onClick={() => setShowPhotoDialog(true)}
            className="p-4 rounded-xl bg-white/5 border border-white/10 active:bg-white/10 transition-all"
          >
            <Camera className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <p className="text-white/60 text-xs">Foto</p>
          </button>
        </div>

        {/* Address */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-white/40 mt-0.5" />
            <div>
              <p className="text-white font-medium">{ticket.property_name}</p>
              <p className="text-white/60 text-sm">{ticket.property_address}</p>
              {ticket.tenant_name && (
                <p className="text-white/40 text-sm mt-2">
                  Kontakt: {ticket.tenant_name} {ticket.tenant_phone && `• ${ticket.tenant_phone}`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {ticket.description && (
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <h3 className="text-white font-medium mb-2">Beschreibung</h3>
            <p className="text-white/70 text-sm">{ticket.description}</p>
          </div>
        )}

        {/* Photos Section */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-medium flex items-center gap-2">
              <Image className="w-5 h-5 text-white/40" />
              Fotos ({ticket.photos?.length || 0})
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowPhotoDialog(true)}
              className="text-blue-400 hover:text-blue-300"
            >
              + Hinzufügen
            </Button>
          </div>
          
          {ticket.photos?.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {ticket.photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.thumbnail_url || photo.photo_url}
                    alt={photo.category}
                    onClick={() => setSelectedPhoto(photo)}
                    className="w-full aspect-square rounded-xl object-cover cursor-pointer"
                  />
                  <span className="absolute bottom-1 left-1 px-2 py-0.5 rounded text-[10px] bg-black/70 text-white">
                    {photo.category}
                  </span>
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/40 text-sm text-center py-4">
              Noch keine Fotos vorhanden
            </p>
          )}
        </div>

        {/* Work Report */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-medium flex items-center gap-2">
              <FileText className="w-5 h-5 text-white/40" />
              Arbeitsbericht
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowReportDialog(true)}
              className="text-blue-400 hover:text-blue-300"
            >
              <Edit3 className="w-4 h-4 mr-1" />
              {ticket.work_report ? "Bearbeiten" : "Erstellen"}
            </Button>
          </div>
          
          {ticket.work_report ? (
            <div className="space-y-2 text-sm">
              <p className="text-white/70">{ticket.work_report.description}</p>
              {ticket.work_report.materials_used && (
                <p className="text-white/50">Material: {ticket.work_report.materials_used}</p>
              )}
              <div className="flex gap-4 pt-2 border-t border-white/10">
                <span className="text-white/50">{ticket.work_report.work_hours}h Arbeit</span>
                <span className="text-emerald-400 font-medium">
                  {ticket.work_report.total_cost?.toLocaleString("de-DE")} € Gesamt
                </span>
              </div>
            </div>
          ) : (
            <p className="text-white/40 text-sm text-center py-4">
              Noch kein Arbeitsbericht erstellt
            </p>
          )}
        </div>

        {/* Status History */}
        {ticket.status_updates?.length > 0 && (
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-white/40" />
              Status-Verlauf
            </h3>
            <div className="space-y-3">
              {ticket.status_updates.slice(0, 5).map((update, idx) => (
                <div key={update.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${statusColors[update.status] || "bg-gray-500"}`} />
                  <div>
                    <p className="text-white text-sm">{update.status}</p>
                    {update.note && <p className="text-white/50 text-xs">{update.note}</p>}
                    <p className="text-white/30 text-xs">
                      {new Date(update.timestamp).toLocaleString("de-DE")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Status Update Bar - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-white/10">
        <div className="flex gap-2 mb-3">
          <Input
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            placeholder="Notiz hinzufügen (optional)"
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {statusOptions.map((status) => (
            <Button
              key={status}
              onClick={() => handleStatusUpdate(status)}
              disabled={updating}
              className={`flex-shrink-0 rounded-full px-4 ${
                latestStatus === status
                  ? `${statusColors[status]} text-white`
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
              data-testid={`status-btn-${status.toLowerCase().replace(" ", "-")}`}
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : status}
            </Button>
          ))}
        </div>
      </div>

      {/* Photo Upload Dialog */}
      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent className="bg-[#0A0A0A] border-white/10 text-white max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>Foto aufnehmen</DialogTitle>
            <DialogDescription className="text-white/50">
              Kategorisieren Sie das Foto für bessere Dokumentation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/70">Kategorie</Label>
              <Select value={photoCategory} onValueChange={setPhotoCategory}>
                <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-white/10">
                  {photoCategories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-white hover:bg-white/10">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/70">Beschreibung (optional)</Label>
              <Input
                value={photoDescription}
                onChange={(e) => setPhotoDescription(e.target.value)}
                placeholder="z.B. Wasserschaden an der Decke"
                className="mt-1 bg-white/5 border-white/10 text-white"
              />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowPhotoDialog(false)}
                className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
                data-testid="photo-dialog-cancel"
              >
                Abbrechen
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="flex-1 h-12 rounded-xl bg-blue-500 hover:bg-blue-600"
                data-testid="photo-dialog-capture"
              >
                {uploadingPhoto ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 mr-2" />
                    Kamera
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Photo View */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white"
            onClick={() => setSelectedPhoto(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedPhoto.photo_url}
            alt={selectedPhoto.category}
            className="max-w-full max-h-full object-contain rounded-xl"
          />
          <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-black/70 text-center">
            <p className="text-white font-medium">{selectedPhoto.category}</p>
            {selectedPhoto.description && (
              <p className="text-white/60 text-sm">{selectedPhoto.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Work Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="bg-[#0A0A0A] border-white/10 text-white max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Arbeitsbericht</DialogTitle>
            <DialogDescription className="text-white/50">
              Dokumentieren Sie die durchgeführten Arbeiten
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/70">Durchgeführte Arbeiten *</Label>
              <Textarea
                value={reportData.description}
                onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
                placeholder="Beschreiben Sie die Arbeiten..."
                className="mt-1 bg-white/5 border-white/10 text-white resize-none"
                rows={3}
              />
            </div>
            <div>
              <Label className="text-white/70">Verwendete Materialien</Label>
              <Textarea
                value={reportData.materials_used}
                onChange={(e) => setReportData({ ...reportData, materials_used: e.target.value })}
                placeholder="z.B. 2x Dichtung, 1x Rohr 50mm"
                className="mt-1 bg-white/5 border-white/10 text-white resize-none"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-white/70">Stunden</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={reportData.work_hours}
                  onChange={(e) => setReportData({ ...reportData, work_hours: parseFloat(e.target.value) || 0 })}
                  className="mt-1 bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white/70">Material €</Label>
                <Input
                  type="number"
                  value={reportData.material_cost}
                  onChange={(e) => setReportData({ ...reportData, material_cost: parseFloat(e.target.value) || 0 })}
                  className="mt-1 bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white/70">Arbeit €</Label>
                <Input
                  type="number"
                  value={reportData.labor_cost}
                  onChange={(e) => setReportData({ ...reportData, labor_cost: parseFloat(e.target.value) || 0 })}
                  className="mt-1 bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-emerald-400 text-sm">
                Gesamtkosten: <span className="text-lg font-bold">
                  {((reportData.material_cost || 0) + (reportData.labor_cost || 0)).toLocaleString("de-DE")} €
                </span>
              </p>
            </div>
            <div>
              <Label className="text-white/70">Zusätzliche Notizen</Label>
              <Textarea
                value={reportData.notes}
                onChange={(e) => setReportData({ ...reportData, notes: e.target.value })}
                placeholder="Weitere Hinweise..."
                className="mt-1 bg-white/5 border-white/10 text-white resize-none"
                rows={2}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowReportDialog(false)}
                className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleSaveReport}
                disabled={updating}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Speichern"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
