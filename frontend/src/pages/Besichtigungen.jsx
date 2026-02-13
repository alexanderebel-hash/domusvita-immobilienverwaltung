import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, User, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

export default function Besichtigungen() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [besichtigungen, setBesichtigungen] = useState([]);
  const [klienten, setKlienten] = useState([]);
  const [wgs, setWgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [newBesichtigung, setNewBesichtigung] = useState({
    klient_id: '',
    pflege_wg_id: '',
    termin: '',
    notizen: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [besRes, klientenRes, wgsRes] = await Promise.all([
        fetch(`${API_URL}/api/besichtigungen`),
        fetch(`${API_URL}/api/klienten`),
        fetch(`${API_URL}/api/pflege-wgs`)
      ]);
      
      // Besichtigungen might not exist yet
      let besData = [];
      if (besRes.ok) {
        besData = await besRes.json();
      }
      
      const klientenData = await klientenRes.json();
      const wgsData = await wgsRes.json();
      
      setBesichtigungen(besData);
      setKlienten(klientenData.filter(k => k.status !== 'bewohner' && k.status !== 'ausgezogen'));
      setWgs(wgsData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Add empty days for padding
    const startPadding = (firstDay.getDay() + 6) % 7; // Monday = 0
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }
    
    // Add days of month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getBesichtigungenForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return besichtigungen.filter(b => {
      const bDate = new Date(b.termin).toISOString().split('T')[0];
      return bDate === dateStr;
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (date) => {
    if (!date) return;
    setSelectedDate(date);
    setNewBesichtigung(prev => ({
      ...prev,
      termin: `${date.toISOString().split('T')[0]}T14:00`
    }));
  };

  const handleCreateBesichtigung = async () => {
    if (!newBesichtigung.klient_id || !newBesichtigung.pflege_wg_id || !newBesichtigung.termin) {
      toast.error('Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/besichtigungen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBesichtigung)
      });
      
      if (!res.ok) throw new Error('Fehler');
      
      toast.success('Besichtigung geplant');
      setShowNewDialog(false);
      setNewBesichtigung({ klient_id: '', pflege_wg_id: '', termin: '', notizen: '' });
      fetchData();
    } catch (error) {
      toast.error('Fehler beim Speichern');
    }
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const days = getDaysInMonth(currentDate);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" className="overflow-x-hidden" data-testid="besichtigungen-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/pflege-wgs')}
            className="text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Besichtigungen</h1>
            <p className="text-gray-500">Termine für Interessenten</p>
          </div>
        </div>
        <Button 
          onClick={() => setShowNewDialog(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Neue Besichtigung
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 bg-white border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleNextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map(day => (
                <div key={day} className="text-center text-gray-500 text-sm py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((date, idx) => {
                const dayBesichtigungen = getBesichtigungenForDate(date);
                const isSelected = selectedDate && date && date.toDateString() === selectedDate.toDateString();
                
                return (
                  <button
                    key={idx}
                    onClick={() => handleDayClick(date)}
                    disabled={!date}
                    className={`
                      aspect-square p-1 rounded-lg text-sm transition-all relative
                      ${!date ? 'invisible' : 'hover:bg-gray-50'}
                      ${isToday(date) ? 'ring-2 ring-blue-500' : ''}
                      ${isSelected ? 'bg-blue-500/30' : ''}
                      ${dayBesichtigungen.length > 0 ? 'bg-emerald-50' : ''}
                    `}
                  >
                    {date && (
                      <>
                        <span className={`${isToday(date) ? 'text-blue-500 font-bold' : 'text-white'}`}>
                          {date.getDate()}
                        </span>
                        {dayBesichtigungen.length > 0 && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {dayBesichtigungen.slice(0, 3).map((_, i) => (
                              <span key={i} className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Details */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {selectedDate ? (
                `${selectedDate.getDate()}. ${MONTHS[selectedDate.getMonth()]}`
              ) : (
                'Tag auswählen'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              <>
                {getBesichtigungenForDate(selectedDate).length > 0 ? (
                  <div className="space-y-3">
                    {getBesichtigungenForDate(selectedDate).map(bes => {
                      const klient = klienten.find(k => k.id === bes.klient_id);
                      const wg = wgs.find(w => w.id === bes.pflege_wg_id);
                      return (
                        <div key={bes.id} className="p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-900 font-medium">
                              {new Date(bes.termin).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                            </span>
                            <Badge className={
                              bes.status === 'durchgefuehrt' ? 'bg-green-500' :
                              bes.status === 'abgesagt' ? 'bg-red-500' :
                              'bg-blue-500'
                            }>
                              {bes.status || 'geplant'}
                            </Badge>
                          </div>
                          {klient && (
                            <p className="text-gray-900 flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-500" />
                              {klient.vorname} {klient.nachname}
                            </p>
                          )}
                          {wg && (
                            <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                              <MapPin className="w-4 h-4" />
                              {wg.kurzname}
                            </p>
                          )}
                          {bes.notizen && (
                            <p className="text-gray-400 text-sm mt-2">{bes.notizen}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">Keine Besichtigungen</p>
                    <Button 
                      size="sm"
                      onClick={() => setShowNewDialog(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Termin planen
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-400 text-center py-8">
                Klicken Sie auf einen Tag im Kalender
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming List */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Anstehende Besichtigungen</CardTitle>
        </CardHeader>
        <CardContent>
          {besichtigungen.filter(b => new Date(b.termin) >= new Date()).length > 0 ? (
            <div className="space-y-3">
              {besichtigungen
                .filter(b => new Date(b.termin) >= new Date())
                .sort((a, b) => new Date(a.termin) - new Date(b.termin))
                .slice(0, 5)
                .map(bes => {
                  const klient = klienten.find(k => k.id === bes.klient_id);
                  const wg = wgs.find(w => w.id === bes.pflege_wg_id);
                  const date = new Date(bes.termin);
                  
                  return (
                    <div key={bes.id} className="flex items-center gap-4 p-3 bg-white rounded-lg">
                      <div className="text-center min-w-[60px]">
                        <p className="text-2xl font-bold text-gray-900">{date.getDate()}</p>
                        <p className="text-gray-500 text-xs">{MONTHS[date.getMonth()].slice(0, 3)}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">
                          {klient ? `${klient.vorname} ${klient.nachname}` : 'Unbekannt'}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr • {wg?.kurzname || 'WG'}
                        </p>
                      </div>
                      <Badge className="bg-blue-50 text-blue-500">
                        {bes.status || 'geplant'}
                      </Badge>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">Keine anstehenden Besichtigungen</p>
          )}
        </CardContent>
      </Card>

      {/* New Besichtigung Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="bg-white border-gray-200 text-gray-900">
          <DialogHeader>
            <DialogTitle>Neue Besichtigung planen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-gray-500 text-sm">Interessent *</label>
              <Select 
                value={newBesichtigung.klient_id} 
                onValueChange={(v) => setNewBesichtigung({...newBesichtigung, klient_id: v})}
              >
                <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                  <SelectValue placeholder="Auswählen..." />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {klienten.map(k => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.vorname} {k.nachname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-gray-500 text-sm">Wohngemeinschaft *</label>
              <Select 
                value={newBesichtigung.pflege_wg_id} 
                onValueChange={(v) => setNewBesichtigung({...newBesichtigung, pflege_wg_id: v})}
              >
                <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                  <SelectValue placeholder="Auswählen..." />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {wgs.map(wg => (
                    <SelectItem key={wg.id} value={wg.id}>
                      {wg.kurzname} ({wg.freie_zimmer} frei)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-gray-500 text-sm">Termin *</label>
              <Input
                type="datetime-local"
                value={newBesichtigung.termin}
                onChange={(e) => setNewBesichtigung({...newBesichtigung, termin: e.target.value})}
                className="bg-white border-gray-200 text-gray-900"
              />
            </div>
            <div>
              <label className="text-gray-500 text-sm">Notizen</label>
              <Textarea
                value={newBesichtigung.notizen}
                onChange={(e) => setNewBesichtigung({...newBesichtigung, notizen: e.target.value})}
                className="bg-white border-gray-200 text-gray-900"
                placeholder="z.B. Kontaktperson kommt mit..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateBesichtigung} className="bg-green-600 hover:bg-green-700">
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
