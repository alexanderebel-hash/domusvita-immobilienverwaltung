import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Phone, Mail, MessageSquare, Calendar, FileText, 
  Clock, Building2, Edit, Trash2, Plus, Send, History, Home
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

export default function KlientDetail() {
  const { klientId } = useParams();
  const navigate = useNavigate();
  const [klient, setKlient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('uebersicht');
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [newNote, setNewNote] = useState({ typ: 'notiz', betreff: '', inhalt: '' });
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchKlient();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!klient) return null;

  return (
    <div className="p-6 space-y-6" data-testid="klient-detail-page">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/pflege-wgs/pipeline')}
            className="text-white/60 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">
                {klient.vorname} {klient.nachname}
              </h1>
              <Badge 
                className={`${STATUS_COLORS[klient.status]} text-white cursor-pointer`}
                onClick={() => setShowStatusDialog(true)}
              >
                {STATUS_LABELS[klient.status]}
              </Badge>
              {klient.pflegegrad && klient.pflegegrad !== 'keiner' && (
                <Badge className={`${PFLEGEGRAD_COLORS[klient.pflegegrad]} text-white`}>
                  Pflegegrad {klient.pflegegrad}
                </Badge>
              )}
            </div>
            {klient.wg_name && (
              <p className="text-white/60 mt-1 flex items-center gap-2">
                <Home className="w-4 h-4" />
                {klient.wg_name} - Zimmer {klient.zimmer_nummer}
              </p>
            )}
            {klient.alter && (
              <p className="text-white/60">{klient.alter} Jahre</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          {klient.kontakt_telefon && (
            <Button 
              variant="outline" 
              className="border-green-500/50 text-green-400 hover:bg-green-500/20"
              onClick={() => window.location.href = `tel:${klient.kontakt_telefon}`}
            >
              <Phone className="w-4 h-4 mr-2" />
              Anrufen
            </Button>
          )}
          {klient.kontakt_email && (
            <Button 
              variant="outline"
              className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
              onClick={() => window.location.href = `mailto:${klient.kontakt_email}`}
            >
              <Mail className="w-4 h-4 mr-2" />
              E-Mail
            </Button>
          )}
          <Button 
            onClick={() => setShowNoteDialog(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Eintrag
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white/5 border-white/10">
          <TabsTrigger value="uebersicht" className="data-[state=active]:bg-white/10">
            <User className="w-4 h-4 mr-2" />
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="kommunikation" className="data-[state=active]:bg-white/10">
            <MessageSquare className="w-4 h-4 mr-2" />
            Kommunikation
          </TabsTrigger>
          <TabsTrigger value="dokumente" className="data-[state=active]:bg-white/10">
            <FileText className="w-4 h-4 mr-2" />
            Dokumente
          </TabsTrigger>
          <TabsTrigger value="verlauf" className="data-[state=active]:bg-white/10">
            <History className="w-4 h-4 mr-2" />
            Verlauf
          </TabsTrigger>
        </TabsList>

        {/* Übersicht Tab */}
        <TabsContent value="uebersicht" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Persönliche Daten */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Persönliche Daten
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/60 text-sm">Geburtsdatum</p>
                    <p className="text-white">{formatDate(klient.geburtsdatum) || '-'}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Geschlecht</p>
                    <p className="text-white">{klient.geschlecht || '-'}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Pflegegrad</p>
                    <p className="text-white">{klient.pflegegrad !== 'keiner' ? klient.pflegegrad : 'Keiner'}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Einzugsdatum</p>
                    <p className="text-white">{formatDate(klient.einzugsdatum) || '-'}</p>
                  </div>
                </div>
                
                {klient.besonderheiten && (
                  <div>
                    <p className="text-white/60 text-sm">Besonderheiten</p>
                    <p className="text-white bg-white/5 p-3 rounded-lg mt-1">{klient.besonderheiten}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Kontaktperson */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Kontaktperson
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium text-lg">{klient.kontakt_name || '-'}</p>
                    <p className="text-white/60">{klient.kontakt_beziehung || '-'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {klient.kontakt_telefon && (
                    <a 
                      href={`tel:${klient.kontakt_telefon}`}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <Phone className="w-5 h-5 text-green-400" />
                      <span className="text-white">{klient.kontakt_telefon}</span>
                    </a>
                  )}
                  {klient.kontakt_email && (
                    <a 
                      href={`mailto:${klient.kontakt_email}`}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <Mail className="w-5 h-5 text-blue-400" />
                      <span className="text-white">{klient.kontakt_email}</span>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Anfrage-Details */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Anfrage-Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/60 text-sm">Anfrage am</p>
                    <p className="text-white">{formatDate(klient.anfrage_am)}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Quelle</p>
                    <p className="text-white capitalize">{klient.anfrage_quelle || '-'}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Dringlichkeit</p>
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
                      <p className="text-white/60 text-sm">Vermittler</p>
                      <p className="text-white">{klient.vermittler}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Wohnsituation */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Wohnsituation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {klient.status === 'bewohner' && klient.wg_name ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <p className="text-emerald-400 font-medium">{klient.wg_name}</p>
                    <p className="text-white">Zimmer {klient.zimmer_nummer}</p>
                    <p className="text-white/60 text-sm mt-2">
                      Seit {formatDate(klient.einzugsdatum)}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-white/60">Noch nicht eingezogen</p>
                    {klient.bevorzugte_wgs?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-white/60 text-sm mb-2">Bevorzugte WGs:</p>
                        <div className="flex flex-wrap gap-2">
                          {klient.bevorzugte_wgs.map(wgId => (
                            <Badge key={wgId} className="bg-blue-500/20 text-blue-400">
                              {wgId.replace('wg-', '').replace('-', ' ')}
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
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Kommunikationsverlauf</CardTitle>
              <Button onClick={() => setShowNoteDialog(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Neuer Eintrag
              </Button>
            </CardHeader>
            <CardContent>
              {klient.kommunikation?.length > 0 ? (
                <div className="space-y-4">
                  {klient.kommunikation.map((item, idx) => {
                    const Icon = KOMMUNIKATION_ICONS[item.typ] || FileText;
                    return (
                      <div key={idx} className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            item.typ.includes('ein') ? 'bg-green-500/20' : 'bg-blue-500/20'
                          }`}>
                            <Icon className={`w-4 h-4 ${
                              item.typ.includes('ein') ? 'text-green-400' : 'text-blue-400'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-white font-medium">
                                {KOMMUNIKATION_LABELS[item.typ] || item.typ}
                              </p>
                              <span className="text-white/40 text-sm">
                                {formatDateTime(item.erstellt_am)}
                              </span>
                            </div>
                            {item.betreff && (
                              <p className="text-white/80 text-sm mt-1">{item.betreff}</p>
                            )}
                            <p className="text-white/60 mt-2 whitespace-pre-wrap">{item.inhalt}</p>
                            {item.erstellt_von_name && (
                              <p className="text-white/40 text-xs mt-2">
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
                <p className="text-white/40 text-center py-8">
                  Noch keine Kommunikation vorhanden
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dokumente Tab */}
        <TabsContent value="dokumente" className="mt-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Dokumente</CardTitle>
              <Button size="sm" disabled>
                <Plus className="w-4 h-4 mr-2" />
                Hochladen
              </Button>
            </CardHeader>
            <CardContent>
              {klient.dokumente?.length > 0 ? (
                <div className="space-y-3">
                  {klient.dokumente.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-white">{doc.name}</p>
                          <p className="text-white/60 text-sm">{doc.typ}</p>
                        </div>
                      </div>
                      <Badge className={
                        doc.status === 'unterschrieben' ? 'bg-green-500' :
                        doc.status === 'gesendet' ? 'bg-blue-500' :
                        'bg-gray-500'
                      }>
                        {doc.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-center py-8">
                  Noch keine Dokumente vorhanden
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verlauf Tab */}
        <TabsContent value="verlauf" className="mt-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Aktivitätsverlauf</CardTitle>
            </CardHeader>
            <CardContent>
              {klient.aktivitaeten?.length > 0 ? (
                <div className="space-y-3">
                  {klient.aktivitaeten.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg border-l-2 border-blue-500">
                      <Clock className="w-4 h-4 text-white/40" />
                      <div className="flex-1">
                        <p className="text-white">{item.aktion}</p>
                        {item.vorher_wert && item.nachher_wert && (
                          <p className="text-white/60 text-sm">
                            {item.vorher_wert} → {item.nachher_wert}
                          </p>
                        )}
                      </div>
                      <span className="text-white/40 text-sm">
                        {formatDateTime(item.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-center py-8">
                  Noch keine Aktivitäten vorhanden
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="bg-gray-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Neuen Eintrag hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-white/60 text-sm">Typ</label>
              <Select value={newNote.typ} onValueChange={(v) => setNewNote({...newNote, typ: v})}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10">
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
              <label className="text-white/60 text-sm">Betreff (optional)</label>
              <Input
                value={newNote.betreff}
                onChange={(e) => setNewNote({...newNote, betreff: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Betreff eingeben..."
              />
            </div>
            <div>
              <label className="text-white/60 text-sm">Inhalt</label>
              <Textarea
                value={newNote.inhalt}
                onChange={(e) => setNewNote({...newNote, inhalt: e.target.value})}
                className="bg-white/5 border-white/10 text-white min-h-[120px]"
                placeholder="Details eingeben..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNoteDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleAddNote} className="bg-blue-600 hover:bg-blue-700">
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="bg-gray-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Status ändern</DialogTitle>
          </DialogHeader>
          <div>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/10">
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
            <Button onClick={handleStatusChange} className="bg-blue-600 hover:bg-blue-700">
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
