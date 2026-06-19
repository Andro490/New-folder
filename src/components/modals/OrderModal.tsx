import React, { useState } from 'react';
import { Info, Wallet } from 'lucide-react';
import { DesignLayer, TShirtColor, TShirtView } from '../../types';
import { appConfig } from '../../config';
import { generateTshirtImage } from '../../utils/tshirtCanvas';
import { uploadToImgBB } from '../../utils/imgbb';
import { sendOrderToSheet } from '../../utils/orderApi';
import TshirtPreviewBox from '../editor/TshirtPreviewBox';
import { useLanguage } from '../../contexts/LanguageContext';
import { SizeGuideModal } from '../SizeGuideModal';

const SIZES = [
  { id: 'S', label: 'SMALL', dims: '52 × 68', height: '165–170 cm tall', weight: '50–70 kg' },
  { id: 'M', label: 'MEDIUM', dims: '54 × 70', height: '170–175 cm tall', weight: '70–80 kg' },
  { id: 'L', label: 'LARGE', dims: '56 × 72', height: '175–180 cm tall', weight: '80–90 kg' },
  { id: 'XL', label: 'XLARGE', dims: '58 × 74', height: '180–185 cm tall', weight: '90–100 kg' },
  { id: 'XXL', label: 'XXLARGE', dims: '60 × 76', height: '185–195 cm tall', weight: '100–110 kg' },
];

interface OrderModalProps {
  onClose: () => void;
  tshirtColor: TShirtColor;
  allLayers: DesignLayer[];
  designLink?: string;
}

export default function OrderModal({ onClose, tshirtColor, allLayers, designLink }: OrderModalProps) {
  const { t, dir } = useLanguage();
  type Step = 'size' | 'review' | 'checkout' | 'thanks';
  const [step, setStep] = useState<Step>('size');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<'instapay' | 'cod'>('cod');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [shipping, setShipping] = useState<'free' | 'premium'>('free');
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', city: '', governorate: '', address: '' });
  const [showRefundPolicy, setShowRefundPolicy] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalTotal, setFinalTotal] = useState<number | null>(null);
  const [usedBalance, setUsedBalance] = useState(0);

  // ── رصيد المحفظة ────────────────────────────────────────────────
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('wearurway_user') || '{}'); } catch { return {}; } })();
  const userBalance: number = Number(storedUser.discountBalance) || 0;

  const colorLabel = tshirtColor === 'black' ? 'أسود' : tshirtColor === 'white' ? 'أبيض' : tshirtColor === 'navy' ? 'كحلي' : tshirtColor === 'red' ? 'أحمر' : 'رمادي';
  const colorDot = tshirtColor === 'black' ? '#111' : tshirtColor === 'white' ? '#f0f0f0' : tshirtColor === 'navy' ? '#1e3a5f' : tshirtColor === 'red' ? '#c0392b' : '#888';
  const affiliateCode = localStorage.getItem('wearurway_ref') || '';
  const communityDesignId = new URLSearchParams(window.location.search).get('designId') || localStorage.getItem('wearurway_community_design_id') || '';

  // ── خصم 10% بس لو بيشتري تصميم حد تاني (مش تصميمه هو) ──────────
  const designOwnerId = localStorage.getItem('wearurway_community_design_owner') || '';
  const loggedInUserId = String(storedUser.id || '');
  const isBuyingOthersDesign = Boolean(communityDesignId) && (designOwnerId !== loggedInUserId || !loggedInUserId);
  const isEligibleForDiscount = Boolean(affiliateCode || isBuyingOthersDesign);

  const baseDesignPrice = appConfig.pricing.basePrice;
  const discountAmount = isEligibleForDiscount ? Math.round(baseDesignPrice * 0.1) : 0;
  const designPrice = baseDesignPrice - discountAmount;
  
  const shippingCost = shipping === 'premium' ? appConfig.shipping.premium.priceEGP : appConfig.shipping.standard.priceEGP;
  const subtotal = designPrice + shippingCost;
  // خصم الرصيد لا يتجاوز الإجمالي
  const balanceDiscount = Math.min(userBalance, subtotal);
  const total = subtotal - balanceDiscount;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)',
    border: '1px solid #2a2a2a', outline: 'none',
    fontSize: 13, fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  // ── THANK YOU ──────────────────────────────────────────────────
  if (step === 'thanks') {
    return (
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div style={{ maxWidth: 520, width: '90%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', padding: '52px 40px', textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>
          {/* Animated checkmark */}
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), #e6a800)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 0 40px rgba(245,200,66,0.35)' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <p style={{ fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: 12 }}>ORDER CONFIRMED</p>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.05em', marginBottom: 16 }}>{t('orderModal.thanksTitle')}</h2>
          <p style={{ fontSize: 14, color: '#666', lineHeight: 1.8, marginBottom: 36 }}>
            {t('orderModal.orderConfirmedMsg')}<strong style={{ color: 'var(--text-primary)' }}>{t('orderModal.orderConfirmedMsg2')}</strong>{t('orderModal.orderConfirmedMsg3')}
          </p>

          {/* Order summary pill */}
          {usedBalance > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 16, padding: '10px 20px', backgroundColor: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 8 }}>
              <Wallet size={16} style={{ color: '#4ade80' }} />
              <span style={{ fontSize: 13, color: '#4ade80', fontWeight: 700 }}>تم خصم {usedBalance} {appConfig.pricing.currencyAr} من رصيدك 🎉</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 36 }}>
            {[
              { label: t('orderModal.size'), value: selectedSize ?? '-' },
              { label: t('orderModal.color'), value: colorLabel },
              { label: t('orderModal.total'), value: `${finalTotal ?? total} ${appConfig.pricing.currencyAr}` },
            ].map(item => (
              <div key={item.label} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '10px 20px', minWidth: 110 }}>
                <p style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</p>
                <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{item.value}</p>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            style={{ width: '100%', padding: '14px', backgroundColor: 'var(--accent-primary)', color: '#000', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase' }}
          >
            {t('orderModal.backToDesign')}
          </button>
        </div>
      </div>
    );
  }

  // ── CHECKOUT FORM ───────────────────────────────────────────────
  if (step === 'checkout') {
    const fitParam = new URLSearchParams(window.location.search).get('fit') || 'regularFit';
    const fitName = fitParam === 'oversize' ? 'أوفر سايز' : (fitParam === 'boxyFit' ? 'بوكسي' : 'مقاس عادي');

    return (
      <div className="fixed inset-0 z-[200] overflow-y-auto font-['Inter']" style={{ backgroundColor: 'var(--bg-primary)' }} dir="rtl">

        {/* Refund Policy Modal */}
        {showRefundPolicy && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowRefundPolicy(false)}>
            <div style={{ width: 480, maxWidth: '90%', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: 40, fontFamily: "'Inter', sans-serif" }} onClick={e => e.stopPropagation()} dir={dir}>
              <p style={{ fontSize: 11, color: '#555', marginBottom: 12 }}>{t('orderModal.refundPolicy')}</p>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.05em', marginBottom: 24 }}>{t('orderModal.refundPolicyTitle')}</h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 36 }}>
                {t('orderModal.refundPolicyText')}
              </p>
              <button onClick={() => setShowRefundPolicy(false)} style={{ width: '100%', padding: '16px', backgroundColor: 'var(--accent-primary)', color: '#000', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 900 }}>
                {t('orderModal.gotIt')}
              </button>
            </div>
          </div>
        )}

        {/* Top bar */}
        <div style={{ borderBottom: '1px solid var(--border-color)', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{t('orderModal.step2of2')}</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>

        <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-16 py-10 min-h-[calc(100vh-60px)] flex flex-col lg:flex-row justify-center items-start gap-10 lg:gap-16">
          {/* RIGHT/TOP: Form */}
          <div className="w-full lg:w-[650px]">
            <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 32 }}>{t('orderModal.checkoutTitle')}</h1>

            {/* Delivery info */}
            <p style={{ fontSize: 12, color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>{t('orderModal.deliveryInfo')}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em' }}>{t('orderModal.firstName')}</label>
                <input style={inputStyle} value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em' }}>{t('orderModal.lastName')}</label>
                <input style={inputStyle} value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em' }}>{t('orderModal.phone')}</label>
              <input
                style={{
                  ...inputStyle,
                  border: form.phone && (form.phone.length !== 11 || !form.phone.startsWith('01'))
                    ? '1px solid #e74c3c'
                    : form.phone.length === 11 && form.phone.startsWith('01')
                    ? '1px solid #2ecc71'
                    : '1px solid #2a2a2a',
                }}
                value={form.phone}
                maxLength={11}
                inputMode="numeric"
                placeholder="01xxxxxxxxx"
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setForm(f => ({ ...f, phone: val }));
                }}
              />
              {form.phone && !form.phone.startsWith('01') && (
                <p style={{ fontSize: 11, color: '#e74c3c', marginTop: 4 }}>{t('orderModal.phoneError')}</p>
              )}
              {form.phone && form.phone.startsWith('01') && form.phone.length !== 11 && (
                <p style={{ fontSize: 11, color: '#e7a000', marginTop: 4 }}>
                  {11 - form.phone.length}{t('orderModal.phoneRemaining')}
                </p>
              )}
              {form.phone.length === 11 && form.phone.startsWith('01') && (
                <p style={{ fontSize: 11, color: '#2ecc71', marginTop: 4 }}>{t('orderModal.phoneValid')}</p>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em' }}>{t('orderModal.city')}</label>
                <input style={inputStyle} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em' }}>{t('orderModal.governorate')}</label>
                <input style={inputStyle} value={form.governorate} onChange={e => setForm(f => ({ ...f, governorate: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginBottom: 32 }}>
              <label style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em' }}>{t('orderModal.address')}</label>
              <input style={inputStyle} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>

            {/* Shipping */}
            <p style={{ fontSize: 12, color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>{t('orderModal.shipping')}</p>
            {[
              { id: 'free', label: t('orderModal.freeShipping'), sub: t('orderModal.freeShippingSub'), price: `${appConfig.shipping.standard.priceEGP} ${appConfig.pricing.currencyAr}`, icon: '🎁' },
              { id: 'premium', label: t('orderModal.premiumShipping'), sub: t('orderModal.premiumShippingSub'), price: `${appConfig.shipping.premium.priceEGP} ${appConfig.pricing.currencyAr}`, icon: '🚚' },
            ].map(opt => (
              <div
                key={opt.id}
                onClick={() => setShipping(opt.id as 'free' | 'premium')}
                style={{ border: `1px solid ${shipping === opt.id ? 'var(--accent-primary)' : 'var(--border-color)'}`, backgroundColor: shipping === opt.id ? 'var(--bg-tertiary)' : 'var(--bg-secondary)', padding: '16px 20px', marginBottom: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}
              >
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${shipping === opt.id ? 'var(--accent-primary)' : '#444'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {shipping === opt.id && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{opt.icon} {opt.label}</p>
                  <p style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{opt.sub}</p>
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#4ade80', flexShrink: 0 }}>{opt.price}</p>
              </div>
            ))}

            {/* Payment */}
            <p style={{ fontSize: 12, color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16, marginTop: 28 }}>{t('orderModal.payment')}</p>
            {[
              { id: 'instapay', label: t('orderModal.instapay'), sub: `${t('orderModal.sendTo')}${appConfig.payment.instapay.phoneNumber}`, icon: '📱' },
              { id: 'cod', label: t('orderModal.cod'), sub: t('orderModal.codSub'), icon: '💵' },
            ].map(opt => (
              <div
                key={opt.id}
                onClick={() => setPayMethod(opt.id as 'instapay' | 'cod')}
                style={{ border: `1px solid ${payMethod === opt.id ? 'var(--accent-primary)' : 'var(--border-color)'}`, backgroundColor: payMethod === opt.id ? 'var(--bg-tertiary)' : 'var(--bg-secondary)', padding: '16px 20px', marginBottom: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}
              >
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${payMethod === opt.id ? 'var(--accent-primary)' : '#444'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {payMethod === opt.id && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{opt.icon} {opt.label}</p>
                  <p style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{opt.sub}</p>
                </div>
              </div>
            ))}

            {/* InstaPay Upload Section */}
            {payMethod === 'instapay' && (
              <div style={{ marginTop: 16, border: '1px dashed var(--accent-primary)', padding: '20px', backgroundColor: 'rgba(245,200,66,0.03)' }}>
                <p style={{ fontSize: 11, color: 'var(--accent-primary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>{t('orderModal.attachProof')}</p>
                <label
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 10, padding: '14px', border: '1px solid #2a2a2a',
                    backgroundColor: 'var(--bg-secondary)', cursor: 'pointer',
                    fontSize: 12, color: '#888', letterSpacing: '0.08em'
                  }}
                >
                  <span style={{ fontSize: 18 }}>📷</span>
                  {paymentProof ? paymentProof.name : t('orderModal.chooseProof')}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPaymentProof(file);
                        setPaymentProofPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>
                {paymentProofPreview && (
                  <div style={{ marginTop: 12, position: 'relative' }}>
                    <img
                      src={paymentProofPreview}
                      alt={t('orderModal.attachProof')}
                      style={{ width: '100%', maxHeight: 200, objectFit: 'cover', border: '1px solid #2a2a2a' }}
                    />
                    <button
                      onClick={() => { setPaymentProof(null); setPaymentProofPreview(null); }}
                      style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.8)', border: 'none', color: 'var(--text-primary)', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 14 }}
                    >×</button>
                    <p style={{ fontSize: 11, color: '#4ade80', marginTop: 8 }}>{t('orderModal.proofSuccess')}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* LEFT/BOTTOM: Order summary */}
          <div className="w-full lg:w-[450px] shrink-0 h-fit">
            <p style={{ fontSize: 12, color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>{t('orderModal.yourDesign')}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
              {[{ id: 'front', label: t('orderModal.front') }, { id: 'back', label: t('orderModal.back') }].map(side => (
                <div key={side.id} style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: 12 }}>
                  <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, overflow: 'hidden' }}>
                    <TshirtPreviewBox layers={allLayers} tshirtColor={tshirtColor} view={side.id as TShirtView} width={150} height={160} />
                  </div>
                  <p style={{ fontSize: 11, color: '#555', textAlign: 'center', letterSpacing: '0.1em' }}>{side.label}</p>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 12, color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>{t('orderModal.orderSummary')}</p>
            {[
              { label: t('orderModal.product'), value: t('orderModal.tshirt') },
              { label: t('orderModal.fit'), value: fitName },
              { label: t('orderModal.color'), value: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, backgroundColor: colorDot, border: '1px solid #333', display: 'inline-block' }} />{colorLabel}</span> },
              { label: t('orderModal.size'), value: selectedSize },
              { label: t('orderModal.designLink'), value: (allLayers.find(l => l.pinterestUrl)?.pinterestUrl || t('orderModal.noLink')) },
              { label: t('orderModal.shipping'), value: shippingCost === 0 ? <span style={{ color: '#4ade80' }}>{t('orderModal.freeShipping')}</span> : `${shippingCost} ${appConfig.pricing.currencyAr}` },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{row.value as any}</span>
              </div>
            ))}
            {balanceDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: 12, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Wallet size={13} /> خصم الرصيد
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#4ade80' }}>- {balanceDiscount} {appConfig.pricing.currencyAr}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', marginTop: 4 }}>
              <span style={{ fontSize: 12, color: '#555' }}>{t('orderModal.total')}</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--accent-primary)' }}>{total} {appConfig.pricing.currencyAr}</span>
            </div>

            <button
              id="submit-btn"
              disabled={isSubmitting}
              onClick={async () => {
                if (!form.firstName || !form.phone || !form.address) {
                  alert(t('orderModal.fillRequired'));
                  return;
                }
                if (!form.phone.startsWith('01') || form.phone.length !== 11) {
                  alert(t('orderModal.phoneMustBe11'));
                  return;
                }
                if (payMethod === 'instapay' && !paymentProof) {
                  alert(t('orderModal.instapayProofReq'));
                  return;
                }
                setIsSubmitting(true);

                // ── جمع روابط Pinterest للمرجع فقط ──
                const allPinterestUrls: string[] = allLayers
                  .filter(l => l.pinterestUrl && l.pinterestUrl !== 'جاري الرفع...')
                  .map(l => l.pinterestUrl!);
                const uniquePinterestUrls = [...new Set(allPinterestUrls)];

                // ── جمع الصور الأصلية (قبل التعديل) أو بدائلها من جميع الطبقات ──
                const originalImageUrls: string[] = allLayers
                  .filter(l => !l.textProps)
                  .map(l => {
                    const validPinterest = l.pinterestUrl && l.pinterestUrl !== 'جاري الرفع...' ? l.pinterestUrl : null;
                    // If originalImageUrl is a blob, but we have a valid https pinterestUrl, prefer the https one
                    // because blob URLs from Community designs will be dead on the buyer's machine.
                    if (l.originalImageUrl && l.originalImageUrl.startsWith('blob:') && validPinterest && validPinterest.startsWith('http')) {
                      return validPinterest;
                    }
                    return l.originalImageUrl || validPinterest || l.imageUrl;
                  })
                  .filter(Boolean) as string[];
                const uniqueOriginalUrls = [...new Set(originalImageUrls)];

                // ── رفع الصور الأصلية على ImgBB (ممكن أكتر من صورة) ──
                let uploadedOriginalImages = 'لا توجد صورة أصلية';
                try {
                  const uploadedOriginals = await Promise.all(
                    uniqueOriginalUrls.map(async (imgUrl) => {
                      try {
                        // data URL / blob → ارفع على ImgBB
                        if (imgUrl.startsWith('blob:')) {
                          const res = await fetch(imgUrl);
                          const blob = await res.blob();
                          const file = new File([blob], 'original.png', { type: 'image/png' });
                          return await uploadToImgBB(file);
                        }
                        if (imgUrl.startsWith('data:')) {
                          return await uploadToImgBB(imgUrl);
                        }
                        return imgUrl; // رابط خارجي مباشر
                      } catch {
                        return imgUrl;
                      }
                    })
                  );
                  if (uploadedOriginals.length > 0) {
                    uploadedOriginalImages = uploadedOriginals.join('\n');
                  }
                } catch (origErr) {
                  console.warn('⚠️ فشل رفع الصور الأصلية:', origErr);
                }

                // ── استخراج طبقات النصوص ──
                const textLayersData = allLayers.filter(l => l.textProps);
                const textSummary = textLayersData.length > 0
                  ? textLayersData.map((l, i) =>
                    `[${i + 1}] نص: "${l.textProps!.text}" | خط: ${l.textProps!.font.split(',')[0]} | لون: ${l.textProps!.color}`
                  ).join('\n')
                  : 'لا يوجد نص';

                // ── تصدير صور التيشيرت (أمامي + خلفي) ──
                let frontImageUrl = 'لا توجد صورة';
                let backImageUrl = 'لا توجد صورة';
                try {
                  const [frontBase64, backBase64] = await Promise.all([
                    generateTshirtImage({ layers: allLayers, tshirtColor, view: 'front', width: 600, height: 600 }),
                    generateTshirtImage({ layers: allLayers, tshirtColor, view: 'back', width: 600, height: 600 }),
                  ]);
                  const [fUrl, bUrl] = await Promise.all([
                    uploadToImgBB(frontBase64),
                    uploadToImgBB(backBase64),
                  ]);
                  frontImageUrl = fUrl;
                  backImageUrl = bUrl;
                } catch (imgErr) {
                  console.warn('⚠️ فشل رفع صور التيشيرت:', imgErr);
                }

                // ── رفع صورة إيصال إنستاباي ──
                let instapayProofUrl = 'لا توجد صورة';
                if (payMethod === 'instapay' && paymentProof) {
                  try {
                    instapayProofUrl = await uploadToImgBB(paymentProof);
                  } catch (proofErr) {
                    console.warn('⚠️ فشل رفع إيصال إنستاباي:', proofErr);
                  }
                }

                try {
                  // ── إرسال الطلب عبر الـ Backend ──
                  const result = await sendOrderToSheet({
                    firstName: form.firstName,
                    lastName: form.lastName,
                    phone: form.phone,
                    city: form.city,
                    governorate: form.governorate,
                    address: form.address,
                    size: `${selectedSize ?? '-'} (${fitName})`,
                    color: tshirtColor,
                    shippingType: shipping,
                    paymentMethod: payMethod,
                    designImages: uploadedOriginalImages,
                    pinterestLinks: uniquePinterestUrls.join('\n') || 'لا توجد روابط',
                    textLayers: textSummary,
                    frontImage: frontImageUrl,
                    backImage: backImageUrl,
                    instapayProof: instapayProofUrl,
                    totalPrice: String(total), // الإجمالي بعد خصم الرصيد
                    balanceUsed: String(balanceDiscount),
                    timestamp: new Date().toLocaleString('ar-EG'),
                    affiliateCode: localStorage.getItem('wearurway_ref') || '',
                    designId: new URLSearchParams(window.location.search).get('designId') || localStorage.getItem('wearurway_community_design_id') || '',
                  });

                  // ── تحديث الرصيد في localStorage ──
                  if (result.balanceUsed > 0) {
                    setUsedBalance(result.balanceUsed);
                    const updatedUser = { ...storedUser, discountBalance: result.newUserBalance };
                    localStorage.setItem('wearurway_user', JSON.stringify(updatedUser));
                  }

                  setFinalTotal(total);
                  setStep('thanks');
                  localStorage.removeItem('wearurway_ref');
                  localStorage.removeItem('wearurway_community_design_id');
                  localStorage.removeItem('wearurway_community_design_owner');
                } catch (err: any) {
                  alert('❌ Error: \n' + err.message);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              style={{
                width: '100%', padding: '16px',
                backgroundColor: isSubmitting ? '#8a7020' : 'var(--accent-primary)',
                color: '#000', border: 'none',
                cursor: isSubmitting ? 'wait' : 'pointer',
                fontSize: 14, fontWeight: 900,
                letterSpacing: '0.15em', marginTop: 4,
                transition: 'background-color 0.2s',
              }}
            >
              {isSubmitting ? t('orderModal.submitting') : t('orderModal.submitOrder')}
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16 }}>
              <a
                href={`https://wa.me/${appConfig.site.whatsappNumber.replace('+', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: 'none', border: 'none', fontSize: 12, color: '#444', cursor: 'pointer', textDecoration: 'none' }}
              >{t('orderModal.contactUs')}</a>
              <span style={{ color: '#333' }}>|</span>
              <button onClick={() => setShowRefundPolicy(true)} style={{ background: 'none', border: 'none', fontSize: 12, color: '#444', cursor: 'pointer' }}>{t('orderModal.refundPolicy')}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── REVIEW ──────────────────────────────────────────────────────
  if (step === 'review') {
    const fitParam = new URLSearchParams(window.location.search).get('fit') || 'regularFit';
    const fitLabelEn = fitParam === 'oversize' ? 'OVERSIZE' : (fitParam === 'boxyFit' ? 'BOXY FIT' : 'REGULAR FIT');
    
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
        <div style={{ width: '100%', maxWidth: 560, backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', fontFamily: "'Inter', sans-serif" }} onClick={e => e.stopPropagation()}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 10, color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>{t('orderModal.step2of2')}</p>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t('orderModal.reviewOrder')}</h2>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#444', fontSize: 20, cursor: 'pointer' }}>×</button>
          </div>

          <div style={{ padding: '24px', overflowY: 'auto', maxHeight: '70vh' }} dir={dir}>
            <button onClick={() => setStep('size')} style={{ background: 'none', border: 'none', color: '#555', fontSize: 12, cursor: 'pointer', marginBottom: 20, letterSpacing: '0.05em' }}>{t('orderModal.changeSize')}</button>

            <p style={{ fontSize: 10, color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>{t('orderModal.designPreview')}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
              {[{ id: 'front', label: t('orderModal.front') }, { id: 'back', label: t('orderModal.back') }].map(side => (
                <div key={side.id} style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <TshirtPreviewBox layers={allLayers} tshirtColor={tshirtColor} view={side.id as TShirtView} width={200} height={200} />
                  </div>
                  <p style={{ textAlign: 'center', fontSize: 10, color: '#444', letterSpacing: '0.15em', padding: '8px 0' }}>{side.label}</p>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 10, color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>{t('orderModal.configuration')}</p>
            {[
              { label: t('orderModal.product'), value: t('orderModal.tshirt') },
              { label: t('orderModal.fit'), value: fitLabelEn },
              { label: t('orderModal.color'), value: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, backgroundColor: colorDot, border: '1px solid #333', display: 'inline-block' }} />{colorLabel.toUpperCase()}</span> },
              { label: t('orderModal.size'), value: selectedSize },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', marginBottom: 1 }}>
                <span style={{ fontSize: 11, color: '#444', letterSpacing: '0.1em' }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>{row.value as any}</span>
              </div>
            ))}

            {balanceDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', backgroundColor: 'rgba(74,222,128,0.05)', paddingInline: 8 }}>
                <span style={{ fontSize: 11, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Wallet size={12} /> خصم الرصيد
                </span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#4ade80' }}>- {balanceDiscount} {appConfig.pricing.currencyAr}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', marginTop: 8 }}>
              <span style={{ fontSize: 11, color: '#555', letterSpacing: '0.1em' }}>{t('orderModal.total')}</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--accent-primary)' }}>
                {isEligibleForDiscount && <span style={{ textDecoration: 'line-through', color: '#888', margin: '0 8px', fontSize: 16 }}>{baseDesignPrice}</span>}
                {total} <span style={{ fontSize: 13, color: '#888' }}>{appConfig.pricing.currencyAr}</span>
              </span>
            </div>

            <button
              onClick={() => setStep('checkout')}
              style={{ width: '100%', padding: '16px', backgroundColor: 'var(--accent-primary)', color: '#000', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase' }}
            >
              {t('orderModal.confirmOrder')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── SIZE SELECTION ───────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 860, maxHeight: '90vh', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} dir={dir}>
          <div>
            <p style={{ fontSize: 10, color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>{t('orderModal.step1of2')}</p>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t('orderModal.selectSize')}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#444', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ overflowY: 'auto', padding: '24px' }} dir={dir}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 10, color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>{t('orderModal.perfectFit')}</p>
            <button
              onClick={() => setShowSizeGuide(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', backgroundColor: 'rgba(245, 200, 66, 0.1)',
                color: 'var(--accent-primary)', border: '1px solid rgba(245, 200, 66, 0.3)',
                borderRadius: 100, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(245, 200, 66, 0.2)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(245, 200, 66, 0.1)'}
            >
              <Info size={14} />
              {t('orderModal.knowYourSize')}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SIZES.map(sz => (
              <div
                key={sz.id}
                onClick={() => { setSelectedSize(sz.id); setStep('review'); }}
                style={{
                  border: `1px solid ${selectedSize === sz.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                  backgroundColor: selectedSize === sz.id ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                  padding: '28px 20px', cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = selectedSize === sz.id ? 'var(--accent-primary)' : 'var(--border-color)')}
              >
                <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.12em', marginBottom: 8 }}>{sz.label}</p>
                <p style={{ fontSize: 12, color: '#555', marginBottom: 10 }}>
                  {sz.dims.split(' × ')[0]} × {sz.dims.split(' × ')[1]} <span style={{ color: '#4a9eff', fontSize: 10 }}>cm</span>
                </p>
                <p style={{ fontSize: 11, color: '#444', lineHeight: 1.7 }}>{sz.height}<br />{sz.weight}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {showSizeGuide && (
        <SizeGuideModal onClose={() => setShowSizeGuide(false)} />
      )}
    </div>
  );
}
