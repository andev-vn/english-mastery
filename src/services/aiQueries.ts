import { useQuery } from '@tanstack/react-query';
import { useOnlineStatus } from '@/lib/useOnlineStatus';
import { useAuthStore } from '@/stores/authStore';
import { getTutorAvailability, listConversations, loadConversationMessages } from './aiTutor';

export const aiKeys = {
  status: (online: boolean) => ['ai', 'status', online] as const,
  conversations: (userId: string) => ['ai', 'conversations', userId] as const,
  messages: (conversationId: string) => ['ai', 'messages', conversationId] as const,
};

/** Is the AI tutor usable? Re-checked when connectivity changes; cached for 5 minutes. */
export function useTutorAvailability(enabled = true) {
  const online = useOnlineStatus();
  return useQuery({ queryKey: aiKeys.status(online), queryFn: getTutorAvailability, staleTime: 5 * 60_000, retry: false, enabled });
}

/** True when AI actions can be offered: tutor configured and the learner signed in. */
export function useCanUseAI() {
  const status = useAuthStore((s) => s.status);
  // Guests never see AI actions, so do not even ask the server.
  const availability = useTutorAvailability(status === 'signed_in');
  return status === 'signed_in' && availability.data?.available === true;
}

export function useConversations() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  return useQuery({ queryKey: aiKeys.conversations(userId ?? ''), queryFn: listConversations, enabled: userId !== null });
}

export function useConversationMessages(conversationId: string | null) {
  return useQuery({
    queryKey: aiKeys.messages(conversationId ?? ''),
    queryFn: () => loadConversationMessages(conversationId!),
    enabled: conversationId !== null,
  });
}
