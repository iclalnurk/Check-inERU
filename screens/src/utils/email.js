// utils/email.js (veya dosyanın üstüne ekle)
export const normalizeEmail = (raw) => {
  return (raw || '')
    .normalize('NFKC')                   // unicode normalizasyonu
    .replace(/[\u200B-\u200D\uFEFF]/g,'')// zero-width chars
    .replace(/[\u202A-\u202E]/g,'')      // bidi marks
    .replace(/\u00A0/g, ' ')             // NBSP -> space
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');                // tüm whitespace'i sil
};
