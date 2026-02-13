import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Bed, AlertCircle, Clock, Plus, Search, Calendar, Euro } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function PflegeWGs() {
  const navigate = useNavigate();
  const [wgs, setWgs] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [gesamtKosten, setGesamtKosten] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [wgsRes, dashRes, kostenRes] = await Promise.all([
        fetch(`${API_URL}/api/pflege-wgs`),
        fetch(`${API_URL}/api/klienten/dashboard`),
        fetch(`${API_URL}/api/pflege-wgs/kosten/gesamt`)
      ]);
      setWgs(await wgsRes.json());
      setDashboard(await dashRes.json());
      if (kostenRes.ok) setGesamtKosten(await kostenRes.json());
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const filteredWgs = wgs.filter(wg =>
    wg.kurzname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wg.property_address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div></div>;
  }

  return (
    <div className="space-y-4 p-4 md:p-8 overflow-x-hidden" data-testid="pflege-wgs-page">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">Pflege-WGs</h1>
          <p className="text-gray-500 mt-0.5 text-xs md:text-sm">Klientenmanagement für ambulant betreute WGs</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <Button onClick={() => navigate('/pflege-wgs/pipeline')} size="sm" className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs flex-shrink-0" data-testid="pipeline-btn">
            <Users className="w-3.5 h-3.5 mr-1" /> Pipeline
          </Button>
          <Button onClick={() => navigate('/pflege-wgs/besichtigungen')} size="sm" variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs flex-shrink-0" data-testid="besichtigungen-btn">
            <Calendar className="w-3.5 h-3.5 mr-1" /> Besichtigungen
          </Button>
          <Button onClick={() => navigate('/pflege-wgs/klienten/neu')} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs flex-shrink-0" data-testid="new-klient-btn">
            <Plus className="w-3.5 h-3.5 mr-1" /> Neu
          </Button>
        </div>
      </div>

      {/* Stats */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {[
            { label: 'Bewohner', value: dashboard.bewohner, icon: Users, color: 'blue' },
            { label: 'Freie Zimmer', value: dashboard.freie_zimmer, icon: Bed, color: 'emerald' },
            { label: 'Interessenten', value: dashboard.interessenten, icon: Clock, color: 'orange' },
            { label: 'Pflege-WGs', value: wgs.length, icon: Building2, color: 'purple' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-3 md:p-4 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl bg-${s.color}-50 flex items-center justify-center flex-shrink-0`}>
                  <s.icon className={`w-4 h-4 md:w-5 md:h-5 text-${s.color}-500`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alerts */}
      {dashboard?.handlungsbedarf?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {dashboard.handlungsbedarf.map((item, idx) => (
            <div key={idx} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${
              item.prioritaet === 'hoch' ? 'bg-red-50 border-red-100' :
              item.prioritaet === 'mittel' ? 'bg-orange-50 border-orange-100' :
              'bg-yellow-50 border-yellow-100'
            }`}>
              <AlertCircle className={`w-4 h-4 ${
                item.prioritaet === 'hoch' ? 'text-red-500' : item.prioritaet === 'mittel' ? 'text-orange-500' : 'text-yellow-500'
              }`} />
              <div>
                <p className="text-sm font-medium text-gray-900">{item.text}</p>
                <p className="text-xs text-gray-500">{item.details}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="WG suchen..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl" data-testid="search-input" />
      </div>

      {/* WG Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWgs.map(wg => (
          <div key={wg.id} onClick={() => navigate(`/pflege-wgs/${wg.id}`)}
            className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group p-5"
            data-testid={`wg-card-${wg.id}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{wg.kurzname}</h3>
                <p className="text-gray-500 text-sm">{wg.property_address}</p>
              </div>
              {wg.grundriss_url && <Badge className="bg-blue-50 text-blue-600 border-0 text-xs">Grundriss</Badge>}
            </div>
            <div className="flex items-center gap-4 mb-3">
              <div className="relative w-14 h-14">
                <svg className="w-14 h-14 transform -rotate-90">
                  <circle cx="28" cy="28" r="24" stroke="#E5E5EA" strokeWidth="5" fill="none" />
                  <circle cx="28" cy="28" r="24" stroke="#007AFF" strokeWidth="5" fill="none"
                    strokeDasharray={`${(wg.belegte_zimmer / wg.kapazitaet) * 151} 151`} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-gray-900 font-bold text-xs">{wg.belegte_zimmer}/{wg.kapazitaet}</span>
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <span className="text-gray-600">{wg.freie_zimmer} frei</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                  <span className="text-gray-600">{wg.belegte_zimmer} belegt</span>
                </div>
              </div>
            </div>
            <p className="text-gray-500 text-sm line-clamp-2 mb-3">{wg.beschreibung}</p>
            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <span className="text-blue-500 text-sm font-medium">Details ansehen →</span>
            </div>
          </div>
        ))}
      </div>

      {/* Kosten */}
      {gesamtKosten && (
        <div className="bg-white rounded-2xl shadow-sm p-6" data-testid="gesamt-kosten">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Euro className="w-5 h-5 text-gray-400" /> Finanzübersicht
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500">Auslastung</p><p className="text-xl font-bold text-gray-900">{gesamtKosten.gesamt_auslastung}%</p></div>
            <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500">Monatlich</p><p className="text-xl font-bold text-emerald-600">{gesamtKosten.gesamt_monatlich.toLocaleString('de-DE')} &euro;</p></div>
            <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500">Jährlich</p><p className="text-xl font-bold text-gray-900">{gesamtKosten.gesamt_jaehrlich.toLocaleString('de-DE')} &euro;</p></div>
            <div className="p-3 bg-red-50 rounded-xl"><p className="text-xs text-red-500">Entgangen</p><p className="text-xl font-bold text-red-500">{gesamtKosten.gesamt_entgangen.toLocaleString('de-DE')} &euro;</p></div>
          </div>
          <div className="space-y-2">
            {gesamtKosten.wgs.map(wg => (
              <div key={wg.wg_id} onClick={() => navigate(`/pflege-wgs/${wg.wg_id}`)}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                <span className="text-sm font-medium text-gray-900 w-36">{wg.wg_name}</span>
                <div className="flex-1"><div className="w-full bg-gray-200 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-blue-500" style={{width: `${wg.auslastung}%`}}></div></div></div>
                <span className="text-xs text-gray-500 w-12 text-right">{wg.auslastung}%</span>
                <span className="text-sm font-medium text-emerald-600 w-24 text-right">{wg.monatlich.toLocaleString('de-DE')} &euro;</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline Preview */}
      {dashboard?.pipeline && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-gray-400" /> Anfragen-Pipeline
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {dashboard.pipeline.map(stage => (
              <div key={stage.status} className="min-w-[140px] p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-gray-600 text-xs font-medium">{stage.label}</span>
                  {stage.dringend > 0 && <Badge className="bg-red-50 text-red-500 border-0 text-[10px]">{stage.dringend}</Badge>}
                </div>
                <p className="text-2xl font-bold text-gray-900">{stage.anzahl}</p>
              </div>
            ))}
          </div>
          <Button onClick={() => navigate('/pflege-wgs/pipeline')} variant="ghost" className="mt-2 text-blue-500 hover:text-blue-600 text-sm p-0">
            Zur vollständigen Pipeline →
          </Button>
        </div>
      )}
    </div>
  );
}
