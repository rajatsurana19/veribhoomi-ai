import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Maximize2, FileText, Eye, ExternalLink, Download } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface DocumentViewerProps {
  imageUrl: string;
  filename: string;
  highlightKhasra?: boolean;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  imageUrl,
  filename,
  highlightKhasra = false
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const { t } = useLanguage();

  const isPdf = filename?.toLowerCase().endsWith('.pdf') || (imageUrl && imageUrl.toLowerCase().includes('.pdf'));

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPdf) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && !isPdf) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-[6px] overflow-hidden border border-slate-700 shadow-sm">
      {/* Viewer Toolbar */}
      <div className="bg-slate-950 px-3.5 py-2 flex items-center justify-between border-b border-slate-800 text-slate-300">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gov-saffron" />
          <span className="text-xs font-semibold text-slate-200 truncate max-w-[200px]" title={filename}>
            {filename}
          </span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-[3px] font-mono border border-slate-700">
            {t('immutableScanBadge')}
          </span>
          {isPdf && (
            <span className="text-[10px] bg-red-950 text-red-300 px-1.5 py-0.5 rounded-[3px] font-mono border border-red-800 font-bold">
              PDF SCAN
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {imageUrl && (
            <>
              <a
                href={imageUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 hover:bg-slate-800 rounded-[3px] transition text-slate-300 hover:text-white"
                title="Open original scan in full new window"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={imageUrl}
                download={filename || 'scan.pdf'}
                className="p-1.5 hover:bg-slate-800 rounded-[3px] transition text-slate-300 hover:text-white"
                title="Download original scan"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </>
          )}

          {!isPdf && (
            <>
              <button
                onClick={() => setZoom(prev => Math.min(prev + 0.25, 3.5))}
                className="p-1.5 hover:bg-slate-800 rounded-[3px] transition text-slate-300 hover:text-white"
                title={t('zoomIn')}
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.5))}
                className="p-1.5 hover:bg-slate-800 rounded-[3px] transition text-slate-300 hover:text-white"
                title={t('zoomOut')}
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setRotation(prev => (prev + 90) % 360)}
                className="p-1.5 hover:bg-slate-800 rounded-[3px] transition text-slate-300 hover:text-white"
                title={t('rotate')}
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={resetView}
                className="p-1.5 hover:bg-slate-800 rounded-[3px] transition text-slate-300 hover:text-white text-xs px-2 font-medium"
                title={t('fitToScreen')}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono text-slate-400 pl-2 border-l border-slate-800">
                {Math.round(zoom * 100)}%
              </span>
            </>
          )}
        </div>
      </div>

      {/* Canvas / Document Viewport */}
      {isPdf ? (
        <div className="relative flex-1 w-full h-[650px] bg-slate-900 overflow-hidden flex flex-col">
          {imageUrl ? (
            <iframe
              src={`${imageUrl}#toolbar=1&navpanes=0`}
              className="w-full h-full border-0 bg-white"
              title={filename}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-400 text-center">
              <FileText className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-300">Loading Authentic PDF Scan...</p>
              <p className="text-xs text-slate-500 mt-1">Decrypting stream from secure cryptographic vault</p>
            </div>
          )}
        </div>
      ) : (
        <div
          className="relative flex-1 overflow-hidden cursor-grab active:cursor-grabbing flex items-center justify-center p-4 select-none bg-slate-900 min-h-[600px]"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="relative transition-transform duration-75 ease-out max-h-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`
            }}
          >
            <img
              src={imageUrl || '/sample-scans/sample_01.png'}
              alt="Original Land Record Scan"
              className="max-h-[680px] w-auto rounded-[4px] shadow-lg border border-slate-700 pointer-events-none object-contain bg-white"
              onError={(e) => {
                // If blob or path fails, fallback safely
                (e.target as HTMLImageElement).src = '/sample-scans/sample_01.png';
              }}
            />

            {/* Region Highlight Bounding Box for Khasra */}
            {highlightKhasra && (
              <div
                className="absolute top-[28%] left-[34%] w-[32%] h-[6%] border-2 border-dashed border-rose-500 bg-rose-500/15 rounded-[3px] pointer-events-none animate-pulse flex items-center justify-end pr-2"
              >
                <span className="bg-rose-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[2px] shadow-xs">
                  {t('khasraBbox')}
                </span>
              </div>
            )}
          </div>

          {/* Watermark overlay */}
          <div className="absolute bottom-2.5 left-2.5 bg-slate-950/90 px-2.5 py-1 rounded-[4px] border border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5 pointer-events-none">
            <Eye className="w-3.5 h-3.5 text-gov-saffron" />
            <span>{t('viewerGuide')}</span>
          </div>
        </div>
      )}
    </div>
  );
};
