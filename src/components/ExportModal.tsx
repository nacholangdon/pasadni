import React, { useEffect, useState } from 'react';
import {
  X,
  Download,
  ShieldCheck,
  FileCheck,
  Sliders,
  CheckCircle2,
  Share2,
  Copy,
  Mail,
  Bookmark,
  BookmarkCheck,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CensorBox, CensorStyle } from '../types/dni';
import { generateRedactedCanvas } from '../utils/canvasFilters';
import {
  triggerDownload,
  formatBytes,
  copyImageToClipboard,
  shareImageFile,
  canShareFiles,
  getWhatsAppShareUrl,
  getTelegramShareUrl,
  getEmailShareUrl,
} from '../utils/fileHelpers';
import {
  saveDniRecord,
  imageToDataUrl,
  generateThumbnail,
} from '../utils/dniStorage';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: HTMLImageElement;
  boxes: CensorBox[];
  censorStyle: CensorStyle;
  onSavedChange?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  image,
  boxes,
  censorStyle,
  onSavedChange,
}) => {
  const [quality, setQuality] = useState<number>(0.90);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileBlob, setFileBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);
  const [isSavedLocally, setIsSavedLocally] = useState(false);
  const [isSavingLocally, setIsSavingLocally] = useState(false);
  const [customTitle, setCustomTitle] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const defaultTitle = boxes.some((b) => b.type === 'tramite' || b.type === 'firma')
    ? 'DNI Frente'
    : (boxes.some((b) => b.type === 'huella' || b.type === 'mrz') ? 'DNI Dorso' : 'Mi DNI Protegido');
  const saveTitle = customTitle !== null ? customTitle : defaultTitle;

  const hasNativeShare = typeof window !== 'undefined' && canShareFiles();


  // Re-generate export preview when quality or boxes change
  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;
    const timeout = setTimeout(() => {
      try {
        setIsGenerating(true);
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
    }, 40);

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
      colors: ['#14b8a6', '#0284c7', '#38bdf8', '#f59e0b'],
    });

    setTimeout(() => {
      setIsDownloaded(false);
    }, 3000);
  };

  // Copy rasterized image directly to clipboard
  const handleCopyImage = async () => {
    if (!fileBlob) return;
    try {
      setCopiedStatus('Copiando...');
      await copyImageToClipboard(fileBlob);
      setCopiedStatus('¡Imagen copiada!');
      confetti({
        particleCount: 40,
        spread: 45,
        origin: { y: 0.8 },
      });
      setTimeout(() => setCopiedStatus(null), 3500);
    } catch (err: any) {
      console.error('Error al copiar imagen:', err);
      setCopiedStatus('No se pudo copiar');
      setTimeout(() => setCopiedStatus(null), 3000);
    }
  };

  // Native share sheet (for smartphones & supported desktops)
  const handleNativeShare = async () => {
    if (!fileBlob) return;
    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `DNI_Seguro_${timestamp}.jpg`;
      const success = await shareImageFile(
        fileBlob,
        filename,
        'DNI Seguro',
        'Te comparto mi DNI con datos sensibles protegidos (procesado con PasaDNI).'
      );
      if (success) {
        setShareFeedback('¡Compartido con éxito!');
        setTimeout(() => setShareFeedback(null), 3000);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('Error al compartir:', err);
      }
    }
  };

  // Share via WhatsApp
  const handleWhatsAppShare = async () => {
    if (!fileBlob) return;

    // If mobile native share is available, try it first so file is attached
    if (hasNativeShare) {
      handleNativeShare();
      return;
    }

    // On desktop / WhatsApp Web, copy image to clipboard and open WhatsApp
    try {
      await copyImageToClipboard(fileBlob);
      setShareFeedback('¡Imagen copiada al portapapeles! Pegala con Ctrl+V en WhatsApp.');
    } catch {
      setShareFeedback('Abriendo WhatsApp...');
    }

    const message = 'Hola, te comparto mi DNI seguro sin datos sensibles (procesado de forma privada con PasaDNI).';
    const waUrl = getWhatsAppShareUrl(message);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => setShareFeedback(null), 5000);
  };

  // Share via Telegram
  const handleTelegramShare = async () => {
    if (!fileBlob) return;

    if (hasNativeShare) {
      handleNativeShare();
      return;
    }

    try {
      await copyImageToClipboard(fileBlob);
      setShareFeedback('¡Imagen copiada! Pegala en tu chat de Telegram.');
    } catch {
      setShareFeedback('Abriendo Telegram...');
    }

    const message = 'Te comparto mi DNI seguro procesado localmente con PasaDNI.';
    const tgUrl = getTelegramShareUrl(message);
    window.open(tgUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => setShareFeedback(null), 5000);
  };

  // Share via Email
  const handleEmailShare = () => {
    const subject = 'DNI Protegido';
    const body =
      'Hola,\n\nTe adjunto mi DNI con los datos sensibles censurados (número de trámite / firma / huella) para proteger mi privacidad.\n\nGenerado de forma 100% privada con PasaDNI.';
    const emailUrl = getEmailShareUrl(subject, body);
    window.open(emailUrl, '_self');
    setShareFeedback('Recordá adjuntar o pegar la imagen descargada en tu correo.');
    setTimeout(() => setShareFeedback(null), 5000);
  };

  // Save DNI to local IndexedDB
  const handleSaveToDevice = async () => {
    if (!image || isSavingLocally) return;

    try {
      setIsSavingLocally(true);
      const rawDataUrl = imageToDataUrl(image);
      const thumbUrl = generateThumbnail(image, 340);
      const isBack = boxes.some((b) => b.type === 'huella' || b.type === 'mrz');
      const side = isBack ? 'back' : 'front';

      await saveDniRecord({
        title: saveTitle.trim() || (side === 'front' ? 'DNI Frente' : 'DNI Dorso'),
        side,
        imageDataUrl: rawDataUrl,
        thumbnailUrl: thumbUrl,
        boxes,
        censorStyle,
      });

      setIsSavedLocally(true);
      if (onSavedChange) onSavedChange();

      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#14b8a6', '#10b981'],
      });
    } catch (err: any) {
      console.error('Error al guardar en el dispositivo:', err);
      alert('Error al guardar localmente: ' + (err?.message || 'Error desconocido'));
    } finally {
      setIsSavingLocally(false);
    }
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
              <h3 className="text-base sm:text-lg font-bold text-white">Listo para Compartir o Descargar</h3>
              <p className="text-xs text-slate-400">Verificá el resultado seguro antes de enviar</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Preview */}
        <div className="py-4 space-y-4">
          {/* Image Preview Window */}
          <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center max-h-[38vh]">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Vista previa DNI Seguro"
                className="max-h-[38vh] w-auto object-contain mx-auto"
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

          {/* Feedback alert if any */}
          {shareFeedback && (
            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>{shareFeedback}</span>
            </div>
          )}

          {/* Social Share & Copy Section */}
          <div className="bg-slate-950/70 rounded-2xl p-3 sm:p-4 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Compartir directo</span>
              </span>
              <span className="text-[11px] text-slate-500">Envío seguro</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* WhatsApp button */}
              <button
                onClick={handleWhatsAppShare}
                disabled={!fileBlob || isGenerating}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs font-semibold transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                title="Compartir por WhatsApp"
              >
                {/* Custom WhatsApp SVG */}
                <svg className="w-4 h-4 fill-current text-[#25D366]" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
                <span>WhatsApp</span>
              </button>

              {/* Telegram button */}
              <button
                onClick={handleTelegramShare}
                disabled={!fileBlob || isGenerating}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-sky-600/15 hover:bg-sky-600/25 border border-sky-500/30 text-sky-300 hover:text-sky-200 text-xs font-semibold transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                title="Compartir por Telegram"
              >
                <svg className="w-4 h-4 fill-current text-[#229ED9]" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.43 7.82l-2.04 9.63c-.15.68-.56.85-1.12.53l-3.1-2.28-1.5 1.44c-.17.17-.31.31-.63.31l.22-3.18 5.79-5.23c.25-.22-.05-.35-.39-.12L7.5 13.51l-3.08-.96c-.67-.21-.68-.67.14-.99l12.04-4.64c.56-.21 1.05.13.83.9z"/>
                </svg>
                <span>Telegram</span>
              </button>

              {/* Email button */}
              <button
                onClick={handleEmailShare}
                disabled={!fileBlob || isGenerating}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-300 hover:text-indigo-200 text-xs font-semibold transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                title="Compartir por Email"
              >
                <Mail className="w-4 h-4 text-indigo-400" />
                <span>Email</span>
              </button>

              {/* Copy Image to Clipboard */}
              <button
                onClick={handleCopyImage}
                disabled={!fileBlob || isGenerating}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                  copiedStatus
                    ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-200'
                }`}
                title="Copiar imagen directamente al portapapeles para pegar con Ctrl+V"
              >
                {copiedStatus ? <CheckCircle2 className="w-4 h-4 text-teal-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copiedStatus || 'Copiar imagen'}</span>
              </button>
            </div>

            {/* Mobile native share button if supported */}
            {hasNativeShare && (
              <button
                onClick={handleNativeShare}
                disabled={!fileBlob || isGenerating}
                className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/90 border border-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5 text-teal-400" />
                <span>Abrir menú de compartir del sistema (AirDrop, WhatsApp, etc.)</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>

          {/* Local Storage Saving Option (Zero-Trust) */}
          <div className="bg-slate-950/50 rounded-2xl p-3 sm:p-4 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Bookmark className="w-3.5 h-3.5 text-teal-400" />
                <span>Guardar en este dispositivo</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 font-mono">
                  IndexedDB
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Evitá tener que escanear de nuevo: guardalo 100% en tu navegador para futuros envíos.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={saveTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Nombre (ej. DNI Frente)"
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-teal-500 w-32 sm:w-28 text-center"
              />
              <button
                onClick={handleSaveToDevice}
                disabled={isSavingLocally || isSavedLocally}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  isSavedLocally
                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-teal-600 hover:bg-teal-500 text-white shadow-sm hover:scale-[1.02]'
                }`}
              >
                {isSavedLocally ? (
                  <>
                    <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>¡Guardado!</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{isSavingLocally ? 'Guardando...' : 'Guardar'}</span>
                  </>
                )}
              </button>
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
                <span>Descargar Archivo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
