import { useEffect } from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { useOnlineStatus } from '@/lib/useOnlineStatus';

/**
 * Service-worker lifecycle UI + offline indicator.
 * Rendered at the top of the screen so it never covers the bottom navigation or primary actions.
 */
export function PwaPrompt() {
  const online = useOnlineStatus();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (!offlineReady) return;
    toast.success('Ứng dụng đã sẵn sàng dùng ngoại tuyến');
    setOfflineReady(false);
  }, [offlineReady, setOfflineReady]);

  return (
    <>
      {!online && (
        <div
          role="status"
          className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-text px-4 pt-[max(0.375rem,env(safe-area-inset-top))] pb-1.5 text-xs font-medium text-bg"
        >
          <WifiOff className="size-3.5" aria-hidden />
          Bạn đang ngoại tuyến — các bài đã tải vẫn dùng được.
        </div>
      )}
      {needRefresh && (
        <div className="fixed inset-x-4 top-[max(0.75rem,env(safe-area-inset-top))] z-50 mx-auto flex max-w-sm animate-fade-up items-center gap-2 rounded-2xl border border-border bg-surface p-2 pl-4 shadow-raised">
          <p className="flex-1 text-sm font-medium" role="status">
            Đã có phiên bản mới.
          </p>
          <Button size="sm" variant="ghost" onClick={() => setNeedRefresh(false)}>
            Để sau
          </Button>
          <Button size="sm" leftIcon={<RefreshCw className="size-4" />} onClick={() => void updateServiceWorker(true)}>
            Cập nhật
          </Button>
        </div>
      )}
    </>
  );
}
