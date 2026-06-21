// ── T-Shirt Canvas Generator ──────────────────────────────────────
// Generates a final PNG image of the t-shirt with all design layers on top.
// Optionally draws a solid background color or a background image behind the shirt.

import { DesignLayer, TShirtColor, TShirtView } from '../types';
import { getTshirtSVG, CANVAS_WIDTH, CANVAS_HEIGHT } from './tshirtSvg';

import blackMockupFront from '../assets/black-mockup.png';
import blackMockupBack from '../assets/black-mockup-back.png';
import whiteMockupFront from '../assets/—Pngtree—white t shirt mockup realistic_13020297.png';
import whiteMockupBack from '../assets/—Pngtree—back white t shirt_13029479.png';
import oversizeWhiteMockupFront from '../assets/size.png';
import oversizeWhiteMockupBack from '../assets/bak.png';
import oversizeBlackMockupFront from '../assets/blackk.png';
const oversizeBlackMockupBack = 'https://i.ibb.co/NgtD8tcY/backkk.png';

/** Fetch any URL/src as a local blob URL to avoid canvas CORS taint. */
export async function fetchAsBlobUrl(src: string): Promise<string> {
  try {
    const resp = await fetch(src);
    const blob = await resp.blob();
    return URL.createObjectURL(blob);
  } catch {
    return src; // fallback to original
  }
}

/** Returns the shirt mockup image source for a given color & view. */
export function getShirtSrc(color: TShirtColor, view: TShirtView): string {
  const fit = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('fit') : null;
  
  if (color === 'black') {
    return view === 'front' 
      ? (fit === 'oversize' ? oversizeBlackMockupFront : blackMockupFront) 
      : (fit === 'oversize' ? oversizeBlackMockupBack : blackMockupBack);
  }
  if (color === 'white') {
    return view === 'front' 
      ? (fit === 'oversize' ? oversizeWhiteMockupFront : whiteMockupFront) 
      : (fit === 'oversize' ? oversizeWhiteMockupBack : whiteMockupBack);
  }
  // Colored shirts → generate SVG
  const svgStr = getTshirtSVG(color, view);
  const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  return URL.createObjectURL(svgBlob);
}

interface GenerateOptions {
  layers: DesignLayer[];
  tshirtColor: TShirtColor;
  view: TShirtView;
  width?: number;
  height?: number;
  bgColor?: string;        // e.g. '#1a1a1a' or 'transparent'
  bgImageBase64?: string;  // data URL of background image
}

/** Generate a full t-shirt PNG as a base64 data URL (ready for upload). */
export async function generateTshirtImage({
  layers,
  tshirtColor,
  view,
  width = 600,
  height = 600,
  bgColor,
  bgImageBase64,
}: GenerateOptions): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  // 1️⃣ Draw solid background color
  if (bgColor && bgColor !== 'transparent') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
  }

  // 2️⃣ Draw background image (cover mode)
  if (bgImageBase64) {
    try {
      const bgImgUrl = await fetchAsBlobUrl(bgImageBase64);
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const imgRatio = img.width / img.height;
          const canvasRatio = width / height;
          let drawW = width, drawH = height, ox = 0, oy = 0;
          if (imgRatio > canvasRatio) {
            drawW = height * imgRatio;
            ox = (width - drawW) / 2;
          } else {
            drawH = width / imgRatio;
            oy = (height - drawH) / 2;
          }
          ctx.drawImage(img, ox, oy, drawW, drawH);
          URL.revokeObjectURL(bgImgUrl);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = bgImgUrl;
      });
    } catch (e) {
      console.error('[tshirtCanvas] Failed to draw background image:', e);
    }
  }

  // 3️⃣ Draw shirt mockup
  const scale = width / CANVAS_WIDTH;
  const shirtSrc = getShirtSrc(tshirtColor, view);
  const shirtBlob = await fetchAsBlobUrl(shirtSrc);

  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, Math.round(CANVAS_HEIGHT * scale));
      URL.revokeObjectURL(shirtBlob);
      resolve();
    };
    img.onerror = reject;
    img.src = shirtBlob;
  });

  // 4️⃣ Draw design layers
  const visibleLayers = layers.filter(l => l.visible && l.view === view);
  for (const layer of visibleLayers) {
    try {
      const blobUrl = await fetchAsBlobUrl(layer.imageUrl);
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          ctx.save();
          const cx = (layer.x + layer.width / 2) * scale;
          const cy = (layer.y + layer.height / 2) * scale;
          ctx.translate(cx, cy);
          ctx.rotate((layer.rotation * Math.PI) / 180);
          ctx.globalAlpha = layer.opacity;
          ctx.drawImage(
            img,
            -layer.width * scale / 2,
            -layer.height * scale / 2,
            layer.width * scale,
            layer.height * scale
          );
          ctx.restore();
          URL.revokeObjectURL(blobUrl);
          resolve();
        };
        img.onerror = () => { URL.revokeObjectURL(blobUrl); resolve(); };
        img.src = blobUrl;
      });
    } catch { /* skip failed layer */ }
  }

  return canvas.toDataURL('image/png');
}
