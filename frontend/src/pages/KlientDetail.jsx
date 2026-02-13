import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Phone, Mail, MessageSquare, Calendar, FileText, 
  Clock, Building2, Plus, Send, History, Home, Upload, Download,
  Trash2, Paperclip, Check, X, Euro
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const STATUS_LABELS = {
  neu: 'Neu eingegangen',
  erstgespraech: 'Erstgespräch',
  besichtigung_geplant: 'Besichtigung geplant',
  unterlagen_gesendet: 'Unterlagen gesendet',
  entscheidung_ausstehend: 'Entscheidung ausstehend',
  zusage: 'Zusage',
  einzug_geplant: 'Einzug geplant',
  bewohner: 'Bewohner',
  abgesagt: 'Abgesagt'
};

const STATUS_COLORS = {
  neu: 'bg-red-500',
  erstgespraech: 'bg-orange-500',
  besichtigung_geplant: 'bg-yellow-500',
  unterlagen_gesendet: 'bg-blue-500',
  entscheidung_ausstehend: 'bg-purple-500',
  zusage: 'bg-green-500',
  einzug_geplant: 'bg-teal-500',
  bewohner: 'bg-emerald-600',
  abgesagt: 'bg-gray-500'
};

const PFLEGEGRAD_COLORS = {
  '1': 'bg-green-500',
  '2': 'bg-lime-500',
  '3': 'bg-yellow-500',
  '4': 'bg-orange-500',
  '5': 'bg-red-500'
};

const KOMMUNIKATION_ICONS = {
  email_ein: Mail,
  email_aus: Send,
  anruf_ein: Phone,
  anruf_aus: Phone,
  whatsapp_ein: MessageSquare,
  whatsapp_aus: MessageSquare,
  notiz: FileText,
  besichtigung: Calendar
};

const KOMMUNIKATION_LABELS = {
  email_ein: 'E-Mail erhalten',
  email_aus: 'E-Mail gesendet',
  anruf_ein: 'Anruf erhalten',
  anruf_aus: 'Anruf durchgeführt',
  whatsapp_ein: 'WhatsApp erhalten',
  whatsapp_aus: 'WhatsApp gesendet',
  notiz: 'Notiz',
  besichtigung: 'Besichtigung'
};

const DOK_KATEGORIEN = [
  { value: 'infomaterial', label: 'Infomaterial' },
  { value: 'mietvertrag', label: 'Mietvertrag' },
  { value: 'vollmacht', label: 'Vollmacht' },
  { value: 'arztbrief', label: 'Arztbrief' },
  { value: 'pflegegutachten', label: 'Pflegegutachten' },
  { value: 'sonstiges', label: 'Sonstiges' },
];

export default function KlientDetail() {
  const { klientId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [klient, setKlient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('uebersicht');
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [newNote, setNewNote] = useState({ typ: 'notiz', betreff: '', inhalt: '' });
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailData, setEmailData] = useState({ betreff: '', inhalt: '', empfaenger: '', dokument_ids: [] });
  const [uploading, setUploading] = useState(false);
  const [uploadKategorie, setUploadKategorie] = useState('sonstiges');
  const [dokumente, setDokumente] = useState([]);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetchKlient();
    fetchDokumente();
  }, [klientId]);

  const fetchKlient = async () => {
    try {
      const res = await fetch(`${API_URL}/api/klienten/${klientId}`);
      if (!res.ok) throw new Error('Klient nicht gefunden');
      const data = await res.json();
      setKlient(data);
      setNewStatus(data.status);
    } catch (error) {
      toast.error('Klient nicht gefunden');
      navigate('/pflege-wgs/pipeline');
    } finally {
      setLoading(false);
    }
  };

  const fetchDokumente = async () => {
    try {
      const res = await fetch(`${API_URL}/api/klienten/${klientId}/dokumente`);
      if (res.ok) {
        const data = await res.json();
        setDokumente(data);
      }
    } catch (e) { /* ignore */ }
  };

  const handleStatusChange = async () => {
    try {
      await fetch(`${API_URL}/api/klienten/${klientId}/status?status=${newStatus}`, {
        method: 'POST'
      });
      toast.success('Status aktualisiert');
      fetchKlient();
      setShowStatusDialog(false);
    } catch (error) {
      toast.error('Fehler beim Aktualisieren');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.inhalt.trim()) {
      toast.error('Bitte geben Sie einen Text ein');
      return;
    }

    try {
      await fetch(`${API_URL}/api/klienten/${klientId}/kommunikation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          klient_id: klientId,
          typ: newNote.typ,
          betreff: newNote.betreff || null,
          inhalt: newNote.inhalt,
          anhaenge: []
        })
      });
      toast.success('Eintrag hinzugefügt');
      setNewNote({ typ: 'notiz', betreff: '', inhalt: '' });
      setShowNoteDialog(false);
      fetchKlient();
    } catch (error) {
      toast.error('Fehler beim Speichern');
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(
          `${API_URL}/api/klienten/${klientId}/dokumente?kategorie=${uploadKategorie}`,
          { method: 'POST', body: formData }
        );
        if (!res.ok) throw new Error('Upload fehlgeschlagen');
      }
      toast.success(`${files.length} Dokument(e) hochgeladen`);
      fetchDokumente();
      fetchKlient();
    } catch (error) {
      toast.error('Fehler beim Hochladen');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteDokument = async (dokId) => {
    try {
      await fetch(`${API_URL}/api/klienten/${klientId}/dokumente/${dokId}`, { method: 'DELETE' });
      toast.success('Dokument gelöscht');
      fetchDokumente();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  const handleSendEmail = async () => {
    if (!emailData.inhalt.trim()) {
      toast.error('Bitte geben Sie einen Text ein');
      return;
    }
    setSendingEmail(true);
    try {
      const res = await fetch(`${API_URL}/api/klienten/${klientId}/email-senden`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      });
      const result = await res.json();
      if (result.email_sent) {
        toast.success('E-Mail gesendet');
      } else {
        toast.success('E-Mail als Kommunikationseintrag gespeichert');
      }
      setShowEmailDialog(false);
      setEmailData({ betreff: '', inhalt: '', empfaenger: '', dokument_ids: [] });
      fetchKlient();
      fetchDokumente();
    } catch (error) {
      toast.error('Fehler beim Senden');
    } finally {
      setSendingEmail(false);
    }
  };

  const toggleDokumentForEmail = (dokId) => {
    setEmailData(prev => ({
      ...prev,
      dokument_ids: prev.dokument_ids.includes(dokId)
        ? prev.dokument_ids.filter(id => id !== dokId)
        : [...prev.dokument_ids, dokId]
    }));
  };

  const openEmailDialog = () => {
    setEmailData({
      betreff: `Informationen zu Pflege-WG - ${klient?.vorname} ${klient?.nachname}`,
      inhalt: `Sehr geehrte/r ${klient?.kontakt_name || 'Interessent/in'},\n\nanbei erhalten Sie die gewünschten Informationen zu unseren Pflege-Wohngemeinschaften.\n\nBei Fragen stehen wir Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen\nDomusVita Gesundheit`,
      empfaenger: klient?.kontakt_email || '',
      dokument_ids: []
    });
    setShowEmailDialog(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!klient) return null;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6" data-testid="klient-detail-page">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/pflege-wgs/pipeline')}
            className="text-gray-500 hover:text-gray-900 p-2"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-3xl font-bold text-gray-900 truncate">
                {klient.vorname} {klient.nachname}
              </h1>
              <Badge 
                className={`${STATUS_COLORS[klient.status]} text-gray-900 cursor-pointer text-xs`}
                onClick={() => setShowStatusDialog(true)}
                data-testid="status-badge"
              >
                {STATUS_LABELS[klient.status]}
              </Badge>
              {klient.pflegegrad && klient.pflegegrad !== 'keiner' && (
                <Badge className={`${PFLEGEGRAD_COLORS[klient.pflegegrad]} text-gray-900 text-xs`}>
                  PG {klient.pflegegrad}
                </Badge>
              )}
            </div>
            {klient.wg_name && (
              <p className="text-gray-500 mt-1 flex items-center gap-2 text-sm">
                <Home className="w-3.5 h-3.5" />
                {klient.wg_name} - Zimmer {klient.zimmer_nummer}
              </p>
            )}
            {klient.alter && (
              <p className="text-gray-500 text-sm">{klient.alter} Jahre</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          {klient.kontakt_telefon && (
            <Button 
              variant="outline" 
              size="sm"
              className="border-emerald-300 text-emerald-500 hover:bg-emerald-50"
              onClick={() => window.location.href = `tel:${klient.kontakt_telefon}`}
              data-testid="call-button"
            >
              <Phone className="w-4 h-4 mr-1.5" />
              Anrufen
            </Button>
          )}
          <Button 
            variant="outline"
            size="sm"
            className="border-blue-300 text-blue-500 hover:bg-blue-50"
            onClick={openEmailDialog}
            data-testid="email-button"
          >
            <Mail className="w-4 h-4 mr-1.5" />
            E-Mail
          </Button>
          <Button 
            size="sm"
            onClick={() => setShowNoteDialog(true)}
            className="bg-purple-600 hover:bg-purple-700"
            data-testid="add-note-button"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Eintrag
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border-gray-200">
          <TabsTrigger value="uebersicht" className="data-[state=active]:bg-gray-50" data-testid="tab-uebersicht">
            <User className="w-4 h-4 mr-2" />
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="kommunikation" className="data-[state=active]:bg-gray-50" data-testid="tab-kommunikation">
            <MessageSquare className="w-4 h-4 mr-2" />
            Kommunikation
            {klient.kommunikation?.length > 0 && (
              <Badge className="ml-2 bg-blue-50 text-blue-500 border-0 text-xs">{klient.kommunikation.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="dokumente" className="data-[state=active]:bg-gray-50" data-testid="tab-dokumente">
            <FileText className="w-4 h-4 mr-2" />
            Dokumente
            {dokumente.length > 0 && (
              <Badge className="ml-2 bg-blue-50 text-blue-500 border-0 text-xs">{dokumente.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="verlauf" className="data-[state=active]:bg-gray-50" data-testid="tab-verlauf">
            <History className="w-4 h-4 mr-2" />
            Verlauf
          </TabsTrigger>
        </TabsList>

        {/* Übersicht Tab */}
        <TabsContent value="uebersicht" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Persönliche Daten */}
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Persönliche Daten
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-sm">Geburtsdatum</p>
                    <p className="text-gray-900">{formatDate(klient.geburtsdatum) || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Geschlecht</p>
                    <p className="text-gray-900">{klient.geschlecht || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Pflegegrad</p>
                    <p className="text-gray-900">{klient.pflegegrad !== 'keiner' ? klient.pflegegrad : 'Keiner'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Einzugsdatum</p>
                    <p className="text-gray-900">{formatDate(klient.einzugsdatum) || '-'}</p>
                  </div>
                </div>
                
                {klient.besonderheiten && (
                  <div>
                    <p className="text-gray-500 text-sm">Besonderheiten</p>
                    <p className="text-gray-900 bg-white p-3 rounded-lg mt-1">{klient.besonderheiten}</p>
                  </div>
                )}
                
                {klient.diagnosen && (
                  <div>
                    <p className="text-gray-500 text-sm">Diagnosen</p>
                    <p className="text-gray-900 bg-white p-3 rounded-lg mt-1">{klient.diagnosen}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Kontaktperson */}
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Kontaktperson
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-900 font-medium text-lg">{klient.kontakt_name || '-'}</p>
                    <p className="text-gray-500">{klient.kontakt_beziehung || '-'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {klient.kontakt_telefon && (
                    <a 
                      href={`tel:${klient.kontakt_telefon}`}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Phone className="w-5 h-5 text-emerald-500" />
                      <span className="text-gray-900">{klient.kontakt_telefon}</span>
                    </a>
                  )}
                  {klient.kontakt_email && (
                    <a 
                      href={`mailto:${klient.kontakt_email}`}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Mail className="w-5 h-5 text-blue-500" />
                      <span className="text-gray-900">{klient.kontakt_email}</span>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Anfrage-Details */}
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Anfrage-Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-sm">Anfrage am</p>
                    <p className="text-gray-900">{formatDate(klient.anfrage_am)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Quelle</p>
                    <p className="text-gray-900 capitalize">{klient.anfrage_quelle || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Dringlichkeit</p>
                    <Badge className={
                      klient.dringlichkeit === 'sofort' ? 'bg-red-500' :
                      klient.dringlichkeit === '4_wochen' ? 'bg-orange-500' :
                      klient.dringlichkeit === '3_monate' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }>
                      {klient.dringlichkeit === '4_wochen' ? '4 Wochen' :
                       klient.dringlichkeit === '3_monate' ? '3 Monate' :
                       klient.dringlichkeit?.charAt(0).toUpperCase() + klient.dringlichkeit?.slice(1)}
                    </Badge>
                  </div>
                  {klient.vermittler && (
                    <div>
                      <p className="text-gray-500 text-sm">Vermittler</p>
                      <p className="text-gray-900">{klient.vermittler}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Wohnsituation */}
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Wohnsituation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {klient.status === 'bewohner' && klient.wg_name ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-emerald-500 font-medium">{klient.wg_name}</p>
                    <p className="text-gray-900">Zimmer {klient.zimmer_nummer}</p>
                    <p className="text-gray-500 text-sm mt-2">
                      Seit {formatDate(klient.einzugsdatum)}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-white rounded-lg">
                    <p className="text-gray-500">Noch nicht eingezogen</p>
                    {klient.bevorzugte_wgs?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-gray-500 text-sm mb-2">Bevorzugte WGs:</p>
                        <div className="flex flex-wrap gap-2">
                          {klient.bevorzugte_wgs.map(wgId => (
                            <Badge key={wgId} className="bg-blue-50 text-blue-500">
                              {wgId.replace('wg-', '').replace(/-/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Kommunikation Tab */}
        <TabsContent value="kommunikation" className="mt-6">
          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-gray-900">Kommunikationsverlauf</CardTitle>
              <div className="flex gap-2">
                <Button onClick={openEmailDialog} size="sm" variant="outline" className="border-blue-300 text-blue-500">
                  <Send className="w-4 h-4 mr-2" />
                  E-Mail senden
                </Button>
                <Button onClick={() => setShowNoteDialog(true)} size="sm" data-testid="new-entry-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Neuer Eintrag
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {klient.kommunikation?.length > 0 ? (
                <div className="space-y-4">
                  {klient.kommunikation.map((item, idx) => {
                    const Icon = KOMMUNIKATION_ICONS[item.typ] || FileText;
                    return (
                      <div key={idx} className="p-4 bg-white rounded-lg border border-gray-200" data-testid={`komm-entry-${idx}`}>
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            item.typ.includes('ein') ? 'bg-emerald-50' : 'bg-blue-50'
                          }`}>
                            <Icon className={`w-4 h-4 ${
                              item.typ.includes('ein') ? 'text-emerald-500' : 'text-blue-500'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-gray-900 font-medium">
                                {KOMMUNIKATION_LABELS[item.typ] || item.typ}
                              </p>
                              <span className="text-gray-400 text-sm">
                                {formatDateTime(item.erstellt_am)}
                              </span>
                            </div>
                            {item.betreff && (
                              <p className="text-gray-700 text-sm mt-1 font-medium">{item.betreff}</p>
                            )}
                            <p className="text-gray-500 mt-2 whitespace-pre-wrap">{item.inhalt}</p>
                            {item.anhaenge?.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {item.anhaenge.map((a, i) => (
                                  <Badge key={i} className="bg-gray-50 text-gray-600 border-0">
                                    <Paperclip className="w-3 h-3 mr-1" />{a}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {item.erstellt_von_name && (
                              <p className="text-gray-400 text-xs mt-2">
                                von {item.erstellt_von_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">
                  Noch keine Kommunikation vorhanden
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dokumente Tab */}
        <TabsContent value="dokumente" className="mt-6">
          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-gray-900">Dokumente</CardTitle>
              <div className="flex items-center gap-3">
                <Select value={uploadKategorie} onValueChange={setUploadKategorie}>
                  <SelectTrigger className="w-40 bg-white border-gray-200 text-gray-900 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {DOK_KATEGORIEN.map(k => (
                      <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  multiple
                  onChange={handleFileUpload}
                />
                <Button 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  data-testid="upload-document-btn"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Hochladen...' : 'Hochladen'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dokumente.length > 0 ? (
                <div className="space-y-3">
                  {dokumente.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors" data-testid={`dokument-${doc.id}`}>
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <FileText className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium">{doc.name}</p>
                          <div className="flex items-center gap-3 text-gray-500 text-sm mt-1">
                            <span className="capitalize">{DOK_KATEGORIEN.find(k => k.value === doc.kategorie)?.label || doc.kategorie}</span>
                            <span>{formatFileSize(doc.file_size)}</span>
                            <span>{formatDateTime(doc.erstellt_am)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={
                          doc.status === 'gesendet' ? 'bg-emerald-50 text-emerald-500' :
                          doc.status === 'hochgeladen' ? 'bg-blue-50 text-blue-500' :
                          'bg-gray-500/20 text-gray-400'
                        }>
                          {doc.status === 'gesendet' ? 'Gesendet' : 'Hochgeladen'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gray-500 hover:text-blue-500"
                          onClick={() => window.open(`${API_URL}/api/klienten/${klientId}/dokumente/${doc.id}/download`, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gray-500 hover:text-red-500"
                          onClick={() => handleDeleteDokument(doc.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-gray-400">Noch keine Dokumente vorhanden</p>
                  <p className="text-gray-300 text-sm mt-1">Laden Sie PDFs, Verträge oder Infomaterial hoch</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verlauf Tab */}
        <TabsContent value="verlauf" className="mt-6">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Aktivitätsverlauf</CardTitle>
            </CardHeader>
            <CardContent>
              {klient.aktivitaeten?.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-50"></div>
                  <div className="space-y-4">
                    {klient.aktivitaeten.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-4 pl-3 relative" data-testid={`activity-${idx}`}>
                        <div className="w-6 h-6 rounded-full bg-blue-50 border-2 border-blue-300 flex items-center justify-center z-10">
                          <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        </div>
                        <div className="flex-1 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between">
                            <p className="text-gray-900 font-medium">{item.aktion}</p>
                            <span className="text-gray-400 text-sm">
                              {formatDateTime(item.timestamp)}
                            </span>
                          </div>
                          {item.vorher_wert && item.nachher_wert && (
                            <p className="text-gray-500 text-sm mt-1">
                              <span className="text-red-500/70">{STATUS_LABELS[item.vorher_wert] || item.vorher_wert}</span>
                              {' → '}
                              <span className="text-emerald-500/70">{STATUS_LABELS[item.nachher_wert] || item.nachher_wert}</span>
                            </p>
                          )}
                          {item.benutzer_name && (
                            <p className="text-gray-400 text-xs mt-1">von {item.benutzer_name}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">
                  Noch keine Aktivitäten vorhanden
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="bg-white border-gray-200 text-gray-900">
          <DialogHeader>
            <DialogTitle>Neuen Eintrag hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-gray-500 text-sm">Typ</label>
              <Select value={newNote.typ} onValueChange={(v) => setNewNote({...newNote, typ: v})}>
                <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="notiz">Notiz</SelectItem>
                  <SelectItem value="anruf_aus">Anruf durchgeführt</SelectItem>
                  <SelectItem value="anruf_ein">Anruf erhalten</SelectItem>
                  <SelectItem value="email_aus">E-Mail gesendet</SelectItem>
                  <SelectItem value="email_ein">E-Mail erhalten</SelectItem>
                  <SelectItem value="whatsapp_aus">WhatsApp gesendet</SelectItem>
                  <SelectItem value="besichtigung">Besichtigung</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-gray-500 text-sm">Betreff (optional)</label>
              <Input
                value={newNote.betreff}
                onChange={(e) => setNewNote({...newNote, betreff: e.target.value})}
                className="bg-white border-gray-200 text-gray-900"
                placeholder="Betreff eingeben..."
              />
            </div>
            <div>
              <label className="text-gray-500 text-sm">Inhalt</label>
              <Textarea
                value={newNote.inhalt}
                onChange={(e) => setNewNote({...newNote, inhalt: e.target.value})}
                className="bg-white border-gray-200 text-gray-900 min-h-[120px]"
                placeholder="Details eingeben..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNoteDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleAddNote} className="bg-blue-600 hover:bg-blue-700" data-testid="save-note-btn">
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="bg-white border-gray-200 text-gray-900">
          <DialogHeader>
            <DialogTitle>Status ändern</DialogTitle>
          </DialogHeader>
          <div>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowStatusDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleStatusChange} className="bg-blue-600 hover:bg-blue-700" data-testid="save-status-btn">
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-500" />
              E-Mail senden
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-gray-500 text-sm">Empfänger</label>
              <Input
                value={emailData.empfaenger}
                onChange={(e) => setEmailData({...emailData, empfaenger: e.target.value})}
                className="bg-white border-gray-200 text-gray-900"
                placeholder="E-Mail-Adresse"
              />
            </div>
            <div>
              <label className="text-gray-500 text-sm">Betreff</label>
              <Input
                value={emailData.betreff}
                onChange={(e) => setEmailData({...emailData, betreff: e.target.value})}
                className="bg-white border-gray-200 text-gray-900"
              />
            </div>
            <div>
              <label className="text-gray-500 text-sm">Nachricht</label>
              <Textarea
                value={emailData.inhalt}
                onChange={(e) => setEmailData({...emailData, inhalt: e.target.value})}
                className="bg-white border-gray-200 text-gray-900 min-h-[160px]"
              />
            </div>
            
            {/* Document Attachments */}
            {dokumente.length > 0 && (
              <div>
                <label className="text-gray-500 text-sm mb-2 block">Dokumente anhängen</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {dokumente.map(doc => (
                    <div 
                      key={doc.id}
                      onClick={() => toggleDokumentForEmail(doc.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        emailData.dokument_ids.includes(doc.id) 
                          ? 'bg-blue-50 border-blue-300' 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        emailData.dokument_ids.includes(doc.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-200'
                      }`}>
                        {emailData.dokument_ids.includes(doc.id) && <Check className="w-3 h-3 text-gray-900" />}
                      </div>
                      <Paperclip className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900 text-sm flex-1">{doc.name}</span>
                      <span className="text-gray-400 text-xs">{formatFileSize(doc.file_size)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-500 text-sm">
                Der Kommunikationseintrag wird automatisch gespeichert. 
                E-Mail-Versand wird aktiviert, wenn SMTP konfiguriert ist.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEmailDialog(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleSendEmail} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={sendingEmail}
              data-testid="send-email-btn"
            >
              <Send className="w-4 h-4 mr-2" />
              {sendingEmail ? 'Wird gesendet...' : 'Senden'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
