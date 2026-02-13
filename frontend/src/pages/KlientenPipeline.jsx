import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MessageSquare, Calendar, FileText, Clock, ChevronRight, User, Building2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const PIPELINE_COLUMNS = [
  { key: 'neu', label: 'Neu eingegangen', color: 'bg-red-500' },
  { key: 'erstgespraech', label: 'Erstgespräch', color: 'bg-orange-500' },
  { key: 'besichtigung_geplant', label: 'Besichtigung', color: 'bg-yellow-500' },
  { key: 'unterlagen_gesendet', label: 'Unterlagen', color: 'bg-blue-500' },
  { key: 'entscheidung_ausstehend', label: 'Entscheidung', color: 'bg-purple-500' },
  { key: 'zusage', label: 'Zusage', color: 'bg-green-500' },
];

const DRINGLICHKEIT_COLORS = {
  sofort: 'border-l-red-500 bg-red-500/10',
  '4_wochen': 'border-l-orange-500 bg-orange-500/10',
  '3_monate': 'border-l-yellow-500 bg-yellow-500/10',
  flexibel: 'border-l-green-500 bg-green-500/10'
};

const PFLEGEGRAD_BADGE = {
  '1': 'bg-green-500',
  '2': 'bg-lime-500',
  '3': 'bg-yellow-500',
  '4': 'bg-orange-500',
  '5': 'bg-red-500',
  'beantragt': 'bg-gray-500',
  'keiner': 'bg-gray-400'
};

export default function KlientenPipeline() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [klienten, setKlienten] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedKlient, setDraggedKlient] = useState(null);
  const [wgs, setWgs] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [klientenRes, wgsRes] = await Promise.all([
        fetch(`${API_URL}/api/klienten`),
        fetch(`${API_URL}/api/pflege-wgs`)
      ]);
      
      const klientenData = await klientenRes.json();
      const wgsData = await wgsRes.json();
      
      // Filter out bewohner, ausgezogen, verstorben
      const pipelineKlienten = klientenData.filter(k => 
        !['bewohner', 'ausgezogen', 'verstorben'].includes(k.status)
      );
      
      setKlienten(pipelineKlienten);
      setWgs(wgsData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, klient) => {
    setDraggedKlient(klient);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    if (!draggedKlient || draggedKlient.status === newStatus) {
      setDraggedKlient(null);
      return;
    }

    try {
      await fetch(`${API_URL}/api/klienten/${draggedKlient.id}/status?status=${newStatus}`, {
        method: 'POST'
      });
      
      // Update local state
      setKlienten(prev => prev.map(k => 
        k.id === draggedKlient.id ? { ...k, status: newStatus } : k
      ));
      
      toast.success(`${draggedKlient.vorname} ${draggedKlient.nachname} nach "${PIPELINE_COLUMNS.find(c => c.key === newStatus)?.label}" verschoben`);
    } catch (error) {
      toast.error('Fehler beim Aktualisieren');
    }
    
    setDraggedKlient(null);
  };

  const getKlientenForColumn = (status) => {
    return klienten
      .filter(k => k.status === status)
      .filter(k => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
          k.vorname?.toLowerCase().includes(search) ||
          k.nachname?.toLowerCase().includes(search) ||
          k.kontakt_name?.toLowerCase().includes(search)
        );
      });
  };

  const getWGNames = (wgIds) => {
    if (!wgIds?.length) return [];
    return wgIds.map(id => wgs.find(w => w.id === id)?.kurzname).filter(Boolean);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Heute';
    if (diff === 1) return 'Gestern';
    return `vor ${diff} Tagen`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" data-testid="pipeline-page">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-white/10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/pflege-wgs')}
              className="text-white/60 hover:text-white p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-white">Anfragen-Pipeline</h1>
              <p className="text-white/60 text-sm">{klienten.length} Interessenten</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Input
              placeholder="Suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-white/5 border-white/10 text-white text-sm"
            />
            <Button 
              onClick={() => navigate('/pflege-wgs/klienten/neu')}
              className="bg-green-600 hover:bg-green-700 text-sm flex-shrink-0"
            >
              <Plus className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Neue Anfrage</span>
              <span className="sm:hidden">Neu</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Pipeline Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full min-w-max">
          {PIPELINE_COLUMNS.map(column => {
            const columnKlienten = getKlientenForColumn(column.key);
            const dringendCount = columnKlienten.filter(k => k.dringlichkeit === 'sofort').length;
            
            return (
              <div
                key={column.key}
                className="w-80 flex-shrink-0 flex flex-col bg-white/5 rounded-xl border border-white/10"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.key)}
                data-testid={`column-${column.key}`}
              >
                {/* Column Header */}
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${column.color}`}></span>
                      <h3 className="text-white font-medium">{column.label}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {dringendCount > 0 && (
                        <Badge className="bg-red-500/20 text-red-400 border-0">
                          {dringendCount} dringend
                        </Badge>
                      )}
                      <Badge className="bg-white/10 text-white border-0">
                        {columnKlienten.length}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {columnKlienten.map(klient => (
                    <div
                      key={klient.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, klient)}
                      onClick={() => navigate(`/pflege-wgs/klienten/${klient.id}`)}
                      className={`p-4 rounded-lg border-l-4 cursor-pointer transition-all hover:scale-[1.02] ${DRINGLICHKEIT_COLORS[klient.dringlichkeit] || 'border-l-gray-500 bg-white/5'} border border-white/10 hover:border-white/20`}
                      data-testid={`klient-card-${klient.id}`}
                    >
                      {/* Name */}
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-white font-medium">
                            {klient.vorname} {klient.nachname}
                          </h4>
                          <p className="text-white/60 text-sm">{klient.kontakt_name}</p>
                        </div>
                        {klient.pflegegrad && klient.pflegegrad !== 'keiner' && (
                          <Badge className={`${PFLEGEGRAD_BADGE[klient.pflegegrad]} text-white text-xs`}>
                            PG {klient.pflegegrad}
                          </Badge>
                        )}
                      </div>

                      {/* Besonderheiten */}
                      {klient.besonderheiten && (
                        <p className="text-white/50 text-xs mb-2 line-clamp-2">
                          {klient.besonderheiten}
                        </p>
                      )}

                      {/* WGs */}
                      {klient.bevorzugte_wgs?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {getWGNames(klient.bevorzugte_wgs).map(name => (
                            <Badge key={name} className="bg-blue-500/20 text-blue-400 border-0 text-xs">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                        <span className="text-white/40 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(klient.anfrage_am)}
                        </span>
                        
                        {/* Quick Actions */}
                        <div className="flex gap-1">
                          {klient.kontakt_telefon && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0 text-white/40 hover:text-green-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `tel:${klient.kontakt_telefon}`;
                              }}
                            >
                              <Phone className="w-3 h-3" />
                            </Button>
                          )}
                          {klient.kontakt_email && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0 text-white/40 hover:text-blue-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `mailto:${klient.kontakt_email}`;
                              }}
                            >
                              <Mail className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {columnKlienten.length === 0 && (
                    <div className="text-center py-8 text-white/40">
                      <p className="text-sm">Keine Anfragen</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Abgesagt Column */}
          <div className="w-64 flex-shrink-0 flex flex-col bg-white/5 rounded-xl border border-white/10 opacity-60">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                <h3 className="text-white/60 font-medium">Abgesagt</h3>
                <Badge className="bg-white/10 text-white/60 border-0">
                  {klienten.filter(k => k.status === 'abgesagt').length}
                </Badge>
              </div>
            </div>
            <div 
              className="flex-1 overflow-y-auto p-3"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'abgesagt')}
            >
              {klienten.filter(k => k.status === 'abgesagt').slice(0, 3).map(klient => (
                <div key={klient.id} className="p-3 bg-white/5 rounded-lg mb-2 opacity-60">
                  <p className="text-white/60 text-sm">{klient.vorname} {klient.nachname}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
