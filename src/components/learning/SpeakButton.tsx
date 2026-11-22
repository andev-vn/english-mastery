import { Volume2 } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { toast } from '@/components/ui/Toast';
import { speak } from '@/lib/speech';

export function SpeakButton({ text, className }: { text: string; className?: string }) {
  return (
    <IconButton
      label={`Nghe phát âm: ${text}`}
      icon={<Volume2 className="size-5" />}
      variant="soft"
      className={className}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!speak(text)) toast.info('Trình duyệt này chưa hỗ trợ đọc văn bản. Hãy xem phiên âm IPA.');
      }}
    />
  );
}
