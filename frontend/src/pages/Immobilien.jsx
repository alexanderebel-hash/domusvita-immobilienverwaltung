import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Building2,
  Plus,
  Search,
  Filter,
  MapPin,
  Home,
  Loader2,
  X,
  Grid3X3,
  List,
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
import { Label } from "../components/ui/label";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const propertyTypes = ["Wohnung", "Gewerbe", "Pflegewohngemeinschaft", "Mehrfamilienhaus"];
const statusOptions = ["Eigentum", "Gemietet", "Untervermietet"];

export default function Immobilien() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    city: "",
    status: "",
  });
  const [cities, setCities] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProperty, setNewProperty] = useState({
    name: "",
    address: "",
    city: "",
    postal_code: "",
    property_type: "Wohnung",
    status: "Eigentum",
    units_count: 1,
    description: "",
    image_url: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProperties();
    fetchCities();
  }, [filters]);

  const fetchProperties = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append("property_type", filters.type);
      if (filters.city) params.append("city", filters.city);
      if (filters.status) params.append("status", filters.status);

      const res = await axios.get(`${API}/properties?${params.toString()}`);
      setProperties(res.data);
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast.error("Fehler beim Laden der Immobilien");
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const res = await axios.get(`${API}/properties/cities/list`);
      setCities(res.data.cities || []);
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  const handleCreateProperty = async (e) => {
    e.preventDefault();
    if (!newProperty.name || !newProperty.address || !newProperty.city) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }

    setSubmitting(true);
    try {
      const propertyData = {
        ...newProperty,
        image_url: newProperty.image_url || getDefaultImage(newProperty.property_type),
      };
      await axios.post(`${API}/properties`, propertyData);
      toast.success("Immobilie erfolgreich erstellt");
      setIsDialogOpen(false);
      setNewProperty({
        name: "",
        address: "",
        city: "",
        postal_code: "",
        property_type: "Wohnung",
        status: "Eigentum",
        units_count: 1,
        description: "",
        image_url: "",
      });
      fetchProperties();
      fetchCities();
    } catch (error) {
      console.error("Error creating property:", error);
      toast.error("Fehler beim Erstellen der Immobilie");
    } finally {
      setSubmitting(false);
    }
  };

  const getDefaultImage = (type) => {
    const images = {
      Wohnung: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
      Gewerbe: "https://images.unsplash.com/photo-1664813953310-ea2953c0ec99?w=800",
      Pflegewohngemeinschaft: "https://images.unsplash.com/photo-1664813954641-1ffcb7b55fd1?w=800",
      Mehrfamilienhaus: "https://images.unsplash.com/photo-1664813953897-ada06817c48c?w=800",
    };
    return images[type] || images.Wohnung;
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
        return "bg-gray-50 text-gray-700";
    }
  };

  const filteredProperties = properties.filter((prop) =>
    prop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prop.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prop.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clearFilters = () => {
    setFilters({ type: "", city: "", status: "" });
    setSearchTerm("");
  };

  const hasActiveFilters = filters.type || filters.city || filters.status || searchTerm;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-testid="immobilien-loading">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" data-testid="immobilien-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-['Manrope']">Immobilien</h1>
          <p className="text-gray-400 mt-1">{properties.length} Objekte in Ihrem Portfolio</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary flex items-center gap-2" data-testid="create-property-btn">
              <Plus className="w-4 h-4" />
              Neue Immobilie
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0A0A0A] border-gray-200 text-gray-900 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-['Manrope']">Neue Immobilie erstellen</DialogTitle>
              <DialogDescription className="text-gray-400">
                Fügen Sie eine neue Immobilie zu Ihrem Portfolio hinzu.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateProperty} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-white/70">Name *</Label>
                  <Input
                    value={newProperty.name}
                    onChange={(e) => setNewProperty({ ...newProperty, name: e.target.value })}
                    placeholder="z.B. Mehrfamilienhaus Berlin"
                    className="mt-1 bg-white border-gray-200 text-gray-900"
                    data-testid="property-name-input"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-white/70">Adresse *</Label>
                  <Input
                    value={newProperty.address}
                    onChange={(e) => setNewProperty({ ...newProperty, address: e.target.value })}
                    placeholder="Straße und Hausnummer"
                    className="mt-1 bg-white border-gray-200 text-gray-900"
                    data-testid="property-address-input"
                  />
                </div>
                <div>
                  <Label className="text-white/70">Stadt *</Label>
                  <Input
                    value={newProperty.city}
                    onChange={(e) => setNewProperty({ ...newProperty, city: e.target.value })}
                    placeholder="Berlin"
                    className="mt-1 bg-white border-gray-200 text-gray-900"
                    data-testid="property-city-input"
                  />
                </div>
                <div>
                  <Label className="text-white/70">PLZ</Label>
                  <Input
                    value={newProperty.postal_code}
                    onChange={(e) => setNewProperty({ ...newProperty, postal_code: e.target.value })}
                    placeholder="10115"
                    className="mt-1 bg-white border-gray-200 text-gray-900"
                    data-testid="property-postal-input"
                  />
                </div>
                <div>
                  <Label className="text-white/70">Typ</Label>
                  <Select
                    value={newProperty.property_type}
                    onValueChange={(value) => setNewProperty({ ...newProperty, property_type: value })}
                  >
                    <SelectTrigger className="mt-1 bg-white border-gray-200 text-gray-900" data-testid="property-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-gray-200">
                      {propertyTypes.map((type) => (
                        <SelectItem key={type} value={type} className="text-gray-900 hover:bg-gray-50">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white/70">Status</Label>
                  <Select
                    value={newProperty.status}
                    onValueChange={(value) => setNewProperty({ ...newProperty, status: value })}
                  >
                    <SelectTrigger className="mt-1 bg-white border-gray-200 text-gray-900" data-testid="property-status-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-gray-200">
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status} className="text-gray-900 hover:bg-gray-50">
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white/70">Einheiten</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newProperty.units_count}
                    onChange={(e) => setNewProperty({ ...newProperty, units_count: parseInt(e.target.value) || 1 })}
                    className="mt-1 bg-white border-gray-200 text-gray-900"
                    data-testid="property-units-input"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="bg-white border-gray-200 text-gray-900 hover:bg-gray-50"
                  data-testid="cancel-create-btn"
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  data-testid="submit-create-btn"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Erstellen"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-4" data-testid="filters-section">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Suchen nach Name, Adresse oder Stadt..."
              className="pl-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-300"
              data-testid="search-input"
            />
          </div>

          {/* Filter Selects */}
          <div className="flex flex-wrap gap-3">
            <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
              <SelectTrigger className="w-[160px] bg-white border-gray-200 text-gray-900" data-testid="filter-type">
                <Filter className="w-4 h-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Typ" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-gray-200">
                <SelectItem value="all" className="text-gray-900 hover:bg-gray-50">Alle Typen</SelectItem>
                {propertyTypes.map((type) => (
                  <SelectItem key={type} value={type} className="text-gray-900 hover:bg-gray-50">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.city} onValueChange={(value) => setFilters({ ...filters, city: value })}>
              <SelectTrigger className="w-[160px] bg-white border-gray-200 text-gray-900" data-testid="filter-city">
                <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Stadt" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-gray-200">
                <SelectItem value="all" className="text-gray-900 hover:bg-gray-50">Alle Städte</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city} className="text-gray-900 hover:bg-gray-50">
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger className="w-[160px] bg-white border-gray-200 text-gray-900" data-testid="filter-status">
                <Home className="w-4 h-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-gray-200">
                <SelectItem value="all" className="text-gray-900 hover:bg-gray-50">Alle Status</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status} className="text-gray-900 hover:bg-gray-50">
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                data-testid="clear-filters-btn"
              >
                <X className="w-4 h-4 mr-1" />
                Filter zurücksetzen
              </Button>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex gap-1 bg-white rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-all ${viewMode === "grid" ? "bg-gray-50 text-gray-900" : "text-gray-400 hover:text-gray-900"}`}
              data-testid="view-grid-btn"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-gray-50 text-gray-900" : "text-gray-400 hover:text-gray-900"}`}
              data-testid="view-list-btn"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      {filteredProperties.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center" data-testid="no-properties">
          <Building2 className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Immobilien gefunden</h3>
          <p className="text-gray-400 mb-4">
            {hasActiveFilters
              ? "Versuchen Sie andere Filtereinstellungen"
              : "Fügen Sie Ihre erste Immobilie hinzu"}
          </p>
          {!hasActiveFilters && (
            <Button onClick={() => setIsDialogOpen(true)} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Immobilie hinzufügen
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="properties-grid">
          {filteredProperties.map((property, index) => (
            <div
              key={property.id}
              onClick={() => navigate(`/immobilien/${property.id}`)}
              className="property-card bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer opacity-0 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
              data-testid={`property-card-${property.id}`}
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={property.image_url || getDefaultImage(property.property_type)}
                  alt={property.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="type-badge">{property.property_type}</span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`status-badge ${getStatusClass(property.status)}`}>
                    {property.status}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 font-['Manrope'] mb-2 line-clamp-1">
                  {property.name}
                </h3>
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                  <MapPin className="w-4 h-4" />
                  <span className="line-clamp-1">{property.address}, {property.city}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Home className="w-4 h-4" />
                    <span className="text-sm">{property.units_count} Einheiten</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-300 hover:bg-blue-500/10 p-0">
                    Details →
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3" data-testid="properties-list">
          {filteredProperties.map((property, index) => (
            <div
              key={property.id}
              onClick={() => navigate(`/immobilien/${property.id}`)}
              className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-all opacity-0 animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
              data-testid={`property-list-${property.id}`}
            >
              <img
                src={property.image_url || getDefaultImage(property.property_type)}
                alt={property.name}
                className="w-20 h-20 rounded-xl object-cover"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-gray-900 font-medium font-['Manrope'] truncate">{property.name}</h3>
                <p className="text-gray-400 text-sm truncate">{property.address}, {property.city}</p>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <span className="type-badge">{property.property_type}</span>
                <span className={`status-badge ${getStatusClass(property.status)}`}>{property.status}</span>
              </div>
              <div className="text-gray-500 text-sm whitespace-nowrap">
                {property.units_count} Einheiten
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
