import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bed, User, Phone, Calendar, Plus, Euro, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const STATUS_COLORS = {
  frei: { bg: 'bg-green-500', border: 'border-green-400', text: 'text-emerald-500', label: 'Frei' },
  belegt: { bg: 'bg-blue-500', border: 'border-blue-400', text: 'text-blue-500', label: 'Belegt' },
  reserviert: { bg: 'bg-orange-500', border: 'border-orange-400', text: 'text-orange-500', label: 'Reserviert' },
  renovierung: { bg: 'bg-gray-500', border: 'border-gray-400', text: 'text-gray-400', label: 'Renovierung' }
};

const PFLEGEGRAD_COLORS = {
  '1': 'bg-green-500',
  '2': 'bg-lime-500',
  '3': 'bg-yellow-500',
  '4': 'bg-orange-500',
  '5': 'bg-red-500'
};

export default function PflegeWGDetail() {
  const { wgId } = useParams();
  const navigate = useNavigate();
  const [wg, setWg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedZimmer, setSelectedZimmer] = useState(null);
  const [showZimmerDialog, setShowZimmerDialog] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [kosten, setKosten] = useState(null);
  const [activeTab, setActiveTab] = useState('grundriss');

  useEffect(() => {
    fetchWG();
    fetchKosten();
  }, [wgId]);

  const fetchWG = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pflege-wgs/${wgId}`);
      const data = await res.json();
      setWg(data);
    } catch (error) {
      console.error('Error fetching WG:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchKosten = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pflege-wgs/${wgId}/kosten`);
      if (res.ok) {
        const data = await res.json();
        setKosten(data);
      }
    } catch (e) { /* ignore */ }
  };

  const handleZimmerClick = (zimmer) => {
    setSelectedZimmer(zimmer);
    setShowZimmerDialog(true);
  };

  const handleAssignKlient = (zimmerId) => {
    navigate(`/pflege-wgs/klienten?assign_zimmer=${zimmerId}&wg=${wgId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!wg) {
    return (
      <div className="p-6">
        <p className="text-white">WG nicht gefunden</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6" data-testid="wg-detail-page">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/pflege-wgs')}
            className="text-gray-500 hover:text-gray-900 p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-3xl font-bold text-white truncate">{wg.kurzname}</h1>
            <p className="text-gray-500 text-sm truncate">{wg.property_address}</p>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <Badge className={`${STATUS_COLORS.frei.bg} text-white text-xs`}>
              {wg.freie_zimmer} frei
            </Badge>
            <Badge className={`${STATUS_COLORS.belegt.bg} text-white text-xs`}>
              {wg.belegte_zimmer} belegt
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border-gray-200 mb-6">
          <TabsTrigger value="grundriss" className="data-[state=active]:bg-gray-50" data-testid="tab-grundriss">
            <Bed className="w-4 h-4 mr-2" />
            Grundriss & Bewohner
          </TabsTrigger>
          <TabsTrigger value="kosten" className="data-[state=active]:bg-gray-50" data-testid="tab-kosten">
            <Euro className="w-4 h-4 mr-2" />
            Kostenübersicht
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grundriss">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grundriss */}
        <Card className="lg:col-span-2 bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bed className="w-5 h-5" />
              Interaktiver Grundriss
            </CardTitle>
          </CardHeader>
          <CardContent>
            {wg.grundriss_url && !imageError ? (
              <div className="relative bg-white rounded-lg overflow-hidden">
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                )}
                <img
                  src={wg.grundriss_url}
                  alt={`Grundriss ${wg.kurzname}`}
                  className={`w-full h-auto transition-opacity ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
                
                {/* Zimmer Overlays */}
                {imageLoaded && wg.zimmer?.map(zimmer => (
                  <button
                    key={zimmer.id}
                    onClick={() => handleZimmerClick(zimmer)}
                    className={`absolute flex flex-col items-center justify-center rounded-lg border-2 transition-all hover:scale-105 cursor-pointer ${STATUS_COLORS[zimmer.status]?.border || 'border-gray-400'} ${STATUS_COLORS[zimmer.status]?.bg || 'bg-gray-500'}/30 hover:${STATUS_COLORS[zimmer.status]?.bg}/50`}
                    style={{
                      left: `${(zimmer.position_x / 700) * 100}%`,
                      top: `${(zimmer.position_y / 700) * 100}%`,
                      width: `${(zimmer.breite / 700) * 100}%`,
                      height: `${(zimmer.hoehe / 700) * 100}%`,
                      minWidth: '60px',
                      minHeight: '40px'
                    }}
                    data-testid={`zimmer-${zimmer.nummer}`}
                  >
                    <span className="text-white font-bold text-sm drop-shadow-lg">
                      {zimmer.nummer}
                    </span>
                    {zimmer.bewohner_name && (
                      <span className="text-gray-800 text-xs drop-shadow-lg truncate max-w-full px-1">
                        {zimmer.bewohner_name.split(' ')[0]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-8">
                <div className="grid grid-cols-3 gap-4">
                  {wg.zimmer?.map(zimmer => (
                    <button
                      key={zimmer.id}
                      onClick={() => handleZimmerClick(zimmer)}
                      className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${STATUS_COLORS[zimmer.status]?.border || 'border-gray-400'} ${STATUS_COLORS[zimmer.status]?.bg || 'bg-gray-500'}/20`}
                      data-testid={`zimmer-${zimmer.nummer}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-bold">Zimmer {zimmer.nummer}</span>
                        <Badge className={`${STATUS_COLORS[zimmer.status]?.bg} text-white text-xs`}>
                          {STATUS_COLORS[zimmer.status]?.label}
                        </Badge>
                      </div>
                      {zimmer.flaeche_qm && (
                        <p className="text-gray-500 text-sm">{zimmer.flaeche_qm} m²</p>
                      )}
                      {zimmer.bewohner_name && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-white text-sm">{zimmer.bewohner_name}</p>
                          {zimmer.bewohner_alter && (
                            <p className="text-gray-500 text-xs">{zimmer.bewohner_alter} Jahre</p>
                          )}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="flex gap-4 mt-4 pt-4 border-t border-gray-200">
              {Object.entries(STATUS_COLORS).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${value.bg}`}></span>
                  <span className="text-gray-500 text-sm">{value.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bewohnerliste */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Bewohner
              </span>
              <Badge className="bg-gray-50 text-white">
                {wg.zimmer?.filter(z => z.status === 'belegt').length || 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
            {wg.zimmer?.filter(z => z.bewohner_name).map(zimmer => (
              <div
                key={zimmer.id}
                onClick={() => handleZimmerClick(zimmer)}
                className="p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{zimmer.bewohner_name}</p>
                    <p className="text-gray-500 text-sm">Zimmer {zimmer.nummer}</p>
                  </div>
                  <div className="text-right">
                    {zimmer.bewohner_alter && (
                      <p className="text-gray-700 text-sm">{zimmer.bewohner_alter} J.</p>
                    )}
                    {zimmer.bewohner_pflegegrad && (
                      <Badge className={`${PFLEGEGRAD_COLORS[zimmer.bewohner_pflegegrad] || 'bg-gray-500'} text-white text-xs`}>
                        PG {zimmer.bewohner_pflegegrad}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Freie Zimmer */}
            {wg.zimmer?.filter(z => z.status === 'frei').length > 0 && (
              <>
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <p className="text-gray-500 text-sm mb-2">Freie Zimmer</p>
                </div>
                {wg.zimmer?.filter(z => z.status === 'frei').map(zimmer => (
                  <div
                    key={zimmer.id}
                    className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 hover:bg-emerald-50 cursor-pointer transition-all"
                    onClick={() => handleZimmerClick(zimmer)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Zimmer {zimmer.nummer}</p>
                        {zimmer.flaeche_qm && (
                          <p className="text-gray-500 text-sm">{zimmer.flaeche_qm} m²</p>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssignKlient(zimmer.id);
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>
        </TabsContent>

        {/* Kostenübersicht Tab */}
        <TabsContent value="kosten">
          {kosten ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-4">
                    <p className="text-gray-500 text-sm">Auslastung</p>
                    <p className="text-2xl font-bold text-white">{kosten.auslastung_prozent}%</p>
                    <p className="text-gray-400 text-xs">{kosten.belegte_zimmer}/{kosten.kapazitaet} Zimmer</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-4">
                    <p className="text-gray-500 text-sm">Monatlich gesamt</p>
                    <p className="text-2xl font-bold text-emerald-500">{kosten.gesamt_monatlich.toLocaleString('de-DE')} &euro;</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-4">
                    <p className="text-gray-500 text-sm">Jährlich gesamt</p>
                    <p className="text-2xl font-bold text-white">{kosten.gesamt_jaehrlich.toLocaleString('de-DE')} &euro;</p>
                  </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-4">
                    <p className="text-red-500/80 text-sm">Entgangene Einnahmen</p>
                    <p className="text-2xl font-bold text-red-500">{kosten.entgangene_einnahmen.toLocaleString('de-DE')} &euro;</p>
                    <p className="text-red-500/60 text-xs">pro Monat durch Leerstand</p>
                  </CardContent>
                </Card>
              </div>

              {/* Cost Breakdown */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Euro className="w-5 h-5" />
                    Kostenaufstellung pro Bewohner
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(kosten.kosten_detail).map(([key, val]) => {
                      const labels = {
                        miete: 'Miete',
                        nebenkosten: 'Nebenkosten',
                        betreuungspauschale: 'Betreuungspauschale',
                        verpflegung: 'Verpflegung',
                        investitionskosten: 'Investitionskosten'
                      };
                      return (
                        <div key={key} className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-white">{labels[key] || key}</span>
                          <div className="flex items-center gap-8">
                            <span className="text-gray-500 text-sm">{val.pro_zimmer.toLocaleString('de-DE')} &euro;/Zimmer</span>
                            <span className="text-white font-medium w-28 text-right">{val.gesamt.toLocaleString('de-DE')} &euro;</span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <span className="text-emerald-500 font-medium">Gesamt pro Bewohner</span>
                      <span className="text-emerald-500 font-bold text-lg">{kosten.kosten_pro_bewohner.toLocaleString('de-DE')} &euro;/Monat</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-500 text-sm">
                  Die Kostensätze sind Standardwerte. Sie können die echten Kosten später hinterlegen.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Zimmer Dialog */}
      <Dialog open={showZimmerDialog} onOpenChange={setShowZimmerDialog}>
        <DialogContent className="bg-white border-gray-200 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Zimmer {selectedZimmer?.nummer}
              <Badge className={`ml-2 ${STATUS_COLORS[selectedZimmer?.status]?.bg} text-white`}>
                {STATUS_COLORS[selectedZimmer?.status]?.label}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Zimmer Info */}
            <div className="grid grid-cols-2 gap-4">
              {selectedZimmer?.flaeche_qm && (
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-gray-500 text-sm">Fläche</p>
                  <p className="text-white font-medium">{selectedZimmer.flaeche_qm} m²</p>
                </div>
              )}
              {selectedZimmer?.name && (
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-gray-500 text-sm">Bezeichnung</p>
                  <p className="text-white font-medium">{selectedZimmer.name}</p>
                </div>
              )}
            </div>

            {/* Bewohner Info */}
            {selectedZimmer?.bewohner_name ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-medium text-lg">{selectedZimmer.bewohner_name}</p>
                    <div className="flex items-center gap-3 mt-2 text-gray-500 text-sm">
                      {selectedZimmer.bewohner_alter && (
                        <span>{selectedZimmer.bewohner_alter} Jahre</span>
                      )}
                      {selectedZimmer.bewohner_pflegegrad && (
                        <Badge className={`${PFLEGEGRAD_COLORS[selectedZimmer.bewohner_pflegegrad]} text-white`}>
                          Pflegegrad {selectedZimmer.bewohner_pflegegrad}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-blue-200 flex gap-2">
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setShowZimmerDialog(false);
                      navigate(`/pflege-wgs/klienten/${selectedZimmer.aktueller_bewohner_id}`);
                    }}
                  >
                    Profil öffnen
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-gray-200 text-white hover:bg-gray-50"
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Anrufen
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-full">
                    <Bed className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Zimmer ist frei</p>
                    <p className="text-gray-500 text-sm">Klicken Sie unten, um einen Klienten zuzuweisen</p>
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-4 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setShowZimmerDialog(false);
                    handleAssignKlient(selectedZimmer.id);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Klient zuweisen
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
