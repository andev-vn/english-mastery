import type { ReactNode } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-surface-muted', className)} aria-hidden />;
}

/** Generic page-level loading skeleton. */
export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Đang tải">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-32 w-full rounded-card" />
      <Skeleton className="h-20 w-full rounded-card" />
      <Skeleton className="h-20 w-full rounded-card" />
    </div>
  );
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-10 text-center', className)}>
      <div className="mb-4 flex size-16 items-center justify-center rounded-3xl bg-primary-soft text-primary">{icon}</div>
      <h3 className="text-base font-bold">{title}</h3>
      {description && <p className="mt-1.5 max-w-xs text-sm text-text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Đã có lỗi xảy ra', description = 'Không thể tải nội dung. Vui lòng thử lại.', onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-3xl bg-danger-soft text-danger">
        <TriangleAlert className="size-7" aria-hidden />
      </div>
      <h3 className="text-base font-bold">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm text-text-muted">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-5" leftIcon={<RefreshCw className="size-4" />} onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}
