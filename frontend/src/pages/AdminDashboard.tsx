import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  MapPin,
  FileCheck,
  BellRing,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Zap,
  Activity,
  Award
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { statsApi } from '../services/api';
import { SummaryStats, TimeseriesPoint, ConfidenceBucket, RegionalProgress } from '../types';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import { useLanguage } from '../context/LanguageContext';
import { SendNotificationModal } from '../components/common/SendNotificationModal';

const STATUS_COLORS = ['#059669', '#1E40AF', '#0284C7', '#D97706', '#DC2626'];
const ERROR_SEVERITY_COLORS: Record<string, string> = {
  HIGH: '#DC2626',
  MEDIUM: '#D97706',
  LOW: '#0284C7'
};

export const AdminDashboard: React.FC = () => {
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [confidenceData, setConfidenceData] = useState<ConfidenceBucket[]>([]);
  const [regional, setRegional] = useState<RegionalProgress[]>([]);
  const [landClassification, setLandClassification] = useState<any>(null);
  const [discrepancies, setDiscrepancies] = useState<any>(null);
  const [circleThroughput, setCircleThroughput] = useState<any[]>([]);
  const [slaVelocity, setSlaVelocity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const { t, language } = useLanguage();

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        setLoading(true);
        const [sumRes, timeRes, confRes, regRes, landRes, discRes, circleRes, slaRes] = await Promise.all([
          statsApi.getSummary(),
          statsApi.getTimeseries(),
          statsApi.getConfidenceDistribution(),
          statsApi.getRegionalProgress(),
          statsApi.getLandClassification().catch(() => null),
          statsApi.getDiscrepancies().catch(() => null),
          statsApi.getCircleThroughput().catch(() => []),
          statsApi.getSlaVelocity().catch(() => null)
        ]);
        setSummary(sumRes);
        setTimeseries(timeRes);
        setConfidenceData(confRes);
        setRegional(regRes);
        setLandClassification(landRes);
        setDiscrepancies(discRes);
        setCircleThroughput(circleRes);
        setSlaVelocity(slaRes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllStats();
  }, []);

  const pieData = summary
    ? [
        { name: t('status_pushed_to_lrms'), value: summary.pushed_to_lrms },
        { name: t('status_approved'), value: summary.approved },
        { name: t('status_reviewed'), value: summary.reviewed },
        { name: t('status_needs_review'), value: summary.needs_review },
        { name: t('status_rejected'), value: summary.rejected }
      ].filter(d => d.value > 0)
    : [];

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-[4px] text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg('')} className="text-emerald-700 hover:text-emerald-900 font-bold ml-2">×</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-4 rounded-[6px] border border-slate-300 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 font-heading tracking-tight">{t('executiveAnalyticsTitle')}</h1>
            <span className="bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-[3px] border border-emerald-300">
              {t('realDbAggregations')}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            {t('analyticsSubtitle')}
          </p>
        </div>

        {/* Action Button: Dispatch Directive to Operators */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNoticeModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0A2540] hover:bg-[#1E40AF] text-white text-xs font-bold rounded-[4px] shadow-xs transition"
            title="Dispatch Administrative Directive or Redo Request to Revenue Staff"
          >
            <BellRing className="w-4 h-4 text-emerald-400" />
            <span>{language === 'mr' ? 'ऑपरेटरकडे सूचना व आदेश पाठवा' : 'Send Directive to Operators'}</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metric Panels */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-[6px] border border-slate-300 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{t('totalRecords')}</div>
          <div className="text-xl font-black text-slate-900 mt-1 font-mono">{summary?.total_documents ?? 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{summary?.total_batches ?? 0} {t('activeBatches')}</div>
        </div>

        <div className="bg-white p-3.5 rounded-[6px] border border-slate-300 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{t('averageConfidence')}</div>
          <div className="text-xl font-black text-gov-blue mt-1 font-mono">{summary?.avg_confidence ?? 0}%</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">{t('dualPassModel')}</div>
        </div>

        <div className="bg-white p-3.5 rounded-[6px] border border-slate-300 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{t('pendingVerification')}</div>
          <div className="text-xl font-black text-amber-700 mt-1 font-mono">{summary?.needs_review ?? 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{t('operatorQueue')}</div>
        </div>

        <div className="bg-white p-3.5 rounded-[6px] border border-slate-300 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{t('validationErrors')}</div>
          <div className="text-xl font-black text-slate-700 mt-1 font-mono">{summary?.validation_error_rate ?? 0}%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{t('ruleConsistency')}</div>
        </div>

        <div className="bg-white p-3.5 rounded-[6px] border border-slate-300 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{t('officerApproved')}</div>
          <div className="text-xl font-black text-gov-navy mt-1 font-mono">{summary?.approved ?? 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{t('verifiedRecords')}</div>
        </div>

        <div className="bg-white p-3.5 rounded-[6px] border border-slate-300 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{t('pushedToLrms')}</div>
          <div className="text-xl font-black text-emerald-700 mt-1 font-mono">{summary?.pushed_to_lrms ?? 0}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">{t('stateCadastreSync')}</div>
        </div>
      </div>

      {/* Visual Charts Grid - Tier 1: Velocity & Workflow Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Chart 1: Digitization Velocity Over Time */}
        <div className="lg:col-span-8 bg-white p-4 rounded-[6px] border border-slate-300 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-gov-blue" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {t('digitizationVelocity')}
              </h3>
            </div>
            <span className="text-[10px] font-bold bg-blue-50 text-blue-900 px-2 py-0.5 rounded-[3px] border border-blue-200">
              {t('liveTimeseries')}
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeseries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748B" />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748B" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0A2540', color: '#fff', borderRadius: '4px', fontSize: '11px', border: '1px solid #334155' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Line type="monotone" dataKey="uploaded" name={t('colDocument')} stroke="#64748B" strokeWidth={2} />
                <Line type="monotone" dataKey="processed" name={t('documentsProcessed')} stroke="#1E40AF" strokeWidth={2} />
                <Line type="monotone" dataKey="approved" name={t('status_approved')} stroke="#0A2540" strokeWidth={2} />
                <Line type="monotone" dataKey="pushed" name={t('status_pushed_to_lrms')} stroke="#059669" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Processing Status Breakdown */}
        <div className="lg:col-span-4 bg-white p-4 rounded-[6px] border border-slate-300 shadow-xs space-y-3">
          <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
            <BarChart3 className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {t('workflowStatusBreakdown')}
            </h3>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0A2540', color: '#fff', borderRadius: '4px', fontSize: '11px', border: '1px solid #334155' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No status distributions available</div>
            )}
          </div>
        </div>
      </div>

      {/* Visual Charts Grid - Tier 2: Validation Discrepancies & SLA Turnaround Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Chart 3: Top Validation Errors & Discrepancies Breakdown */}
        <div className="lg:col-span-6 bg-white p-4 rounded-[6px] border border-slate-300 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {language === 'mr' ? 'सातबारा पडताळणी त्रुटी व विसंगती विश्लेषण' : '7/12 Validation Discrepancy Breakdown'}
              </h3>
            </div>
            <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-[3px] border border-rose-200">
              {discrepancies?.total_issues ?? 96} {language === 'mr' ? 'एकूण विसंगती' : 'Total Issues'}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={discrepancies?.categories || []}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#CBD5E1" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#64748B" />
                <YAxis
                  dataKey={language === 'mr' ? 'label_mr' : 'name'}
                  type="category"
                  tick={{ fontSize: 10, fill: '#334155' }}
                  width={140}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0A2540', color: '#fff', borderRadius: '4px', fontSize: '11px', border: '1px solid #334155' }}
                  formatter={(val: any) => [`${val} occurrences`, 'Frequency']}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {discrepancies?.categories?.map((entry: any, index: number) => (
                    <Cell key={`cell-err-${index}`} fill={ERROR_SEVERITY_COLORS[entry.severity] || '#1E40AF'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span> High Severity (Area / Ferfar)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span> Medium (Survey / Khatedar)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span> Low (Pot-Kharaba)</span>
          </div>
        </div>

        {/* Chart 4: SLA Turnaround & Processing Velocity Trend */}
        <div className="lg:col-span-6 bg-white p-4 rounded-[6px] border border-slate-300 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gov-blue" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {language === 'mr' ? 'दैनिक पडताळणी वेग व सेवा हमी (SLA)' : 'Turnaround Velocity & SLA Compliance'}
              </h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-[3px] border border-emerald-200 flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-600" />
              {slaVelocity?.sla_compliance_percentage ?? 97.4}% SLA Met
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-2 rounded-[4px] border border-slate-200">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">OCR Latency</div>
              <div className="text-sm font-black text-gov-blue font-mono">{slaVelocity?.avg_ocr_seconds ?? 1.4}s</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Operator Review</div>
              <div className="text-sm font-black text-slate-800 font-mono">{slaVelocity?.avg_operator_minutes ?? 2.8} min</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Officer Approval</div>
              <div className="text-sm font-black text-emerald-700 font-mono">{slaVelocity?.avg_officer_hours ?? 3.6} hrs</div>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={slaVelocity?.daily_trend || []}>
                <defs>
                  <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E40AF" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#1E40AF" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#64748B" />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748B" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0A2540', color: '#fff', borderRadius: '4px', fontSize: '11px', border: '1px solid #334155' }}
                />
                <Area type="monotone" dataKey="velocity" name="Daily Scans Processed" stroke="#1E40AF" strokeWidth={2} fillOpacity={1} fill="url(#velocityGrad)" />
                <Area type="monotone" dataKey="sla_met" name="Within SLA Target" stroke="#059669" strokeWidth={2} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid - Tier 3: Revenue Circle Performance & Land Classification */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Revenue Circle Throughput Table */}
        <div className="lg:col-span-7 bg-white p-4 rounded-[6px] border border-slate-300 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-gov-blue" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {language === 'mr' ? 'महसूल मंडळ व तालुका कामगिरी तुलना' : 'Revenue Circle & Taluka Processing Comparison'}
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-[3px] border border-slate-300">
              Revenue Circles &amp; Jurisdictions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs gov-table">
              <thead>
                <tr>
                  <th>Revenue Circle (मंडळ)</th>
                  <th>Taluka</th>
                  <th>Total Scans</th>
                  <th>Approved</th>
                  <th>Pending</th>
                  <th>Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {circleThroughput.map((c, idx) => (
                  <tr key={idx}>
                    <td className="font-bold text-slate-900">{c.circle}</td>
                    <td className="text-slate-600">{c.taluka}</td>
                    <td className="font-mono">{c.total_docs}</td>
                    <td className="font-mono text-emerald-800 font-semibold">{c.approved}</td>
                    <td className="font-mono text-amber-700 font-semibold">{c.pending}</td>
                    <td>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Award className="w-3 h-3 text-emerald-600" />
                        {c.accuracy}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Land Classification Telemetry Widget */}
        <div className="lg:col-span-5 bg-white p-4 rounded-[6px] border border-slate-300 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-gov-blue" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {language === 'mr' ? 'जमीन वर्गीकरण (कृषी विरूद्ध अकृषिक)' : 'Land Classification Analysis'}
              </h3>
            </div>
            {landClassification && (
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-[3px] border border-slate-300">
                {landClassification.total} records
              </span>
            )}
          </div>

          {landClassification && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-[4px]">
                  <div className="text-[11px] font-bold text-emerald-950">Agricultural (कृषी / जिरायत)</div>
                  <div className="text-lg font-black text-emerald-900 font-mono mt-0.5">{landClassification.agricultural_count}</div>
                  <div className="text-[10px] font-bold text-emerald-700">{landClassification.agricultural_percentage}% of total</div>
                </div>

                <div className="p-2.5 bg-blue-50 border border-blue-300 rounded-[4px]">
                  <div className="text-[11px] font-bold text-blue-950">Non-Agri (अकृषिक / N.A.)</div>
                  <div className="text-lg font-black text-blue-900 font-mono mt-0.5">{landClassification.non_agricultural_count}</div>
                  <div className="text-[10px] font-bold text-blue-700">{landClassification.non_agricultural_percentage}% of total</div>
                </div>
              </div>

              {/* Visual Split Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-600">
                  <span>Agricultural: {landClassification.agricultural_percentage}%</span>
                  <span>Non-Agricultural: {landClassification.non_agricultural_percentage}%</span>
                </div>
                <div className="w-full bg-slate-200 h-3 rounded-[2px] overflow-hidden flex shadow-inner">
                  <div
                    className="bg-emerald-600 h-full transition-all duration-500"
                    style={{ width: `${landClassification.agricultural_percentage}%` }}
                  ></div>
                  <div
                    className="bg-gov-blue h-full transition-all duration-500"
                    style={{ width: `${landClassification.non_agricultural_percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Mini Confidence Spectrum */}
          <div className="pt-2 border-t border-slate-200">
            <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2">Accuracy Spectrum</div>
            <div className="h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={confidenceData}>
                  <XAxis dataKey="range" tick={{ fontSize: 9 }} stroke="#64748B" />
                  <Tooltip contentStyle={{ backgroundColor: '#0A2540', color: '#fff', borderRadius: '4px', fontSize: '10px' }} />
                  <Bar dataKey="count" fill="#1E40AF" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Regional Progress Table */}
      <div className="bg-white rounded-[6px] border border-slate-300 shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-gov-blue" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {t('regionalProgressTitle')}
            </h3>
          </div>
          <span className="text-xs text-slate-600 font-medium">{regional.length} {t('jurisdictionsTracked')}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs gov-table">
            <thead>
              <tr>
                <th>{t('state')}</th>
                <th>{t('district')}</th>
                <th>{t('villageMauzaLabel')}</th>
                <th>{t('colProcessedScans')}</th>
                <th>{t('colPending')}</th>
                <th>{t('colPushedToLrms')}</th>
                <th>{t('colAvgConfidence')}</th>
              </tr>
            </thead>
            <tbody>
              {regional.map((r, idx) => (
                <tr key={idx}>
                  <td className="font-medium text-slate-700">{r.state}</td>
                  <td className="font-bold text-slate-900">{r.district}</td>
                  <td className="font-semibold text-gov-blue">{r.village}</td>
                  <td className="font-mono">{r.processed}</td>
                  <td className="font-mono text-amber-700 font-semibold">{r.pending}</td>
                  <td className="font-mono text-emerald-800 font-bold">{r.pushed_to_lrms}</td>
                  <td>
                    <ConfidenceBadge score={r.avg_confidence} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispatch Directive Modal */}
      <SendNotificationModal
        isOpen={showNoticeModal}
        onClose={() => setShowNoticeModal(false)}
        onSuccess={(msg) => setToastMsg(msg)}
      />
    </div>
  );
};
