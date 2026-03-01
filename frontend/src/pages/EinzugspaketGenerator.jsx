import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, ArrowRight, FileText, Download, Send, Save,
  Home, User, Bed, Calendar, Check, ChevronRight, Plus, Euro, Package
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_BACKEND_URL || '';

const STEP_LABELS = ['WG & Klient', 'Zimmer & Details', 'Vorschau & Generierung'];

export default function EinzugspaketGenerator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);

  // Data
  const [wgs, setWgs] = useState([]);
  const [klienten, setKlienten] = useState([]);
  const [sections, setSections] = useState([]);
  const [generatedPakete, setGeneratedPakete] = useState([]);

  // Selections
  const [selectedWgId, setSelectedWgId] = useState(searchParams.get('wg') || '');
  const [selectedKlientId, setSelectedKlientId] = useState(searchParams.get('klient') || '');
  const [selectedZimmerId, setSelectedZimmerId] = useState('');
  const [mietbeginn, setMietbeginn] = useState('');
  const [selectedSections, setSelectedSections] = useState([]);

  // Selected WG detail
  const [wgDetail, setWgDetail] = useState(null);
  const [stammdaten, setStammdaten] = useState(null);
  const [selectedKlient, setSelectedKlient] = useState(null);
  const [selectedZimmer, setSelectedZimmer] = useState(null);

  // Dialogs
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailData, setEmailData] = useState({ empfaenger_email: '', betreff: '', nachricht: '' });
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWGs();
    fetchKlienten();
    fetchSections();
    fetchGeneratedPakete();
  }, []);

  useEffect(() => {
    if (selectedWgId) {
      fetchWGDetail(selectedWgId);
      fetchStammdaten(selectedWgId);
    }
  }, [selectedWgId]);

  useEffect(() => {
    if (selectedKlientId && klienten.length) {
      const k = klienten.find(k => k.id === selectedKlientId);
      setSelectedKlient(k || null);
      if (k?.kontakt_email) {
        setEmailData(prev => ({ ...prev, empfaenger_email: k.kontakt_email }));
      }
    }
  }, [selectedKlientId, klienten]);

  useEffect(() => {
    if (selectedZimmerId && wgDetail?.zimmer) {
      setSelectedZimmer(wgDetail.zimmer.find(z => z.id === selectedZimmerId) || null);
    }
  }, [selectedZimmerId, wgDetail]);

  const fetchWGs = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/pflege-wgs`);
      setWgs(data);
    } catch (e) { console.error(e); }
  };

  const fetchKlienten = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/klienten`);
      setKlienten(data);
    } catch (e) { console.error(e); }
  };

  const fetchSections = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/einzugspaket/sections`);
      setSections(data);
      setSelectedSections(data.map(s => s.key));
    } catch (e) { console.error(e); }
  };

  const fetchWGDetail = async (wgId) => {
    try {
      const { data } = await axios.get(`${API_URL}/api/pflege-wgs/${wgId}`);
      setWgDetail(data);
    } catch (e) { console.error(e); }
  };

  const fetchStammdaten = async (wgId) => {
    try {
      const { data } = await axios.get(`${API_URL}/api/pflege-wgs/${wgId}/stammdaten`);
      setStammdaten(data);
    } catch (e) { console.error(e); }
  };

  const fetchGeneratedPakete = async () => {
    try {
      const { data: allKlienten } = await axios.get(`${API_URL}/api/klienten`);
      const pakete = [];
      for (const k of allKlienten.slice(0, 20)) {
        try {
          const { data: docs } = await axios.get(`${API_URL}/api/klienten/${k.id}/dokumente`);
          const epDocs = docs.filter(d => d.kategorie === 'einzugspaket');
          epDocs.forEach(d => pakete.push({ ...d, klient_name: `${k.vorname} ${k.nachname}`, wg_name: k.wg_name }));
        } catch (e) { /* ignore */ }
      }
      setGeneratedPakete(pakete.sort((a, b) => new Date(b.erstellt_am) - new Date(a.erstellt_am)));
    } catch (e) { /* ignore */ }
  };

  const handleDownload = async () => {
    if (!selectedKlientId || !selectedWgId || !selectedZimmerId) {
      toast.error('Bitte alle Felder ausfüllen');
      return;
    }
    setGenerating(true);
    try {
      const response = await axios.post(`${API_URL}/api/einzugspaket/generate`, {
        klient_id: selectedKlientId,
        wg_id: selectedWgId,
        zimmer_id: selectedZimmerId,
        mietbeginn: mietbeginn || null,
        dokumente: selectedSections.length === sections.length ? null : selectedSections,
      }, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Einzugspaket_${selectedKlient?.nachname}_${selectedKlient?.vorname}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF heruntergeladen');
    } catch (e) {
      toast.error('Fehler beim Generieren');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/einzugspaket/save`, {
        klient_id: selectedKlientId,
        wg_id: selectedWgId,
        zimmer_id: selectedZimmerId,
        mietbeginn: mietbeginn || null,
        dokumente: selectedSections.length === sections.length ? null : selectedSections,
      });
      toast.success('Einzugspaket in Dokumenten gespeichert');
      fetchGeneratedPakete();
    } catch (e) {
      toast.error('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailData.empfaenger_email) {
      toast.error('Bitte E-Mail-Adresse eingeben');
      return;
    }
    setSending(true);
    try {
      const { data } = await axios.post(`${API_URL}/api/einzugspaket/send-email`, {
        klient_id: selectedKlientId,
        wg_id: selectedWgId,
        zimmer_id: selectedZimmerId,
        mietbeginn: mietbeginn || null,
        ...emailData,
      });
      toast.success(data.message);
      setShowEmailDialog(false);
    } catch (e) {
      toast.error('Fehler beim Senden');
    } finally {
      setSending(false);
    }
  };

  const toggleSection = (key) => {
    setSelectedSections(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const canProceed = () => {
    if (step === 0) return selectedWgId && selectedKlientId;
    if (step === 1) return selectedZimmerId;
    return true;
  };

  const selectedWg = wgs.find(w => w.id === selectedWgId);
  const freieZimmer = wgDetail?.zimmer?.filter(z => z.status === 'frei') || [];

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Calculate costs for preview
  const mieteZimmer = selectedZimmer?.miete || ((selectedZimmer?.flaeche_qm || 20) * 13);
  const gesamtMonatlich = mieteZimmer + (stammdaten?.lebensmittelpauschale || 290) + (stammdaten?.wg_beitrag || 30) + (stammdaten?.wg_zuschlag || 224);
  const kaution = mieteZimmer * 2;

  return (
    <div className="p-4 md:p-6 space-y-6" data-testid="einzugspaket-page">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/pflege-wgs')} className="text-slate-500 hover:text-slate-900 p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-slate-900">Einzugspaket-Generator</h1>
          <p className="text-slate-500 text-sm">Personalisierte Einzugspakete erstellen und versenden</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {STEP_LABELS.map((label, i) => (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />}
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                i === step ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
                i < step ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-pointer' :
                'bg-slate-50 text-slate-400 border border-slate-200'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                i === step ? 'bg-cyan-600 text-white' :
                i < step ? 'bg-emerald-500 text-white' :
                'bg-slate-200 text-slate-500'
              }`}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              {label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: WG & Klient */}
      {step === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <Home className="w-5 h-5" />
                Wohngemeinschaft
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedWgId} onValueChange={setSelectedWgId}>
                <SelectTrigger className="bg-white border-slate-200 text-slate-900">
                  <SelectValue placeholder="WG auswählen..." />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  {wgs.map(w => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.kurzname} ({w.freie_zimmer} frei / {w.kapazitaet})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedWg && (
                <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg text-sm">
                  <p className="text-slate-900 font-medium">{selectedWg.property_name}</p>
                  <p className="text-slate-500">{selectedWg.property_address}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className="bg-green-500 text-white text-xs">{selectedWg.freie_zimmer} frei</Badge>
                    <Badge className="bg-cyan-600 text-white text-xs">{selectedWg.belegte_zimmer} belegt</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5" />
                Klient
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedKlientId} onValueChange={setSelectedKlientId}>
                <SelectTrigger className="bg-white border-slate-200 text-slate-900">
                  <SelectValue placeholder="Klient auswählen..." />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  {klienten.map(k => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.nachname}, {k.vorname} ({k.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedKlient && (
                <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg text-sm">
                  <p className="text-slate-900 font-medium">{selectedKlient.vorname} {selectedKlient.nachname}</p>
                  {selectedKlient.pflegegrad && selectedKlient.pflegegrad !== 'keiner' && (
                    <p className="text-slate-500">Pflegegrad {selectedKlient.pflegegrad}</p>
                  )}
                  {selectedKlient.kontakt_name && (
                    <p className="text-slate-500">Kontakt: {selectedKlient.kontakt_name}</p>
                  )}
                </div>
              )}
              <Button variant="outline" size="sm" onClick={() => navigate('/pflege-wgs/klienten/neu')} className="border-slate-200 text-slate-600">
                <Plus className="w-4 h-4 mr-1" />
                Neuen Klienten anlegen
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Zimmer & Details */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <Bed className="w-5 h-5" />
                Zimmer auswählen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {freieZimmer.length > 0 ? (
                freieZimmer.map(z => (
                  <button
                    key={z.id}
                    onClick={() => setSelectedZimmerId(z.id)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedZimmerId === z.id
                        ? 'border-cyan-500 bg-cyan-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-slate-900 font-medium">Zimmer {z.nummer}</span>
                        {z.flaeche_qm && <span className="text-slate-500 text-sm ml-2">{z.flaeche_qm} m²</span>}
                      </div>
                      {selectedZimmerId === z.id && <Check className="w-5 h-5 text-cyan-600" />}
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-slate-500 text-sm py-4">Keine freien Zimmer in dieser WG</p>
              )}
              {/* Also show occupied rooms as selectable (for existing residents) */}
              {wgDetail?.zimmer?.filter(z => z.status === 'belegt').length > 0 && (
                <>
                  <p className="text-slate-400 text-sm pt-2 border-t border-slate-200">Belegte Zimmer (bestehende Bewohner)</p>
                  {wgDetail.zimmer.filter(z => z.status === 'belegt').map(z => (
                    <button
                      key={z.id}
                      onClick={() => setSelectedZimmerId(z.id)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedZimmerId === z.id
                          ? 'border-cyan-500 bg-cyan-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-slate-900 font-medium">Zimmer {z.nummer}</span>
                          {z.flaeche_qm && <span className="text-slate-500 text-sm ml-2">{z.flaeche_qm} m²</span>}
                          {z.bewohner_name && <span className="text-slate-400 text-sm ml-2">({z.bewohner_name})</span>}
                        </div>
                        {selectedZimmerId === z.id && <Check className="w-5 h-5 text-cyan-600" />}
                      </div>
                    </button>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Mietdetails
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-slate-500 text-sm">Mietbeginn</label>
                <Input
                  type="date"
                  value={mietbeginn}
                  onChange={e => setMietbeginn(e.target.value)}
                  className="bg-white border-slate-200 text-slate-900"
                />
              </div>
              {selectedZimmer && stammdaten && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
                  <p className="text-slate-900 font-medium">Kostenvorschau</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Miete Zimmer {selectedZimmer.nummer}</span>
                    <span className="text-slate-900">{mieteZimmer.toFixed(2)} EUR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Lebensmittelpauschale</span>
                    <span className="text-slate-900">{(stammdaten.lebensmittelpauschale || 290).toFixed(2)} EUR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">WG-Beitrag</span>
                    <span className="text-slate-900">{(stammdaten.wg_beitrag || 30).toFixed(2)} EUR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">WG-Zuschlag</span>
                    <span className="text-slate-900">{(stammdaten.wg_zuschlag || 224).toFixed(2)} EUR</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t border-emerald-300 pt-2 mt-2">
                    <span className="text-emerald-700">Gesamt / Monat</span>
                    <span className="text-emerald-700">{gesamtMonatlich.toFixed(2)} EUR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Kaution (2x Miete)</span>
                    <span className="text-slate-900">{kaution.toFixed(2)} EUR</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Vorschau & Generierung */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Summary */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Zusammenfassung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-slate-500 text-xs">Klient</p>
                  <p className="text-slate-900 font-medium">{selectedKlient?.vorname} {selectedKlient?.nachname}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-slate-500 text-xs">WG</p>
                  <p className="text-slate-900 font-medium">{selectedWg?.kurzname}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-slate-500 text-xs">Zimmer</p>
                  <p className="text-slate-900 font-medium">{selectedZimmer?.nummer}{selectedZimmer?.flaeche_qm ? ` (${selectedZimmer.flaeche_qm} m²)` : ''}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-slate-500 text-xs">Mietbeginn</p>
                  <p className="text-slate-900 font-medium">{mietbeginn ? formatDate(mietbeginn) : 'Heute'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document sections */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900">Enthaltene Dokumente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {sections.map(s => (
                  <button
                    key={s.key}
                    onClick={() => toggleSection(s.key)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                      selectedSections.includes(s.key)
                        ? 'bg-cyan-50 border-cyan-200'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedSections.includes(s.key) ? 'bg-cyan-600 border-cyan-500' : 'border-slate-300'
                    }`}>
                      {selectedSections.includes(s.key) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-slate-900 text-sm">{s.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleDownload} disabled={generating} className="bg-cyan-600 hover:bg-cyan-700">
              <Download className="w-4 h-4 mr-2" />
              {generating ? 'Wird generiert...' : 'PDF herunterladen'}
            </Button>
            <Button onClick={() => {
              setEmailData({
                empfaenger_email: selectedKlient?.kontakt_email || '',
                betreff: `Einzugspaket - ${selectedWg?.kurzname} - ${selectedKlient?.vorname} ${selectedKlient?.nachname}`,
                nachricht: `Sehr geehrte/r ${selectedKlient?.kontakt_name || 'Interessent/in'},\n\nanbei erhalten Sie das Einzugspaket für den Einzug in die ${selectedWg?.property_name}.\n\nBei Fragen stehen wir Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen\n${stammdaten?.pflegedienst_name || 'DomusVita Gesundheit'}`,
              });
              setShowEmailDialog(true);
            }} variant="outline" className="border-blue-300 text-cyan-500 hover:bg-cyan-50">
              <Send className="w-4 h-4 mr-2" />
              Per E-Mail senden
            </Button>
            <Button onClick={handleSave} disabled={saving} variant="outline" className="border-slate-200 text-slate-600">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Wird gespeichert...' : 'In Dokumente speichern'}
            </Button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-slate-200">
        <Button
          variant="ghost"
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className="text-slate-500"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück
        </Button>
        {step < 2 && (
          <Button
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed()}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            Weiter
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Generated Pakete Table */}
      {generatedPakete.length > 0 && (
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Generierte Einzugspakete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {generatedPakete.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-cyan-500" />
                    <div>
                      <p className="text-slate-900 font-medium text-sm">{p.name}</p>
                      <p className="text-slate-500 text-xs">
                        {p.klient_name}{p.wg_name ? ` - ${p.wg_name}` : ''} - {formatDate(p.erstellt_am)}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(`${API_URL}/api/klienten/${p.klient_id}/dokumente/${p.id}/download`, '_blank')}
                    className="text-cyan-500"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-cyan-500" />
              Einzugspaket per E-Mail senden
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-slate-500 text-sm">Empfänger</label>
              <Input
                value={emailData.empfaenger_email}
                onChange={e => setEmailData(prev => ({ ...prev, empfaenger_email: e.target.value }))}
                className="bg-white border-slate-200 text-slate-900"
                placeholder="E-Mail-Adresse"
              />
            </div>
            <div>
              <label className="text-slate-500 text-sm">Betreff</label>
              <Input
                value={emailData.betreff}
                onChange={e => setEmailData(prev => ({ ...prev, betreff: e.target.value }))}
                className="bg-white border-slate-200 text-slate-900"
              />
            </div>
            <div>
              <label className="text-slate-500 text-sm">Nachricht</label>
              <Textarea
                value={emailData.nachricht}
                onChange={e => setEmailData(prev => ({ ...prev, nachricht: e.target.value }))}
                className="bg-white border-slate-200 text-slate-900 min-h-[120px]"
              />
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-600 text-sm">
                Das Einzugspaket-PDF wird automatisch als Anhang beigefügt.
                {!import.meta.env.VITE_SMTP_CONFIGURED && ' E-Mail wird als Kommunikationseintrag gespeichert (SMTP nicht konfiguriert).'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEmailDialog(false)}>Abbrechen</Button>
            <Button onClick={handleSendEmail} disabled={sending} className="bg-cyan-600 hover:bg-cyan-700">
              <Send className="w-4 h-4 mr-2" />
              {sending ? 'Wird gesendet...' : 'Senden'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
