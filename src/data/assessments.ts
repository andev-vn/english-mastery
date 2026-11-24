import type { Assessment } from '@/types/content';

/**
 * Placement test: 4 questions per CEFR level (A1–C2) across five skills.
 * Questions are objective (structured answers), so the result is an estimate — not a CEFR certificate.
 * Speaking is not assessed here.
 */
export const placementTest: Assessment = {
  id: 'placement-v1',
  title: 'Placement test',
  titleVi: 'Bài kiểm tra xếp lớp',
  description: 'Ước lượng trình độ CEFR của bạn qua từ vựng, ngữ pháp, đọc, nghe và viết câu.',
  estimatedMinutes: 12,
  questions: [
    // ---------- A1 ----------
    {
      id: 'a1-1', level: 'A1', skill: 'vocabulary', type: 'multiple_choice',
      prompt: "I'm ___. Can I have a sandwich?",
      options: [{ id: 'a', text: 'hungry' }, { id: 'b', text: 'tired' }, { id: 'c', text: 'cold' }],
      correctOptionId: 'a',
      explanationVi: '"Hungry" (đói) phù hợp với việc muốn ăn bánh sandwich.',
    },
    {
      id: 'a1-2', level: 'A1', skill: 'grammar', type: 'multiple_choice',
      prompt: 'She ___ from Vietnam.',
      options: [{ id: 'a', text: 'am' }, { id: 'b', text: 'is' }, { id: 'c', text: 'are' }],
      correctOptionId: 'b',
      explanationVi: '"She" đi với "is".',
    },
    {
      id: 'a1-3', level: 'A1', skill: 'listening', type: 'multiple_choice',
      audioText: "Hi, I'm Tom. I'm a teacher, and I live in London.",
      prompt: "What is Tom's job?",
      options: [{ id: 'a', text: 'A doctor' }, { id: 'b', text: 'A teacher' }, { id: 'c', text: 'A student' }],
      correctOptionId: 'b',
      explanationVi: '"I\'m a teacher" — Tom là giáo viên.',
    },
    {
      id: 'a1-4', level: 'A1', skill: 'writing', type: 'ordering',
      prompt: 'Sắp xếp thành câu hỏi đúng.',
      tokens: ['Where', 'do', 'you', 'work', '?'],
      explanationVi: 'Từ để hỏi + do + chủ ngữ + động từ?',
    },
    // ---------- A2 ----------
    {
      id: 'a2-1', level: 'A2', skill: 'grammar', type: 'multiple_choice',
      prompt: 'Yesterday we ___ to the beach.',
      options: [{ id: 'a', text: 'go' }, { id: 'b', text: 'went' }, { id: 'c', text: 'have gone' }],
      correctOptionId: 'b',
      explanationVi: '"Yesterday" → quá khứ đơn: went.',
    },
    {
      id: 'a2-2', level: 'A2', skill: 'vocabulary', type: 'multiple_choice',
      prompt: "I need to book a ___ to Da Nang. I'm flying on Friday.",
      options: [{ id: 'a', text: 'flight' }, { id: 'b', text: 'journey' }, { id: 'c', text: 'passport' }],
      correctOptionId: 'a',
      explanationVi: '"Flying" → đặt chuyến bay: book a flight.',
    },
    {
      id: 'a2-3', level: 'A2', skill: 'reading', type: 'true_false',
      context: 'SWIMMING POOL — Open 6 a.m. to 8 p.m. every day except Monday. Children under 10 must swim with an adult.',
      prompt: 'Đúng hay sai theo thông báo?',
      statement: 'A nine-year-old child can swim alone.',
      answer: false,
      explanationVi: 'Trẻ dưới 10 tuổi phải bơi cùng người lớn.',
    },
    {
      id: 'a2-4', level: 'A2', skill: 'listening', type: 'multiple_choice',
      audioText: "I'm sorry, I can't come to the meeting on Thursday. Can we meet on Friday morning instead?",
      prompt: 'When does the speaker want to meet?',
      options: [{ id: 'a', text: 'Thursday morning' }, { id: 'b', text: 'Friday morning' }, { id: 'c', text: 'Friday afternoon' }],
      correctOptionId: 'b',
      explanationVi: '"Can we meet on Friday morning instead?"',
    },
    // ---------- B1 ----------
    {
      id: 'b1-1', level: 'B1', skill: 'grammar', type: 'multiple_choice',
      prompt: 'I ___ here since 2020.',
      options: [{ id: 'a', text: 'work' }, { id: 'b', text: 'worked' }, { id: 'c', text: 'have worked' }],
      correctOptionId: 'c',
      explanationVi: '"Since 2020" (đến nay) → hiện tại hoàn thành.',
    },
    {
      id: 'b1-2', level: 'B1', skill: 'vocabulary', type: 'multiple_choice',
      prompt: 'We need to finish the report before the ___ on Friday.',
      options: [{ id: 'a', text: 'deadline' }, { id: 'b', text: 'delay' }, { id: 'c', text: 'appointment' }],
      correctOptionId: 'a',
      explanationVi: '"Deadline" là hạn chót phải hoàn thành.',
    },
    {
      id: 'b1-3', level: 'B1', skill: 'reading', type: 'multiple_choice',
      context:
        'Hi Minh, thank you for your application. Unfortunately, the position has already been filled. However, we were impressed by your experience and would like to keep your CV for future openings. Best regards, Sarah',
      prompt: 'What does Sarah say?',
      options: [
        { id: 'a', text: 'Minh got the job.' },
        { id: 'b', text: 'The job is no longer available, but they may contact Minh later.' },
        { id: 'c', text: 'Minh needs more experience to apply.' },
      ],
      correctOptionId: 'b',
      explanationVi: '"The position has already been filled" (đã tuyển được người) nhưng họ giữ CV cho các vị trí sau.',
    },
    {
      id: 'b1-4', level: 'B1', skill: 'writing', type: 'error_correction',
      prompt: 'Sửa lỗi sai trong câu.',
      sentence: 'If it will rain tomorrow, we will stay at home.',
      acceptedAnswers: ['If it rains tomorrow, we will stay at home.', "If it rains tomorrow, we'll stay at home."],
      explanationVi: 'Câu điều kiện loại 1: mệnh đề "if" dùng hiện tại đơn, không dùng "will".',
    },
    // ---------- B2 ----------
    {
      id: 'b2-1', level: 'B2', skill: 'grammar', type: 'multiple_choice',
      prompt: 'If I ___ about the traffic, I would have left earlier.',
      options: [{ id: 'a', text: 'knew' }, { id: 'b', text: 'had known' }, { id: 'c', text: 'would know' }],
      correctOptionId: 'b',
      explanationVi: 'Câu điều kiện loại 3: If + had V3, would have V3.',
    },
    {
      id: 'b2-2', level: 'B2', skill: 'vocabulary', type: 'multiple_choice',
      prompt: 'The new system is faster, but there is a ___: it uses much more memory.',
      options: [{ id: 'a', text: 'trade-off' }, { id: 'b', text: 'blocker' }, { id: 'c', text: 'nuance' }],
      correctOptionId: 'a',
      explanationVi: '"Trade-off" là sự đánh đổi: được tốc độ nhưng mất bộ nhớ.',
    },
    {
      id: 'b2-3', level: 'B2', skill: 'listening', type: 'multiple_choice',
      audioText: "Although the results look promising, we shouldn't draw any conclusions until we've tested the feature with real users.",
      prompt: 'What does the speaker suggest?',
      options: [
        { id: 'a', text: 'Launching the feature now' },
        { id: 'b', text: 'Testing with real users before deciding' },
        { id: 'c', text: 'Abandoning the feature' },
      ],
      correctOptionId: 'b',
      explanationVi: '"We shouldn\'t draw any conclusions until we\'ve tested…" — chưa kết luận khi chưa thử với người dùng thật.',
    },
    {
      id: 'b2-4', level: 'B2', skill: 'writing', type: 'translation',
      prompt: 'Dịch sang tiếng Anh.',
      sourceVi: 'Tôi ước mình đã học tiếng Anh sớm hơn.',
      acceptedAnswers: [
        'I wish I had learned English earlier.',
        'I wish I had learnt English earlier.',
        "I wish I'd learned English earlier.",
        "I wish I'd learnt English earlier.",
        'I wish I had studied English earlier.',
        "I wish I'd studied English earlier.",
      ],
      explanationVi: 'Ước điều trái với quá khứ: I wish + quá khứ hoàn thành (had + V3).',
    },
    // ---------- C1 ----------
    {
      id: 'c1-1', level: 'C1', skill: 'grammar', type: 'multiple_choice',
      prompt: 'Not only ___ late, but he also forgot the documents.',
      options: [{ id: 'a', text: 'he was' }, { id: 'b', text: 'was he' }, { id: 'c', text: 'he is' }],
      correctOptionId: 'b',
      explanationVi: '"Not only" đứng đầu câu → đảo ngữ: was he.',
    },
    {
      id: 'c1-2', level: 'C1', skill: 'vocabulary', type: 'multiple_choice',
      prompt: 'We added a cache to ___ the impact of the slow database.',
      options: [{ id: 'a', text: 'mitigate' }, { id: 'b', text: 'aggravate' }, { id: 'c', text: 'negotiate' }],
      correctOptionId: 'a',
      explanationVi: '"Mitigate" = giảm thiểu tác động xấu.',
    },
    {
      id: 'c1-3', level: 'C1', skill: 'reading', type: 'multiple_choice',
      context:
        'Remote work was once viewed as a perk reserved for a privileged few. Today, many companies treat it as the default, arguing that it widens the talent pool. Critics counter that spontaneous collaboration suffers when teams rarely meet in person.',
      prompt: 'What do the critics argue?',
      options: [
        { id: 'a', text: 'Remote work is too expensive for companies.' },
        { id: 'b', text: 'Unplanned teamwork happens less when people rarely meet.' },
        { id: 'c', text: 'Remote work makes it harder to find talented staff.' },
      ],
      correctOptionId: 'b',
      explanationVi: '"Spontaneous collaboration suffers" — sự cộng tác tự phát bị ảnh hưởng.',
    },
    {
      id: 'c1-4', level: 'C1', skill: 'writing', type: 'error_correction',
      prompt: 'Sửa lỗi sai trong câu.',
      sentence: 'Hardly I had arrived when the meeting started.',
      acceptedAnswers: ['Hardly had I arrived when the meeting started.'],
      explanationVi: '"Hardly" đứng đầu câu → đảo trợ động từ: Hardly had I arrived…',
    },
    // ---------- C2 ----------
    {
      id: 'c2-1', level: 'C2', skill: 'grammar', type: 'multiple_choice',
      prompt: 'It was the lack of testing ___ caused the outage.',
      options: [{ id: 'a', text: 'what' }, { id: 'b', text: 'that' }, { id: 'c', text: 'where' }],
      correctOptionId: 'b',
      explanationVi: 'Câu chẻ: It was + thông tin nhấn mạnh + that…',
    },
    {
      id: 'c2-2', level: 'C2', skill: 'vocabulary', type: 'multiple_choice',
      prompt: 'His reply was deliberately ___, so nobody knew whether he agreed.',
      options: [{ id: 'a', text: 'equivocal' }, { id: 'b', text: 'ubiquitous' }, { id: 'c', text: 'scalable' }],
      correctOptionId: 'a',
      explanationVi: '"Equivocal" = mơ hồ, nước đôi.',
    },
    {
      id: 'c2-3', level: 'C2', skill: 'reading', type: 'true_false',
      context: "The minister's statement, while ostensibly conciliatory, conceded nothing of substance.",
      prompt: 'Đúng hay sai theo câu văn?',
      statement: 'The minister made real concessions.',
      answer: false,
      explanationVi: '"Ostensibly conciliatory" (bề ngoài có vẻ hoà giải) nhưng "conceded nothing of substance" (không nhượng bộ điều gì thực chất).',
    },
    {
      id: 'c2-4', level: 'C2', skill: 'listening', type: 'multiple_choice',
      audioText: "Had we known the vendor would discontinue support, we'd never have built the whole platform on their framework.",
      prompt: 'What does the speaker mean?',
      options: [
        { id: 'a', text: 'They regret choosing that framework.' },
        { id: 'b', text: 'The vendor still supports the framework.' },
        { id: 'c', text: 'They plan to build on the framework.' },
      ],
      correctOptionId: 'a',
      explanationVi: 'Đảo ngữ điều kiện loại 3 ("Had we known…") diễn tả hối tiếc về lựa chọn trong quá khứ.',
    },
  ],
};

export const assessments: Assessment[] = [placementTest];
