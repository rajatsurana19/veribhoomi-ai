import React, { useState, useEffect } from 'react';
import { X, Send, AlertTriangle, FileText, User, CheckCircle2, BellRing } from 'lucide-react';
import { authApi, notificationsApi, batchesApi } from '../../services/api';
import { User as UserType, BatchItem } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface SendNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  defaultDocumentId?: string;
  defaultBatchId?: string;
}

export const SendNotificationModal: React.FC<SendNotificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultDocumentId,
  defaultBatchId
}) => {
  const { t, language } = useLanguage();
  const [operators, setOperators] = useState<UserType[]>([]);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [recipient, setRecipient] = useState<string>('all');
  const [type, setType] = useState<string>('redo_request');
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>(defaultBatchId || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    const loadData = async () => {
      try {
        const [users, batchList] = await Promise.all([
          authApi.listUsers('operator').catch(() => []),
          batchesApi.list().catch(() => [])
        ]);
        setOperators(users);
        setBatches(batchList);
      } catch (e) {
        // quiet
      }
    };
    loadData();
    if (defaultBatchId) setSelectedBatchId(defaultBatchId);
  }, [isOpen, defaultBatchId]);

  if (!isOpen) return null;

  const quickTemplates = [
    {
      title: language === 'mr' ? 'खातेदार नाव फेरपडताळणी' : 'Re-verify Khatedar Names',
      msg: language === 'mr' 
        ? 'कृपया मूळ सातबारा स्कॅनशी खातेदारांची नावे तपासून घ्या. विसंगती आढळल्यास दुरुस्ती करा.'
        : 'Please verify the extracted Khatedar names against the original 7/12 scan document and rectify discrepancies.'
    },
    {
      title: language === 'mr' ? 'क्षेत्रफळ बेरीज तफावत दुरुस्ती' : 'Rectify Area Balance Mismatch',
      msg: language === 'mr'
        ? 'आकारणी व पोटखराब क्षेत्राची बेरीज एकूण क्षेत्राशी जुळत नाही. कृपया गणना पुन्हा तपासा.'
        : 'The sum of cultivated area and Pot-Kharaba does not match the total holding area. Please re-calculate.'
    },
    {
      title: language === 'mr' ? 'अंधेरी-ओशिवरा प्रलंबित काम पूर्ण करा' : 'Expedite Pending Batches',
      msg: language === 'mr'
        ? 'आज सायंकाळपर्यंत अंधेरी व ओशिवरा मंडळातील प्रलंबित अभिलेखांची पडताळणी पूर्ण करावी.'
        : 'Ensure all pending documents in Andheri and Oshiwara revenue batches are verified and submitted by EOD.'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError(language === 'mr' ? 'कृपया शीर्षक आणि संदेश दोन्ही प्रविष्ट करा.' : 'Please provide both title and message.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await notificationsApi.send({
        recipient_role: 'operator',
        recipient_user_id: recipient === 'all' ? 'all' : recipient,
        batch_id: selectedBatchId || undefined,
        document_id: defaultDocumentId || undefined,
        title: title.trim(),
        message: message.trim(),
        type: type
      });

      const successMsg = language === 'mr'
        ? 'ऑपरेटरकडे सूचना व आदेश यशस्वीरित्या पाठवले गेले.'
        : 'Directive & notification successfully dispatched to operator(s).';

      if (onSuccess) onSuccess(successMsg);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to dispatch notification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-[6px] shadow-2xl border border-slate-300 max-w-xl w-full p-5 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] bg-[#0A2540] text-white flex items-center justify-center">
              <BellRing className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0A2540]">
                {language === 'mr' ? 'ऑपरेटरकडे सूचना व आदेश पाठवा' : 'Dispatch Directive / Notice to Operators'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {language === 'mr' ? 'तलाठी व ऑपरेटर यांच्या कार्यकक्षेत तात्काळ सूचना पाठवण्यासाठी' : 'Send administrative directives, redo requests, or notifications to revenue staff'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-[4px] text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Recipient Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                {language === 'mr' ? 'प्राप्तकर्ता (ऑपरेटर)' : 'Recipient Operator'}
              </label>
              <select
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-[4px] px-2.5 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#1E40AF]"
              >
                <option value="all">
                  {language === 'mr' ? '📢 सर्व ऑपरेटर (तलाठी)' : '📢 All Revenue Operators (Broadcast)'}
                </option>
                {operators.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.full_name} ({op.designation || 'Operator'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                {language === 'mr' ? 'सूचनेचा प्रकार' : 'Notice Type'}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-[4px] px-2.5 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#1E40AF]"
              >
                <option value="redo_request">
                  {language === 'mr' ? '🔴 फेरपडताळणी / Redo Request' : '🔴 Redo / Correction Request'}
                </option>
                <option value="instruction">
                  {language === 'mr' ? '⚖️ प्रशासकीय आदेश / Directive' : '⚖️ Administrative Directive'}
                </option>
                <option value="urgent_notice">
                  {language === 'mr' ? '⚡ तात्काळ सूचना / Urgent' : '⚡ Urgent Action Required'}
                </option>
                <option value="info">
                  {language === 'mr' ? 'ℹ️ सर्वसाधारण माहिती / General Info' : 'ℹ️ General Information'}
                </option>
              </select>
            </div>
          </div>

          {/* Associated Batch */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              {language === 'mr' ? 'संबंधित महसूल संच (ऐच्छिक)' : 'Associated Revenue Batch (Optional)'}
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-[4px] px-2.5 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#1E40AF]"
            >
              <option value="">{language === 'mr' ? '-- कोणताही संच नाही --' : '-- No Specific Batch Linked --'}</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.district} - {b.village})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Preset Templates */}
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5">
              {language === 'mr' ? 'त्वरित नमुना संदेश:' : 'Quick Directive Templates:'}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickTemplates.map((tmpl, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    setTitle(tmpl.title);
                    setMessage(tmpl.msg);
                  }}
                  className="text-[11px] px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-800 border border-slate-300 rounded-[3px] transition text-left"
                >
                  + {tmpl.title}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              {language === 'mr' ? 'सूचनेचे शीर्षक' : 'Notice Subject / Title'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={language === 'mr' ? 'उदा. खातेदारांच्या नावांमधील तफावत' : 'e.g., Verify Khatedar Names in Survey 14'}
              className="w-full text-xs border border-slate-300 rounded-[4px] px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#1E40AF]"
              required
            />
          </div>

          {/* Message Content */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              {language === 'mr' ? 'सविस्तर आदेश / संदेश' : 'Detailed Directive / Instructions'}
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={language === 'mr' ? 'ऑपरेटरने करावयाच्या सुधारणा किंवा कार्यवाहीचे स्पष्ट निर्देश प्रविष्ट करा...' : 'Specify the exact corrective action, survey parcel, or procedural directive required...'}
              className="w-full text-xs border border-slate-300 rounded-[4px] px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#1E40AF]"
              required
            ></textarea>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-[4px] hover:bg-slate-100 transition"
            >
              {language === 'mr' ? 'रद्द करा' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#0A2540] hover:bg-[#1E40AF] rounded-[4px] shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === 'mr' ? 'आदेश पाठवा' : 'Dispatch Directive'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
