import { ExternalLink, FileText, Paperclip } from 'lucide-react';
import { ChatImage } from '@/features/chat/components/ChatImage';

const URL_REGEX =
  /((https?:\/\/|www\.)[^\s<]+[^\s<.,;:!?"')\]])/gi;

function normalizeHref(raw) {
  const url = String(raw || '').trim();
  if (!url) return '#';
  if (/^https?:\/\//i.test(url)) return url;
  if (/^www\./i.test(url)) return `https://${url}`;
  return url;
}

/** Render comment text with clickable URLs. */
export function CommentText({ content, className = '' }) {
  const text = String(content || '');
  if (!text) return null;

  const parts = [];
  let lastIndex = 0;
  let match;
  const re = new RegExp(URL_REGEX);
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'link', value: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return (
    <p className={`whitespace-pre-wrap text-xs leading-relaxed text-charcoal ${className}`}>
      {parts.map((part, i) =>
        part.type === 'link' ? (
          <a
            key={`${part.value}-${i}`}
            href={normalizeHref(part.value)}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all font-medium text-primary underline-offset-2 hover:underline"
          >
            {part.value}
          </a>
        ) : (
          <span key={i}>{part.value}</span>
        )
      )}
    </p>
  );
}

function isImageType(fileType = '', fileName = '') {
  if (String(fileType).startsWith('image/')) return true;
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fileName);
}

export function CommentAttachments({ attachments = [], links = [] }) {
  const files = attachments || [];
  const sharedLinks = links || [];
  if (!files.length && !sharedLinks.length) return null;

  return (
    <div className="mt-2 space-y-2">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file) => {
            const key = `${file.url}-${file.fileName}`;
            if (isImageType(file.fileType, file.fileName)) {
              return (
                <ChatImage
                  key={key}
                  src={file.url}
                  previewUrl={file.previewUrl}
                  alt={file.fileName || 'Attachment'}
                  className="h-24 w-32 object-cover"
                />
              );
            }
            return (
              <a
                key={key}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-hairline bg-cloud px-2.5 py-1.5 text-[11px] font-medium text-ink hover:bg-paper"
              >
                <FileText className="h-3.5 w-3.5 shrink-0 text-graphite" />
                <span className="truncate">{file.fileName || 'Document'}</span>
                <Paperclip className="h-3 w-3 shrink-0 text-graphite" />
              </a>
            );
          })}
        </div>
      )}

      {sharedLinks.length > 0 && (
        <div className="space-y-1">
          {sharedLinks.map((link) => (
            <a
              key={link.url}
              href={normalizeHref(link.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-1.5 rounded-lg border border-hairline bg-cloud/60 px-2.5 py-1.5 text-[11px] text-ink hover:bg-cloud"
            >
              <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-graphite" />
              <span className="min-w-0">
                <span className="block truncate font-medium">
                  {link.title || link.url}
                </span>
                {link.title ? (
                  <span className="block truncate text-graphite">{link.url}</span>
                ) : null}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
