/** Mirror of backend/src/constants/chat.constant.js */
export const CHAT_LIMITS = {
  MAX_FILES: 5,
  MAX_LINKS: 5,
  IMAGE_MAX_BYTES: 10 * 1024 * 1024,
  DOCUMENT_MAX_BYTES: 15 * 1024 * 1024,
};

export const IMAGE_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

export function formatBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImageFile(file) {
  if (!file) return false;
  if (file.type && IMAGE_MIME.has(file.type)) return true;
  return /\.(png|jpe?g|gif|webp)$/i.test(file.name || file.fileName || '');
}

export function validateChatFile(file) {
  if (!file) return 'No file selected';
  const image = isImageFile(file);
  const max = image ? CHAT_LIMITS.IMAGE_MAX_BYTES : CHAT_LIMITS.DOCUMENT_MAX_BYTES;
  if (file.size > max) {
    return `${image ? 'Images' : 'Documents'} must be ${Math.round(max / (1024 * 1024))} MB or smaller (${formatBytes(file.size)})`;
  }
  return null;
}
