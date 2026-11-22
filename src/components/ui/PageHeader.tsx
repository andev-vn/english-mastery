import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { IconButton } from './IconButton';

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  /** Shows a back button. Falls back to `backTo` when there is no in-app history (direct URL access). */
  backTo?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, backTo, actions }: PageHeaderProps) {
  const navigate = useNavigate();
  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate(backTo ?? '/', { replace: true });
  };

  return (
    <header className="mb-5 flex items-start gap-2">
      {backTo !== undefined && <IconButton label="Quay lại" icon={<ArrowLeft className="size-5" />} onClick={goBack} className="-ml-2.5" />}
      <div className="min-w-0 flex-1 pt-1.5">
        <h1 className="text-[22px] leading-tight font-bold tracking-tight text-balance lg:text-[26px]">{title}</h1>
        {subtitle && <div className="mt-1 text-sm text-text-muted">{subtitle}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1 pt-0.5">{actions}</div>}
    </header>
  );
}
