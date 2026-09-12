import { useRef, useEffect, useCallback } from 'react';
import type { CensorBox, CensorStyle } from '../types/dni';
import { applyCensorToContext } from '../utils/canvasFilters';

interface UseCanvasEditorProps {
  image: HTMLImageElement | null;
  boxes: CensorBox[];
  onBoxesChange: (boxes: CensorBox[]) => void;
  selectedBoxId: string | null;
  onSelectBoxId: (id: string | null) => void;
  censorStyle: CensorStyle;
  isDrawMode: boolean;
  onDrawModeChange: (val: boolean) => void;
}

type DragAction = 
  | { type: 'move'; boxId: string; startX: number; startY: number; origBox: CensorBox }
  | { type: 'resize'; boxId: string; handle: 'tl' | 'tr' | 'bl' | 'br'; startX: number; startY: number; origBox: CensorBox }
  | { type: 'draw'; startX: number; startY: number; currentX: number; currentY: number }
  | null;

const HANDLE_SIZE = 14; // pixels on screen

export function useCanvasEditor({
  image,
  boxes,
  onBoxesChange,
  selectedBoxId,
  onSelectBoxId,
  censorStyle,
  isDrawMode,
  onDrawModeChange,
}: UseCanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragActionRef = useRef<DragAction>(null);

  // Helper to convert screen mouse/pointer coordinate to normalized (0..1) image coordinate
  const getNormalizedCoords = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0, clientX: 0, clientY: 0, rectWidth: 0, rectHeight: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const normX = Math.max(0, Math.min(1, clientX / (rect.width || 1)));
    const normY = Math.max(0, Math.min(1, clientY / (rect.height || 1)));

    return { x: normX, y: normY, clientX, clientY, rectWidth: rect.width, rectHeight: rect.height };
  }, []);

  // Check if a point hits a handle of the selected box
  const getHitHandle = useCallback((
    clientX: number,
    clientY: number,
    box: CensorBox,
    rectWidth: number,
    rectHeight: number
  ): 'tl' | 'tr' | 'bl' | 'br' | null => {
    const bx = box.x * rectWidth;
    const by = box.y * rectHeight;
    const bw = box.width * rectWidth;
    const bh = box.height * rectHeight;

    const handles = {
      tl: { x: bx, y: by },
      tr: { x: bx + bw, y: by },
      bl: { x: bx, y: by + bh },
      br: { x: bx + bw, y: by + bh },
    };

    const threshold = HANDLE_SIZE + 6;

    for (const [key, pt] of Object.entries(handles)) {
      if (Math.hypot(clientX - pt.x, clientY - pt.y) <= threshold) {
        return key as 'tl' | 'tr' | 'bl' | 'br';
      }
    }

    return null;
  }, []);

  // Main rendering loop onto the interactive canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. Draw source image scaled to display size
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    ctx.drawImage(image, 0, 0, displayWidth, displayHeight);

    // 2. Render each censor box
    for (const box of boxes) {
      applyCensorToContext(ctx, box, displayWidth, displayHeight, censorStyle);

      const bx = Math.round(box.x * displayWidth);
      const by = Math.round(box.y * displayHeight);
      const bw = Math.round(box.width * displayWidth);
      const bh = Math.round(box.height * displayHeight);

      const isSelected = box.id === selectedBoxId;

      // Draw box boundary
      ctx.strokeStyle = isSelected ? '#14b8a6' : '#0284c7';
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.setLineDash(isSelected ? [] : [4, 4]);
      ctx.strokeRect(bx, by, bw, bh);
      ctx.setLineDash([]);

      // Draw label pill above box
      const labelText = box.label;
      ctx.font = '600 11px system-ui, sans-serif';
      const textMetrics = ctx.measureText(labelText);
      const pillW = textMetrics.width + 12;
      const pillH = 18;
      const pillX = bx;
      const pillY = Math.max(0, by - pillH - 3);

      ctx.fillStyle = isSelected ? '#0f766e' : '#0369a1';
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(pillX, pillY, pillW, pillH, 4);
      } else {
        ctx.rect(pillX, pillY, pillW, pillH);
      }
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText(labelText, pillX + 6, pillY + pillH / 2);

      // Draw resize corner handles if selected
      if (isSelected) {
        ctx.fillStyle = '#14b8a6';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;

        const corners = [
          { x: bx, y: by },
          { x: bx + bw, y: by },
          { x: bx, y: by + bh },
          { x: bx + bw, y: by + bh },
        ];

        for (const corner of corners) {
          ctx.beginPath();
          ctx.arc(corner.x, corner.y, HANDLE_SIZE / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }
    }

    // 3. If currently drawing a manual box, show preview rectangle
    if (dragActionRef.current?.type === 'draw') {
      const { startX, startY, currentX, currentY } = dragActionRef.current;
      const x1 = Math.min(startX, currentX) * displayWidth;
      const y1 = Math.min(startY, currentY) * displayHeight;
      const w = Math.abs(currentX - startX) * displayWidth;
      const h = Math.abs(currentY - startY) * displayHeight;

      ctx.fillStyle = 'rgba(20, 184, 166, 0.25)';
      ctx.fillRect(x1, y1, w, h);
      ctx.strokeStyle = '#14b8a6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x1, y1, w, h);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [image, boxes, selectedBoxId, censorStyle]);

  // Re-render when dependencies update
  useEffect(() => {
    render();
  }, [render]);

  // Handle pointer down (mouse or touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    const { x, y, clientX, clientY, rectWidth, rectHeight } = getNormalizedCoords(e);

    // If manual draw mode is on, start drawing immediately
    if (isDrawMode) {
      dragActionRef.current = {
        type: 'draw',
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
      };
      onSelectBoxId(null);
      render();
      return;
    }

    // 1. Check if clicking on resize handles of selected box
    if (selectedBoxId) {
      const currentSelected = boxes.find((b) => b.id === selectedBoxId);
      if (currentSelected) {
        const handle = getHitHandle(clientX, clientY, currentSelected, rectWidth, rectHeight);
        if (handle) {
          dragActionRef.current = {
            type: 'resize',
            boxId: selectedBoxId,
            handle,
            startX: x,
            startY: y,
            origBox: { ...currentSelected },
          };
          return;
        }
      }
    }

    // 2. Check if clicking inside an existing box (from top-most to bottom)
    for (let i = boxes.length - 1; i >= 0; i--) {
      const box = boxes[i];
      if (x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height) {
        onSelectBoxId(box.id);
        dragActionRef.current = {
          type: 'move',
          boxId: box.id,
          startX: x,
          startY: y,
          origBox: { ...box },
        };
        render();
        return;
      }
    }

    // 3. Clicked empty area: Deselect box, or start drawing if user dragged
    onSelectBoxId(null);
    dragActionRef.current = {
      type: 'draw',
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
    };
    render();
  };

  // Handle pointer move
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const action = dragActionRef.current;
    if (!action) return;

    const { x, y } = getNormalizedCoords(e);

    if (action.type === 'move') {
      const dx = x - action.startX;
      const dy = y - action.startY;

      const updated = boxes.map((b) => {
        if (b.id !== action.boxId) return b;
        const newX = Math.max(0, Math.min(1 - b.width, action.origBox.x + dx));
        const newY = Math.max(0, Math.min(1 - b.height, action.origBox.y + dy));
        return { ...b, x: newX, y: newY };
      });
      onBoxesChange(updated);
    } else if (action.type === 'resize') {
      const { origBox, handle } = action;
      let newX = origBox.x;
      let newY = origBox.y;
      let newW = origBox.width;
      let newH = origBox.height;

      const minSize = 0.03; // 3% of document min size

      if (handle === 'tl') {
        newX = Math.max(0, Math.min(origBox.x + origBox.width - minSize, x));
        newY = Math.max(0, Math.min(origBox.y + origBox.height - minSize, y));
        newW = origBox.x + origBox.width - newX;
        newH = origBox.y + origBox.height - newY;
      } else if (handle === 'tr') {
        newY = Math.max(0, Math.min(origBox.y + origBox.height - minSize, y));
        newW = Math.max(minSize, Math.min(1 - origBox.x, x - origBox.x));
        newH = origBox.y + origBox.height - newY;
      } else if (handle === 'bl') {
        newX = Math.max(0, Math.min(origBox.x + origBox.width - minSize, x));
        newW = origBox.x + origBox.width - newX;
        newH = Math.max(minSize, Math.min(1 - origBox.y, y - origBox.y));
      } else if (handle === 'br') {
        newW = Math.max(minSize, Math.min(1 - origBox.x, x - origBox.x));
        newH = Math.max(minSize, Math.min(1 - origBox.y, y - origBox.y));
      }

      const updated = boxes.map((b) =>
        b.id === action.boxId ? { ...b, x: newX, y: newY, width: newW, height: newH } : b
      );
      onBoxesChange(updated);
    } else if (action.type === 'draw') {
      action.currentX = x;
      action.currentY = y;
      render();
    }
  };

  // Handle pointer up
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }

    const action = dragActionRef.current;
    if (!action) return;

    if (action.type === 'draw') {
      const minX = Math.min(action.startX, action.currentX);
      const minY = Math.min(action.startY, action.currentY);
      const width = Math.abs(action.currentX - action.startX);
      const height = Math.abs(action.currentY - action.startY);

      // Only create a box if user actually dragged enough (minimum 1.5% size)
      if (width > 0.015 && height > 0.015) {
        const newBox: CensorBox = {
          id: `box-manual-${Date.now()}`,
          label: `Zona Censurada #${boxes.length + 1}`,
          type: 'custom',
          x: minX,
          y: minY,
          width,
          height,
          isAutoDetected: false,
        };
        onBoxesChange([...boxes, newBox]);
        onSelectBoxId(newBox.id);
        if (isDrawMode) {
          onDrawModeChange(false);
        }
      }
    }

    dragActionRef.current = null;
    render();
  };

  return {
    canvasRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    render,
  };
}
