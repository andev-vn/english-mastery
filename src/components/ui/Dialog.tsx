import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from './IconButton';

type DialogVariant = 'modal' | 'drawer' | 'sheet';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  variant?: DialogVariant;
}

const variantClasses: Record<DialogVariant, string> = {
  modal: 'm-auto w-[calc(100%-2rem)] max-w-md rounded-3xl animate-fade-up',
  drawer: 'ml-auto mr-0 my-0 h-dvh max-h-none w-[min(24rem,100%)] rounded-l-3xl animate-slide-in',
  // On mobile a bottom sheet; on larger screens it becomes a centered modal.
  sheet:
    'mx-auto mb-0 mt-auto w-full max-w-lg rounded-t-3xl pb-safe animate-sheet-up sm:m-auto sm:w-[calc(100%-2rem)] sm:rounded-3xl sm:animate-fade-up',
};

/**
 * Accessible dialog built on the native <dialog> element:
 * focus trapping, Escape to close and inert background come from the browser.
 */
function Dialog({ open, onClose, title, description, children, footer, variant = 'modal' }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={cn('max-h-[90dvh] overflow-hidden bg-surface p-0 text-text shadow-raised backdrop:backdrop-blur-[2px]', variantClasses[variant])}
    >
      {open && (
        <div className="flex max-h-[inherit] flex-col">
          {variant === 'sheet' && <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-border sm:hidden" aria-hidden />}
          <header className="flex items-start gap-3 px-5 pt-4 pb-2">
            <div className="min-w-0 flex-1 pt-2">
              <h2 id={titleId} className="text-lg font-bold">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-1 text-sm text-text-muted">
                  {description}
                </p>
              )}
            </div>
            <IconButton label="Đóng" icon={<X className="size-5" />} onClick={onClose} className="-mr-2" />
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
          {footer && <footer className="border-t border-border px-5 py-4">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}

type PublicProps = Omit<DialogProps, 'variant'>;

export const Modal = (props: PublicProps) => <Dialog {...props} variant="modal" />;
export const Drawer = (props: PublicProps) => <Dialog {...props} variant="drawer" />;
export const BottomSheet = (props: PublicProps) => <Dialog {...props} variant="sheet" />;
