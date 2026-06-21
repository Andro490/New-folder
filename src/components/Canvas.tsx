import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer, Rect } from 'react-konva';
import Konva from 'konva';
import { useLocation } from 'react-router-dom';
import { DesignLayer, TShirtColor, TShirtView } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PRINT_AREA, getTshirtSVG } from '../utils/tshirtSvg';
import blackMockupFront from '../assets/black-mockup.png';
import blackMockupBack from '../assets/black-mockup-back.png';
import whiteMockupFront from '../assets/—Pngtree—white t shirt mockup realistic_13020297.png';
import whiteMockupBack from '../assets/—Pngtree—back white t shirt_13029479.png';
import oversizeWhiteMockupFront from '../assets/size.png';
import oversizeWhiteMockupBack from '../assets/bak.png';
import oversizeBlackMockupFront from '../assets/blackk.png';
const oversizeBlackMockupBack = 'https://i.ibb.co/NgtD8tcY/backkk.png';

interface CanvasProps {
  layers: DesignLayer[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onLayerChange: (id: string, attrs: Partial<DesignLayer>) => void;
  tshirtColor: TShirtColor;
  view: TShirtView;
}

// Hook to load an image URL into HTMLImageElement
function useImage(src: string): [HTMLImageElement | null, string] {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [status, setStatus] = useState<string>('loading');

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { setImage(img); setStatus('loaded'); };
    img.onerror = () => setStatus('error');
    img.src = src;
    return () => { img.onload = null; img.onerror = null; };
  }, [src]);

  return [image, status];
}

// T-Shirt background image component
function TshirtBackground({ color, view }: { color: TShirtColor; view: TShirtView }) {
  const [url, setUrl] = useState<string>('');
  const location = useLocation();
  const fit = new URLSearchParams(location.search).get('fit');

  useEffect(() => {
    if (color === 'black') {
      if (view === 'front') {
        setUrl(fit === 'oversize' ? oversizeBlackMockupFront : blackMockupFront);
        return;
      } else if (view === 'back') {
        setUrl(fit === 'oversize' ? oversizeBlackMockupBack : blackMockupBack);
        return;
      }
    } else if (color === 'white') {
      if (view === 'front') {
        setUrl(fit === 'oversize' ? oversizeWhiteMockupFront : whiteMockupFront);
        return;
      } else if (view === 'back') {
        setUrl(fit === 'oversize' ? oversizeWhiteMockupBack : whiteMockupBack);
        return;
      }
    }

    const svgString = getTshirtSVG(color, view);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
    const objectUrl = URL.createObjectURL(svgBlob);
    setUrl(objectUrl);
    
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [color, view]);

  const [image] = useImage(url);

  return image ? (
    <KonvaImage
      image={image}
      x={0}
      y={0}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      listening={false}
    />
  ) : null;
}

// Single draggable/resizable/rotatable design layer
interface DesignImageProps {
  layer: DesignLayer;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<DesignLayer>) => void;
}

function DesignImage({ layer, isSelected, onSelect, onChange }: DesignImageProps) {
  const imageRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [image] = useImage(layer.imageUrl);

  useEffect(() => {
    if (isSelected && trRef.current && imageRef.current) {
      trRef.current.nodes([imageRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  if (!image) return null;

  return (
    <>
      <KonvaImage
        id={layer.id}
        ref={imageRef}
        image={image}
        x={layer.x}
        y={layer.y}
        width={layer.width}
        height={layer.height}
        rotation={layer.rotation}
        opacity={layer.opacity}
        visible={layer.visible}
        draggable={!layer.locked}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({ x: e.target.x(), y: e.target.y() });
        }}
        onTransformEnd={(e) => {
          const node = imageRef.current!;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            x: node.x(),
            y: node.y(),
            width: Math.max(20, node.width() * scaleX),
            height: Math.max(20, node.height() * scaleY),
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 20 || newBox.height < 20) return oldBox;
            return newBox;
          }}
          enabledAnchors={[
            'top-left', 'top-right', 'bottom-left', 'bottom-right',
            'middle-left', 'middle-right', 'top-center', 'bottom-center',
          ]}
          rotateEnabled={true}
          borderStroke="#6366f1"
          borderStrokeWidth={1.5}
          anchorFill="#6366f1"
          anchorStroke="#fff"
          anchorSize={10}
          anchorCornerRadius={3}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
        />
      )}
    </>
  );
}

export default function Canvas({
  layers,
  selectedId,
  onSelect,
  onLayerChange,
  tshirtColor,
  view,
}: CanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const printArea = PRINT_AREA[view];
  const lastDist = useRef<number>(0);
  const lastCenter = useRef<{ x: number; y: number } | null>(null);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    if (!selectedId) return;
    const layer = layers.find(l => l.id === selectedId);
    if (!layer || layer.locked) return;

    const scaleBy = 1.05;
    const isZoomIn = e.evt.deltaY < 0;
    const factor = isZoomIn ? scaleBy : 1 / scaleBy;

    const newWidth = Math.max(20, layer.width * factor);
    const newHeight = Math.max(20, layer.height * factor);
    const dw = newWidth - layer.width;
    const dh = newHeight - layer.height;

    onLayerChange(selectedId, {
      width: newWidth,
      height: newHeight,
      x: layer.x - dw / 2,
      y: layer.y - dh / 2,
    });
  };

  const handleTouchMove = (e: any) => {
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];

    if (touch1 && touch2 && selectedId && stageRef.current) {
      e.evt.preventDefault();
      const node = stageRef.current.findOne('#' + selectedId);
      if (!node) return;

      // Stop single-finger drag if it was started
      if (node.isDragging()) {
        node.stopDrag();
      }

      const dist = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      if (!lastDist.current) {
        lastDist.current = dist;
      }

      const factor = dist / lastDist.current;
      lastDist.current = dist;

      // Calculate center of the pinch
      const clientCenterX = (touch1.clientX + touch2.clientX) / 2;
      const clientCenterY = (touch1.clientY + touch2.clientY) / 2;

      const stage = stageRef.current;
      const stageBox = stage.container().getBoundingClientRect();
      const newCenter = {
        x: clientCenterX - stageBox.left,
        y: clientCenterY - stageBox.top
      };

      if (!lastCenter.current) {
        lastCenter.current = newCenter;
      }

      // Get the point on the node where the OLD center was
      const transform = node.getAbsoluteTransform().copy();
      transform.invert();
      const localCenter = transform.point(lastCenter.current);

      // Scale the node
      const scaleX = node.scaleX() * factor;
      const scaleY = node.scaleY() * factor;
      node.scale({ x: scaleX, y: scaleY });

      // Move the node so that the localCenter maps perfectly to the NEW center
      const newAbsoluteCenter = node.getAbsoluteTransform().point(localCenter);
      node.position({
        x: node.x() + newCenter.x - newAbsoluteCenter.x,
        y: node.y() + newCenter.y - newAbsoluteCenter.y
      });

      lastCenter.current = newCenter;
      node.getLayer()?.batchDraw();
    }
  };

  const handleTouchEnd = () => {
    const wasPinching = lastDist.current > 0;
    lastDist.current = 0;
    lastCenter.current = null;
    
    if (wasPinching && selectedId && stageRef.current) {
      const node = stageRef.current.findOne('#' + selectedId);
      if (node) {
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        
        const newWidth = Math.max(20, node.width() * scaleX);
        const newHeight = Math.max(20, node.height() * scaleY);
        
        // Update visually immediately before React re-renders to prevent jitter
        node.width(newWidth);
        node.height(newHeight);
        
        const layer = layers.find(l => l.id === selectedId);
        if (layer) {
          onLayerChange(selectedId, {
            x: node.x(),
            y: node.y(),
            width: newWidth,
            height: newHeight,
          });
        }
      }
    }
  };

  return (
    <div className="konva-wrapper rounded-2xl overflow-hidden" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
      <Stage
        ref={stageRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onWheel={handleWheel}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) onSelect(null);
        }}
        onTap={(e) => {
          if (e.target === e.target.getStage()) onSelect(null);
        }}
      >
        {/* T-Shirt background layer */}
        <Layer>
          <TshirtBackground color={tshirtColor} view={view} />
          {/* Print area guide (subtle dashed rectangle) */}
          <Rect
            x={printArea.x}
            y={printArea.y}
            width={printArea.width}
            height={printArea.height}
            fill="transparent"
            stroke={selectedId ? '#6366f140' : '#6366f125'}
            strokeWidth={1}
            dash={[5, 4]}
            listening={false}
          />
        </Layer>

        {/* Design layers */}
        <Layer>
          {layers.map((layer) => (
            <DesignImage
              key={layer.id}
              layer={layer}
              isSelected={layer.id === selectedId}
              onSelect={() => onSelect(layer.id)}
              onChange={(attrs) => onLayerChange(layer.id, attrs)}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
