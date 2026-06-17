// ── Order API ──────────────────────────────────────────────────────
// Sends the final order data to the backend which forwards it to Google Sheets.

function getApiBase(): string {
  return (
    import.meta.env.VITE_API_URL ||
    (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '')
  );
}

/** Sanitizes all values in the order — replaces empty/null with 'غير متوفر' */
function sanitizeOrder(data: Record<string, string>): Record<string, string> {
  const safe: Record<string, string> = {};
  for (const key in data) {
    const val = data[key];
    safe[key] =
      val !== undefined && val !== null && String(val).trim() !== ''
        ? String(val).trim()
        : 'غير متوفر';
  }
  return safe;
}

export async function sendOrderToSheet(
  orderData: Record<string, string>
): Promise<void> {
  const safe = sanitizeOrder(orderData);
  console.log('📦 إرسال الطلب:', safe);

  const res = await fetch(`${getApiBase()}/api/submit-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(safe),
  });

  const result = await res.json();
  if (!res.ok || !result.success) {
    throw new Error(result.error || 'فشل إرسال الطلب');
  }

  console.log('✅ تم إرسال الطلب بنجاح');
}
