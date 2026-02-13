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
  frei: { bg: 'bg-green-500', border: 'border-green-400', text: 'text-green-400', label: 'Frei' },
  belegt: { bg: 'bg-blue-500', border: 'border-blue-400', text: 'text-blue-400', label: 'Belegt' },
  reserviert: { bg: 'bg-orange-500', border: 'border-orange-400', text: 'text-orange-400', label: 'Reserviert' },
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

  useEffect(() => {
    fetchWG();
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
    <div className="space-y-6 p-6" data-testid="wg-detail-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/pflege-wgs')}
          className="text-white/60 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">{wg.kurzname}</h1>
          <p className="text-white/60">{wg.property_address}</p>
        </div>
        <div className="flex gap-2">
          <Badge className={`${STATUS_COLORS.frei.bg} text-white`}>
            {wg.freie_zimmer} frei
          </Badge>
          <Badge className={`${STATUS_COLORS.belegt.bg} text-white`}>
            {wg.belegte_zimmer} belegt
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grundriss */}
        <Card className="lg:col-span-2 bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bed className="w-5 h-5" />
              Interaktiver Grundriss
            </CardTitle>
          </CardHeader>
          <CardContent>
            {wg.grundriss_url && !imageError ? (
              <div className="relative bg-white/5 rounded-lg overflow-hidden">
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
                      <span className="text-white/90 text-xs drop-shadow-lg truncate max-w-full px-1">
                        {zimmer.bewohner_name.split(' ')[0]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-white/5 rounded-lg p-8">
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
                        <p className="text-white/60 text-sm">{zimmer.flaeche_qm} m²</p>
                      )}
                      {zimmer.bewohner_name && (
                        <div className="mt-2 pt-2 border-t border-white/10">
                          <p className="text-white text-sm">{zimmer.bewohner_name}</p>
                          {zimmer.bewohner_alter && (
                            <p className="text-white/60 text-xs">{zimmer.bewohner_alter} Jahre</p>
                          )}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="flex gap-4 mt-4 pt-4 border-t border-white/10">
              {Object.entries(STATUS_COLORS).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${value.bg}`}></span>
                  <span className="text-white/60 text-sm">{value.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bewohnerliste */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Bewohner
              </span>
              <Badge className="bg-white/10 text-white">
                {wg.zimmer?.filter(z => z.status === 'belegt').length || 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
            {wg.zimmer?.filter(z => z.bewohner_name).map(zimmer => (
              <div
                key={zimmer.id}
                onClick={() => handleZimmerClick(zimmer)}
                className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{zimmer.bewohner_name}</p>
                    <p className="text-white/60 text-sm">Zimmer {zimmer.nummer}</p>
                  </div>
                  <div className="text-right">
                    {zimmer.bewohner_alter && (
                      <p className="text-white/80 text-sm">{zimmer.bewohner_alter} J.</p>
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
                <div className="pt-4 mt-4 border-t border-white/10">
                  <p className="text-white/60 text-sm mb-2">Freie Zimmer</p>
                </div>
                {wg.zimmer?.filter(z => z.status === 'frei').map(zimmer => (
                  <div
                    key={zimmer.id}
                    className="p-3 bg-green-500/10 rounded-lg border border-green-500/30 hover:bg-green-500/20 cursor-pointer transition-all"
                    onClick={() => handleZimmerClick(zimmer)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Zimmer {zimmer.nummer}</p>
                        {zimmer.flaeche_qm && (
                          <p className="text-white/60 text-sm">{zimmer.flaeche_qm} m²</p>
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

      {/* Zimmer Dialog */}
      <Dialog open={showZimmerDialog} onOpenChange={setShowZimmerDialog}>
        <DialogContent className="bg-gray-900 border-white/10 text-white max-w-md">
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
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-white/60 text-sm">Fläche</p>
                  <p className="text-white font-medium">{selectedZimmer.flaeche_qm} m²</p>
                </div>
              )}
              {selectedZimmer?.name && (
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-white/60 text-sm">Bezeichnung</p>
                  <p className="text-white font-medium">{selectedZimmer.name}</p>
                </div>
              )}
            </div>

            {/* Bewohner Info */}
            {selectedZimmer?.bewohner_name ? (
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-medium text-lg">{selectedZimmer.bewohner_name}</p>
                    <div className="flex items-center gap-3 mt-2 text-white/60 text-sm">
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
                
                <div className="mt-4 pt-4 border-t border-blue-500/30 flex gap-2">
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
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Anrufen
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-full">
                    <Bed className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Zimmer ist frei</p>
                    <p className="text-white/60 text-sm">Klicken Sie unten, um einen Klienten zuzuweisen</p>
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
