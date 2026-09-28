import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup } from 'react-leaflet';
import { MapPin, Info, Layers, Flame } from 'lucide-react';
import { gisApi } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { VillageHeatmapPoint } from '../types';
import 'leaflet/dist/leaflet.css';

interface SelectedVillage {
  village_name: string;
  tehsil: string;
  district: string;
  state: string;
  total_plots: number;
  documents_total: number;
  processed_count: number;
  needs_review_count: number;
  approved_count: number;
  pushed_to_lrms_count: number;
  avg_confidence: number;
  status: string;
  plots_covered?: number;
  plots_left?: number;
  coverage_percentage?: number;
  coverage_intensity?: number;
}

export const AdminGIS: React.FC = () => {
  const [geoData, setGeoData] = useState<any>(null);
  const [heatmapData, setHeatmapData] = useState<VillageHeatmapPoint[]>([]);
  const [selectedVillage, setSelectedVillage] = useState<SelectedVillage | null>(null);
  const [viewMode, setViewMode] = useState<'boundary' | 'heatmap'>('boundary');
  const [loading, setLoading] = useState(true);
  const [districtFilter, setDistrictFilter] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    const fetchGeoAndHeatmap = async () => {
      try {
        setLoading(true);
        const [boundary, heatmap] = await Promise.all([
          gisApi.getVillages({ district: districtFilter || undefined }),
          gisApi.getHeatmap({ district: districtFilter || undefined })
        ]);
        setGeoData(boundary);
        const pts = (heatmap.points || heatmap.data || []).map((p: any) => ({
          ...p,
          village: p.village_name || p.village,
          latitude: p.lat ?? p.latitude,
          longitude: p.lng ?? p.longitude,
          coverage_intensity: p.intensity ?? p.coverage_intensity ?? 0.5
        }));
        setHeatmapData(pts);
        if (boundary.features && boundary.features.length > 0) {
          setSelectedVillage(boundary.features[0].properties);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGeoAndHeatmap();
  }, [districtFilter]);

  const geoJsonStyle = (feature: any) => {
    const props = feature.properties;
    if (viewMode === 'heatmap') {
      const intensity = props.coverage_intensity ?? (props.documents_total / Math.max(props.total_plots, 1));
      let fillColor = '#DC2626'; // Red: low coverage / plots left
      let color = '#991B1B';
      if (intensity >= 0.6) {
        fillColor = '#059669'; // Green: most covered
        color = '#065F46';
      } else if (intensity >= 0.25) {
        fillColor = '#D97706'; // Amber: moderate
        color = '#92400E';
      }
      return {
        color: color,
        weight: 1.5,
        fillColor: fillColor,
        fillOpacity: 0.6
      };
    }

    const status = props.status;
    let color = '#1E40AF';
    let fillColor = '#BFDBFE';

    if (status === 'Fully Digitized') {
      color = '#059669';
      fillColor = '#A7F3D0';
    } else if (status === 'Needs Review' || props.needs_review_count > 0) {
      color = '#D97706';
      fillColor = '#FDE68A';
    }

    return {
      color: color,
      weight: 1.5,
      fillColor: fillColor,
      fillOpacity: 0.5
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    layer.on({
      click: () => {
        setSelectedVillage(feature.properties);
      },
      mouseover: (e: any) => {
        const l = e.target;
        l.setStyle({
          weight: 3,
          fillOpacity: 0.8
        });
      },
      mouseout: (e: any) => {
        const l = e.target;
        l.setStyle(geoJsonStyle(feature));
      }
    });
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-8">
      {/* Header & Controls */}
      <div className="bg-white p-4 rounded-[6px] border border-slate-300 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 font-heading tracking-tight">
              Cadastral GIS & Village Coverage Inspection
            </h1>
            <span className="bg-blue-50 text-gov-blue text-[11px] font-bold px-2 py-0.5 rounded-[3px] border border-blue-200">
              Cadastral Coverage
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Cadastral village boundaries and spatial coverage indexing. Visualizes digitized plots and pending survey areas.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-[4px] border border-slate-300">
          <button
            onClick={() => setViewMode('boundary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-semibold transition ${
              viewMode === 'boundary'
                ? 'bg-gov-navy text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Cadastral Boundary</span>
          </button>
          <button
            onClick={() => setViewMode('heatmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-semibold transition ${
              viewMode === 'heatmap'
                ? 'bg-gov-saffron text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Coverage Heatmap</span>
          </button>
        </div>
      </div>

      {/* Map & Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Side: Map View (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-[6px] border border-slate-300 p-3 shadow-xs h-[520px] overflow-hidden flex flex-col">
          {/* Prominent Color Legend Above Map */}
          <div className="pb-2.5 px-1 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                {viewMode === 'heatmap' ? 'Coverage Intensity:' : 'Parcels Status:'}
              </span>
              {viewMode === 'heatmap' ? (
                <div className="flex flex-wrap items-center gap-2.5 text-xs">
                  <span className="flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <span>High Coverage (&gt;60%)</span>
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span>Moderate (25–60%)</span>
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                    <span>Pending / Low (&lt;25%)</span>
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2.5 text-xs">
                  <span className="flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <span className="w-2.5 h-2.5 rounded-[3px] bg-emerald-600"></span>
                    <span>{t('fullyDigitizedLegend')}</span>
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <span className="w-2.5 h-2.5 rounded-[3px] bg-amber-500"></span>
                    <span>{t('needsReviewLegend')}</span>
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    <span className="w-2.5 h-2.5 rounded-[3px] bg-blue-500"></span>
                    <span>{t('partiallyDigitizedLegend')}</span>
                  </span>
                </div>
              )}
            </div>
            <span className="text-[10px] font-mono text-slate-500 hidden sm:inline-block">EPSG:4326 PostGIS</span>
          </div>

          <div className="flex-1 rounded-[4px] overflow-hidden relative z-10 border border-slate-200">
            {geoData && (
              <MapContainer
                center={[18.98, 73.18]}
                zoom={11}
                style={{ height: '100%', width: '100%' }}
                className="rounded-[4px]"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <GeoJSON
                  key={`${viewMode}-${districtFilter}`}
                  data={geoData}
                  style={geoJsonStyle}
                  onEachFeature={onEachFeature}
                />
                {/* Heatmap Circle Indicators */}
                {viewMode === 'heatmap' && heatmapData.map((pt, i) => (
                  <CircleMarker
                    key={i}
                    center={[pt.latitude, pt.longitude]}
                    radius={Math.max(12, pt.total_documents * 4)}
                    pathOptions={{
                      color: pt.coverage_intensity > 0.5 ? '#059669' : '#DC2626',
                      fillColor: pt.coverage_intensity > 0.5 ? '#10B981' : '#EF4444',
                      fillOpacity: 0.6,
                      weight: 2
                    }}
                  >
                    <Popup>
                      <div className="text-xs p-1">
                        <div className="font-bold text-slate-900">{pt.village}, {pt.district}</div>
                        <div className="text-slate-600 mt-1">Coverage: {pt.coverage_percentage}%</div>
                        <div className="text-slate-600">Covered: {pt.plots_covered} / {pt.total_plots} plots</div>
                        <div className="font-semibold text-rose-700">Areas Left: {pt.plots_left} plots</div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            )}
          </div>
        </div>

        {/* Right Side: Selected Village Live Metrics Inspector (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white p-4 rounded-[6px] border border-slate-300 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gov-blue" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {t('villageInspectionPanel')}
                </h3>
              </div>
              <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-[3px] font-bold text-slate-700 border border-slate-300">
                {t('liveDbMetrics')}
              </span>
            </div>

            {selectedVillage ? (
              <div className="space-y-3">
                <div>
                  <div className="text-xl font-bold text-slate-900 font-heading">
                    {selectedVillage.village_name}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {t('tehsil')}: <span className="font-semibold text-slate-800">{selectedVillage.tehsil}</span> • {t('district')}: <span className="font-semibold text-slate-800">{selectedVillage.district}</span> • {t('state')}:{' '}
                    <span className="font-semibold text-slate-800">{selectedVillage.state}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-[4px] border border-slate-300 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">{t('digitizationStatus')}</span>
                  <span className="text-xs font-bold text-gov-blue bg-blue-50 px-2 py-0.5 rounded-[3px] border border-blue-200">
                    {selectedVillage.status}
                  </span>
                </div>

                {/* Quantitative statistics */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 bg-slate-50 rounded-[4px] border border-slate-300">
                    <div className="text-lg font-black text-slate-900 font-mono">{selectedVillage.documents_total}</div>
                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-0.5">
                      {t('scannedRecordsMetric')}
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-[4px] border border-slate-300">
                    <div className="text-lg font-black text-gov-blue font-mono">{selectedVillage.total_plots || 120}</div>
                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-0.5">
                      Total Survey Plots
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-[4px] border border-slate-300">
                    <div className="text-lg font-black text-emerald-800 font-mono">
                      {selectedVillage.plots_covered ?? selectedVillage.documents_total}
                    </div>
                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-0.5">
                      Plots Covered
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-[4px] border border-slate-300">
                    <div className="text-lg font-black text-rose-700 font-mono">
                      {selectedVillage.plots_left ?? Math.max(0, (selectedVillage.total_plots || 120) - selectedVillage.documents_total)}
                    </div>
                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-0.5">
                      Areas Left
                    </div>
                  </div>
                </div>

                {/* Coverage Heatmap Meter */}
                <div className="p-3 bg-slate-50 rounded-[4px] border border-slate-300 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Digitization Coverage:</span>
                    <span className="font-bold text-gov-blue font-mono">
                      {selectedVillage.coverage_percentage ?? Math.min(100, Math.round((selectedVillage.documents_total / (selectedVillage.total_plots || 120)) * 100))}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-[2px] overflow-hidden">
                    <div
                      className="bg-gov-blue h-full"
                      style={{
                        width: `${Math.min(100, selectedVillage.coverage_percentage ?? Math.round((selectedVillage.documents_total / (selectedVillage.total_plots || 120)) * 100))}%`
                      }}
                    ></div>
                  </div>
                </div>

                {/* Average Accuracy Rating */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-[4px] flex items-center justify-between">
                  <span className="text-xs font-bold text-gov-navy">{t('avgJurisdictionConf')}</span>
                  <span className="text-sm font-black text-gov-navy font-mono">
                    {selectedVillage.avg_confidence}%
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed italic border-t border-slate-200 pt-2">
                  {t('gisFootnote')}
                </p>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                {t('clickVillagePrompt')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

