import { useState, useCallback, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroDropzone } from './components/HeroDropzone';
import { CanvasEditor } from './components/CanvasEditor';
import { Toolbar } from './components/Toolbar';
import { ExportModal } from './components/ExportModal';
import type { CensorBox, CensorStyle, SavedDniRecord } from './types/dni';
import { useOpenCvWorker } from './hooks/useOpenCvWorker';
import { loadImageFromFile, extractImageData } from './utils/fileHelpers';
import { generateSampleDniImage } from './utils/sampleDni';
import {
  getAllSavedDnis,
  deleteSavedDni,
  clearAllSavedDnis,
  dataUrlToImage,
  saveDniRecord,
  imageToDataUrl,
  generateThumbnail,
} from './utils/dniStorage';
import { Shield, CheckCircle2 } from 'lucide-react';

export function App() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [boxes, setBoxes] = useState<CensorBox[]>([]);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [censorStyle, setCensorStyle] = useState<CensorStyle>('solid');
  const [isDrawMode, setIsDrawMode] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [detectionNotice, setDetectionNotice] = useState<string | null>(null);
  const [savedDnis, setSavedDnis] = useState<SavedDniRecord[]>([]);
  const [isSavedInToolbar, setIsSavedInToolbar] = useState<boolean>(false);

  const { status, detectZones } = useOpenCvWorker();
  const isDetecting = status === 'processing';

  // Load saved DNIs from IndexedDB on startup
  const refreshSavedDnis = useCallback(async () => {
    try {
      const list = await getAllSavedDnis();
      setSavedDnis(list);
    } catch (err) {
      console.error('Error al cargar DNIs guardados:', err);
    }
  }, []);

  useEffect(() => {
    refreshSavedDnis();
  }, [refreshSavedDnis]);

  // Apply predefined box templates (declared before runDetection to satisfy linters)
  const applyPreset = useCallback((type: 'front' | 'back') => {
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
    setIsSavedInToolbar(false);
    setTimeout(() => setDetectionNotice(null), 4000);
  }, []);

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
  }, [detectZones, applyPreset]);

  // Handle image upload from input or camera
  const handleImageSelected = async (file: File) => {
    try {
      const loadedImg = await loadImageFromFile(file);
      setImage(loadedImg);
      setSelectedBoxId(null);
      setIsSavedInToolbar(false);
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
      setIsSavedInToolbar(false);
      await runDetection(sampleImg);
    } catch (err: any) {
      alert('Error al generar imagen de muestra: ' + err?.message);
    }
  };

  // Load a locally stored DNI into the editor
  const handleLoadSavedDni = async (record: SavedDniRecord) => {
    try {
      const loadedImg = await dataUrlToImage(record.imageDataUrl);
      setImage(loadedImg);
      setBoxes(record.boxes);
      setCensorStyle(record.censorStyle || 'solid');
      setSelectedBoxId(null);
      setIsSavedInToolbar(true);
      setDetectionNotice(`DNI "${record.title}" cargado desde almacenamiento seguro.`);
      setTimeout(() => setDetectionNotice(null), 4000);
    } catch (err: any) {
      alert('Error al abrir el DNI guardado: ' + err?.message);
    }
  };

  // Quick share a locally stored DNI (loads and opens modal in 1 click)
  const handleQuickShareSavedDni = async (record: SavedDniRecord) => {
    try {
      const loadedImg = await dataUrlToImage(record.imageDataUrl);
      setImage(loadedImg);
      setBoxes(record.boxes);
      setCensorStyle(record.censorStyle || 'solid');
      setSelectedBoxId(null);
      setIsSavedInToolbar(true);
      setIsExportOpen(true);
    } catch (err: any) {
      alert('Error al abrir para compartir: ' + err?.message);
    }
  };

  // Delete a saved DNI from IndexedDB
  const handleDeleteSavedDni = async (id: string) => {
    try {
      await deleteSavedDni(id);
      await refreshSavedDnis();
    } catch (err: any) {
      alert('Error al eliminar DNI: ' + err?.message);
    }
  };

  // Clear all saved DNIs (Zero-Trust full purge)
  const handleClearAllSaved = async () => {
    try {
      await clearAllSavedDnis();
      await refreshSavedDnis();
      setDetectionNotice('Se han eliminado todos los documentos guardados en este dispositivo.');
      setTimeout(() => setDetectionNotice(null), 4000);
    } catch (err: any) {
      alert('Error al vaciar datos locales: ' + err?.message);
    }
  };

  // Quick save currently loaded DNI into IndexedDB
  const handleSaveCurrentDni = async () => {
    if (!image) return;
    try {
      const rawDataUrl = imageToDataUrl(image);
      const thumbUrl = generateThumbnail(image, 340);
      const isBack = boxes.some((b) => b.type === 'huella' || b.type === 'mrz');
      const title = isBack ? 'DNI Dorso' : 'DNI Frente';

      await saveDniRecord({
        title,
        side: isBack ? 'back' : 'front',
        imageDataUrl: rawDataUrl,
        thumbnailUrl: thumbUrl,
        boxes,
        censorStyle,
      });

      setIsSavedInToolbar(true);
      await refreshSavedDnis();
      setDetectionNotice(`¡Guardado en este navegador como "${title}"!`);
      setTimeout(() => setDetectionNotice(null), 4000);
    } catch (err: any) {
      alert('Error al guardar en el dispositivo: ' + err?.message);
    }
  };

  // Delete currently selected box
  const handleDeleteSelected = () => {
    if (!selectedBoxId) return;
    setBoxes((prev) => prev.filter((b) => b.id !== selectedBoxId));
    setSelectedBoxId(null);
    setIsSavedInToolbar(false);
  };

  // Clear all boxes
  const handleClearAll = () => {
    if (boxes.length === 0) return;
    if (confirm('¿Querés eliminar todas las zonas censuradas?')) {
      setBoxes([]);
      setSelectedBoxId(null);
      setIsSavedInToolbar(false);
    }
  };

  const handleBoxesChange = (newBoxes: CensorBox[]) => {
    setBoxes(newBoxes);
    setIsSavedInToolbar(false);
  };

  const selectedBox = boxes.find((b) => b.id === selectedBoxId) || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation */}
      <Navbar
        savedDniCount={savedDnis.length}
        onClearAllSaved={handleClearAllSaved}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-6 sm:py-8 flex flex-col">
        {!image ? (
          /* Initial Screen: Saved Documents, Dropzone, Camera & Explanations */
          <HeroDropzone
            onImageSelected={handleImageSelected}
            onLoadSample={handleLoadSample}
            onLoadSavedDni={handleLoadSavedDni}
            onQuickShareSavedDni={handleQuickShareSavedDni}
            savedDnis={savedDnis}
            onDeleteSavedDni={handleDeleteSavedDni}
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
                setIsSavedInToolbar(false);
              }}
              boxCount={boxes.length}
              onSaveToDevice={handleSaveCurrentDni}
              isSaved={isSavedInToolbar}
            />

            {/* Canvas Editor */}
            <CanvasEditor
              image={image}
              boxes={boxes}
              onBoxesChange={handleBoxesChange}
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
            onSavedChange={refreshSavedDnis}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/90 py-6 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
            <span>PasaDNI — Herramienta de privacidad de código abierto.</span>
            <span>Desarrollado por</span>
            <a
              href="https://nacholangdon.pages.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:text-teal-300 font-semibold underline underline-offset-2 decoration-teal-500/40 hover:decoration-teal-400 transition-colors inline-flex items-center gap-1"
            >
              Nacho Langdon
            </a>
          </p>
          <div className="flex items-center justify-center gap-3 text-slate-400">
            <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 font-mono text-[11px] text-teal-400 font-medium shadow-sm">
              v1.1.0
            </span>
            <span>·</span>
            <span>100% Client-Side</span>
            <span>·</span>
            <a
              href="https://nacholangdon.pages.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-teal-400 transition-colors font-mono"
            >
              nacholangdon.pages.dev
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
