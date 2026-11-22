import type { GrammarTopic } from '@/types/content';

/**
 * Grammar reference index, organised by CEFR level.
 * Each topic links to the lesson that teaches it; only topics with a real lesson are listed.
 */
export const grammarTopics: GrammarTopic[] = [
  // ---------- A1 ----------
  { id: 'g-to-be', level: 'A1', order: 1, lessonId: 'l-a1-to-be', title: 'The verb "to be"', titleVi: 'Động từ "to be"', summaryVi: 'am / is / are: khẳng định, phủ định, câu hỏi.' },
  { id: 'g-present-simple', level: 'A1', order: 2, lessonId: 'l-a1-present-simple', title: 'Present simple', titleVi: 'Thì hiện tại đơn', summaryVi: 'Thói quen, sự thật; thêm -s/-es với he/she/it; do/does.' },
  { id: 'g-present-continuous', level: 'A1', order: 3, lessonId: 'l-a1-present-continuous', title: 'Present continuous', titleVi: 'Thì hiện tại tiếp diễn', summaryVi: 'am/is/are + V-ing cho việc đang diễn ra.' },
  { id: 'g-articles', level: 'A1', order: 4, lessonId: 'l-a1-articles', title: 'Articles: a, an, the', titleVi: 'Mạo từ a, an, the', summaryVi: 'Chọn a/an theo âm đầu; the cho thứ đã xác định.' },
  { id: 'g-plurals', level: 'A1', order: 5, lessonId: 'l-a1-plurals', title: 'Plural nouns & demonstratives', titleVi: 'Danh từ số nhiều & this/that', summaryVi: '-s/-es/-ies, số nhiều bất quy tắc; this, that, these, those.' },
  { id: 'g-possessives', level: 'A1', order: 6, lessonId: 'l-a1-possessives', title: "Possessives", titleVi: 'Sở hữu', summaryVi: "my, your, his, her…; sở hữu cách 's; whose; its và it's." },
  { id: 'g-there-is', level: 'A1', order: 7, lessonId: 'l-a1-there-is', title: 'There is / there are', titleVi: 'There is / there are', summaryVi: 'Diễn tả "có" (tồn tại) — không dùng "have".' },
  { id: 'g-prepositions-place', level: 'A1', order: 8, lessonId: 'l-a1-prepositions-place', title: 'Prepositions of place', titleVi: 'Giới từ chỉ vị trí', summaryVi: 'in, on, under, next to, between, opposite…' },
  { id: 'g-can', level: 'A1', order: 9, lessonId: 'l-a1-can', title: "Can / can't", titleVi: "Can / can't", summaryVi: 'Khả năng, xin phép, nhờ vả; can + V nguyên mẫu.' },
  { id: 'g-countable', level: 'A1', order: 10, lessonId: 'l-a1-countable', title: 'Countable & uncountable nouns', titleVi: 'Danh từ đếm được / không đếm được', summaryVi: 'some, any, much, many; a glass of, a bowl of.' },
  // ---------- A2 ----------
  { id: 'g-past-simple', level: 'A2', order: 1, lessonId: 'l-a2-past-simple', title: 'Past simple', titleVi: 'Thì quá khứ đơn', summaryVi: 'V-ed và động từ bất quy tắc; did / didn\'t.' },
  { id: 'g-past-continuous', level: 'A2', order: 2, lessonId: 'l-a2-past-continuous', title: 'Past continuous', titleVi: 'Thì quá khứ tiếp diễn', summaryVi: 'was/were + V-ing; when và while.' },
  { id: 'g-used-to', level: 'A2', order: 3, lessonId: 'l-a2-used-to', title: 'Used to', titleVi: 'Used to', summaryVi: 'Thói quen, trạng thái trong quá khứ nay không còn.' },
  { id: 'g-future', level: 'A2', order: 4, lessonId: 'l-a2-future', title: 'Be going to vs will', titleVi: 'Be going to và will', summaryVi: 'Ý định có trước, quyết định tức thì và dự đoán.' },
  { id: 'g-future-arrangements', level: 'A2', order: 5, lessonId: 'l-a2-future-arrangements', title: 'Present tenses for the future', titleVi: 'Thì hiện tại nói về tương lai', summaryVi: 'Hiện tại tiếp diễn cho lịch hẹn; hiện tại đơn cho thời gian biểu.' },
  { id: 'g-suggestions', level: 'A2', order: 6, lessonId: 'l-a2-invitations', title: 'Suggestions & invitations', titleVi: 'Câu gợi ý và lời mời', summaryVi: "Let's + V, How about + V-ing, Would you like + to V." },
  { id: 'g-comparatives', level: 'A2', order: 7, lessonId: 'l-a2-comparatives', title: 'Comparatives', titleVi: 'So sánh hơn', summaryVi: '-er / more … than; better, worse; as … as.' },
  { id: 'g-superlatives', level: 'A2', order: 8, lessonId: 'l-a2-superlatives', title: 'Superlatives', titleVi: 'So sánh nhất', summaryVi: 'the -est / the most; the best, the worst.' },
  { id: 'g-obligation', level: 'A2', order: 9, lessonId: 'l-a2-obligation', title: 'Must, have to, should', titleVi: 'Must, have to, should', summaryVi: "Bắt buộc, cấm (mustn't), không cần (don't have to), lời khuyên." },
  // ---------- B1+ ----------
  { id: 'g-present-perfect', level: 'B1', order: 1, lessonId: 'l-b1-present-perfect', title: 'Present perfect vs past simple', titleVi: 'Hiện tại hoàn thành và quá khứ đơn', summaryVi: 'Trải nghiệm, for/since và mốc thời gian đã kết thúc.' },
  { id: 'g-conditionals', level: 'B2', order: 1, lessonId: 'l-b2-conditionals', title: 'Second, third & mixed conditionals', titleVi: 'Câu điều kiện loại 2, 3 và hỗn hợp', summaryVi: 'Giả định không có thật ở hiện tại và quá khứ.' },
  { id: 'g-inversion', level: 'C1', order: 1, lessonId: 'l-c1-inversion', title: 'Negative inversion', titleVi: 'Đảo ngữ phủ định', summaryVi: 'Never, rarely, not only, no sooner… + trợ động từ + S.' },
  { id: 'g-cleft', level: 'C2', order: 1, lessonId: 'l-c2-cleft', title: 'Cleft sentences', titleVi: 'Câu chẻ', summaryVi: 'It-cleft và wh-cleft để nhấn mạnh thông tin.' },
];
