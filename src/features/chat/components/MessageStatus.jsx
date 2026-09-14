import { AlertCircle, Check, Clock, RotateCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The time line inside a bubble, carrying delivery state for your own messages.
 * A message still on its way must never look identical to a delivered one —
 * that is what made failed sends look successful.
 */
export function MessageMeta({ message, mine, time, className }) {
  if (mine && message.pending) {
    return (
      <p className={cn('mt-1 inline-flex items-center gap-1 text-[10px] text-white/80', className)}>
        <Clock className="h-3 w-3" aria-hidden />
        Sending…
      </p>
    );
  }
  if (mine && message.failed) {
    return (
      <p className={cn('mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-white', className)}>
        <AlertCircle className="h-3 w-3" aria-hidden />
        Not sent
      </p>
    );
  }
  return (
    <p
      className={cn(
        'mt-1 inline-flex items-center gap-1 text-[10px] tabular-nums',
        // Solid white: on the purple bubble even 90% falls below AA at this size.
        mine ? 'text-white' : 'text-graphite',
        className
      )}
    >
      {time}
      {mine ? <Check className="h-3 w-3" aria-label="Sent" /> : null}
    </p>
  );
}

/** Shown under a failed bubble: why it failed, and what you can do about it. */
export function FailedMessageActions({ message, onRetry, onDiscard }) {
  if (!message.failed) return null;
  return (
    <div
      role="alert"
      className="mt-1 flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 text-[11px] text-danger-text"
    >
      <span className="max-w-[18rem]">{message.error || 'Message not sent.'}</span>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline"
        >
          <RotateCw className="h-3 w-3" aria-hidden />
          Retry
        </button>
      ) : null}
      {onDiscard ? (
        <button
          type="button"
          onClick={onDiscard}
          className="inline-flex items-center gap-1 font-semibold text-graphite underline-offset-2 hover:text-ink hover:underline"
        >
          <X className="h-3 w-3" aria-hidden />
          Remove
        </button>
      ) : null}
    </div>
  );
}
