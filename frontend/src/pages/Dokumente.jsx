import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FolderOpen,
  Plus,
  Search,
  Upload,
  FileText,
  Image,
  File,
  Loader2,
  X,
  Trash2,
  Download,
  Building2,
  Filter,
  Eye,
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
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categoryOptions = ["Vertrag", "Protokoll", "Rechnung", "Grundriss", "Sonstiges"];
const categoryColors = {
  Vertrag: "bg-blue-50 text-blue-500 border-blue-500/30",
  Protokoll: "bg-emerald-50 text-emerald-500 border-emerald-500/30",
  Rechnung: "bg-amber-50 text-amber-500 border-amber-500/30",
  Grundriss: "bg-purple-50 text-purple-500 border-purple-500/30",
  Sonstiges: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const getFileIcon = (fileType) => {
  if (!fileType) return File;
  if (fileType.includes("pdf")) return FileText;
  if (fileType.includes("image")) return Image;
  return File;
};

const formatFileSize = (bytes) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export default function Dokumente() {
  const [documents, setDocuments] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [propertyFilter, setPropertyFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadData, setUploadData] = useState({
    property_id: "",
    category: "Sonstiges",
    file: null,
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [propertyFilter, categoryFilter]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (propertyFilter) params.append("property_id", propertyFilter);
      if (categoryFilter) params.append("category", categoryFilter);
      
      const [docsRes, propsRes] = await Promise.all([
        axios.get(`${API}/documents?${params.toString()}`),
        axios.get(`${API}/properties`),
      ]);
      setDocuments(docsRes.data);
      setProperties(propsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Fehler beim Laden der Dokumente");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.property_id || !uploadData.file) {
      toast.error("Bitte wählen Sie eine Immobilie und eine Datei aus");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadData.file);
      
      await axios.post(
        `${API}/documents/upload?property_id=${uploadData.property_id}&category=${uploadData.category}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      
      toast.success("Dokument hochgeladen");
      setIsDialogOpen(false);
      setUploadData({ property_id: "", category: "Sonstiges", file: null });
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchData();
    } catch (error) {
      console.error("Error uploading:", error);
      toast.error("Fehler beim Hochladen");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/documents/${id}`);
      toast.success("Dokument gelöscht");
      fetchData();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Fehler beim Löschen");
    }
  };

  const filteredDocuments = documents.filter((d) =>
    d.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by property
  const groupedByProperty = properties.reduce((acc, prop) => {
    const propDocs = filteredDocuments.filter((d) => d.property_id === prop.id);
    if (propDocs.length > 0 || !propertyFilter) {
      acc[prop.id] = { property: prop, documents: propDocs };
    }
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" className="overflow-x-hidden" data-testid="dokumente-loading">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" className="overflow-x-hidden" data-testid="dokumente-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-['Manrope']">Dokumente</h1>
          <p className="text-gray-400 mt-1">{documents.length} Dokumente verwalten</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary flex items-center gap-2" className="overflow-x-hidden" data-testid="upload-document-btn">
              <Upload className="w-4 h-4" />
              Dokument hochladen
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0A0A0A] border-gray-200 text-gray-900 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-['Manrope']">Dokument hochladen</DialogTitle>
              <DialogDescription className="text-gray-400">
                Laden Sie ein Dokument zu einer Immobilie hoch.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4 mt-4">
              <div>
                <Label className="text-white/70">Immobilie *</Label>
                <Select value={uploadData.property_id} onValueChange={(v) => setUploadData({ ...uploadData, property_id: v })}>
                  <SelectTrigger className="mt-1 bg-white border-gray-200 text-gray-900" className="overflow-x-hidden" data-testid="upload-property-select">
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
                <Label className="text-white/70">Kategorie</Label>
                <Select value={uploadData.category} onValueChange={(v) => setUploadData({ ...uploadData, category: v })}>
                  <SelectTrigger className="mt-1 bg-white border-gray-200 text-gray-900" className="overflow-x-hidden" data-testid="upload-category-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-gray-200">
                    {categoryOptions.map((c) => (
                      <SelectItem key={c} value={c} className="text-gray-900 hover:bg-gray-50">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/70">Datei *</Label>
                <div 
                  className="mt-1 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-white/40 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    className="overflow-x-hidden" data-testid="file-input"
                  />
                  {uploadData.file ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-6 h-6 text-blue-500" />
                      <span className="text-gray-900">{uploadData.file.name}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); setUploadData({ ...uploadData, file: null }); }}
                        className="text-gray-400 hover:text-gray-900"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Klicken oder Datei hierher ziehen</p>
                      <p className="text-gray-400 text-sm mt-1">PDF, DOC, XLS, JPG, PNG</p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="bg-white border-gray-200 text-gray-900 hover:bg-gray-50">
                  Abbrechen
                </Button>
                <Button type="submit" disabled={uploading} className="btn-primary" className="overflow-x-hidden" data-testid="submit-upload-btn">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hochladen"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-4" className="overflow-x-hidden" data-testid="dokumente-filters">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Dokument suchen..."
              className="pl-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-300"
              className="overflow-x-hidden" data-testid="search-documents-input"
            />
          </div>
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="w-[200px] bg-white border-gray-200 text-gray-900" className="overflow-x-hidden" data-testid="filter-property">
              <Building2 className="w-4 h-4 mr-2 text-gray-400" />
              <SelectValue placeholder="Alle Immobilien" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-gray-200">
              <SelectItem value="all" className="text-gray-900 hover:bg-gray-50">Alle Immobilien</SelectItem>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-gray-900 hover:bg-gray-50">{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] bg-white border-gray-200 text-gray-900" className="overflow-x-hidden" data-testid="filter-category">
              <Filter className="w-4 h-4 mr-2 text-gray-400" />
              <SelectValue placeholder="Alle Kategorien" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-gray-200">
              <SelectItem value="all" className="text-gray-900 hover:bg-gray-50">Alle Kategorien</SelectItem>
              {categoryOptions.map((c) => (
                <SelectItem key={c} value={c} className="text-gray-900 hover:bg-gray-50">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(propertyFilter || categoryFilter || searchTerm) && (
            <Button variant="ghost" onClick={() => { setPropertyFilter(""); setCategoryFilter(""); setSearchTerm(""); }} className="text-gray-500 hover:text-gray-900">
              <X className="w-4 h-4 mr-1" /> Filter zurücksetzen
            </Button>
          )}
        </div>
      </div>

      {/* Documents by Property */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center" className="overflow-x-hidden" data-testid="no-documents">
          <FolderOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Dokumente gefunden</h3>
          <p className="text-gray-400 mb-4">Laden Sie Ihr erstes Dokument hoch</p>
          <Button onClick={() => setIsDialogOpen(true)} className="btn-primary">
            <Upload className="w-4 h-4 mr-2" /> Dokument hochladen
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.values(groupedByProperty).map(({ property, documents: propDocs }) => {
            if (propDocs.length === 0) return null;
            
            return (
              <div key={property.id} className="space-y-4" data-testid={`documents-group-${property.id}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-blue-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 font-['Manrope']">{property.name}</h2>
                  <span className="text-sm text-gray-400">({propDocs.length} Dokumente)</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {propDocs.map((doc, idx) => {
                    const FileIcon = getFileIcon(doc.file_type);
                    
                    return (
                      <div
                        key={doc.id}
                        className="bg-white rounded-2xl shadow-sm p-4 hover:bg-gray-50 transition-all opacity-0 animate-fade-in"
                        style={{ animationDelay: `${idx * 0.05}s` }}
                        data-testid={`document-card-${doc.id}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                            <FileIcon className="w-6 h-6 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-gray-900 font-medium truncate">{doc.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded text-xs border ${categoryColors[doc.category]}`}>
                                {doc.category}
                              </span>
                              <span className="text-xs text-gray-400">{formatFileSize(doc.file_size)}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(doc.created_at).toLocaleDateString("de-DE")}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(doc.file_url, "_blank")}
                            className="flex-1 text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                          >
                            <Eye className="w-4 h-4 mr-1" /> Anzeigen
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(doc.file_url, "_blank")}
                            className="text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-300 hover:bg-red-500/10">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-[#0A0A0A] border-gray-200">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-gray-900">Dokument löschen?</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-500">
                                  Möchten Sie "{doc.name}" wirklich löschen?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-white border-gray-200 text-gray-900 hover:bg-gray-50">Abbrechen</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(doc.id)} className="bg-red-500 hover:bg-red-600 text-gray-900">Löschen</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
