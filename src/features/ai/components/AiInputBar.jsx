import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Mic, Plus, Zap } from 'lucide-react';
import { BrainLogo } from './BrainLogo';
import { AI_MODELS } from '../aiConstants';
import { useAiStore } from '../aiStore';
import { cn } from '@/lib/utils';

export function AiInputBar({ value, onChange, onSubmit, placeholder = '', disabled, className }) {
  const model = useAiStore((s) => s.model);
  const setModel = useAiStore((s) => s.setModel);
  const [modelOpen, setModelOpen] = useState(false);
  const inputRef = useRef(null);
  const selected = AI_MODELS.find((m) => m.id === model) || AI_MODELS[0];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
  };

  return (
    <div
      className={cn(
        'mx-auto w-full max-w-3xl rounded-[28px] border border-gray-200 bg-white shadow-[0_8px_40px_rgba(0,0,0,0.08)]',
        className
      )}
    >
      <div className="px-5 pt-4">
        <textarea
          ref={inputRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full resize-none bg-transparent text-[15px] text-gray-900 outline-none placeholder:text-gray-400"
        />
      </div>

      <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-1">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            title="Attach"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50"
          >
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            Skills
          </button>
        </div>

        <div className="flex items-center gap-1">
          <div className="relative">
            <button
              type="button"
              onClick={() => setModelOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50"
            >
              <BrainLogo size={16} />
              {selected.label}
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>
            {modelOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setModelOpen(false)} />
                <div className="absolute bottom-full right-0 z-50 mb-1 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                  {AI_MODELS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setModel(m.id);
                        setModelOpen(false);
                      }}
                      className={cn(
                        'flex w-full flex-col px-3 py-2 text-left hover:bg-gray-50',
                        model === m.id && 'bg-brand-50'
                      )}
                    >
                      <span className="text-[13px] font-semibold text-gray-900">{m.label}</span>
                      <span className="text-[11px] text-gray-500">{m.desc}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            title="Voice input"
          >
            <Mic className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
