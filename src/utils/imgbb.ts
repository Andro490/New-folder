// ── ImgBB Upload Utility ──────────────────────────────────────────
// Handles uploading images (File or base64) to ImgBB hosting

const IMGBB_API_KEY = '878a3e7d1975c224f0cfc02c0bd29299';

export async function uploadToImgBB(fileOrBase64: File | string): Promise<string> {
  const formData = new FormData();

  if (typeof fileOrBase64 === 'string') {
    const base64Data = fileOrBase64.includes('base64,')
      ? fileOrBase64.split('base64,')[1]
      : fileOrBase64;
    formData.append('image', base64Data);
  } else {
    formData.append('image', fileOrBase64);
  }

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (data.success) {
    return data.data.url;
  }
  throw new Error('فشل رفع الصورة إلى ImgBB');
}
