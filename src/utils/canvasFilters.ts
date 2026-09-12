import type { CensorBox, CensorStyle } from '../types/dni';

/**
 * Applies irreversible censorship on a canvas 2D context for a given normalized box
 */
export function applyCensorToContext(
  ctx: CanvasRenderingContext2D,
  box: CensorBox,
  canvasWidth: number,
  canvasHeight: number,
  style: CensorStyle = 'solid'
) {
  const pixelX = Math.round(box.x * canvasWidth);
  const pixelY = Math.round(box.y * canvasHeight);
  const pixelW = Math.round(box.width * canvasWidth);
  const pixelH = Math.round(box.height * canvasHeight);

  if (pixelW <= 0 || pixelH <= 0) return;

  ctx.save();

  if (style === 'solid') {
    // 100% Destructive Solid Matte Black Fill
    ctx.fillStyle = '#09090b'; // Deep carbon black
    ctx.fillRect(pixelX, pixelY, pixelW, pixelH);

    // Add clean subtle inner border
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = Math.max(1, Math.round(canvasWidth * 0.0015));
    ctx.strokeRect(pixelX, pixelY, pixelW, pixelH);

    // Optional safe badge text on boxes large enough
    if (pixelW > 70 && pixelH > 24) {
      ctx.fillStyle = '#a1a1aa';
      ctx.font = `600 ${Math.max(10, Math.min(14, Math.round(pixelH * 0.35)))}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const labelText = box.label.toUpperCase();
      ctx.fillText(labelText, pixelX + pixelW / 2, pixelY + pixelH / 2);
    }
  } else if (style === 'pixelate') {
    // True destructive pixelation via low-res sub-sampling
    const pixelSize = Math.max(8, Math.round(Math.min(pixelW, pixelH) / 6));
    
    // Create temporary offscreen buffer for the area
    const offCanvas = document.createElement('canvas');
    const cols = Math.max(1, Math.floor(pixelW / pixelSize));
    const rows = Math.max(1, Math.floor(pixelH / pixelSize));
    offCanvas.width = cols;
    offCanvas.height = rows;

    const offCtx = offCanvas.getContext('2d');
    if (offCtx) {
      offCtx.imageSmoothingEnabled = true;
      offCtx.drawImage(ctx.canvas, pixelX, pixelY, pixelW, pixelH, 0, 0, cols, rows);

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(offCanvas, 0, 0, cols, rows, pixelX, pixelY, pixelW, pixelH);
    }
  } else if (style === 'blur') {
    // Heavy multi-pass blur via clipped context
    ctx.beginPath();
    ctx.rect(pixelX, pixelY, pixelW, pixelH);
    ctx.clip();

    ctx.filter = `blur(${Math.max(12, Math.round(pixelH * 0.25))}px)`;
    ctx.drawImage(ctx.canvas, 0, 0);
  }

  ctx.restore();
}

/**
 * Creates a clean full-resolution canvas with all censor boxes baked into pixel data.
 * Zero-Trust & Clean: Strips all EXIF metadata naturally through canvas re-rasterization.
 */
export function generateRedactedCanvas(
  sourceImage: HTMLImageElement,
  boxes: CensorBox[],
  style: CensorStyle
): HTMLCanvasElement {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = sourceImage.naturalWidth;
  exportCanvas.height = sourceImage.naturalHeight;

  const ctx = exportCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo inicializar el contexto de exportación.');
  }

  // Draw full-resolution original image
  ctx.drawImage(sourceImage, 0, 0);

  // Apply each censor box destructively
  for (const box of boxes) {
    applyCensorToContext(ctx, box, exportCanvas.width, exportCanvas.height, style);
  }

  return exportCanvas;
}
