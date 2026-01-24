import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Home,
  Edit2,
  Trash2,
  Loader2,
  Users,
  FileText,
  Wrench,
} from "lucide-react";
import { Button } from "../components/ui/button";
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
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ImmobilieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPropertyDetails();
  }, [id]);

  const fetchPropertyDetails = async () => {
    try {
      const [propertyRes, unitsRes] = await Promise.all([
        axios.get(`${API}/properties/${id}`),
        axios.get(`${API}/units?property_id=${id}`),
      ]);
      setProperty(propertyRes.data);
      setUnits(unitsRes.data);
    } catch (error) {
      console.error("Error fetching property:", error);
      toast.error("Immobilie nicht gefunden");
      navigate("/immobilien");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API}/properties/${id}`);
      toast.success("Immobilie erfolgreich gelöscht");
      navigate("/immobilien");
    } catch (error) {
      console.error("Error deleting property:", error);
      toast.error("Fehler beim Löschen der Immobilie");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Eigentum":
        return "status-eigentum";
      case "Gemietet":
        return "status-gemietet";
      case "Untervermietet":
        return "status-untervermietet";
      default:
        return "bg-white/10 text-white/80";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-testid="detail-loading">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!property) {
    return null;
  }

  return (
    <div className="space-y-8 animate-fade-in" data-testid="property-detail">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate("/immobilien")}
        className="text-white/60 hover:text-white hover:bg-white/10 -ml-2"
        data-testid="back-btn"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Zurück zur Übersicht
      </Button>

      {/* Hero Section */}
      <div className="relative h-[300px] rounded-2xl overflow-hidden">
        <img
          src={property.image_url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200"}
          alt={property.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md"
            data-testid="edit-btn"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Bearbeiten
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 backdrop-blur-md"
                data-testid="delete-btn"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#0A0A0A] border-white/10">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Immobilie löschen?</AlertDialogTitle>
                <AlertDialogDescription className="text-white/60">
                  Diese Aktion kann nicht rückgängig gemacht werden. Alle zugehörigen Einheiten werden ebenfalls gelöscht.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                  Abbrechen
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-500 hover:bg-red-600 text-white"
                  data-testid="confirm-delete-btn"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Löschen"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Property Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="type-badge">{property.property_type}</span>
            <span className={`status-badge ${getStatusClass(property.status)}`}>
              {property.status}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white font-['Manrope'] mb-2">
            {property.name}
          </h1>
          <div className="flex items-center gap-2 text-white/70">
            <MapPin className="w-4 h-4" />
            <span>{property.address}, {property.postal_code} {property.city}</span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-stat-card p-5" data-testid="stat-units">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Home className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white font-['Manrope']">{property.units_count}</p>
              <p className="text-xs text-white/50">Einheiten</p>
            </div>
          </div>
        </div>
        <div className="glass-stat-card p-5" data-testid="stat-tenants">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white font-['Manrope']">
                {units.filter((u) => !u.is_vacant).length}
              </p>
              <p className="text-xs text-white/50">Mieter</p>
            </div>
          </div>
        </div>
        <div className="glass-stat-card p-5" data-testid="stat-contracts">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white font-['Manrope']">0</p>
              <p className="text-xs text-white/50">Verträge</p>
            </div>
          </div>
        </div>
        <div className="glass-stat-card p-5" data-testid="stat-maintenance">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white font-['Manrope']">0</p>
              <p className="text-xs text-white/50">Wartungen</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Units Section */}
        <div className="lg:col-span-2 glass-card p-6" data-testid="units-section">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white font-['Manrope']">Einheiten</h2>
            <Button size="sm" className="btn-secondary text-sm" data-testid="add-unit-btn">
              + Einheit hinzufügen
            </Button>
          </div>

          {units.length === 0 ? (
            <div className="text-center py-12">
              <Home className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/50">Keine Einheiten vorhanden</p>
            </div>
          ) : (
            <div className="space-y-3">
              {units.map((unit) => (
                <div
                  key={unit.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  data-testid={`unit-${unit.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${unit.is_vacant ? "bg-amber-500/20" : "bg-emerald-500/20"}`}>
                      <Home className={`w-5 h-5 ${unit.is_vacant ? "text-amber-400" : "text-emerald-400"}`} />
                    </div>
                    <div>
                      <p className="text-white font-medium">Einheit {unit.unit_number}</p>
                      <p className="text-white/50 text-sm">
                        {unit.rooms} Zimmer • {unit.area_sqm} m² • {unit.floor}. OG
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{unit.rent_amount.toLocaleString("de-DE")} €</p>
                    <p className={`text-sm ${unit.is_vacant ? "text-amber-400" : "text-emerald-400"}`}>
                      {unit.is_vacant ? "Leer" : unit.tenant_name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Description & Details */}
        <div className="space-y-6">
          <div className="glass-card p-6" data-testid="description-section">
            <h2 className="text-lg font-semibold text-white font-['Manrope'] mb-4">Beschreibung</h2>
            <p className="text-white/70 text-sm leading-relaxed">
              {property.description || "Keine Beschreibung vorhanden."}
            </p>
          </div>

          <div className="glass-card p-6" data-testid="details-section">
            <h2 className="text-lg font-semibold text-white font-['Manrope'] mb-4">Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Typ</span>
                <span className="text-white">{property.property_type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Status</span>
                <span className="text-white">{property.status}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Stadt</span>
                <span className="text-white">{property.city}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">PLZ</span>
                <span className="text-white">{property.postal_code}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Erstellt</span>
                <span className="text-white">
                  {new Date(property.created_at).toLocaleDateString("de-DE")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
