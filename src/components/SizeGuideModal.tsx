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
    <div
      onClick={(e) => { e.stopPropagation(); onClose(); }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 md:p-5"
      dir="rtl"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white text-black rounded-2xl w-full max-w-[900px] max-h-[90vh] overflow-y-auto relative font-inter p-6 md:p-10"
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 md:top-5 md:left-5 bg-gray-100 border-none rounded-full w-10 h-10 text-2xl cursor-pointer flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          ×
        </button>

        {/* Header */}
        <div className="text-center mb-8 md:mb-10">
          <p className="text-gray-500 text-sm md:text-base mb-2">على القيش شينشين:</p>
          <h2 className="text-2xl md:text-4xl font-black m-0">دليل المقاسات الذكية لـ PrintStudio</h2>
        </div>

        {/* Illustrations Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 mb-8 md:mb-10">
          <div className="text-center md:border-l border-gray-200 md:pl-10">
            {/* Boxy Fit Illustration placeholder */}
            <div className="w-full h-40 md:h-48 bg-gray-50 rounded-lg flex items-center justify-center mb-5 overflow-hidden">
              <img src={fitIllustration} alt="Regular Fit" className="w-full h-full object-contain" />
            </div>
            <h3 className="text-xl md:text-2xl font-black mb-2 md:mb-3">مقاس عادي</h3>
            <p className="text-gray-500 text-xs md:text-sm">قصة منتظمة، التوجيه على الكتف، القيادة على قياساتك.</p>
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gray-100 rounded-full text-xs md:text-sm font-bold">
              <Ruler size={16} className="text-[#d4af37]" />
              كيفية القياس
            </div>
          </div>
          
          <div className="text-center md:pr-10">
            <div className="w-full h-40 md:h-48 bg-gray-50 rounded-lg flex items-center justify-center mb-5 overflow-hidden">
              <img src={fitIllustration} alt="Boxy Fit" className="w-full h-full object-contain" />
            </div>
            <h3 className="text-xl md:text-2xl font-black mb-2 md:mb-3">قصة مربعة</h3>
            <p className="text-gray-500 text-xs md:text-sm">قصة Boxy Fit، التوجيه على الرئيس، على قياسك.</p>
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gray-100 rounded-full text-xs md:text-sm font-bold">
              <Ruler size={16} className="text-[#d4af37]" />
              كيفية القياس
            </div>
          </div>
        </div>

        {/* Size Table */}
        <div className="overflow-x-auto mb-8 md:mb-10">
          <table className="w-full border-collapse text-center text-sm md:text-base whitespace-nowrap">
            <thead>
              <tr>
                <th className="bg-[#111] text-white p-3 md:p-4 border border-[#333]">Size</th>
                <th className="bg-[#111] text-[#f5c842] p-3 md:p-4 border border-[#333]">S</th>
                <th className="bg-[#111] text-[#f5c842] p-3 md:p-4 border border-[#333]">M</th>
                <th className="bg-[#111] text-[#f5c842] p-3 md:p-4 border border-[#333]">L</th>
                <th className="bg-[#111] text-[#f5c842] p-3 md:p-4 border border-[#333]">XL</th>
                <th className="bg-[#111] text-[#f5c842] p-3 md:p-4 border border-[#333]">XXL</th>
                <th className="bg-[#111] text-white p-3 md:p-4 border border-[#333] text-xs md:text-sm leading-tight">
                  المقاس المقترح<br/><span className="text-[10px] md:text-xs text-gray-400 font-normal">(بالسنتيمتر)</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 md:p-4 border border-gray-200 font-bold">عرض الكتفين</td>
                <td className="p-3 md:p-4 border border-gray-200">16 سم</td>
                <td className="p-3 md:p-4 border border-gray-200">18 سم</td>
                <td className="p-3 md:p-4 border border-gray-200">20 سم</td>
                <td className="p-3 md:p-4 border border-gray-200">23 سم</td>
                <td className="p-3 md:p-4 border border-gray-200">26 سم</td>
                <td className="p-3 md:p-4 border border-gray-200 bg-gray-50 font-bold">44-46</td>
              </tr>
              <tr>
                <td className="p-3 md:p-4 border border-gray-200 font-bold">محيط الصدر</td>
                <td className="p-3 md:p-4 border border-gray-200">40 سم</td>
                <td className="p-3 md:p-4 border border-gray-200">44 سم</td>
                <td className="p-3 md:p-4 border border-gray-200">48 سم</td>
                <td className="p-3 md:p-4 border border-gray-200">52 سم</td>
                <td className="p-3 md:p-4 border border-gray-200">56 سم</td>
                <td className="p-3 md:p-4 border border-gray-200 bg-gray-50 font-bold">56-60</td>
              </tr>
              <tr>
                <td className="p-3 md:p-4 border border-gray-200 font-bold">طول التيشيرت</td>
                <td className="p-3 md:p-4 border border-gray-200">64 سم</td>
                <td className="p-3 md:p-4 border border-gray-200">66 سم</td>
                <td className="p-3 md:p-4 border border-gray-200">70 سم</td>
                <td className="p-3 md:p-4 border border-gray-200">72 سم</td>
                <td className="p-3 md:p-4 border border-gray-200">74 سم</td>
                <td className="p-3 md:p-4 border border-gray-200 bg-gray-50 font-bold">69-72</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Calculator Section */}
        <div className="flex flex-col md:flex-row gap-5 md:gap-6">
          
          <div className="w-full md:w-2/3 border-2 border-[#111] rounded-xl overflow-hidden">
            <div className="bg-[#111] text-white p-3 md:p-4 flex items-center gap-3">
              <Ruler className="text-[#f5c842]" />
              <h3 className="m-0 text-base md:text-lg font-bold">حساب مقاسي الذكي</h3>
            </div>
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 mb-4 md:mb-5">
                <div className="flex items-center gap-2 md:gap-3">
                  <span className="font-bold w-12 md:w-16 text-sm md:text-base">الكتف</span>
                  <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 flex-1">
                    <input type="number" value={shoulder} onChange={e => setShoulder(e.target.value)} placeholder="الكتف" className="border-none outline-none w-full text-sm md:text-base bg-transparent" />
                    <span className="text-gray-400 text-xs md:text-sm">cm</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <span className="font-bold w-12 md:w-16 text-sm md:text-base">الصدر</span>
                  <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 flex-1">
                    <input type="number" value={chest} onChange={e => setChest(e.target.value)} placeholder="الصدر" className="border-none outline-none w-full text-sm md:text-base bg-transparent" />
                    <span className="text-gray-400 text-xs md:text-sm">cm</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                <div className="flex items-center gap-2 md:gap-3">
                  <span className="font-bold w-12 md:w-16 text-sm md:text-base">الطول</span>
                  <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 flex-1">
                    <input type="number" value={length} onChange={e => setLength(e.target.value)} placeholder="الطول" className="border-none outline-none w-full text-sm md:text-base bg-transparent" />
                    <span className="text-gray-400 text-xs md:text-sm">cm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/3 bg-[#111] text-white rounded-xl p-6 md:p-8 flex flex-col items-center justify-center min-h-[140px] md:min-h-0">
            <span className="text-6xl md:text-7xl font-black text-[#f5c842] leading-none mb-2 md:mb-0">{suggestedSize}</span>
            {suggestedFit && (
              <div className="flex items-center gap-2 mt-2 md:mt-3 text-gray-400 text-xs md:text-sm text-center">
                <CheckCircle2 size={16} className="text-[#2ecc71] shrink-0" />
                <span>{suggestedFit}</span>
              </div>
            )}
          </div>

        </div>

        <p className="mt-6 md:mt-8 text-center text-[10px] md:text-xs text-gray-400 leading-relaxed">
          * كيفية القياس الصحيح لك للحصول على القياس المناسب.<br/>
          * تتم الإشارة إلى تباين القياس لنماذج مختلفة.
        </p>
      </div>
    </div>
  );
}
