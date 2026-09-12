export type SensitiveZoneType = 
  | 'tramite'     // Número de trámite (Frente)
  | 'firma'       // Firma digitalizada (Frente)
  | 'huella'      // Huella dactilar (Dorso)
  | 'mrz'         // Código de barras o zona MRZ (Dorso)
  | 'custom';     // Rectángulo manual del usuario

export type CensorStyle = 'solid' | 'pixelate' | 'blur';

export interface CensorBox {
  id: string;
  label: string;
  type: SensitiveZoneType;
  // Normalized coordinates (0.0 to 1.0)
  x: number;
  y: number;
  width: number;
  height: number;
  isAutoDetected?: boolean;
}

export interface DetectionResult {
  orientation: 'front' | 'back' | 'unknown';
  confidence: number;
  boxes: CensorBox[];
  faceDetected?: boolean;
  documentContourFound?: boolean;
}

export interface WorkerMessageRequest {
  type: 'INIT' | 'DETECT';
  payload?: {
    imageData?: ImageData;
    width?: number;
    height?: number;
    options?: {
      detectFace?: boolean;
      detectContour?: boolean;
    };
  };
}

export interface WorkerMessageResponse {
  type: 'INIT_SUCCESS' | 'INIT_ERROR' | 'DETECT_SUCCESS' | 'DETECT_ERROR' | 'STATUS';
  payload?: {
    result?: DetectionResult;
    message?: string;
    progress?: number;
  };
}
