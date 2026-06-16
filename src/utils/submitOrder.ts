// ====================================================
// submitOrder.ts — إرسال بيانات الطلب إلى Google Sheets
// ====================================================

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzgNR5Swr7A0Gbg-QkERjAUe-HiukKS0j02sq9lsgm7jiPvHy0-ecA0WGWlA1_JuI8T/exec';

// البيانات الثابتة (لا تتغير مع كل طلب)
const HARDCODED_DATA = {
  designLink: 'https://pin.it/44SL9x40D',
  paymentStatus: 'إيداع انستا باي',
};

export interface OrderData {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
}

/**
 * يسحب بيانات المستخدم من حقول الإدخال ويُرسل الطلب كاملاً
 * @param inputIds - أسماء IDs حقول الإدخال في الصفحة
 */
export async function submitOrderFromInputs(inputIds: {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
}): Promise<void> {
  // --- سحب القيم من حقول الإدخال ---
  const getValue = (id: string): string => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    return el ? el.value.trim() : '';
  };

  const firstName = getValue(inputIds.firstName);
  const lastName  = getValue(inputIds.lastName);
  const phone     = getValue(inputIds.phone);
  const address   = getValue(inputIds.address);

  // --- التحقق البسيط ---
  if (!firstName || !lastName || !phone || !address) {
    showMessage('⚠️ من فضلك اكمل جميع بيانات الطلب قبل الإرسال.', 'error');
    return;
  }

  // --- كائن الطلب الكامل ---
  const orderPayload = {
    firstName,
    lastName,
    phone,
    address,
    designLink:    HARDCODED_DATA.designLink,
    paymentStatus: HARDCODED_DATA.paymentStatus,
    timestamp:     new Date().toLocaleString('ar-EG'),
  };

  console.log('📦 إرسال الطلب:', orderPayload);

  try {
    // إرسال بـ fetch مع no-cors (لا يُرجع response قابلة للقراءة — هذا طبيعي)
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });

    // ── Track Community Design Purchase ──
    try {
      const designId = localStorage.getItem('wearurway_community_design_id');
      if (designId) {
        const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');
        await fetch(`${API_BASE}/api/designs/${designId}/purchase`, { method: 'POST' });
        localStorage.removeItem('wearurway_community_design_id');
      }
    } catch (e) {
      console.error('Failed to track purchase', e);
    }

    // ✅ رسالة النجاح للمستخدم
    showSuccessModal(firstName);
  } catch (error) {
    console.error('❌ خطأ في الإرسال:', error);
    showMessage('❌ حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.', 'error');
  }
}

// --------------------------------------------------
// عرض رسالة النجاح (Modal)
// --------------------------------------------------
function showSuccessModal(name: string): void {
  // إزالة أي modal سابق
  document.getElementById('order-success-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'order-success-modal';
  modal.innerHTML = `
    <div style="
      position:fixed; inset:0; z-index:99999;
      display:flex; align-items:center; justify-content:center;
      background:rgba(0,0,0,0.85); backdrop-filter:blur(8px);
      padding:20px; font-family:'Cairo',sans-serif; direction:rtl;
    ">
      <div style="
        background:linear-gradient(135deg,#111,#1a1a1a);
        border:1px solid rgba(245,200,66,0.3);
        border-radius:20px; padding:40px 32px;
        max-width:480px; width:100%; text-align:center;
        box-shadow:0 0 60px rgba(245,200,66,0.1);
        animation: fadeInScale 0.3s ease;
      ">
        <div style="font-size:56px; margin-bottom:16px;">🎉</div>

        <h2 style="color:#f5c842; font-size:26px; font-weight:900; margin:0 0 12px;" id="success-name-title">
          تم استقبال طلبك!
        </h2>

        <p style="color:#ccc; font-size:15px; line-height:1.8; margin-bottom:24px;">
          طلبك وصلنا بنجاح ✅<br/>
          عايزك دلوقتي تبعتلنا <strong style="color:#fff;">رابط التصميم</strong> أو
          <strong style="color:#fff;">صورة التصميم</strong> على إنستقرام أو واتساب
          عشان نقدر نكمل طلبك 🔥
        </p>

        <div style="
          background:rgba(245,200,66,0.08);
          border:1px dashed rgba(245,200,66,0.4);
          border-radius:12px; padding:16px; margin-bottom:24px;
        ">
          <p style="color:#aaa; font-size:13px; margin:0 0 8px;">🔗 رابط التصميم بتاعنا للإلهام:</p>
          <a href="https://pin.it/44SL9x40D" target="_blank" style="
            color:#f5c842; font-size:14px; font-weight:700;
            word-break:break-all; text-decoration:none;
          ">
            https://pin.it/44SL9x40D
          </a>
        </div>

        <button
          id="close-success-modal"
          style="
            background:linear-gradient(135deg,#f5c842,#d4af37);
            color:#000; border:none; border-radius:10px;
            padding:14px 32px; font-size:15px; font-weight:900;
            cursor:pointer; width:100%; letter-spacing:0.05em;
            transition:opacity 0.2s;
          "
          onmouseover="this.style.opacity='0.85'"
          onmouseout="this.style.opacity='1'"
        >
          تمام، هبعت التصميم ✅
        </button>
      </div>
    </div>
    <style>
      @keyframes fadeInScale {
        from { opacity:0; transform:scale(0.85); }
        to   { opacity:1; transform:scale(1);    }
      }
    </style>
  `;

  document.body.appendChild(modal);
  
  // Safe injection using textContent
  const titleEl = document.getElementById('success-name-title');
  if (titleEl) {
    titleEl.textContent = `تم استقبال طلبك يا ${name}!`;
  }
  
  document.getElementById('close-success-modal')?.addEventListener('click', () => modal.remove());
}

// --------------------------------------------------
// رسالة خطأ بسيطة (Toast)
// --------------------------------------------------
function showMessage(text: string, type: 'error' | 'success'): void {
  document.getElementById('order-toast')?.remove();

  const toast = document.createElement('div');
  toast.id = 'order-toast';
  toast.textContent = text;
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '30px',
    right: '20px',
    zIndex: '99999',
    background: type === 'error' ? '#c0392b' : '#27ae60',
    color: '#fff',
    padding: '14px 22px',
    borderRadius: '10px',
    fontFamily: 'Cairo, sans-serif',
    fontSize: '14px',
    fontWeight: '700',
    direction: 'rtl',
    boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
    animation: 'fadeIn 0.3s ease',
  });

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}
