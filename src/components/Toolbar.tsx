import React from 'react';
import {
  Wand2,
  Plus,
  Trash2,
  Download,
  RotateCcw,
  Square,
  Grid,
  Droplets,
  Layers,
  ArrowLeft
} from 'lucide-react';
import type { CensorStyle, CensorBox } from '../types/dni';

interface ToolbarProps {
  onAutoDetect: () => void;
  isDetecting: boolean;
  onApplyPreset: (type: 'front' | 'back') => void;
  isDrawMode: boolean;
  onToggleDrawMode: () => void;
  selectedBox: CensorBox | null;
  onDeleteSelected: () => void;
  onClearAll: () => void;
  censorStyle: CensorStyle;
  onChangeStyle: (style: CensorStyle) => void;
  onOpenExport: () => void;
  onResetImage: () => void;
  boxCount: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onAutoDetect,
  isDetecting,
  onApplyPreset,
  isDrawMode,
  onToggleDrawMode,
  selectedBox,
  onDeleteSelected,
  onClearAll,
  censorStyle,
  onChangeStyle,
  onOpenExport,
  onResetImage,
  boxCount,
}) => {
  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl space-y-3">
      {/* Top Bar: Primary Actions & Export */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={onResetImage}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            title="Cambiar imagen"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Otra foto</span>
          </button>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* Auto-detect button */}
          <button
            onClick={onAutoDetect}
            disabled={isDetecting}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-teal-900/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Wand2 className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
            <span>{isDetecting ? 'Detectando con OpenCV...' : 'Auto-detectar'}</span>
          </button>

          {/* Add custom manual box */}
          <button
            onClick={onToggleDrawMode}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isDrawMode
                ? 'bg-teal-500 text-slate-950 ring-2 ring-teal-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isDrawMode ? 'Dibujá sobre el DNI' : 'Agregar zona'}</span>
          </button>
        </div>

        {/* Export / Download Safe DNI Button */}
        <button
          onClick={onOpenExport}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer hover:scale-[1.02]"
        >
          <Download className="w-4 h-4" />
          <span>Descargar DNI Seguro</span>
        </button>
      </div>

      {/* Secondary Bar: Presets, Style Selector, Delete */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
        {/* Presets */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mr-1 hidden md:inline">Presets:</span>
          <button
            onClick={() => onApplyPreset('front')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/50 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Layers className="w-3 h-3 text-sky-400" />
            <span>DNI Frente</span>
          </button>
          <button
            onClick={() => onApplyPreset('back')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/50 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Layers className="w-3 h-3 text-amber-400" />
            <span>DNI Dorso</span>
          </button>
        </div>

        {/* Censor Style Toggle */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-500 font-mono px-2 hidden sm:inline">Estilo:</span>
          <button
            onClick={() => onChangeStyle('solid')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              censorStyle === 'solid'
                ? 'bg-slate-800 text-white font-semibold shadow-sm text-teal-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Bloque negro destructivo (Más seguro)"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Negro</span>
          </button>
          <button
            onClick={() => onChangeStyle('pixelate')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              censorStyle === 'pixelate'
                ? 'bg-slate-800 text-white font-semibold shadow-sm text-teal-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Pixelado destructivo"
          >
            <Grid className="w-3 h-3" />
            <span>Pixelado</span>
          </button>
          <button
            onClick={() => onChangeStyle('blur')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              censorStyle === 'blur'
                ? 'bg-slate-800 text-white font-semibold shadow-sm text-teal-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Desenfoque profundo"
          >
            <Droplets className="w-3 h-3" />
            <span>Blur</span>
          </button>
        </div>

        {/* Box management: Delete selected or Clear all */}
        <div className="flex items-center gap-2">
          {selectedBox && (
            <button
              onClick={onDeleteSelected}
              className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors flex items-center gap-1 cursor-pointer"
              title="Eliminar caja seleccionada"
            >
              <Trash2 className="w-3 h-3" />
              <span>Borrar zona</span>
            </button>
          )}

          {boxCount > 0 && (
            <button
              onClick={onClearAll}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Limpiar todas las cajas"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
