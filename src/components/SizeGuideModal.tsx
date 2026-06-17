import React, { useState } from 'react';
import { Ruler, CheckCircle2 } from 'lucide-react';
import fitIllustration from '../assets/Gemini_Generated_Image_ljxpfeljxpfeljxp.png';
import { useLanguage } from '../contexts/LanguageContext';

export function SizeGuideModal({ onClose }: { onClose: () => void }) {
  const { t, dir } = useLanguage();
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
    suggestedFit = t('sizeGuide.regularFitSuggested');
  }

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClose(); }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 md:p-5"
      dir={dir}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-2xl w-full max-w-[900px] md:max-w-[1100px] max-h-[90vh] overflow-y-auto relative font-inter p-6 pb-8 md:p-12 md:pb-14"
        style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 md:top-5 md:left-5 border-none rounded-full w-10 h-10 text-2xl cursor-pointer flex items-center justify-center transition-colors"
          style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
        >
          ×
        </button>

        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <p className="text-sm md:text-base mb-3" style={{ color: 'var(--text-secondary)' }}>{t('sizeGuide.subtitle')}</p>
          <h2 className="text-2xl md:text-4xl font-black m-0" style={{ color: 'var(--text-primary)' }}>{t('sizeGuide.title')}</h2>
        </div>

        {/* Illustrations Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 mb-10 md:mb-14">
          <div className="text-center md:border-l md:pl-12" style={{ borderColor: 'var(--border-color)' }}>
            {/* Boxy Fit Illustration placeholder */}
            <div className="w-full h-44 md:h-52 rounded-lg flex items-center justify-center mb-6 overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <img src={fitIllustration} alt="Regular Fit" className="w-full h-full object-contain" />
            </div>
            <h3 className="text-xl md:text-2xl font-black mb-3 md:mb-4" style={{ color: 'var(--text-primary)' }}>{t('sizeGuide.regularFitTitle')}</h3>
            <p className="text-xs md:text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{t('sizeGuide.regularFitDesc')}</p>
            <div className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full text-xs md:text-sm font-bold" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
              <Ruler size={16} className="text-[#d4af37]" />
              {t('sizeGuide.howToMeasure')}
            </div>
          </div>
          
          <div className="text-center md:pr-12">
            <div className="w-full h-44 md:h-52 rounded-lg flex items-center justify-center mb-6 overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <img src={fitIllustration} alt="Boxy Fit" className="w-full h-full object-contain" />
            </div>
            <h3 className="text-xl md:text-2xl font-black mb-3 md:mb-4" style={{ color: 'var(--text-primary)' }}>{t('sizeGuide.boxyFitTitle')}</h3>
            <p className="text-xs md:text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{t('sizeGuide.boxyFitDesc')}</p>
            <div className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full text-xs md:text-sm font-bold" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
              <Ruler size={16} className="text-[#d4af37]" />
              {t('sizeGuide.howToMeasure')}
            </div>
          </div>
        </div>

        {/* Size Table */}
        <div className="overflow-x-auto mb-14 md:mb-20">
          <table className="w-full border-collapse text-center text-sm md:text-base whitespace-nowrap">
            <thead>
              <tr>
                <th className="bg-[#111] text-white border border-[#333]" style={{ padding: '16px' }}>Size</th>
                <th className="bg-[#111] text-[#f5c842] border border-[#333]" style={{ padding: '16px' }}>S</th>
                <th className="bg-[#111] text-[#f5c842] border border-[#333]" style={{ padding: '16px' }}>M</th>
                <th className="bg-[#111] text-[#f5c842] border border-[#333]" style={{ padding: '16px' }}>L</th>
                <th className="bg-[#111] text-[#f5c842] border border-[#333]" style={{ padding: '16px' }}>XL</th>
                <th className="bg-[#111] text-[#f5c842] border border-[#333]" style={{ padding: '16px' }}>XXL</th>
                <th className="bg-[#111] text-white border border-[#333] text-xs md:text-sm leading-tight" style={{ padding: '16px' }}>
                  {t('sizeGuide.suggestedSize')}<br/><span className="text-[10px] md:text-xs text-gray-400 font-normal">{t('sizeGuide.inCm')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border font-bold" style={{ padding: '16px', borderColor: 'var(--border-color)' }}>{t('sizeGuide.shoulderWidth')}</td>
                <td className="border" style={{ padding: '16px', borderColor: 'var(--border-color)' }}>16 {dir === 'rtl' ? 'سم' : 'cm'}</td>
                <td className="border" style={{ padding: '16px', borderColor: 'var(--border-color)' }}>18 سم</td>
                <td className="border" style={{ padding: '16px', borderColor: 'var(--border-color)' }}>20 سم</td>
                <td className="border" style={{ padding: '16px', borderColor: 'var(--border-color)' }}>23 سم</td>
                <td className="border" style={{ padding: '16px', borderColor: 'var(--border-color)' }}>26 سم</td>
                <td className="border font-bold" style={{ padding: '16px', borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>44-46</td>
              </tr>
              <tr>
                <td className="border font-bold" style={{ padding: '16px', borderColor: 'var(--border-color)' }}>{t('sizeGuide.chestWidth')}</td>
                <td className="border" style={{ padding: '16px', borderColor: 'var(--border-color)' }}>40 {dir === 'rtl' ? 'سم' : 'cm'}</td>
                <td className="border" style={{ padding: '16px', borderColor: 'var(--border-color)' }}>44 سم</td>
                <td className="border" style={{ padding: '16px', borderColor: 'var(--border-color)' }}>48 سم</td>
                <td className="border" style={{ padding: '16px', borderColor: 'var(--border-color)' }}>52 سم</td>
                <td className="border" style={{ padding: '16px', borderColor: 'var(--border-color)' }}>56 سم</td>
                <td className="border font-bold" style={{ padding: '16px', borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>56-60</td>
              </tr>
              <tr>
                <td className="border font-bold" style={{ padding: '16px', borderColor: 'var(--border-color)' }}>{t('sizeGuide.tshirtLength')}</td>
                <td className="border" style={{ padding: '16px', borderColor: 'var(--border-color)' }}>64 {dir === 'rtl' ? 'سم' : 'cm'}</td>
                <td className="border" style={{ padding: '16px', borderColor: 'var(--border-color)' }}>66 سم</td>
                <td className="border" style={{ padding: '16px', borderColor: 'var(--border-color)' }}>70 سم</td>
                <td className="border" style={{ padding: '16px', borderColor: 'var(--border-color)' }}>72 سم</td>
                <td className="border" style={{ padding: '16px', borderColor: 'var(--border-color)' }}>74 سم</td>
                <td className="border font-bold" style={{ padding: '16px', borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>69-72</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Calculator Section */}
        <div className="flex flex-col gap-6 md:gap-8">

          {/* Inputs Card — always on top */}
          <div className="w-full border-2 rounded-xl overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
            <div className="p-3 md:p-4 flex items-center gap-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <Ruler className="text-[#f5c842]" />
              <h3 className="m-0 text-base md:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{t('sizeGuide.smartCalcTitle')}</h3>
            </div>
            <div className="p-5 md:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-7">
                {/* Shoulder */}
                <div className="flex flex-col gap-1.5">
                  <span className="font-bold text-sm md:text-base" style={{ color: 'var(--text-primary)' }}>{t('sizeGuide.shoulder')}</span>
                  <div className="flex items-center border rounded-lg px-4 py-3" style={{ borderColor: 'var(--border-color)' }}>
                    <input
                      type="number"
                      value={shoulder}
                      onChange={e => setShoulder(e.target.value)}
                      placeholder={`${t('sizeGuide.example')} 18`}
                      className="border-none outline-none w-full text-sm md:text-base bg-transparent"
                      style={{ color: 'var(--text-primary)' }}
                    />
                    <span className="text-xs md:text-sm ml-1" style={{ color: 'var(--text-secondary)' }}>cm</span>
                  </div>
                </div>
                {/* Chest */}
                <div className="flex flex-col gap-1.5">
                  <span className="font-bold text-sm md:text-base" style={{ color: 'var(--text-primary)' }}>{t('sizeGuide.chest')}</span>
                  <div className="flex items-center border rounded-lg px-4 py-3" style={{ borderColor: 'var(--border-color)' }}>
                    <input
                      type="number"
                      value={chest}
                      onChange={e => setChest(e.target.value)}
                      placeholder={`${t('sizeGuide.example')} 44`}
                      className="border-none outline-none w-full text-sm md:text-base bg-transparent"
                      style={{ color: 'var(--text-primary)' }}
                    />
                    <span className="text-xs md:text-sm ml-1" style={{ color: 'var(--text-secondary)' }}>cm</span>
                  </div>
                </div>
                {/* Length */}
                <div className="flex flex-col gap-1.5">
                  <span className="font-bold text-sm md:text-base" style={{ color: 'var(--text-primary)' }}>{t('sizeGuide.tshirtLength')}</span>
                  <div className="flex items-center border rounded-lg px-4 py-3" style={{ borderColor: 'var(--border-color)' }}>
                    <input
                      type="number"
                      value={length}
                      onChange={e => setLength(e.target.value)}
                      placeholder={`${t('sizeGuide.example')} 66`}
                      className="border-none outline-none w-full text-sm md:text-base bg-transparent"
                      style={{ color: 'var(--text-primary)' }}
                    />
                    <span className="text-xs md:text-sm ml-1" style={{ color: 'var(--text-secondary)' }}>cm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Result Box — always below inputs */}
          <div className="w-full bg-[#111] text-white rounded-xl p-8 md:p-10 flex flex-col items-center justify-center min-h-[160px]">
            <span className="text-7xl md:text-8xl font-black text-[#f5c842] leading-none">{suggestedSize}</span>
            {suggestedFit && (
              <div className="flex items-center gap-2 mt-4 text-gray-400 text-sm md:text-base text-center">
                <CheckCircle2 size={18} className="text-[#2ecc71] shrink-0" />
                <span>{suggestedFit}</span>
              </div>
            )}
          </div>

        </div>

        <p className="mt-6 md:mt-8 text-center text-[10px] md:text-xs text-gray-400 leading-relaxed">
          {t('sizeGuide.footerNote1')}<br/>
          {t('sizeGuide.footerNote2')}
        </p>
      </div>
    </div>
  );
}
