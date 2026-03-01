import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, User, Phone, Mail, Calendar, Building2, AlertCircle, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_BACKEND_URL || '';

export default function NeuerKlient() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assignZimmer = searchParams.get('assign_zimmer');
  const preselectedWg = searchParams.get('wg');
  
  const [loading, setLoading] = useState(false);
  const [wgs, setWgs] = useState([]);
  const [formData, setFormData] = useState({
    vorname: '',
    nachname: '',
    geburtsdatum: '',
    geschlecht: '',
    pflegegrad: 'keiner',
    besonderheiten: '',
    diagnosen: '',
    kontakt_name: '',
    kontakt_beziehung: '',
    kontakt_telefon: '',
    kontakt_email: '',
    anfrage_quelle: 'email',
    vermittler: '',
    dringlichkeit: 'flexibel',
    bevorzugte_wgs: preselectedWg ? [preselectedWg] : []
  });

  useEffect(() => {
    fetchWGs();
  }, []);

  const fetchWGs = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/pflege-wgs`);
      setWgs(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleWGToggle = (wgId) => {
    setFormData(prev => ({
      ...prev,
      bevorzugte_wgs: prev.bevorzugte_wgs.includes(wgId)
        ? prev.bevorzugte_wgs.filter(id => id !== wgId)
        : [...prev.bevorzugte_wgs, wgId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.vorname || !formData.nachname) {
      toast.error('Bitte Vor- und Nachname eingeben');
      return;
    }

    setLoading(true);
    try {
      // Clean empty strings to null for optional datetime/enum fields
      const cleaned = { ...formData };
      if (!cleaned.geburtsdatum) cleaned.geburtsdatum = null;
      if (!cleaned.geschlecht) cleaned.geschlecht = null;
      const { data: newKlient } = await axios.post(`${API_URL}/api/klienten`, cleaned);
      toast.success('Klient erfolgreich angelegt');

      // If we have a zimmer to assign, do it now
      if (assignZimmer) {
        await axios.post(`${API_URL}/api/klienten/${newKlient.id}/zimmer/${assignZimmer}`);
        toast.success('Zimmer zugewiesen');
      }
      
      navigate(`/pflege-wgs/klienten/${newKlient.id}`);
    } catch (error) {
      toast.error('Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto" data-testid="neuer-klient-page">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Neue Anfrage erfassen</h1>
          <p className="text-slate-500">Interessent für Pflege-Wohngemeinschaft</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bewohner-Daten */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5" />
              Daten der/des Bewohnerin/Bewohners
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-700">Vorname *</Label>
              <Input
                value={formData.vorname}
                onChange={(e) => handleChange('vorname', e.target.value)}
                className="bg-white border-slate-200 text-slate-900"
                placeholder="Vorname"
                required
              />
            </div>
            <div>
              <Label className="text-slate-700">Nachname *</Label>
              <Input
                value={formData.nachname}
                onChange={(e) => handleChange('nachname', e.target.value)}
                className="bg-white border-slate-200 text-slate-900"
                placeholder="Nachname"
                required
              />
            </div>
            <div>
              <Label className="text-slate-700">Geburtsdatum</Label>
              <Input
                type="date"
                value={formData.geburtsdatum}
                onChange={(e) => handleChange('geburtsdatum', e.target.value)}
                className="bg-white border-slate-200 text-slate-900"
              />
            </div>
            <div>
              <Label className="text-slate-700">Geschlecht</Label>
              <Select value={formData.geschlecht} onValueChange={(v) => handleChange('geschlecht', v)}>
                <SelectTrigger className="bg-white border-slate-200 text-slate-900">
                  <SelectValue placeholder="Auswählen..." />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="weiblich">Weiblich</SelectItem>
                  <SelectItem value="männlich">Männlich</SelectItem>
                  <SelectItem value="divers">Divers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-700">Pflegegrad</Label>
              <Select value={formData.pflegegrad} onValueChange={(v) => handleChange('pflegegrad', v)}>
                <SelectTrigger className="bg-white border-slate-200 text-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="keiner">Kein Pflegegrad</SelectItem>
                  <SelectItem value="beantragt">Beantragt</SelectItem>
                  <SelectItem value="1">Pflegegrad 1</SelectItem>
                  <SelectItem value="2">Pflegegrad 2</SelectItem>
                  <SelectItem value="3">Pflegegrad 3</SelectItem>
                  <SelectItem value="4">Pflegegrad 4</SelectItem>
                  <SelectItem value="5">Pflegegrad 5</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-slate-700">Besonderheiten / Pflegebedarf</Label>
              <Textarea
                value={formData.besonderheiten}
                onChange={(e) => handleChange('besonderheiten', e.target.value)}
                className="bg-white border-slate-200 text-slate-900"
                placeholder="z.B. Demenz, Rollator, Sturzgefahr, Diabetes..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Kontaktperson */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Kontaktperson (Angehörige)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-700">Name</Label>
              <Input
                value={formData.kontakt_name}
                onChange={(e) => handleChange('kontakt_name', e.target.value)}
                className="bg-white border-slate-200 text-slate-900"
                placeholder="Name der Kontaktperson"
              />
            </div>
            <div>
              <Label className="text-slate-700">Beziehung</Label>
              <Select value={formData.kontakt_beziehung} onValueChange={(v) => handleChange('kontakt_beziehung', v)}>
                <SelectTrigger className="bg-white border-slate-200 text-slate-900">
                  <SelectValue placeholder="Auswählen..." />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="Sohn">Sohn</SelectItem>
                  <SelectItem value="Tochter">Tochter</SelectItem>
                  <SelectItem value="Ehepartner">Ehepartner/in</SelectItem>
                  <SelectItem value="Enkel">Enkel/in</SelectItem>
                  <SelectItem value="Geschwister">Geschwister</SelectItem>
                  <SelectItem value="Betreuer">Rechtliche/r Betreuer/in</SelectItem>
                  <SelectItem value="Sonstige">Sonstige</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-700">Telefon</Label>
              <Input
                type="tel"
                value={formData.kontakt_telefon}
                onChange={(e) => handleChange('kontakt_telefon', e.target.value)}
                className="bg-white border-slate-200 text-slate-900"
                placeholder="+49 30 123456"
              />
            </div>
            <div>
              <Label className="text-slate-700">E-Mail</Label>
              <Input
                type="email"
                value={formData.kontakt_email}
                onChange={(e) => handleChange('kontakt_email', e.target.value)}
                className="bg-white border-slate-200 text-slate-900"
                placeholder="email@beispiel.de"
              />
            </div>
          </CardContent>
        </Card>

        {/* Anfrage-Details */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Anfrage-Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-700">Anfrage-Quelle</Label>
              <Select value={formData.anfrage_quelle} onValueChange={(v) => handleChange('anfrage_quelle', v)}>
                <SelectTrigger className="bg-white border-slate-200 text-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="email">E-Mail</SelectItem>
                  <SelectItem value="telefon">Telefon</SelectItem>
                  <SelectItem value="vermittlung">Vermittlung (Klinik etc.)</SelectItem>
                  <SelectItem value="empfehlung">Empfehlung</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="sonstige">Sonstige</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-700">Dringlichkeit</Label>
              <Select value={formData.dringlichkeit} onValueChange={(v) => handleChange('dringlichkeit', v)}>
                <SelectTrigger className="bg-white border-slate-200 text-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="sofort">🔴 Sofort</SelectItem>
                  <SelectItem value="4_wochen">🟠 Innerhalb 4 Wochen</SelectItem>
                  <SelectItem value="3_monate">🟡 Innerhalb 3 Monate</SelectItem>
                  <SelectItem value="flexibel">🟢 Flexibel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.anfrage_quelle === 'vermittlung' && (
              <div className="md:col-span-2">
                <Label className="text-slate-700">Vermittler / Klinik</Label>
                <Input
                  value={formData.vermittler}
                  onChange={(e) => handleChange('vermittler', e.target.value)}
                  className="bg-white border-slate-200 text-slate-900"
                  placeholder="z.B. Vivantes Klinikum Neukölln"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bevorzugte WGs */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Bevorzugte Wohngemeinschaften
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {wgs.map(wg => (
                <label
                  key={wg.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    formData.bevorzugte_wgs.includes(wg.id)
                      ? 'bg-cyan-50 border-cyan-500'
                      : 'bg-white border-slate-200 hover:border-white/30'
                  }`}
                >
                  <Checkbox
                    checked={formData.bevorzugte_wgs.includes(wg.id)}
                    onCheckedChange={() => handleWGToggle(wg.id)}
                  />
                  <div>
                    <p className="text-slate-900 font-medium">{wg.kurzname}</p>
                    <p className="text-slate-500 text-sm">
                      {wg.freie_zimmer} von {wg.gesamt_zimmer} frei
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="text-slate-500"
          >
            Abbrechen
          </Button>
          <Button 
            type="submit" 
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <span className="animate-spin mr-2">⏳</span>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Anfrage speichern
          </Button>
        </div>
      </form>
    </div>
  );
}
