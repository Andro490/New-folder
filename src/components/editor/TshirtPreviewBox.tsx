// ── TshirtPreviewBox ──────────────────────────────────────────────
// A canvas component that renders a mini t-shirt preview with all design layers.

import React, { useRef, useEffect } from 'react';
import { DesignLayer, TShirtColor, TShirtView } from '../../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, getTshirtSVG } from '../../utils/tshirtSvg';
import blackMockupFront from '../../assets/black-mockup.png';
import blackMockupBack from '../../assets/black-mockup-back.png';
import whiteMockupFront from '../../assets/—Pngtree—white t shirt mockup realistic_13020297.png';
import whiteMockupBack from '../../assets/—Pngtree—back white t shirt_13029479.png';

interface Props {
  layers: DesignLayer[];
  tshirtColor: TShirtColor;
  view: TShirtView;
  width?: number;
  height?: number;
}

export default function TshirtPreviewBox({
  layers,
  tshirtColor,
  view,
  width = 220,
  height = 180,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const scale = width / CANVAS_WIDTH;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, width, height);

    // Determine shirt background
    let imgSrc = '';
    let isSvg = false;
    if (tshirtColor === 'black') {
      imgSrc = view === 'front' ? blackMockupFront : blackMockupBack;
    } else if (tshirtColor === 'white') {
      imgSrc = view === 'front' ? whiteMockupFront : whiteMockupBack;
    } else {
      isSvg = true;
      const svgStr = getTshirtSVG(tshirtColor, view);
      const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      imgSrc = URL.createObjectURL(svgBlob);
    }

    const shirtImg = new Image();
    shirtImg.onload = () => {
      ctx.drawImage(shirtImg, 0, 0, width, Math.round(CANVAS_HEIGHT * scale));
      if (isSvg) URL.revokeObjectURL(imgSrc);

      const visibleLayers = layers.filter(l => l.visible && l.view === view);
      if (visibleLayers.length === 0) return;

      visibleLayers.forEach(layer => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
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
        };
        img.src = layer.imageUrl;
      });
    };
    shirtImg.src = imgSrc;
  }, [layers, tshirtColor, view, width, height]);

  return <canvas ref={canvasRef} style={{ width, height, display: 'block' }} />;
}
