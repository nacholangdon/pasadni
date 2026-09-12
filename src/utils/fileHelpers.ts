/**
 * Loads an image File into an HTMLImageElement
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo seleccionado no es una imagen válida.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('No se pudo decodificar la imagen.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Extracts ImageData from an HTMLImageElement with an optional max dimension for worker performance
 */
export function extractImageData(img: HTMLImageElement, maxDimension = 1200): ImageData {
  const canvas = document.createElement('canvas');
  let width = img.naturalWidth;
  let height = img.naturalHeight;

  if (Math.max(width, height) > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo crear el contexto 2D para extraer ImageData.');
  }

  ctx.drawImage(img, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

/**
 * Triggers a browser download for a Blob or DataURL
 */
export function triggerDownload(urlOrBlob: string | Blob, filename: string) {
  const link = document.createElement('a');
  link.download = filename;

  if (typeof urlOrBlob === 'string') {
    link.href = urlOrBlob;
  } else {
    link.href = URL.createObjectURL(urlOrBlob);
  }

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  if (typeof urlOrBlob !== 'string') {
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }
}

/**
 * Formats bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Checks if the browser supports sharing files via Web Share API
 */
export function canShareFiles(): boolean {
  if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare) {
    return false;
  }
  try {
    const testFile = new File(['test'], 'test.png', { type: 'image/png' });
    return navigator.canShare({ files: [testFile] });
  } catch {
    return false;
  }
}

/**
 * Shares an image file using the Web Share API (native mobile/desktop share sheet)
 */
export async function shareImageFile(
  blob: Blob,
  filename: string,
  title = 'DNI Seguro',
  text = 'Te comparto mi DNI con datos sensibles protegidos (procesado con PasaDNI).'
): Promise<boolean> {
  if (!canShareFiles()) return false;
  const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
  await navigator.share({
    title,
    text,
    files: [file],
  });
  return true;
}

/**
 * Converts a Blob to image/png (required by most browser Clipboard APIs)
 */
function convertBlobToPng(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('No se pudo crear el contexto para convertir a PNG.'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('Fallo al generar PNG.'));
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Fallo al decodificar blob para el portapapeles.'));
    };
    img.src = url;
  });
}

/**
 * Copies an image Blob to the system clipboard
 */
export async function copyImageToClipboard(blob: Blob): Promise<void> {
  if (!navigator.clipboard || !window.ClipboardItem) {
    throw new Error('El portapapeles de imágenes no está soportado en este navegador.');
  }

  const pngBlob = blob.type === 'image/png' ? blob : await convertBlobToPng(blob);
  const item = new ClipboardItem({ 'image/png': pngBlob });
  await navigator.clipboard.write([item]);
}

/**
 * URL schemes for sharing
 */
export function getWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function getTelegramShareUrl(text: string, url = 'https://nacholangdon.pages.dev'): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

export function getEmailShareUrl(subject: string, body: string): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

