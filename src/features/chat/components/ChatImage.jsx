import { useEffect, useState } from 'react';

/**
 * Instant chat image: prefer the local file preview (blob) so senders
 * see the photo immediately, like WhatsApp / iMessage.
 */
export function ChatImage({
  src,
  previewUrl,
  alt = '',
  className = 'max-h-56 max-w-[260px] rounded-lg object-cover',
  href,
}) {
  const displaySrc = previewUrl || src;
  if (!displaySrc) return null;

  const img = (
    <img
      src={displaySrc}
      alt={alt}
      decoding="sync"
      fetchPriority="high"
      loading="eager"
      draggable={false}
      className={className}
    />
  );

  const open = href || (!String(displaySrc).startsWith('blob:') ? src : null);
  if (!open) return img;

  return (
    <a href={open} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg">
      {img}
    </a>
  );
}

function useObjectUrl(file) {
  const [url] = useState(() => (file ? URL.createObjectURL(file) : ''));
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);
  return url;
}

/** Instant thumbnail for a local File in the composer. */
export function FileThumb({ file, className = 'h-14 w-14 rounded-md object-cover' }) {
  const url = useObjectUrl(file);
  if (!url) return null;
  return (
    <img
      src={url}
      alt={file?.name || ''}
      decoding="sync"
      fetchPriority="high"
      loading="eager"
      className={className}
    />
  );
}
