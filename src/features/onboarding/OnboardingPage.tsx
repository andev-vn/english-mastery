import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Briefcase, Code2, GraduationCap, MessageCircle, Plane } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { RadioGroup } from '@/components/ui/Choice';
import { Input } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgressBar } from '@/components/ui/Progress';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { CEFR_LEVELS } from '@/types/content';

const schema = z.object({
  displayName: z.string().trim().min(1, 'Hãy cho chúng tôi biết tên của bạn').max(40, 'Tối đa 40 ký tự'),
  goal: z.enum(['work', 'travel', 'study', 'interview', 'daily']),
  level: z.enum(CEFR_LEVELS),
  dailyGoalMinutes: z.enum(['5', '10', '15', '30']),
});
type FormValues = z.infer<typeof schema>;

const steps = ['Tên', 'Mục tiêu', 'Trình độ', 'Thời gian'] as const;

const goalOptions = [
  { value: 'daily', label: 'Giao tiếp hằng ngày', icon: <MessageCircle className="size-5" /> },
  { value: 'work', label: 'Công việc', icon: <Briefcase className="size-5" /> },
  { value: 'interview', label: 'Phỏng vấn (IT)', icon: <Code2 className="size-5" /> },
  { value: 'study', label: 'Học tập & thi cử', icon: <GraduationCap className="size-5" /> },
  { value: 'travel', label: 'Du lịch', icon: <Plane className="size-5" /> },
] as const;

const levelOptions = [
  { value: 'A1', label: 'A1 · Mới bắt đầu', description: 'Tôi chỉ biết vài từ, cần học lại từ đầu.' },
  { value: 'A2', label: 'A2 · Sơ cấp', description: 'Tôi hiểu câu đơn giản về chủ đề quen thuộc.' },
  { value: 'B1', label: 'B1 · Trung cấp', description: 'Tôi giao tiếp được trong phần lớn tình huống quen thuộc.' },
  { value: 'B2', label: 'B2 · Trung cao cấp', description: 'Tôi thảo luận được nhiều chủ đề khá trôi chảy.' },
  { value: 'C1', label: 'C1 · Cao cấp', description: 'Tôi dùng tiếng Anh linh hoạt trong công việc.' },
  { value: 'C2', label: 'C2 · Thành thạo', description: 'Tôi hiểu gần như mọi thứ đọc và nghe được.' },
] as const;

const minuteOptions = [
  { value: '5', label: '5 phút', description: 'Nhẹ nhàng' },
  { value: '10', label: '10 phút', description: 'Đều đặn' },
  { value: '15', label: '15 phút', description: 'Nghiêm túc' },
  { value: '30', label: '30 phút', description: 'Tăng tốc' },
] as const;

const fieldsByStep: (keyof FormValues)[][] = [['displayName'], ['goal'], ['level'], ['dailyGoalMinutes']];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const completeOnboarding = useProgressStore((s) => s.completeOnboarding);
  const setDailyGoal = useSettingsStore((s) => s.setDailyGoal);

  const { register, control, handleSubmit, trigger, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: '', goal: 'daily', level: 'A1', dailyGoalMinutes: '15' },
  });

  const onSubmit = (values: FormValues) => {
    completeOnboarding({ displayName: values.displayName, goal: values.goal, level: values.level });
    setDailyGoal(Number(values.dailyGoalMinutes));
    navigate('/dashboard', { replace: true });
  };

  const next = async () => {
    const valid = await trigger(fieldsByStep[step]);
    if (!valid) return;
    if (step < steps.length - 1) setStep(step + 1);
    else void handleSubmit(onSubmit)();
  };

  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        void next();
      }}
      noValidate
    >
      <PageHeader title="Thiết lập lộ trình" subtitle={`Bước ${step + 1}/${steps.length} · ${steps[step]}`} backTo="/welcome" />
      <ProgressBar value={((step + 1) / steps.length) * 100} label="Tiến độ thiết lập" className="mb-8" />

      <div className="flex-1 animate-fade-up" key={step}>
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold">Chúng tôi nên gọi bạn là gì?</h2>
            <Input label="Tên hiển thị" placeholder="Ví dụ: Minh" autoComplete="given-name" autoFocus error={formState.errors.displayName?.message} {...register('displayName')} />
          </div>
        )}
        {step === 1 && (
          <Controller
            control={control}
            name="goal"
            render={({ field }) => (
              <RadioGroup name="goal" legend="Bạn học tiếng Anh để làm gì?" value={field.value} onChange={field.onChange} prominentLegend options={[...goalOptions]} />
            )}
          />
        )}
        {step === 2 && (
          <div className="flex flex-col gap-3">
            <Controller
              control={control}
              name="level"
              render={({ field }) => (
                <RadioGroup name="level" legend="Bạn tự đánh giá trình độ hiện tại thế nào?" value={field.value} onChange={field.onChange} prominentLegend options={[...levelOptions]} />
              )}
            />
            <p className="text-sm text-text-muted">
              Chưa chắc? Cứ chọn gần đúng — sau khi thiết lập, bạn có thể làm bài kiểm tra xếp lớp (khoảng 12 phút) để ước lượng chính xác hơn, hoặc đổi trình độ trong Cài đặt.
            </p>
          </div>
        )}
        {step === 3 && (
          <Controller
            control={control}
            name="dailyGoalMinutes"
            render={({ field }) => (
              <RadioGroup name="minutes" legend="Mỗi ngày bạn muốn học bao nhiêu phút?" value={field.value} onChange={field.onChange} prominentLegend options={[...minuteOptions]} columns={2} />
            )}
          />
        )}
      </div>

      <div className="sticky bottom-0 flex gap-3 bg-bg pt-4 pb-2">
        {step > 0 && (
          <Button variant="outline" size="lg" onClick={() => setStep(step - 1)}>
            Quay lại
          </Button>
        )}
        <Button type="submit" size="lg" fullWidth>
          {step === steps.length - 1 ? 'Bắt đầu học' : 'Tiếp tục'}
        </Button>
      </div>
    </form>
  );
}
