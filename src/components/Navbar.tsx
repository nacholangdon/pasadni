import { useState } from 'react';
import { ShieldCheck, Lock, Info, X, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <>
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20 ring-1 ring-white/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xl tracking-tight text-white font-mono">Pasa<span className="text-teal-400">DNI</span></span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  AR 🇦🇷
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Censurá trámite, firma y huella de forma segura</p>
            </div>
          </div>

          {/* Zero-Trust Badge & Github */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="https://github.com/nacholangdon/pasadni"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center"
              title="Ver código fuente en GitHub"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            </a>

            <button
              onClick={() => setShowInfoModal(true)}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all text-xs font-medium cursor-pointer"
              title="Ver detalles de privacidad Zero-Trust"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden sm:inline font-mono">100% Client-Side</span>
              <span className="sm:hidden font-mono">Zero-Trust</span>
              <Info className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
            </button>
          </div>
        </div>
      </header>

      {/* Security & Privacy Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Garantía Zero-Trust</h3>
                <p className="text-xs text-slate-400">Privacidad absoluta en tu dispositivo</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <p><strong className="text-white">Cero envíos a servidores:</strong> Tu imagen nunca sale de la memoria de tu navegador. No hay backend ni bases de datos.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <p><strong className="text-white">Censura destructiva:</strong> Los píxeles tapados son reemplazados matemáticamente en el canvas. Ningún software de IA o edición puede revertirlos.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <p><strong className="text-white">Eliminación de metadatos EXIF:</strong> Al exportar la imagen, se purgan automáticamente las coordenadas GPS, modelo de cámara y fecha original.</p>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Podés verificarlo abriendo las herramientas de desarrollador (F12) en la pestaña <em>Network</em>: verás que no se realiza ninguna petición HTTP con los datos de tu documento.
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
