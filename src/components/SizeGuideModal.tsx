import React, { useState } from 'react';
import { Ruler, CheckCircle2 } from 'lucide-react';
import fitIllustration from '../assets/Gemini_Generated_Image_ljxpfeljxpfeljxp.png';

export function SizeGuideModal({ onClose }: { onClose: () => void }) {
  const [shoulder, setShoulder] = useState('');
  const [chest, setChest] = useState('');
  const [length, setLength] = useState('');

  const s = Number(shoulder) || 0;
  const c = Number(chest) || 0;
  const l = Number(length) || 0;

  let suggestedSize = '-';
  let suggestedFit = '';

  if (s > 0 && c > 0 && l > 0) {
    if (s <= 16 || c <= 40 || l <= 64) {
      suggestedSize = 'S';
    } else if (s <= 18 || c <= 44 || l <= 66) {
      suggestedSize = 'M';
    } else if (s <= 20 || c <= 48 || l <= 70) {
      suggestedSize = 'L';
    } else if (s <= 23 || c <= 52 || l <= 72) {
      suggestedSize = 'XL';
    } else {
      suggestedSize = 'XXL';
    }
    suggestedFit = 'قصة Regular Fit، بناءً على قياساتك';
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', padding: 20 }}>
      <div style={{ backgroundColor: '#fff', color: '#000', borderRadius: 16, width: '100%', maxWidth: 900, maxHeight: '90vh', overflowY: 'auto', position: 'relative', fontFamily: 'Inter', padding: 40 }}>
        
        {/* Close Button */}
        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: '#f5f5f5', border: 'none', borderRadius: '50%', width: 40, height: 40, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ×
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ color: '#666', fontSize: 16, marginBottom: 8 }}>على القيش النيشين:</p>
          <h2 style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>دليل المقاسات الذكي لـ PrintStudio</h2>
        </div>

        {/* Illustrations Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 40 }}>
          <div style={{ textAlign: 'center', borderRight: '1px solid #eee', paddingRight: 40 }}>
            {/* Boxy Fit Illustration placeholder */}
            <div style={{ width: '100%', height: 200, backgroundColor: '#f9f9f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, overflow: 'hidden' }}>
              <img src={fitIllustration} alt="Regular Fit" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 10 }}>REGULAR FIT</h3>
            <p style={{ color: '#666', fontSize: 14 }}>قصة Regular، بناءً على الكتف، بناءً على قياساتك.</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 15, padding: '8px 16px', backgroundColor: '#f0f0f0', borderRadius: 100, fontSize: 14, fontWeight: 700 }}>
              <Ruler size={16} color="#d4af37" />
              كيفية القياس
            </div>
          </div>
          
          <div style={{ textAlign: 'center', paddingLeft: 40 }}>
            <div style={{ width: '100%', height: 200, backgroundColor: '#f9f9f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, overflow: 'hidden' }}>
              <img src={fitIllustration} alt="Boxy Fit" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 10 }}>BOXY FIT</h3>
            <p style={{ color: '#666', fontSize: 14 }}>قصة Boxy Fit، بناءً على الصدر، بناءً على قياساتك.</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 15, padding: '8px 16px', backgroundColor: '#f0f0f0', borderRadius: 100, fontSize: 14, fontWeight: 700 }}>
              <Ruler size={16} color="#d4af37" />
              كيفية القياس
            </div>
          </div>
        </div>

        {/* Size Table */}
        <div style={{ overflowX: 'auto', marginBottom: 40 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: 16 }}>
            <thead>
              <tr>
                <th style={{ backgroundColor: '#111', color: '#fff', padding: '16px', border: '1px solid #333' }}>Size</th>
                <th style={{ backgroundColor: '#111', color: '#f5c842', padding: '16px', border: '1px solid #333' }}>S</th>
                <th style={{ backgroundColor: '#111', color: '#f5c842', padding: '16px', border: '1px solid #333' }}>M</th>
                <th style={{ backgroundColor: '#111', color: '#f5c842', padding: '16px', border: '1px solid #333' }}>L</th>
                <th style={{ backgroundColor: '#111', color: '#f5c842', padding: '16px', border: '1px solid #333' }}>XL</th>
                <th style={{ backgroundColor: '#111', color: '#f5c842', padding: '16px', border: '1px solid #333' }}>XXL</th>
                <th style={{ backgroundColor: '#111', color: '#fff', padding: '16px', border: '1px solid #333', fontSize: 14, lineHeight: 1.2 }}>
                  المقاس المقترح<br/><span style={{ fontSize: 12, color: '#aaa', fontWeight: 'normal' }}>(بالسنتيمتر)</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '16px', border: '1px solid #ddd', fontWeight: 'bold' }}>عرض الكتفين</td>
                <td style={{ padding: '16px', border: '1px solid #ddd' }}>16 سم</td>
                <td style={{ padding: '16px', border: '1px solid #ddd' }}>18 سم</td>
                <td style={{ padding: '16px', border: '1px solid #ddd' }}>20 سم</td>
                <td style={{ padding: '16px', border: '1px solid #ddd' }}>23 سم</td>
                <td style={{ padding: '16px', border: '1px solid #ddd' }}>26 سم</td>
                <td style={{ padding: '16px', border: '1px solid #ddd', backgroundColor: '#fafafa', fontWeight: 'bold' }}>44-46</td>
              </tr>
              <tr>
                <td style={{ padding: '16px', border: '1px solid #ddd', fontWeight: 'bold' }}>محيط الصدر</td>
                <td style={{ padding: '16px', border: '1px solid #ddd' }}>40 سم</td>
                <td style={{ padding: '16px', border: '1px solid #ddd' }}>44 سم</td>
                <td style={{ padding: '16px', border: '1px solid #ddd' }}>48 سم</td>
                <td style={{ padding: '16px', border: '1px solid #ddd' }}>52 سم</td>
                <td style={{ padding: '16px', border: '1px solid #ddd' }}>56 سم</td>
                <td style={{ padding: '16px', border: '1px solid #ddd', backgroundColor: '#fafafa', fontWeight: 'bold' }}>56-60</td>
              </tr>
              <tr>
                <td style={{ padding: '16px', border: '1px solid #ddd', fontWeight: 'bold' }}>طول التيشيرت</td>
                <td style={{ padding: '16px', border: '1px solid #ddd' }}>64 سم</td>
                <td style={{ padding: '16px', border: '1px solid #ddd' }}>66 سم</td>
                <td style={{ padding: '16px', border: '1px solid #ddd' }}>70 سم</td>
                <td style={{ padding: '16px', border: '1px solid #ddd' }}>72 سم</td>
                <td style={{ padding: '16px', border: '1px solid #ddd' }}>74 سم</td>
                <td style={{ padding: '16px', border: '1px solid #ddd', backgroundColor: '#fafafa', fontWeight: 'bold' }}>69-72</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Calculator Section */}
        <div style={{ display: 'flex', gap: 20 }}>
          
          <div style={{ flex: 2, border: '2px solid #111', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#111', color: '#fff', padding: '16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Ruler color="#f5c842" />
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 'bold' }}>حساب مقاسي الذكي</h3>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 'bold', width: 60 }}>الكتف</span>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: 8, padding: '8px 16px', flex: 1 }}>
                    <input type="number" value={shoulder} onChange={e => setShoulder(e.target.value)} placeholder="الكتف" style={{ border: 'none', outline: 'none', width: '100%', fontSize: 16 }} />
                    <span style={{ color: '#aaa', fontSize: 14 }}>cm</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 'bold', width: 60 }}>الصدر</span>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: 8, padding: '8px 16px', flex: 1 }}>
                    <input type="number" value={chest} onChange={e => setChest(e.target.value)} placeholder="الصدر" style={{ border: 'none', outline: 'none', width: '100%', fontSize: 16 }} />
                    <span style={{ color: '#aaa', fontSize: 14 }}>cm</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 'bold', width: 60 }}>الطول</span>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: 8, padding: '8px 16px', flex: 1 }}>
                    <input type="number" value={length} onChange={e => setLength(e.target.value)} placeholder="الطول" style={{ border: 'none', outline: 'none', width: '100%', fontSize: 16 }} />
                    <span style={{ color: '#aaa', fontSize: 14 }}>cm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, backgroundColor: '#111', color: '#fff', borderRadius: 12, padding: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 70, fontWeight: 900, color: '#f5c842', lineHeight: 1 }}>{suggestedSize}</span>
            {suggestedFit && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, color: '#aaa', fontSize: 14 }}>
                <CheckCircle2 size={16} color="#2ecc71" />
                {suggestedFit}
              </div>
            )}
          </div>

        </div>

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#aaa' }}>
          * كيفية القياس الصحيحة تضمن لك الحصول على القياس المناسب.<br/>
          * Measurement variance for different models is indicated.
        </p>
      </div>
    </div>
  );
}
