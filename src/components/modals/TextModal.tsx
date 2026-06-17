// ── TextModal ──────────────────────────────────────────────────────
// Allows the user to add Arabic/English text as a design layer.

import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DesignLayer, TShirtView } from '../../types';
import { PRINT_AREA } from '../../utils/tshirtSvg';

const FONTS = [
  { label: 'Cairo (عربي)', value: 'Cairo, sans-serif' },
  { label: 'Impact', value: 'Impact, sans-serif' },
  { label: 'Arial Black', value: '"Arial Black", sans-serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Anton', value: '"Anton", sans-serif' },
  { label: 'Bangers', value: '"Bangers", cursive' },
  { label: 'Bebas Neue', value: '"Bebas Neue", sans-serif' },
  { label: 'Bowlby One SC', value: '"Bowlby One SC", cursive' },
  { label: 'Changa One', value: '"Changa One", sans-serif' },
  { label: 'Creepster', value: '"Creepster", cursive' },
  { label: 'Knewave', value: '"Knewave", cursive' },
  { label: 'Modak', value: '"Modak", cursive' },
  { label: 'Monoton', value: '"Monoton", cursive' },
  { label: 'Nosifer', value: '"Nosifer", cursive' },
  { label: 'Permanent Marker', value: '"Permanent Marker", cursive' },
  { label: 'Righteous', value: '"Righteous", cursive' },
  { label: 'Rubik Glitch', value: '"Rubik Glitch", cursive' },
  { label: 'Special Elite', value: '"Special Elite", cursive' },
];

const PRESET_COLORS = [
  '#ffffff', '#000000', '#e60023', 'var(--accent-primary)',
  '#6366f1', '#22d3ee', '#4ade80', '#f97316',
];

interface Props {
  onClose: () => void;
  onAddLayer: (layer: DesignLayer) => void;
  view: TShirtView;
}

export default function TextModal({ onClose, onAddLayer, view }: Props) {
  const [text, setText] = useState('نصك هنا');
  const [font, setFont] = useState('Cairo, sans-serif');
  const [color, setColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(48);
  const [bold, setBold] = useState(true);
  const printArea = PRINT_AREA[view];

  function handleAdd() {
    if (!text.trim()) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const weight = bold ? 'bold' : 'normal';
    ctx.font = `${weight} ${fontSize}px ${font}`;
    const metrics = ctx.measureText(text);
    const w = Math.ceil(metrics.width) + 20;
    const h = Math.ceil(fontSize * 1.4) + 10;

    canvas.width = w;
    canvas.height = h;
    const ctx2 = canvas.getContext('2d')!;
    ctx2.clearRect(0, 0, w, h);
    ctx2.font = `${weight} ${fontSize}px ${font}`;
    ctx2.fillStyle = color;
    ctx2.textBaseline = 'middle';
    ctx2.fillText(text, 10, h / 2);

    const url = canvas.toDataURL('image/png');
    onAddLayer({
      id: uuidv4(),
      name: text.slice(0, 18),
      imageUrl: url,
      x: printArea.x + 20,
      y: printArea.y + 30,
      width: Math.min(w, printArea.width - 40),
      height: Math.ceil(h * Math.min(w, printArea.width - 40) / w),
      rotation: 0, opacity: 1, visible: true, locked: false,
      view,
      textProps: { text, font, color },
    });
    onClose();
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 460,
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          fontFamily: "'Inter', sans-serif",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #1e1e1e',
        }}>
          <div>
            <p style={{ fontSize: 10, color: '#888', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 2 }}>
              TEXT LAYER
            </p>
            <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              ADD YOUR TEXT
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {/* Live Preview */}
          <div style={{
            backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
            padding: '20px', marginBottom: 20, minHeight: 80,
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            <span style={{
              fontFamily: font, fontSize: Math.min(fontSize, 44),
              fontWeight: bold ? 900 : 400, color,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word', textAlign: 'center',
            }}>
              {text || 'اكتب شيئاً...'}
            </span>
          </div>

          {/* Text Input */}
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="اكتب نصك هنا..."
            dir="auto"
            rows={2}
            style={{
              width: '100%', padding: '10px 12px',
              backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)',
              border: '1px solid #2a2a2a', marginBottom: 16,
              fontSize: 14, outline: 'none', resize: 'none',
              fontFamily: font, boxSizing: 'border-box',
            }}
          />

          {/* Font & Bold */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, color: '#666', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>FONT</p>
              <select
                value={font}
                onChange={e => setFont(e.target.value)}
                style={{
                  width: '100%', padding: '8px 10px',
                  backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)',
                  border: '1px solid #2a2a2a', fontSize: 12, outline: 'none',
                }}
              >
                {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <p style={{ fontSize: 10, color: '#666', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>BOLD</p>
              <button
                onClick={() => setBold(b => !b)}
                style={{
                  padding: '8px 14px', height: 34,
                  backgroundColor: bold ? 'var(--accent-primary)' : 'var(--bg-card)',
                  color: bold ? '#000' : 'var(--text-muted)',
                  border: '1px solid var(--border-color)', cursor: 'pointer',
                  fontWeight: 900, fontSize: 13,
                }}
              >B</button>
            </div>
          </div>

          {/* Font Size */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 10, color: '#666', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
              SIZE — {fontSize}px
            </p>
            <input
              type="range" min={16} max={120} value={fontSize}
              onChange={e => setFontSize(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
            />
          </div>

          {/* Color */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 10, color: '#666', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>COLOR</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 28, height: 28, backgroundColor: c,
                    border: color === c ? '2px solid var(--accent-primary)' : '1px solid #333',
                    cursor: 'pointer', flexShrink: 0,
                  }}
                />
              ))}
              <input
                type="color" value={color}
                onChange={e => setColor(e.target.value)}
                style={{ width: 28, height: 28, padding: 0, border: '1px solid #333', cursor: 'pointer', backgroundColor: 'transparent' }}
                title="اختر لون مخصص"
              />
            </div>
          </div>

          {/* Add Button */}
          <button
            onClick={handleAdd}
            disabled={!text.trim()}
            style={{
              width: '100%', padding: '14px',
              backgroundColor: text.trim() ? 'rgb(245, 200, 66)' : '#333',
              color: text.trim() ? '#000' : '#666',
              border: 'none', cursor: text.trim() ? 'pointer' : 'not-allowed',
              fontSize: 13, fontWeight: 900,
              letterSpacing: '0.2em', textTransform: 'uppercase',
            }}
          >
            ADD TO DESIGN
          </button>
        </div>
      </div>
    </div>
  );
}
