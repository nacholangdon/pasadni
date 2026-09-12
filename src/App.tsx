import { useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { HeroDropzone } from './components/HeroDropzone';
import { CanvasEditor } from './components/CanvasEditor';
import { Toolbar } from './components/Toolbar';
import { ExportModal } from './components/ExportModal';
import type { CensorBox, CensorStyle } from './types/dni';
import { useOpenCvWorker } from './hooks/useOpenCvWorker';
import { loadImageFromFile, extractImageData } from './utils/fileHelpers';
import { generateSampleDniImage } from './utils/sampleDni';
import { Shield, CheckCircle2 } from 'lucide-react';

export function App() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [boxes, setBoxes] = useState<CensorBox[]>([]);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [censorStyle, setCensorStyle] = useState<CensorStyle>('solid');
  const [isDrawMode, setIsDrawMode] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [detectionNotice, setDetectionNotice] = useState<string | null>(null);

  const { status, detectZones } = useOpenCvWorker();
  const isDetecting = status === 'processing';

  // Helper to trigger OpenCV detection on an image
  const runDetection = useCallback(async (targetImg: HTMLImageElement) => {
    try {
      const imgData = extractImageData(targetImg, 1000);
      const result = await detectZones(imgData);

      if (result.boxes && result.boxes.length > 0) {
        setBoxes(result.boxes);
        const orientationLabel = result.orientation === 'front' ? 'Frente' : 'Dorso';
        setDetectionNotice(`Estructura identificada: DNI ${orientationLabel}. Áreas sensibles delimitadas.`);
        setTimeout(() => setDetectionNotice(null), 5000);
      }
    } catch (err) {
      console.warn('Fallo en detección automática, aplicando preset seguro:', err);
      // Fallback: apply default front boxes
      applyPreset('front');
    }
  }, [detectZones]);

  // Apply predefined box templates
  const applyPreset = (type: 'front' | 'back') => {
    if (type === 'front') {
      setBoxes([
        {
          id: `box-tramite-${Date.now()}`,
          label: 'N° de Trámite',
          type: 'tramite',
          x: 0.31,
          y: 0.74,
          width: 0.38,
          height: 0.14,
        },
        {
          id: `box-firma-${Date.now() + 1}`,
          label: 'Firma',
          type: 'firma',
          x: 0.58,
          y: 0.62,
          width: 0.36,
          height: 0.16,
        },
      ]);
      setDetectionNotice('Preset aplicado: N° de Trámite y Firma');
    } else {
      setBoxes([
        {
          id: `box-huella-${Date.now()}`,
          label: 'Huella Dactilar',
          type: 'huella',
          x: 0.70,
          y: 0.28,
          width: 0.26,
          height: 0.40,
        },
        {
          id: `box-mrz-${Date.now() + 1}`,
          label: 'Código de Barras / MRZ',
          type: 'mrz',
          x: 0.05,
          y: 0.72,
          width: 0.90,
          height: 0.24,
        },
      ]);
      setDetectionNotice('Preset aplicado: Huella Dactilar y Código de Barras');
    }
    setTimeout(() => setDetectionNotice(null), 4000);
  };

  // Handle image upload from input or camera
  const handleImageSelected = async (file: File) => {
    try {
      const loadedImg = await loadImageFromFile(file);
      setImage(loadedImg);
      setSelectedBoxId(null);
      await runDetection(loadedImg);
    } catch (err: any) {
      alert(err?.message || 'Error al cargar la imagen');
    }
  };

  // Handle loading synthetic sample DNI
  const handleLoadSample = async () => {
    try {
      const sampleImg = await generateSampleDniImage();
      setImage(sampleImg);
      setSelectedBoxId(null);
      await runDetection(sampleImg);
    } catch (err: any) {
      alert('Error al generar imagen de muestra: ' + err?.message);
    }
  };

  // Delete currently selected box
  const handleDeleteSelected = () => {
    if (!selectedBoxId) return;
    setBoxes((prev) => prev.filter((b) => b.id !== selectedBoxId));
    setSelectedBoxId(null);
  };

  // Clear all boxes
  const handleClearAll = () => {
    if (boxes.length === 0) return;
    if (confirm('¿Querés eliminar todas las zonas censuradas?')) {
      setBoxes([]);
      setSelectedBoxId(null);
    }
  };

  const selectedBox = boxes.find((b) => b.id === selectedBoxId) || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-6 sm:py-8 flex flex-col">
        {!image ? (
          /* Initial Screen: Dropzone, Camera & Explanations */
          <HeroDropzone
            onImageSelected={handleImageSelected}
            onLoadSample={handleLoadSample}
            isLoading={isDetecting}
          />
        ) : (
          /* Editor Screen: Canvas, Interactive Redaction, Controls */
          <div className="space-y-4 max-w-4xl mx-auto w-full animate-in fade-in duration-200">
            {/* Detection status toast / notice */}
            {detectionNotice && (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs shadow-lg animate-in slide-in-from-top-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>{detectionNotice}</span>
              </div>
            )}

            {/* Toolbar */}
            <Toolbar
              onAutoDetect={() => image && runDetection(image)}
              isDetecting={isDetecting}
              onApplyPreset={applyPreset}
              isDrawMode={isDrawMode}
              onToggleDrawMode={() => setIsDrawMode(!isDrawMode)}
              selectedBox={selectedBox}
              onDeleteSelected={handleDeleteSelected}
              onClearAll={handleClearAll}
              censorStyle={censorStyle}
              onChangeStyle={setCensorStyle}
              onOpenExport={() => setIsExportOpen(true)}
              onResetImage={() => {
                setImage(null);
                setBoxes([]);
                setSelectedBoxId(null);
              }}
              boxCount={boxes.length}
            />

            {/* Canvas Editor */}
            <CanvasEditor
              image={image}
              boxes={boxes}
              onBoxesChange={setBoxes}
              censorStyle={censorStyle}
              isDrawMode={isDrawMode}
              onDrawModeChange={setIsDrawMode}
              selectedBoxId={selectedBoxId}
              onSelectBoxId={setSelectedBoxId}
            />

            {/* Quick Helper Tips */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 px-2 pt-1 gap-2">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-teal-500/70" />
                <span>Modo Zero-Trust activo: La imagen nunca se envía a ningún servidor.</span>
              </div>
              <div className="text-slate-400">
                Tip: Arrastrá los círculos en las esquinas para ajustar el tamaño.
              </div>
            </div>
          </div>
        )}

        {/* Export Modal */}
        {image && (
          <ExportModal
            isOpen={isExportOpen}
            onClose={() => setIsExportOpen(false)}
            image={image}
            boxes={boxes}
            censorStyle={censorStyle}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/90 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            PasaDNI — Herramienta de privacidad de código abierto. Desarrollado con tecnología 100% en el cliente.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Cloudflare Pages Ready</span>
            <span>·</span>
            <span className="text-slate-400">OpenCV.js Web Workers</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
