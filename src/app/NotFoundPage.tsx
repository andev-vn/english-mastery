import { Compass } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/States';

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center justify-center px-4">
      <EmptyState
        icon={<Compass className="size-7" />}
        title="Không tìm thấy trang"
        description="Trang bạn tìm không tồn tại hoặc đã được chuyển đi."
        action={<ButtonLink to="/dashboard">Về trang chủ</ButtonLink>}
      />
    </main>
  );
}
