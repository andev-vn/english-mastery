import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bot, CloudOff, LogIn, MessageSquarePlus, Send, ServerOff, Trash2 } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/States';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { deleteConversation, sendTutorMessage, tutorErrorMessage, type TutorAvailability } from '@/services/aiTutor';
import { aiKeys, useConversationMessages, useConversations, useTutorAvailability } from '@/services/aiQueries';
import { useAuthStore } from '@/stores/authStore';
import { useProgressStore } from '@/stores/progressStore';

type Turn = { role: 'user' | 'assistant'; content: string };

const STARTERS = ['Can we practise a job interview?', 'Help me introduce myself.', 'Correct this: "Yesterday I go to the office."', 'How do I explain a bug in a stand-up meeting?'];

function Unavailable({ availability }: { availability: Extract<TutorAvailability, { available: false }> }) {
  const copy = {
    'no-backend': {
      icon: <ServerOff className="size-7" />,
      title: 'Gia sư AI cần máy chủ',
      description: 'Bản ứng dụng này chạy không có máy chủ nên chưa dùng được gia sư AI. Mọi bài học và bài luyện tập khác vẫn dùng bình thường.',
    },
    'not-configured': {
      icon: <Bot className="size-7" />,
      title: 'Gia sư AI chưa được bật',
      description: 'Máy chủ chưa được cấu hình nhà cung cấp AI. Bạn vẫn có thể học, luyện tập và dùng nhận xét tự động như thường.',
    },
    unreachable: {
      icon: <CloudOff className="size-7" />,
      title: 'Không kết nối được gia sư AI',
      description: 'Dịch vụ AI tạm thời không phản hồi. Hãy thử lại sau — các tính năng khác không bị ảnh hưởng.',
    },
    offline: {
      icon: <CloudOff className="size-7" />,
      title: 'Bạn đang ngoại tuyến',
      description: 'Gia sư AI cần Internet. Các bài học đã tải vẫn dùng được khi ngoại tuyến.',
    },
  }[availability.reason];
  return <EmptyState {...copy} action={<ButtonLink to="/practice" variant="outline">Về Luyện tập</ButtonLink>} />;
}

function Bubble({ turn }: { turn: Turn }) {
  const mine = turn.role === 'user';
  return (
    <li className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-line',
          mine ? 'rounded-br-md bg-primary text-on-primary' : 'rounded-bl-md border border-border bg-surface',
        )}
      >
        <span className="sr-only">{mine ? 'Bạn: ' : 'Gia sư: '}</span>
        {turn.content}
      </div>
    </li>
  );
}

function Chat() {
  const level = useProgressStore((s) => s.profile.level);
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const conversations = useConversations();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const saved = useConversationMessages(conversationId);
  const [pending, setPending] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const listEnd = useRef<HTMLLIElement>(null);

  const send = useMutation({
    mutationFn: (message: string) => sendTutorMessage({ level, message, conversationId: conversationId ?? undefined }),
    onMutate: (message) => setPending([{ role: 'user', content: message }]),
    onSuccess: async (result) => {
      if (result.conversationId !== conversationId) setConversationId(result.conversationId);
      await queryClient.invalidateQueries({ queryKey: aiKeys.messages(result.conversationId) });
      void queryClient.invalidateQueries({ queryKey: aiKeys.conversations(userId) });
      setPending([]);
    },
    onError: (error, message) => {
      setPending([]);
      setDraft(message);
      toast.error(tutorErrorMessage(error));
    },
  });

  const turns: Turn[] = [...(saved.data ?? []), ...pending];

  useEffect(() => {
    listEnd.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [turns.length, send.isPending]);

  const submit = (text: string) => {
    const message = text.trim();
    if (!message || send.isPending) return;
    setDraft('');
    send.mutate(message);
  };

  const remove = async (id: string) => {
    try {
      await deleteConversation(id);
      if (id === conversationId) setConversationId(null);
      void queryClient.invalidateQueries({ queryKey: aiKeys.conversations(userId) });
    } catch {
      toast.error('Chưa xoá được cuộc trò chuyện.');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {conversations.data && conversations.data.length > 0 && (
        <details className="rounded-card border border-border bg-surface p-3">
          <summary className="min-h-8 cursor-pointer px-1 text-sm font-bold">Cuộc trò chuyện đã lưu ({conversations.data.length})</summary>
          <ul className="mt-2 flex flex-col gap-1">
            {conversations.data.map((c) => (
              <li key={c.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setConversationId(c.id)}
                  className={cn('min-h-11 flex-1 truncate rounded-xl px-3 text-left text-sm', c.id === conversationId ? 'bg-primary-soft font-semibold text-primary' : 'hover:bg-surface-muted')}
                >
                  {c.title || 'Cuộc trò chuyện'}
                </button>
                <IconButton label="Xoá cuộc trò chuyện" icon={<Trash2 className="size-4" />} onClick={() => void remove(c.id)} />
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">Trình độ {level} · AI có thể sai, hãy kiểm tra lại khi cần.</p>
        {conversationId && (
          <Button size="sm" variant="ghost" leftIcon={<MessageSquarePlus className="size-4" />} onClick={() => setConversationId(null)}>
            Mới
          </Button>
        )}
      </div>

      {saved.isError ? (
        <ErrorState description="Không tải được cuộc trò chuyện." onRetry={() => void saved.refetch()} />
      ) : turns.length === 0 && !saved.isFetching ? (
        <Card className="flex flex-col gap-3">
          <p className="text-sm">Trò chuyện bằng tiếng Anh với gia sư. Gia sư sẽ sửa lỗi và giải thích bằng tiếng Việt. Thử bắt đầu với:</p>
          <div className="flex flex-wrap gap-2">
            {STARTERS.map((s) => (
              <button key={s} type="button" onClick={() => submit(s)} className="min-h-11 rounded-full border border-border px-3.5 text-left text-sm hover:border-primary">
                {s}
              </button>
            ))}
          </div>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2.5" aria-live="polite" aria-label="Cuộc trò chuyện">
          {turns.map((t, i) => (
            <Bubble key={i} turn={t} />
          ))}
          {send.isPending && (
            <li className="text-sm text-text-muted" role="status">
              Gia sư đang trả lời…
            </li>
          )}
          <li ref={listEnd} aria-hidden />
        </ul>
      )}

      <form
        className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] lg:bottom-4 flex items-end gap-2 rounded-2xl border border-border bg-surface p-2 shadow-raised"
        onSubmit={(e) => {
          e.preventDefault();
          submit(draft);
        }}
      >
        <label htmlFor="tutor-input" className="sr-only">
          Tin nhắn cho gia sư
        </label>
        <textarea
          id="tutor-input"
          rows={2}
          maxLength={2000}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit(draft);
            }
          }}
          lang="en"
          placeholder="Viết bằng tiếng Anh…"
          className="min-h-11 flex-1 resize-none bg-transparent px-2 py-1.5 text-[16px] focus:outline-none"
        />
        <Button type="submit" aria-label="Gửi" disabled={!draft.trim() || send.isPending} leftIcon={<Send className="size-4" />}>
          Gửi
        </Button>
      </form>
    </div>
  );
}

export default function TutorPage() {
  const auth = useAuthStore((s) => s.status);
  const availability = useTutorAvailability();

  return (
    <div className="flex flex-col gap-4 animate-fade-up pb-4">
      <PageHeader title="Gia sư AI" subtitle="Luyện hội thoại và hỏi đáp tiếng Anh" backTo="/practice" />
      {availability.isPending || auth === 'loading' ? (
        <PageSkeleton />
      ) : availability.data && !availability.data.available ? (
        <Unavailable availability={availability.data} />
      ) : auth !== 'signed_in' ? (
        <EmptyState
          icon={<LogIn className="size-7" />}
          title="Đăng nhập để dùng gia sư AI"
          description="Gia sư AI cần tài khoản để giới hạn lượt dùng và lưu cuộc trò chuyện của bạn."
          action={<ButtonLink to="/login?redirect=%2Ftutor">Đăng nhập</ButtonLink>}
        />
      ) : (
        <Chat />
      )}
    </div>
  );
}
