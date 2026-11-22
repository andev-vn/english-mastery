import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Download, Monitor, Moon, Share, Sun, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Checkbox, RadioGroup } from '@/components/ui/Choice';
import { Modal } from '@/components/ui/Dialog';
import { Input, Select } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { toast } from '@/components/ui/Toast';
import { isIos, isStandalone, useInstallPrompt } from '@/lib/useInstallPrompt';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore, type ThemePreference } from '@/stores/settingsStore';
import { CEFR_LEVELS, type CefrLevel } from '@/types/content';

const nameSchema = z.object({ displayName: z.string().trim().min(1, 'Tên không được để trống').max(40, 'Tối đa 40 ký tự') });

function InstallCard() {
  const { canInstall, install } = useInstallPrompt();
  if (isStandalone()) return <p className="text-sm text-success">Ứng dụng đã được cài đặt trên thiết bị này.</p>;
  if (canInstall) {
    return (
      <Button
        variant="secondary"
        leftIcon={<Download className="size-5" />}
        onClick={async () => {
          if (await install()) toast.success('Đã cài đặt English Mastery');
        }}
      >
        Cài đặt ứng dụng
      </Button>
    );
  }
  if (isIos()) {
    return (
      <p className="flex items-start gap-2 text-sm text-text-subtle">
        <Share className="mt-0.5 size-4 shrink-0" aria-hidden />
        Trên iPhone/iPad: mở bằng Safari, chạm nút Chia sẻ rồi chọn “Thêm vào MH chính”.
      </p>
    );
  }
  return <p className="text-sm text-text-muted">Trình duyệt này chưa hỗ trợ cài đặt, hoặc ứng dụng đã được cài. Hãy thử Chrome hoặc Edge.</p>;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme, dailyGoalMinutes, setDailyGoal, showTranslations, setShowTranslations } = useSettingsStore();
  const profile = useProgressStore((s) => s.profile);
  const updateProfile = useProgressStore((s) => s.updateProfile);
  const resetProgress = useProgressStore((s) => s.resetProgress);
  const [confirmReset, setConfirmReset] = useState(false);

  const { register, handleSubmit, formState, reset } = useForm({
    resolver: zodResolver(nameSchema),
    defaultValues: { displayName: profile.displayName },
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <PageHeader title="Cài đặt" backTo="/profile" />

      <section aria-labelledby="s-profile">
        <SectionTitle id="s-profile" title="Hồ sơ" />
        <Card className="flex flex-col gap-4">
          <form
            className="flex items-end gap-2.5"
            onSubmit={handleSubmit((v) => {
              updateProfile({ displayName: v.displayName });
              reset({ displayName: v.displayName });
              toast.success('Đã lưu tên hiển thị');
            })}
          >
            <div className="flex-1">
              <Input label="Tên hiển thị" error={formState.errors.displayName?.message} {...register('displayName')} />
            </div>
            <Button type="submit" variant="secondary" disabled={!formState.isDirty}>
              Lưu
            </Button>
          </form>
          <Select
            label="Trình độ hiện tại"
            hint="Ảnh hưởng đến gợi ý bài học và bài nào được mở sẵn."
            value={profile.level}
            onChange={(e) => {
              updateProfile({ level: e.target.value as CefrLevel });
              toast.success(`Đã chuyển sang trình độ ${e.target.value}`);
            }}
            options={CEFR_LEVELS.map((l) => ({ value: l, label: l }))}
          />
        </Card>
      </section>

      <section aria-labelledby="s-learning">
        <SectionTitle id="s-learning" title="Học tập" />
        <Card className="flex flex-col gap-4">
          <Select
            label="Mục tiêu mỗi ngày"
            value={String(dailyGoalMinutes)}
            onChange={(e) => setDailyGoal(Number(e.target.value))}
            options={[5, 10, 15, 20, 30, 45, 60].map((m) => ({ value: String(m), label: `${m} phút` }))}
          />
          <Checkbox
            label="Hiện bản dịch tiếng Việt"
            description="Hiển thị nghĩa tiếng Việt dưới các câu ví dụ trong bài học."
            checked={showTranslations}
            onChange={(e) => setShowTranslations(e.target.checked)}
          />
        </Card>
      </section>

      <section aria-labelledby="s-theme">
        <SectionTitle id="s-theme" title="Giao diện" />
        <RadioGroup<ThemePreference>
          name="theme"
          legend="Chủ đề màu"
          hideLegend
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'light', label: 'Sáng', icon: <Sun className="size-5" /> },
            { value: 'dark', label: 'Tối', icon: <Moon className="size-5" /> },
            { value: 'system', label: 'Theo hệ thống', icon: <Monitor className="size-5" /> },
          ]}
        />
      </section>

      <section aria-labelledby="s-install">
        <SectionTitle id="s-install" title="Ứng dụng" />
        <Card className="flex flex-col gap-3">
          <InstallCard />
        </Card>
      </section>

      <section aria-labelledby="s-data">
        <SectionTitle id="s-data" title="Dữ liệu" />
        <Card className="flex flex-col gap-3">
          <p className="text-sm text-text-subtle">Tiến độ của bạn được lưu cục bộ trên trình duyệt này. Xoá dữ liệu trình duyệt cũng sẽ xoá tiến độ.</p>
          <Button variant="outline" className="text-danger" leftIcon={<Trash2 className="size-4" />} onClick={() => setConfirmReset(true)}>
            Xoá toàn bộ tiến độ
          </Button>
        </Card>
      </section>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Xoá toàn bộ tiến độ?"
        description="Bài học đã hoàn thành, XP, từ vựng đã lưu và lịch sử sẽ bị xoá vĩnh viễn khỏi thiết bị này. Không thể hoàn tác."
        footer={
          <div className="flex gap-2.5">
            <Button variant="outline" fullWidth onClick={() => setConfirmReset(false)}>
              Huỷ
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={() => {
                resetProgress();
                setConfirmReset(false);
                navigate('/welcome', { replace: true });
              }}
            >
              Xoá
            </Button>
          </div>
        }
      >
        <p className="text-sm text-text-muted">Cài đặt giao diện sẽ được giữ nguyên.</p>
      </Modal>
    </div>
  );
}
