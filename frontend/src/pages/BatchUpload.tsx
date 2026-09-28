import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, AlertCircle, ArrowRight, Layers, Trash2, Info } from 'lucide-react';
import { batchesApi, documentsApi } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export const BatchUpload: React.FC = () => {
  const { t } = useLanguage();
  const [batchName, setBatchName] = useState('Land Records Revenue Batch — 01');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [tehsil, setTehsil] = useState('');
  const [village, setVillage] = useState('');

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const filesArr = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...filesArr]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArr]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleStartProcessing = async () => {
    if (!batchName.trim()) {
      setError('Please provide a batch name.');
      return;
    }
    if (selectedFiles.length === 0) {
      setError('Please select at least one scanned land record document.');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      // 1. Create Batch (Location fields are optional and will be automatically extracted from scan text)
      const newBatch = await batchesApi.create({
        name: batchName,
        state: state || 'Central Registry',
        district: district || 'Auto-Detected',
        tehsil: tehsil || 'Auto-Detected',
        village: village || 'Auto-Detected'
      });

      // 2. Fire Asynchronous Non-blocking Upload
      documentsApi.upload(newBatch.id, selectedFiles).catch((err) => {
        console.error('Background processing error:', err);
      });

      // Redirect immediately to Operator Dashboard
      navigate('/operator', {
        state: {
          toast: `Batch "${batchName}" queued with ${selectedFiles.length} document(s). Processing in background.`
        }
      });
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Upload initiation failed. Please check backend connection.');
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-xl font-bold text-slate-900 font-heading tracking-tight">{t('createBatchTitle')}</h1>
        <p className="text-xs text-slate-600 mt-0.5">
          {t('createBatchSubtitle')}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-[4px] text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-700" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Batch Metadata */}
      <div className="bg-white p-5 rounded-[6px] border border-slate-300 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2.5">
          <Layers className="w-4 h-4 text-gov-blue" />
          <span>{t('step1Metadata')}</span>
        </div>

        <div className="bg-blue-50/80 border border-blue-200 p-2.5 rounded-[4px] text-xs text-blue-950 flex items-center gap-2">
          <Info className="w-4 h-4 text-gov-blue shrink-0" />
          <div>
            <span className="font-bold">Automated OCR Extraction: </span>
            <span>District, Tehsil, Village, and Plot Area will be automatically extracted directly from your scanned document content. Filling these below is optional.</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('batchNameLabel')} *
            </label>
            <input
              type="text"
              value={batchName}
              onChange={e => setBatchName(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-[4px] focus:ring-1 focus:ring-gov-blue focus:outline-none"
              placeholder="e.g. Revenue Records Digitization — Batch 01"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('state')}
            </label>
            <input
              type="text"
              value={state}
              onChange={e => setState(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-[4px] bg-slate-50 font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('district')} <span className="text-slate-500 font-normal lowercase">(optional — auto-detected)</span>
            </label>
            <input
              type="text"
              value={district}
              onChange={e => setDistrict(e.target.value)}
              placeholder="Auto-detected (e.g. Raigad, Pune, Nagpur)"
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-[4px] font-medium placeholder:text-slate-400 focus:ring-1 focus:ring-gov-blue focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('tehsilSubDivLabel')} <span className="text-slate-500 font-normal lowercase">(optional — auto-detected)</span>
            </label>
            <input
              type="text"
              value={tehsil}
              onChange={e => setTehsil(e.target.value)}
              placeholder="Auto-detected (e.g. Khalapur, Haveli)"
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-[4px] font-medium placeholder:text-slate-400 focus:ring-1 focus:ring-gov-blue focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('villageMauzaLabel')} <span className="text-slate-500 font-normal lowercase">(optional — auto-detected)</span>
            </label>
            <input
              type="text"
              value={village}
              onChange={e => setVillage(e.target.value)}
              placeholder="Auto-detected (e.g. Posari, Kalote)"
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-[4px] font-medium placeholder:text-slate-400 focus:ring-1 focus:ring-gov-blue focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Step 2: Drag and Drop Upload */}
      <div className="bg-white p-5 rounded-[6px] border border-slate-300 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2.5">
          <UploadCloud className="w-4 h-4 text-gov-blue" />
          <span>{t('step2Scans')}</span>
        </div>

        <div
          onDragOver={e => e.preventDefault()}
          onDrop={handleFileDrop}
          className="border-2 border-dashed border-slate-300 hover:border-gov-blue bg-slate-50 rounded-[4px] p-6 text-center transition cursor-pointer flex flex-col items-center justify-center gap-2.5"
          onClick={() => document.getElementById('file-input-batch')?.click()}
        >
          <div className="w-10 h-10 bg-gov-blue/10 text-gov-blue rounded-[4px] flex items-center justify-center">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">
              {t('dragDropText')} <span className="text-gov-blue underline">{t('browseFiles')}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {t('supportedFormats')}
            </div>
          </div>
          <input
            id="file-input-batch"
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {/* Selected files list */}
        {selectedFiles.length > 0 && (
          <div className="space-y-1.5 pt-2">
            <div className="text-xs font-bold text-slate-800">{t('selectedFilesLabel')} ({selectedFiles.length}):</div>
            <div className="divide-y divide-slate-200 max-h-48 overflow-y-auto border border-slate-300 rounded-[4px] bg-slate-50">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-3.5 h-3.5 text-gov-blue shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">{file.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(idx)}
                    className="text-slate-400 hover:text-rose-700 p-1 rounded transition"
                    title="Remove file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        <div className="pt-3 flex justify-end">
          <button
            onClick={handleStartProcessing}
            disabled={isUploading || selectedFiles.length === 0}
            className="px-5 py-2.5 bg-gov-navy hover:bg-gov-blue text-white rounded-[4px] text-xs font-semibold transition shadow-xs flex items-center gap-2 disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{t('processingPipeline')}...</span>
              </>
            ) : (
              <>
                <span>{t('startExtractionBtn')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

