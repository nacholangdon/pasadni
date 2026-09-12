import React, { useEffect, useState } from 'react';
import { X, Download, ShieldCheck, FileCheck, Sliders, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CensorBox, CensorStyle } from '../types/dni';
import { generateRedactedCanvas } from '../utils/canvasFilters';
import { triggerDownload, formatBytes } from '../utils/fileHelpers';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: HTMLImageElement;
  boxes: CensorBox[];
  censorStyle: CensorStyle;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  image,
  boxes,
  censorStyle,
}) => {
  const [quality, setQuality] = useState<number>(0.90);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileBlob, setFileBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  // Re-generate export preview when quality or boxes change
  useEffect(() => {
    if (!isOpen) return;

    setIsGenerating(true);
    let isCancelled = false;

    const timeout = setTimeout(() => {
      try {
        const offCanvas = generateRedactedCanvas(image, boxes, censorStyle);
        offCanvas.toBlob(
          (blob) => {
            if (isCancelled || !blob) return;
            setFileBlob(blob);
            const url = URL.createObjectURL(blob);
            setPreviewUrl((old) => {
              if (old) URL.revokeObjectURL(old);
              return url;
            });
            setIsGenerating(false);
          },
          'image/jpeg',
          quality
        );
      } catch (err) {
        console.error('Error al generar imagen de exportación:', err);
        setIsGenerating(false);
      }
    }, 50);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [isOpen, image, boxes, censorStyle, quality]);

  const handleDownload = () => {
    if (!fileBlob) return;

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `DNI_Seguro_PasaDNI_${timestamp}.jpg`;
    triggerDownload(fileBlob, filename);

    setIsDownloaded(true);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#14b8a6', '#0284c7', '#38bdf8', '#f59e0b']
    });

    setTimeout(() => {
      setIsDownloaded(false);
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/90 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Listo para Descargar</h3>
              <p className="text-xs text-slate-400">Verificá el resultado seguro antes de guardar</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Preview */}
        <div className="py-4 space-y-4">
          {/* Image Preview Window */}
          <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center max-h-[45vh]">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Vista previa DNI Seguro"
                className="max-h-[45vh] w-auto object-contain mx-auto"
              />
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs font-mono">
                {isGenerating ? 'Generando imagen rasterizada segura...' : 'Cargando...'}
              </div>
            )}

            {/* Zero-Trust badge overlay */}
            <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-sm border border-slate-700 text-[10px] text-emerald-400 font-mono flex items-center gap-1.5 shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>EXIF Limpio · Sin Rastro</span>
            </div>
          </div>

          {/* Quality and Size Control */}
          <div className="bg-slate-950/60 rounded-2xl p-3 sm:p-4 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <Sliders className="w-3.5 h-3.5 text-teal-400" />
                <span>Calidad JPEG: {Math.round(quality * 100)}%</span>
              </div>
              <span className="font-mono text-teal-400 font-semibold text-xs">
                {fileBlob ? formatBytes(fileBlob.size) : 'Calculando...'}
              </span>
            </div>

            <input
              type="range"
              min="0.65"
              max="0.98"
              step="0.05"
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              className="w-full accent-teal-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-[11px] sm:text-xs text-slate-300">
            <FileCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              Esta imagen fue re-comprimida en tu equipo. Los datos tapados han sido destruidos y reemplazados en la matriz de píxeles, garantizando que no puedan ser desocultados.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Volver a editar
          </button>

          <button
            onClick={handleDownload}
            disabled={!fileBlob || isGenerating}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
              isDownloaded
                ? 'bg-emerald-700 text-white'
                : 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white shadow-teal-950/40 hover:scale-[1.02]'
            }`}
          >
            {isDownloaded ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>¡Descargado!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Descargar DNI Seguro</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
