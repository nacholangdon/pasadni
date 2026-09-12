import { useEffect, useRef, useState, useCallback } from 'react';
import type { DetectionResult } from '../types/dni';

export type WorkerStatus = 'idle' | 'initializing' | 'ready' | 'processing' | 'error';

export function useOpenCvWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [status, setStatus] = useState<WorkerStatus>('initializing');
  const [statusMessage, setStatusMessage] = useState<string>('Iniciando motor de visión artificial...');
  const pendingPromiseRef = useRef<{
    resolve: (val: DetectionResult) => void;
    reject: (err: any) => void;
  } | null>(null);

  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/dniWorker.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent) => {
      const { type, payload } = event.data || {};

      switch (type) {
        case 'INIT_SUCCESS':
          setStatus('ready');
          setStatusMessage('Motor de visión OpenCV.js listo (Zero-Trust Local)');
          break;

        case 'INIT_ERROR':
          setStatus('ready');
          setStatusMessage('Motor listo en modo heurístico nativo');
          break;

        case 'DETECT_SUCCESS':
          setStatus('ready');
          setStatusMessage('Detección completada');
          if (pendingPromiseRef.current) {
            pendingPromiseRef.current.resolve(payload.result);
            pendingPromiseRef.current = null;
          }
          break;

        case 'DETECT_ERROR':
          setStatus('error');
          setStatusMessage(payload?.message || 'Error en detección de imagen');
          if (pendingPromiseRef.current) {
            pendingPromiseRef.current.reject(new Error(payload?.message || 'Error de procesamiento'));
            pendingPromiseRef.current = null;
          }
          break;

        default:
          break;
      }
    };

    worker.onerror = (err) => {
      console.warn('Worker error:', err);
      setStatus('ready');
      setStatusMessage('Operando en modo de procesamiento local directo');
    };

    worker.postMessage({ type: 'INIT' });

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const detectZones = useCallback(async (imageData: ImageData): Promise<DetectionResult> => {
    if (!workerRef.current) {
      throw new Error('El Worker no está inicializado.');
    }

    setStatus('processing');
    setStatusMessage('Analizando estructura del DNI...');

    return new Promise((resolve, reject) => {
      pendingPromiseRef.current = { resolve, reject };

      workerRef.current?.postMessage({
        type: 'DETECT',
        payload: { imageData }
      });
    });
  }, []);

  return {
    status,
    statusMessage,
    detectZones,
    isReady: status === 'ready' || status === 'processing'
  };
}
