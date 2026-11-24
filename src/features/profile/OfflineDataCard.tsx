import { useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CloudOff, Database, HardDrive, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { toast } from '@/components/ui/Toast';
import { storageBackend } from '@/lib/idbStorage';
import { formatBytes, getStorageInfo, requestPersistentStorage } from '@/lib/storageInfo';
import { useOnlineStatus } from '@/lib/useOnlineStatus';
import { contentKeys, useContentInfo } from '@/services/contentQueries';
import { refreshFromRemote } from '@/services/contentRepository';
import { processQueue, useSyncStatus, type SyncStatus } from '@/services/sync/syncQueue';
import { useAuthStore } from '@/stores/authStore';

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });

function syncMessage(status: SyncStatus, online: boolean): string {
  if (status.state === 'syncing') return 'Đang gửi tiến độ lên tài khoản…';
  if (status.pending === 0) return 'Mọi thay đổi đã được lưu lên tài khoản.';
  if (!online) return `${status.pending} thay đổi đang chờ — sẽ tự gửi khi có mạng.`;
  if (status.lastError) return `${status.pending} thay đổi chưa gửi được — ứng dụng sẽ tự thử lại.`;
  return `${status.pending} thay đổi đang chờ gửi.`;
}

const SOURCE_LABEL = {
  bundled: 'Nội dung có sẵn trong ứng dụng',
  cache: 'Bản tải từ máy chủ, đã lưu trên thiết bị',
  remote: 'Bản mới nhất từ máy chủ, đã lưu trên thiết bị',
} as const;

function Row({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-text-subtle" aria-hidden>
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm font-semibold">{title}</p>
        {children}
      </div>
    </div>
  );
}

/** Settings → offline data: sync queue, downloaded content and browser storage. */
export function OfflineDataCard() {
  const online = useOnlineStatus();
  const auth = useAuthStore((s) => s.status);
  const sync = useSyncStatus();
  const queryClient = useQueryClient();
  const content = useContentInfo();
  const storage = useQuery({ queryKey: ['device', 'storage'], queryFn: getStorageInfo });
  const [refreshing, setRefreshing] = useState(false);

  const refreshContent = async () => {
    setRefreshing(true);
    const replaced = await refreshFromRemote(15_000, { force: true });
    setRefreshing(false);
    if (replaced) {
      await queryClient.invalidateQueries({ queryKey: contentKeys.all });
      void storage.refetch();
      toast.success('Đã tải nội dung mới nhất và lưu để dùng ngoại tuyến');
    } else {
      toast.error('Chưa tải được nội dung. Ứng dụng vẫn dùng bản hiện có.');
    }
  };

  const persist = async () => {
    const granted = await requestPersistentStorage();
    void storage.refetch();
    if (granted) toast.success('Trình duyệt sẽ giữ dữ liệu của ứng dụng');
    else toast.error('Trình duyệt chưa đồng ý. Cài ứng dụng lên màn hình chính thường giúp dữ liệu được giữ lâu dài.');
  };

  const info = storage.data;

  return (
    <Card className="flex flex-col gap-5">
      <Row icon={<CloudOff className="size-5" />} title="Đồng bộ tài khoản">
        {auth === 'signed_in' ? (
          <>
            <p className="text-sm text-text-muted" role="status">
              {syncMessage(sync, online)}
            </p>
            {sync.lastSyncedAt && <p className="text-xs text-text-subtle">Lần gửi gần nhất: {formatTime(sync.lastSyncedAt)}</p>}
            {sync.rejected > 0 && (
              <p className="text-xs text-warning">{sync.rejected} thay đổi bị máy chủ từ chối (nội dung có thể đã thay đổi) và chỉ được giữ trên thiết bị.</p>
            )}
            {sync.pending > 0 && (
              <Button
                size="sm"
                variant="secondary"
                className="mt-1 self-start"
                disabled={!online || sync.state === 'syncing'}
                leftIcon={<RefreshCw className="size-4" />}
                onClick={() => void processQueue({ force: true })}
              >
                Đồng bộ ngay
              </Button>
            )}
          </>
        ) : (
          <p className="text-sm text-text-muted">
            {auth === 'disabled' ? 'Tiến độ chỉ được lưu trên thiết bị này.' : 'Tiến độ chỉ được lưu trên thiết bị này. Đăng nhập để sao lưu và đồng bộ giữa các thiết bị.'}
          </p>
        )}
      </Row>

      <Row icon={<Database className="size-5" />} title="Nội dung bài học">
        {content.data ? (
          <>
            <p className="text-sm text-text-muted">{SOURCE_LABEL[content.data.source]}</p>
            {content.data.savedAt && <p className="text-xs text-text-subtle">Tải lúc {formatTime(content.data.savedAt)}</p>}
            <p className="text-xs text-text-subtle">
              {content.data.counts.lessons} bài học · {content.data.counts.vocabulary} từ vựng · {content.data.counts.exercises} bài tập ·{' '}
              {content.data.counts.activities} bài kỹ năng · {content.data.counts.grammar} chủ điểm ngữ pháp
            </p>
          </>
        ) : (
          <p className="text-sm text-text-muted">Đang kiểm tra…</p>
        )}
        {auth !== 'disabled' && (
          <Button
            size="sm"
            variant="outline"
            className="mt-1 self-start"
            disabled={!online || refreshing}
            leftIcon={<RefreshCw className={refreshing ? 'size-4 animate-spin' : 'size-4'} />}
            onClick={() => void refreshContent()}
          >
            {refreshing ? 'Đang tải…' : 'Tải nội dung mới nhất'}
          </Button>
        )}
      </Row>

      <Row icon={<HardDrive className="size-5" />} title="Bộ nhớ trên thiết bị">
        <p className="text-sm text-text-muted">
          Tiến độ được lưu bằng {storageBackend() === 'indexeddb' ? 'IndexedDB' : 'localStorage (trình duyệt không hỗ trợ IndexedDB)'}.
          {info?.usageBytes !== undefined && info.quotaBytes ? ` Đang dùng ${formatBytes(info.usageBytes)} / ${formatBytes(info.quotaBytes)}.` : ''}
        </p>
        {info?.persisted ? (
          <p className="flex items-center gap-1.5 text-xs text-success">
            <ShieldCheck className="size-3.5" aria-hidden /> Trình duyệt sẽ không tự xoá dữ liệu này.
          </p>
        ) : (
          info?.canPersist && (
            <>
              <p className="text-xs text-text-subtle">Khi thiết bị thiếu dung lượng, trình duyệt có thể xoá dữ liệu chưa được bảo vệ.</p>
              <Button size="sm" variant="outline" className="mt-1 self-start" leftIcon={<ShieldCheck className="size-4" />} onClick={() => void persist()}>
                Bảo vệ dữ liệu
              </Button>
            </>
          )
        )}
      </Row>
    </Card>
  );
}
