import React, { useRef, useState } from 'react';
import { Camera, UploadCloud, ShieldAlert, Sparkles, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface HeroDropzoneProps {
  onImageSelected: (file: File) => void;
  onLoadSample: () => void;
  isLoading?: boolean;
}

export const HeroDropzone: React.FC<HeroDropzoneProps> = ({
  onImageSelected,
  onLoadSample,
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Title & Introduction */}
      <div className="text-center space-y-4 mb-8 sm:mb-12">
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

      {/* Upload Box Container */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-12 text-center transition-all duration-200 ${
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

        <div className="max-w-md mx-auto space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-teal-400 shadow-inner group-hover:scale-105 transition-transform">
            <UploadCloud className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl font-bold text-white">
              Arrastrá la foto de tu DNI aquí
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Formatos soportados: JPG, PNG o WEBP. Todo el proceso es 100% local.
            </p>
          </div>

          {/* Action Buttons: Gallery and Mobile Camera */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-semibold text-sm rounded-2xl shadow-lg shadow-teal-900/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Elegir de la galería</span>
            </button>

            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm rounded-2xl flex items-center justify-center gap-2.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 sm:mt-12">
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
