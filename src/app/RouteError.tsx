import { isRouteErrorResponse, useRouteError } from 'react-router';
import { ButtonLink } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/States';

/** Route-level error boundary. Also handles failed lazy chunk loads (e.g. after a deploy while offline). */
export function RouteError() {
  const error = useRouteError();
  const isChunkError = error instanceof Error && /dynamically imported module|Failed to fetch/i.test(error.message);
  const description = isRouteErrorResponse(error)
    ? `${error.status} — ${error.statusText}`
    : isChunkError
      ? 'Không tải được trang này. Có thể bạn đang ngoại tuyến hoặc ứng dụng vừa được cập nhật.'
      : 'Một lỗi không mong muốn đã xảy ra.';

  if (import.meta.env.DEV) console.error(error);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4">
      <ErrorState description={description} onRetry={() => window.location.reload()} />
      <ButtonLink to="/dashboard" variant="ghost">
        Về trang chủ
      </ButtonLink>
    </main>
  );
}
