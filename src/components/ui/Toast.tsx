import { useEffect } from 'react';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { create } from 'zustand';
import { cn, uid } from '@/lib/cn';

type ToastTone = 'success' | 'info' | 'error';

interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
}

interface ToastState {
  toasts: ToastItem[];
  push: (message: string, tone?: ToastTone) => void;
  dismiss: (id: string) => void;
}

const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, tone = 'info') => set((s) => ({ toasts: [...s.toasts.slice(-2), { id: uid(), message, tone }] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (message: string) => useToastStore.getState().push(message, 'success'),
  info: (message: string) => useToastStore.getState().push(message, 'info'),
  error: (message: string) => useToastStore.getState().push(message, 'error'),
};

const icons = { success: CheckCircle2, info: Info, error: TriangleAlert };
const toneClasses = { success: 'text-success', info: 'text-primary', error: 'text-danger' };

function ToastCard({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss);
  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(item.id), 3500);
    return () => window.clearTimeout(timer);
  }, [dismiss, item.id]);
  const Icon = icons[item.tone];
  return (
    <div
      role={item.tone === 'error' ? 'alert' : 'status'}
      className="pointer-events-auto flex w-full max-w-sm animate-fade-up items-center gap-3 rounded-2xl border border-border bg-surface py-2 pr-2 pl-4 shadow-raised"
    >
      <Icon className={cn('size-5 shrink-0', toneClasses[item.tone])} aria-hidden />
      <p className="flex-1 text-sm font-medium">{item.message}</p>
      <button
        type="button"
        onClick={() => dismiss(item.id)}
        aria-label="Đóng thông báo"
        className="flex size-9 items-center justify-center rounded-lg text-text-muted hover:bg-surface-muted"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

/** Mount once near the root. Positioned above the mobile bottom navigation. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6">
      {toasts.map((t) => (
        <ToastCard key={t.id} item={t} />
      ))}
    </div>
  );
}
