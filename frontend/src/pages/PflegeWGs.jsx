import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Bed, AlertCircle, Clock, Plus, Search, Calendar, Euro } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Status colors
const STATUS_COLORS = {
  frei: 'bg-green-500',
  belegt: 'bg-blue-500',
  reserviert: 'bg-orange-500',
  renovierung: 'bg-gray-500'
};

const DRINGLICHKEIT_COLORS = {
  sofort: 'bg-red-500 text-white',
  '4_wochen': 'bg-orange-500 text-white',
  '3_monate': 'bg-yellow-500 text-black',
  flexibel: 'bg-green-500 text-white'
};

export default function PflegeWGs() {
  const navigate = useNavigate();
  const [wgs, setWgs] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [gesamtKosten, setGesamtKosten] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [wgsRes, dashRes] = await Promise.all([
        fetch(`${API_URL}/api/pflege-wgs`),
        fetch(`${API_URL}/api/klienten/dashboard`)
      ]);
      
      const wgsData = await wgsRes.json();
      const dashData = await dashRes.json();
      
      setWgs(wgsData);
      setDashboard(dashData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWgs = wgs.filter(wg => 
    wg.kurzname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wg.property_address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" data-testid="pflege-wgs-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Pflege-Wohngemeinschaften</h1>
          <p className="text-white/60 mt-1">Klientenmanagement für ambulant betreute WGs</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button 
            onClick={() => navigate('/pflege-wgs/pipeline')}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="pipeline-btn"
          >
            <Users className="w-4 h-4 mr-2" />
            Pipeline
          </Button>
          <Button 
            onClick={() => navigate('/pflege-wgs/besichtigungen')}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            data-testid="besichtigungen-btn"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Besichtigungen
          </Button>
          <Button 
            onClick={() => navigate('/pflege-wgs/klienten/neu')}
            className="bg-green-600 hover:bg-green-700"
            data-testid="new-klient-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Neue Anfrage
          </Button>
        </div>
      </div>

      {/* Dashboard Stats */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{dashboard.bewohner}</p>
                  <p className="text-xs text-white/60">Bewohner</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Bed className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{dashboard.freie_zimmer}</p>
                  <p className="text-xs text-white/60">Freie Zimmer</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{dashboard.interessenten}</p>
                  <p className="text-xs text-white/60">Interessenten</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Building2 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{wgs.length}</p>
                  <p className="text-xs text-white/60">Pflege-WGs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Handlungsbedarf */}
      {dashboard?.handlungsbedarf?.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {dashboard.handlungsbedarf.map((item, idx) => (
            <Card 
              key={idx}
              className={`border-l-4 ${
                item.prioritaet === 'hoch' ? 'border-l-red-500 bg-red-500/10' :
                item.prioritaet === 'mittel' ? 'border-l-orange-500 bg-orange-500/10' :
                'border-l-yellow-500 bg-yellow-500/10'
              } border-white/10`}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className={`w-5 h-5 ${
                  item.prioritaet === 'hoch' ? 'text-red-400' :
                  item.prioritaet === 'mittel' ? 'text-orange-400' :
                  'text-yellow-400'
                }`} />
                <div>
                  <p className="text-white font-medium">{item.text}</p>
                  <p className="text-white/60 text-sm">{item.details}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <Input
          placeholder="WG suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          data-testid="search-input"
        />
      </div>

      {/* WG Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWgs.map(wg => (
          <Card 
            key={wg.id}
            className="bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer group"
            onClick={() => navigate(`/pflege-wgs/${wg.id}`)}
            data-testid={`wg-card-${wg.id}`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl text-white group-hover:text-blue-400 transition-colors">
                    {wg.kurzname}
                  </CardTitle>
                  <p className="text-white/60 text-sm mt-1">{wg.property_address}</p>
                </div>
                {wg.grundriss_url && (
                  <Badge className="bg-blue-500/20 text-blue-400 border-0">
                    Grundriss
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Belegungsring */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      className="text-white/10"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${(wg.belegte_zimmer / wg.kapazitaet) * 176} 176`}
                      className="text-blue-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {wg.belegte_zimmer}/{wg.kapazitaet}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span className="text-white/80">{wg.freie_zimmer} frei</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span className="text-white/80">{wg.belegte_zimmer} belegt</span>
                  </div>
                  {wg.reservierte_zimmer > 0 && (
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                      <span className="text-white/80">{wg.reservierte_zimmer} reserviert</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-white/60 text-sm line-clamp-2">{wg.beschreibung}</p>

              {/* Action hint */}
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-white/40 text-sm">Klicken für Details</span>
                <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300 p-0">
                  Grundriss ansehen →
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline Preview */}
      {dashboard?.pipeline && (
        <Card className="bg-white/5 border-white/10 mt-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Anfragen-Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {dashboard.pipeline.map(stage => (
                <div 
                  key={stage.status}
                  className="min-w-[160px] p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80 text-sm font-medium">{stage.label}</span>
                    {stage.dringend > 0 && (
                      <Badge className="bg-red-500/20 text-red-400 border-0 text-xs">
                        {stage.dringend} dringend
                      </Badge>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-white">{stage.anzahl}</p>
                </div>
              ))}
            </div>
            <Button 
              onClick={() => navigate('/pflege-wgs/pipeline')}
              variant="ghost" 
              className="mt-2 text-blue-400 hover:text-blue-300"
            >
              Zur vollständigen Pipeline →
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
