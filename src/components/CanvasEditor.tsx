import React, { useRef } from 'react';
import type { CensorBox, CensorStyle } from '../types/dni';
import { useCanvasEditor } from '../hooks/useCanvasEditor';
import { MousePointer2, Move } from 'lucide-react';

interface CanvasEditorProps {
  image: HTMLImageElement;
  boxes: CensorBox[];
  onBoxesChange: (boxes: CensorBox[]) => void;
  censorStyle: CensorStyle;
  isDrawMode: boolean;
  onDrawModeChange: (val: boolean) => void;
  selectedBoxId: string | null;
  onSelectBoxId: (id: string | null) => void;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  image,
  boxes,
  onBoxesChange,
  censorStyle,
  isDrawMode,
  onDrawModeChange,
  selectedBoxId,
  onSelectBoxId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    canvasRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useCanvasEditor({
    image,
    boxes,
    onBoxesChange,
    selectedBoxId,
    onSelectBoxId,
    censorStyle,
    isDrawMode,
    onDrawModeChange,
  });

  // Calculate container aspect ratio to perfectly fit image
  const aspectRatio = image.naturalWidth / image.naturalHeight;

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-[420px] max-h-[70vh] bg-slate-950/80 rounded-3xl border border-slate-800 p-2 sm:p-4 overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Visual Instruction Banner */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 backdrop-blur-md text-[11px] font-medium text-slate-300 flex items-center gap-1.5 shadow-lg">
          {isDrawMode ? (
            <>
              <MousePointer2 className="w-3.5 h-3.5 text-teal-400 animate-bounce" />
              <span className="text-teal-300 font-semibold">Modo Dibujo:</span>
              <span>Trazá un rectángulo arrastrando con el dedo o mouse</span>
            </>
          ) : (
            <>
              <Move className="w-3.5 h-3.5 text-sky-400" />
              <span>Arrastrá o estirá los rectángulos para ajustar las zonas</span>
            </>
          )}
        </div>

        {boxes.length > 0 && (
          <div className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 backdrop-blur-md text-[11px] font-mono text-slate-400 hidden sm:flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
            <span>{boxes.length} {boxes.length === 1 ? 'zona protegida' : 'zonas protegidas'}</span>
          </div>
        )}
      </div>

      {/* Canvas Wrapper keeping exact aspect ratio without stretching */}
      <div
        ref={containerRef}
        className="relative max-w-full max-h-full flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50"
        style={{
          aspectRatio: `${aspectRatio}`,
          maxWidth: '100%',
          maxHeight: '65vh',
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`w-full h-full block touch-none ${
            isDrawMode ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
          }`}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};
