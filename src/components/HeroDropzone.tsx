import React, { useRef, useState } from 'react';
import {
  Camera,
  UploadCloud,
  ShieldAlert,
  Sparkles,
  Image as ImageIcon,
  AlertCircle,
  Bookmark,
  Share2,
  Trash2,
  SlidersHorizontal,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import type { SavedDniRecord } from '../types/dni';

interface HeroDropzoneProps {
  onImageSelected: (file: File) => void;
  onLoadSample: () => void;
  onLoadSavedDni: (record: SavedDniRecord) => void;
  onQuickShareSavedDni: (record: SavedDniRecord) => void;
  savedDnis: SavedDniRecord[];
  onDeleteSavedDni: (id: string) => void;
  isLoading?: boolean;
}

export const HeroDropzone: React.FC<HeroDropzoneProps> = ({
  onImageSelected,
  onLoadSample,
  onLoadSavedDni,
  onQuickShareSavedDni,
  savedDnis,
  onDeleteSavedDni,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor seleccioná un archivo de imagen válido (JPG, PNG, WEBP).');
      return;
    }
    onImageSelected(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const formatDate = (timestamp: number) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-8">
      {/* Title & Introduction */}
      <div className="text-center space-y-3 sm:space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-teal-300 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>Visión artificial asistida en tu navegador</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Compartí tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-sky-400">DNI</span> sin regalar tu identidad
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          El <strong>Número de Trámite</strong> y la <strong>Firma</strong> permiten a terceros validar cuentas bancarias o créditos a tu nombre. Censuralos antes de enviar tu documento por WhatsApp o email.
        </p>
      </div>

      {/* Saved DNIs Section (if user has any saved documents) */}
      {savedDnis.length > 0 && (
        <div className="bg-gradient-to-b from-slate-900/90 to-slate-900/50 border border-teal-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-md space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
                <Bookmark className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>Tus DNI Guardados en este dispositivo</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    {savedDnis.length} {savedDnis.length === 1 ? 'documento' : 'documentos'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Listos para compartir al instante sin tener que volver a escanear
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Guardado 100% local</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {savedDnis.map((dni) => (
              <div
                key={dni.id}
                className="bg-slate-950/70 border border-slate-800 hover:border-teal-500/40 rounded-2xl p-3.5 sm:p-4 flex gap-3.5 transition-all shadow-md group"
              >
                {/* Thumbnail */}
                <div className="w-24 sm:w-28 h-20 sm:h-24 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center relative">
                  {dni.thumbnailUrl ? (
                    <img
                      src={dni.thumbnailUrl}
                      alt={dni.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-600" />
                  )}
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-900/90 text-teal-300 border border-slate-700">
                    {dni.side === 'front' ? 'Frente' : dni.side === 'back' ? 'Dorso' : 'DNI'}
                  </span>
                </div>

                {/* Info & Actions */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-white text-sm truncate">
                        {dni.title}
                      </h4>
                      <button
                        onClick={() => {
                          if (confirm(`¿Querés eliminar "${dni.title}" de este dispositivo?`)) {
                            onDeleteSavedDni(dni.id);
                          }
                        }}
                        className="text-slate-500 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Eliminar de este dispositivo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-teal-400">
                        <ShieldAlert className="w-3 h-3" />
                        <span>{dni.boxes.length} {dni.boxes.length === 1 ? 'zona' : 'zonas'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(dni.updatedAt)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => onLoadSavedDni(dni)}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3 h-3 text-teal-400" />
                      <span>Editar</span>
                    </button>

                    <button
                      onClick={() => onQuickShareSavedDni(dni)}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-teal-950/50 cursor-pointer hover:scale-[1.02]"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>Compartir</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Box Container */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-10 text-center transition-all duration-200 ${
          isDragOver
            ? 'border-teal-400 bg-teal-950/20 scale-[1.01]'
            : 'border-slate-700/80 hover:border-slate-600 bg-slate-900/40 hover:bg-slate-900/60'
        } backdrop-blur-sm shadow-xl`}
      >
        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        <div className="max-w-md mx-auto space-y-5">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-teal-400 shadow-inner group-hover:scale-105 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base sm:text-xl font-bold text-white">
              {savedDnis.length > 0 ? 'O subí otra foto de DNI' : 'Arrastrá la foto de tu DNI aquí'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Formatos soportados: JPG, PNG o WEBP. Todo el proceso es 100% local.
            </p>
          </div>

          {/* Action Buttons: Gallery and Mobile Camera */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-semibold text-sm rounded-2xl shadow-lg shadow-teal-900/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Elegir de la galería</span>
            </button>

            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={isLoading}
              className="w-full sm:w-auto px-5 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm rounded-2xl flex items-center justify-center gap-2.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Camera className="w-4 h-4 text-teal-400" />
              <span>Tomar con la cámara</span>
            </button>
          </div>

          {/* Quick Demo Sample Option */}
          <div className="pt-3 border-t border-slate-800/80">
            <button
              onClick={onLoadSample}
              type="button"
              className="text-xs text-slate-400 hover:text-teal-300 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>¿No tenés una foto a mano?</span>
              <span className="underline decoration-teal-500/50 underline-offset-4 text-teal-400 hover:text-teal-300">
                Probar con un DNI de muestra
              </span>
            </button>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* Security info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <h4 className="font-semibold text-white text-sm mb-1">N° de Trámite</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Es la clave de seguridad del Renaper para autenticaciones ante bancos, billeteras virtuales y organismos públicos.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-3">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="font-semibold text-white text-sm mb-1">Firma y Huella</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Datos biométricos y grafológicos que nunca deberías compartir con desconocidos o alquileres temporarios.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <h4 className="font-semibold text-white text-sm mb-1">Cero Riesgo</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Funciona completamente offline tras cargar la página. Nadie tiene acceso a lo que subas.
          </p>
        </div>
      </div>
    </div>
  );
};
