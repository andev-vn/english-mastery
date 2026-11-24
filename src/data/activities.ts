import type { ListeningActivity, ReadingActivity, SkillActivity, SpeakingActivity, WritingActivity } from '@/types/content';
import {
  cafeScript,
  interviewScript,
  neighbourhoodText,
  postmortemText,
  readmeText,
  remoteWorkText,
  standupScript,
  weekendScript,
} from './skill-scripts';

/* ---------------------------------- Listening ---------------------------------- */
const listening: ListeningActivity[] = [
  {
    id: 'listen-a1-cafe', skill: 'listening', level: 'A1', category: 'daily', order: 1,
    title: 'At the café', titleVi: 'Ở quán cà phê', description: 'Nghe khách gọi đồ uống và thanh toán.',
    lines: cafeScript, exerciseId: 'ex-listen-a1-cafe', vocabularyIds: ['v-coffee', 'v-milk'],
    dictation: ['Can I have a coffee with milk, please?', "That's sixty-five thousand dong."],
  },
  {
    id: 'listen-a2-weekend', skill: 'listening', level: 'A2', category: 'daily', order: 1,
    title: 'Weekend plans', titleVi: 'Kế hoạch cuối tuần', description: 'Nghe cuộc gọi rủ bạn đi xem phim.',
    lines: weekendScript, exerciseId: 'ex-listen-a2-weekend', vocabularyIds: [],
    dictation: ['Are you free this Saturday?', "Let's meet at the café next to the cinema at four."],
  },
  {
    id: 'listen-b1-standup', skill: 'listening', level: 'B1', category: 'developer', order: 1,
    title: 'Daily stand-up', titleVi: 'Buổi daily stand-up', description: 'Nghe một lập trình viên báo cáo tiến độ và nêu vấn đề cản trở.',
    lines: standupScript, exerciseId: 'ex-listen-b1-standup', vocabularyIds: ['v-blocker'],
    dictation: ['Yesterday I finished the search API and wrote the unit tests.', "The staging database is down, so I can't test the migration."],
  },
  {
    id: 'listen-b2-interview', skill: 'listening', level: 'B2', category: 'interview', order: 1,
    title: 'Interview: a difficult bug', titleVi: 'Phỏng vấn: kể về một lỗi khó', description: 'Nghe câu trả lời phỏng vấn theo cấu trúc vấn đề – nguyên nhân – giải pháp.',
    lines: interviewScript, exerciseId: 'ex-listen-b2-interview', vocabularyIds: ['v-bug'],
    dictation: ['It only happened under heavy load, so it was hard to reproduce.', 'We added an idempotency key to every payment request.'],
  },
];

/* ---------------------------------- Reading ---------------------------------- */
const reading: ReadingActivity[] = [
  {
    id: 'read-a2-neighbourhood', skill: 'reading', level: 'A2', category: 'daily', order: 1,
    title: 'My new neighbourhood', titleVi: 'Khu phố mới của tôi', description: 'Một người kể về căn hộ và khu phố mới.',
    paragraphs: neighbourhoodText, exerciseId: 'ex-read-a2-neighbourhood',
    vocabularyIds: ['v-flat', 'v-market', 'v-park', 'v-noisy', 'v-window'],
  },
  {
    id: 'read-b1-remote', skill: 'reading', level: 'B1', category: 'work', order: 1,
    title: 'Working from home', titleVi: 'Làm việc tại nhà', description: 'Bài báo ngắn về ưu và nhược điểm của làm việc từ xa.',
    paragraphs: remoteWorkText, exerciseId: 'ex-read-b1-remote', vocabularyIds: ['v-colleague', 'v-exercise', 'v-free-time', 'v-meeting'],
  },
  {
    id: 'read-b1-readme', skill: 'reading', level: 'B1', category: 'developer', order: 2,
    title: 'A project README', titleVi: 'Tệp README của dự án', description: 'Đọc hiểu tài liệu hướng dẫn chạy dự án và quy trình pull request.',
    paragraphs: readmeText, exerciseId: 'ex-read-b1-readme', vocabularyIds: ['v-review'],
  },
  {
    id: 'read-b2-postmortem', skill: 'reading', level: 'B2', category: 'developer', order: 1,
    title: 'Incident postmortem', titleVi: 'Báo cáo phân tích sự cố', description: 'Đọc một bản postmortem: tóm tắt, nguyên nhân gốc và hành động khắc phục.',
    paragraphs: postmortemText, exerciseId: 'ex-read-b2-postmortem', vocabularyIds: ['v-review'],
  },
];

/* ---------------------------------- Speaking ---------------------------------- */
const speaking: SpeakingActivity[] = [
  {
    id: 'speak-a1-introduce', skill: 'speaking', level: 'A1', category: 'daily', order: 1,
    title: 'Introduce yourself', titleVi: 'Giới thiệu bản thân', description: 'Làm quen với một người bạn mới trong lớp.',
    scenarioVi: 'Bạn gặp một người bạn mới ở lớp tiếng Anh. Hãy trả lời các câu hỏi để giới thiệu bản thân.',
    partnerRole: 'Anna, bạn cùng lớp',
    turns: [
      { partner: "Hi! I'm Anna. What's your name?", partnerVi: 'Chào! Mình là Anna. Bạn tên gì?', suggested: "Hi Anna, I'm Minh. Nice to meet you.", hintVi: 'Nói tên: I\'m + tên.' },
      { partner: 'Nice to meet you too. Where are you from?', partnerVi: 'Mình cũng rất vui được gặp bạn. Bạn đến từ đâu?', suggested: "I'm from Vietnam. I live in Hanoi." },
      { partner: 'What do you do?', partnerVi: 'Bạn làm nghề gì?', suggested: "I'm a software developer.", hintVi: 'Nghề nghiệp: I\'m a/an + nghề.' },
      { partner: 'Why are you learning English?', partnerVi: 'Vì sao bạn học tiếng Anh?', suggested: "I'm learning English for my job." },
    ],
    usefulPhrases: [
      { en: "I'm from…", vi: 'Tôi đến từ…' },
      { en: 'I live in…', vi: 'Tôi sống ở…' },
      { en: 'I work as a…', vi: 'Tôi làm nghề…' },
      { en: 'Nice to meet you.', vi: 'Rất vui được gặp bạn.' },
    ],
    grammarTipVi: 'Dùng "I am / I\'m" để nói tên, quê quán và nghề nghiệp. Nghề nghiệp cần "a/an": I\'m a teacher, I\'m an engineer.',
  },
  {
    id: 'speak-a2-restaurant', skill: 'speaking', level: 'A2', category: 'daily', order: 1,
    title: 'Ordering at a restaurant', titleVi: 'Gọi món ở nhà hàng', description: 'Gọi món, đồ uống và xin hoá đơn lịch sự.',
    scenarioVi: 'Bạn đang ở một nhà hàng. Nhân viên phục vụ hỏi bạn vài câu.',
    partnerRole: 'Nhân viên phục vụ',
    turns: [
      { partner: 'Good evening! Are you ready to order?', partnerVi: 'Chào buổi tối! Anh/chị gọi món chưa ạ?', suggested: "Yes. I'd like the grilled chicken, please." },
      { partner: 'Would you like anything to drink?', partnerVi: 'Anh/chị có dùng đồ uống không ạ?', suggested: 'Can I have an iced tea, please?' },
      { partner: 'Anything else?', partnerVi: 'Anh/chị dùng thêm gì không ạ?', suggested: "No, that's all, thanks." },
      { partner: 'How was everything?', partnerVi: 'Món ăn thế nào ạ?', suggested: 'It was delicious. Could I have the bill, please?', hintVi: 'Khen món ăn rồi xin hoá đơn.' },
    ],
    usefulPhrases: [
      { en: "I'd like…, please.", vi: 'Cho tôi…' },
      { en: 'Can I have…?', vi: 'Cho tôi… được không?' },
      { en: "That's all, thanks.", vi: 'Vậy thôi, cảm ơn.' },
      { en: 'Could I have the bill, please?', vi: 'Cho tôi xin hoá đơn.' },
    ],
    grammarTipVi: 'Dùng "I\'d like…" và "Can I have…?" thay cho "I want…" để lịch sự hơn.',
  },
  {
    id: 'speak-b1-standup', skill: 'speaking', level: 'B1', category: 'developer', order: 1,
    title: 'Your stand-up update', titleVi: 'Báo cáo trong daily stand-up', description: 'Nói việc đã làm, việc sẽ làm và vấn đề cản trở.',
    scenarioVi: 'Đến lượt bạn báo cáo trong buổi daily stand-up của nhóm.',
    partnerRole: 'Scrum master',
    turns: [
      { partner: 'Good morning. What did you work on yesterday?', partnerVi: 'Chào buổi sáng. Hôm qua bạn làm gì?', suggested: 'Yesterday I fixed the login bug and wrote some unit tests.' },
      { partner: 'What are you going to do today?', partnerVi: 'Hôm nay bạn định làm gì?', suggested: "Today I'm going to review Hoa's pull request and start the payment API." },
      { partner: 'Do you have any blockers?', partnerVi: 'Bạn có vấn đề gì cản trở không?', suggested: "Yes, I don't have access to the staging server yet. Could someone help me?", hintVi: 'Nêu vấn đề và nhờ hỗ trợ lịch sự.' },
    ],
    usefulPhrases: [
      { en: 'Yesterday I worked on…', vi: 'Hôm qua tôi làm…' },
      { en: "Today I'm going to…", vi: 'Hôm nay tôi sẽ…' },
      { en: "I'm blocked on…", vi: 'Tôi đang bị kẹt ở…' },
      { en: 'No blockers.', vi: 'Không có vấn đề gì.' },
    ],
    grammarTipVi: 'Quá khứ đơn cho việc hôm qua (fixed, wrote), "going to" cho kế hoạch hôm nay.',
  },
  {
    id: 'speak-b1-explain-bug', skill: 'speaking', level: 'B1', category: 'developer', order: 2,
    title: 'Explaining a bug', titleVi: 'Giải thích một lỗi', description: 'Mô tả lỗi, cách tái hiện, nguyên nhân và cách sửa.',
    scenarioVi: 'Một đồng nghiệp QA người nước ngoài hỏi bạn về lỗi bạn vừa phát hiện.',
    partnerRole: 'Đồng nghiệp QA',
    turns: [
      { partner: "Hey, what's the problem?", partnerVi: 'Này, có vấn đề gì vậy?', suggested: 'When users upload a large image, the app crashes.' },
      { partner: 'Can you reproduce it every time?', partnerVi: 'Bạn có tái hiện được mọi lần không?', suggested: 'Yes. It happens every time the file is bigger than ten megabytes.' },
      { partner: 'What do you think is causing it?', partnerVi: 'Bạn nghĩ nguyên nhân là gì?', suggested: "I think we're loading the whole file into memory before resizing it." },
      { partner: 'How would you fix it?', partnerVi: 'Bạn sẽ sửa thế nào?', suggested: 'We could stream the file and resize it in smaller chunks.' },
    ],
    usefulPhrases: [
      { en: 'It happens when…', vi: 'Lỗi xảy ra khi…' },
      { en: 'I can reproduce it by…', vi: 'Tôi có thể tái hiện bằng cách…' },
      { en: 'I think the cause is…', vi: 'Tôi nghĩ nguyên nhân là…' },
      { en: 'We could…', vi: 'Chúng ta có thể…' },
    ],
    grammarTipVi: 'Dùng hiện tại đơn cho lỗi lặp lại (It happens every time…) và "could" để đề xuất giải pháp một cách nhẹ nhàng.',
  },
  {
    id: 'speak-b2-java-interview', skill: 'speaking', level: 'B2', category: 'interview', order: 1,
    title: 'Java developer interview', titleVi: 'Phỏng vấn Java Developer', description: 'Giới thiệu kinh nghiệm và trả lời câu hỏi kỹ thuật Java.',
    scenarioVi: 'Bạn đang phỏng vấn vị trí Java Developer ở một công ty quốc tế.',
    partnerRole: 'Nhà tuyển dụng',
    turns: [
      { partner: 'Tell me a little about yourself.', partnerVi: 'Hãy giới thiệu ngắn về bản thân.', suggested: "I'm a Java developer with four years of experience, mostly building REST APIs with Spring Boot." },
      { partner: "What's the difference between an interface and an abstract class in Java?", partnerVi: 'Interface và abstract class trong Java khác nhau thế nào?', suggested: 'An abstract class can have state and constructors, while an interface defines a contract. A class can implement many interfaces but extend only one class.' },
      { partner: 'How do you make sure your code is reliable?', partnerVi: 'Bạn làm thế nào để đảm bảo code đáng tin cậy?', suggested: 'I write unit and integration tests, and I ask for code reviews before merging.' },
      { partner: 'Why do you want to work with us?', partnerVi: 'Vì sao bạn muốn làm việc với chúng tôi?', suggested: "I'd like to work on large-scale systems and improve my skills in an international team." },
    ],
    usefulPhrases: [
      { en: 'I have … years of experience in…', vi: 'Tôi có … năm kinh nghiệm về…' },
      { en: 'The main difference is…', vi: 'Điểm khác nhau chính là…' },
      { en: 'For example, …', vi: 'Ví dụ, …' },
      { en: "I'd like to…", vi: 'Tôi muốn…' },
    ],
    grammarTipVi: 'Dùng "while" để so sánh hai ý (A…, while B…). Khi nói kinh nghiệm đến nay, có thể dùng hiện tại hoàn thành: I have worked with Spring Boot for four years.',
  },
  {
    id: 'speak-b2-api-design', skill: 'speaking', level: 'B2', category: 'interview', order: 2,
    title: 'Backend interview: API design', titleVi: 'Phỏng vấn Backend: thiết kế API', description: 'Trình bày cách thiết kế một API đơn giản và mở rộng nó.',
    scenarioVi: 'Kỹ sư phỏng vấn yêu cầu bạn thiết kế API cho một ứng dụng quản lý công việc.',
    partnerRole: 'Kỹ sư phỏng vấn',
    turns: [
      { partner: 'How would you design an API for a to-do app?', partnerVi: 'Bạn sẽ thiết kế API cho ứng dụng to-do thế nào?', suggested: "I'd create a REST API with endpoints like GET tasks, POST tasks and PATCH tasks by ID." },
      { partner: 'How would you handle a large number of tasks?', partnerVi: 'Bạn xử lý số lượng công việc lớn ra sao?', suggested: "I'd add pagination, for example with a limit and a cursor, so responses stay small." },
      { partner: 'What about authentication?', partnerVi: 'Còn xác thực thì sao?', suggested: "I'd use token-based authentication and make sure users can only access their own tasks." },
      { partner: 'What would you do if the database became slow?', partnerVi: 'Nếu cơ sở dữ liệu chậm đi, bạn sẽ làm gì?', suggested: "First I'd measure the slow queries, then add indexes or caching where it helps." },
    ],
    usefulPhrases: [
      { en: "I'd start by…", vi: 'Tôi sẽ bắt đầu bằng…' },
      { en: 'One option is…', vi: 'Một phương án là…' },
      { en: 'The trade-off is…', vi: 'Sự đánh đổi là…' },
      { en: 'To make it scalable, …', vi: 'Để dễ mở rộng, …' },
    ],
    grammarTipVi: 'Trong phỏng vấn thiết kế, dùng "would / I\'d" để nói về giải pháp giả định: I\'d add an index…',
  },
];

/* ---------------------------------- Writing ---------------------------------- */
const writing: WritingActivity[] = [
  {
    id: 'write-a1-routine', skill: 'writing', level: 'A1', category: 'daily', order: 1, writingType: 'sentence',
    title: 'My daily routine', titleVi: 'Thói quen hằng ngày', description: 'Viết 5 câu về một ngày của bạn.',
    promptEn: 'Write five sentences about your daily routine.',
    promptVi: 'Viết 5 câu về thói quen hằng ngày: giờ thức dậy, bữa sáng, đi làm/đi học và buổi tối. Dùng thì hiện tại đơn.',
    minWords: 25, maxWords: 90,
    checklist: [
      { labelVi: 'Nói giờ thức dậy', anyOf: ['wake up', 'get up'] },
      { labelVi: 'Dùng trạng từ tần suất (usually, always…)', anyOf: ['usually', 'always', 'often', 'sometimes', 'never'] },
      { labelVi: 'Nói về buổi tối', anyOf: ['evening', 'night', 'dinner'] },
    ],
    usefulPhrases: [
      { en: 'I usually…', vi: 'Tôi thường…' },
      { en: "At seven o'clock, …", vi: 'Lúc bảy giờ, …' },
      { en: 'After that, …', vi: 'Sau đó, …' },
      { en: 'In the evening, …', vi: 'Buổi tối, …' },
    ],
    sampleAnswer: "I usually wake up at six o'clock. I have breakfast with my family. After that, I go to work by motorbike. I have lunch with my colleagues at twelve. In the evening, I study English for thirty minutes.",
  },
  {
    id: 'write-a2-journal', skill: 'writing', level: 'A2', category: 'daily', order: 1, writingType: 'journal',
    title: 'Daily journal', titleVi: 'Nhật ký hằng ngày', description: 'Viết vài câu về ngày hôm nay — mỗi ngày một trang.',
    promptEn: 'What did you do today? How did you feel?',
    promptVi: 'Viết nhật ký: hôm nay bạn đã làm gì, gặp ai và cảm thấy thế nào? Dùng thì quá khứ đơn.',
    minWords: 30, maxWords: 200,
    checklist: [
      { labelVi: 'Dùng thì quá khứ (went, had, was…)', anyOf: ['went', 'had', 'was', 'were', 'did', 'saw', 'met', 'ate', 'worked', 'studied', 'watched', 'visited'] },
      { labelVi: 'Nói về cảm xúc', anyOf: ['felt', 'happy', 'tired', 'sad', 'excited', 'worried', 'bored', 'relaxed'] },
    ],
    usefulPhrases: [
      { en: 'Today I…', vi: 'Hôm nay tôi…' },
      { en: 'In the afternoon, …', vi: 'Buổi chiều, …' },
      { en: 'I felt… because…', vi: 'Tôi cảm thấy… vì…' },
      { en: 'Tomorrow I want to…', vi: 'Ngày mai tôi muốn…' },
    ],
    sampleAnswer: 'Today I worked from home. In the morning I had a long meeting with my team, and in the afternoon I fixed two small bugs. After work, I went for a walk in the park near my flat. I felt tired but happy because I finished all my tasks. Tomorrow I want to get up early and study English before work.',
  },
  {
    id: 'write-b1-email-help', skill: 'writing', level: 'B1', category: 'work', order: 1, writingType: 'email',
    title: 'Email: asking a colleague for help', titleVi: 'Email nhờ đồng nghiệp giúp đỡ', description: 'Viết email ngắn, lịch sự, nêu rõ vấn đề và đề xuất thời gian trao đổi.',
    promptEn: 'Write an email to a colleague asking for help with a task. Explain the problem and suggest a time to talk.',
    promptVi: 'Viết email nhờ một đồng nghiệp giúp đỡ: chào hỏi, giải thích vấn đề, nhờ giúp lịch sự, đề xuất thời gian và kết thư.',
    minWords: 60, maxWords: 160,
    checklist: [
      { labelVi: 'Lời chào mở đầu', anyOf: ['hi ', 'hello', 'dear'] },
      { labelVi: 'Giải thích vấn đề', anyOf: ['problem', 'issue', 'stuck', 'trouble', 'error'] },
      { labelVi: 'Nhờ giúp đỡ lịch sự', anyOf: ['could you', 'would you', 'can you', 'would it be possible'] },
      { labelVi: 'Đề xuất thời gian', anyOf: ['tomorrow', 'today', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'this afternoon', 'this morning'] },
      { labelVi: 'Lời kết thư', anyOf: ['regards', 'thanks', 'thank you', 'best'] },
    ],
    usefulPhrases: [
      { en: "I'm having trouble with…", vi: 'Tôi đang gặp khó khăn với…' },
      { en: 'Could you help me with…?', vi: 'Anh/chị giúp tôi… được không?' },
      { en: 'Would you have 15 minutes tomorrow?', vi: 'Ngày mai anh/chị có 15 phút không?' },
      { en: 'Thanks in advance.', vi: 'Cảm ơn trước nhé.' },
    ],
    sampleAnswer: "Hi Anna,\n\nI hope you're well. I'm having trouble with the database migration for the orders table. When I run it on staging, it fails with a foreign key error, and I'm not sure how to fix it without losing data.\n\nCould you help me take a look? Would you have 15 minutes tomorrow at 10 a.m.? I can share my screen and show you the error.\n\nThanks in advance,\nMinh",
  },
  {
    id: 'write-b1-bug-report', skill: 'writing', level: 'B1', category: 'developer', order: 2, writingType: 'workplace',
    title: 'Writing a bug report', titleVi: 'Viết báo cáo lỗi', description: 'Mô tả lỗi rõ ràng để người khác tái hiện được.',
    promptEn: "Write a bug report for this problem: the 'Save' button does nothing on the profile page in Safari.",
    promptVi: 'Viết báo cáo lỗi: nút "Save" không hoạt động ở trang hồ sơ trên Safari. Cần có các bước tái hiện, kết quả mong đợi, kết quả thực tế và môi trường.',
    minWords: 50, maxWords: 200,
    checklist: [
      { labelVi: 'Các bước tái hiện (Steps to reproduce)', anyOf: ['steps to reproduce', 'steps:', '1.'] },
      { labelVi: 'Kết quả mong đợi (Expected)', anyOf: ['expected'] },
      { labelVi: 'Kết quả thực tế (Actual)', anyOf: ['actual'] },
      { labelVi: 'Môi trường (trình duyệt, phiên bản)', anyOf: ['safari', 'browser', 'environment', 'version'] },
    ],
    usefulPhrases: [
      { en: 'Steps to reproduce:', vi: 'Các bước tái hiện:' },
      { en: 'Expected result:', vi: 'Kết quả mong đợi:' },
      { en: 'Actual result:', vi: 'Kết quả thực tế:' },
      { en: 'This only happens in…', vi: 'Lỗi chỉ xảy ra trên…' },
    ],
    sampleAnswer: "Title: 'Save' button does nothing on the profile page in Safari\n\nSteps to reproduce:\n1. Log in and open the profile page.\n2. Change the display name.\n3. Click 'Save'.\n\nExpected result: The new name is saved and a confirmation message appears.\nActual result: Nothing happens. No request is sent and there is no error message.\n\nEnvironment: Safari 18 on macOS 15. It works correctly in Chrome and Firefox.",
  },
  {
    id: 'write-b1-pr-description', skill: 'writing', level: 'B1', category: 'developer', order: 3, writingType: 'workplace',
    title: 'Pull request description', titleVi: 'Mô tả pull request', description: 'Giải thích thay đổi gì, vì sao và đã kiểm thử thế nào.',
    promptEn: 'Write a pull request description for a change that adds pagination to the /tasks API.',
    promptVi: 'Viết mô tả pull request cho thay đổi thêm phân trang vào API /tasks: thay đổi gì, vì sao, kiểm thử thế nào và lưu ý cho người review.',
    minWords: 40, maxWords: 180,
    checklist: [
      { labelVi: 'Nói thay đổi gì', anyOf: ['this pr', 'this change', 'adds', 'added'] },
      { labelVi: 'Giải thích vì sao', anyOf: ['because', 'so that', 'problem', 'why'] },
      { labelVi: 'Cách kiểm thử', anyOf: ['test'] },
      { labelVi: 'Lưu ý cho người review', anyOf: ['note', 'reviewer', 'breaking', 'please check'] },
    ],
    usefulPhrases: [
      { en: 'This PR adds…', vi: 'PR này thêm…' },
      { en: 'This is needed because…', vi: 'Việc này cần thiết vì…' },
      { en: 'I tested it by…', vi: 'Tôi đã kiểm thử bằng cách…' },
      { en: 'Note for reviewers: …', vi: 'Lưu ý cho người review: …' },
    ],
    sampleAnswer: 'This PR adds cursor-based pagination to the GET /tasks endpoint.\n\nWhy: some users have thousands of tasks, so the endpoint was slow and returned very large responses.\n\nChanges: new optional limit and cursor query parameters (default limit 50), and a nextCursor field in the response.\n\nTesting: added unit tests for the cursor logic and tested manually with 10,000 tasks.\n\nNote for reviewers: this is not a breaking change, because existing clients still receive the first page.',
  },
  {
    id: 'write-b2-essay-remote', skill: 'writing', level: 'B2', category: 'work', order: 1, writingType: 'essay',
    title: 'Opinion essay: working from home', titleVi: 'Bài luận nêu quan điểm: làm việc tại nhà', description: 'Nêu quan điểm, đưa lý do, ví dụ và kết luận.',
    promptEn: 'Is working from home better than working in an office? Give reasons and examples.',
    promptVi: 'Làm việc tại nhà có tốt hơn làm ở văn phòng không? Nêu quan điểm, đưa lý do và ví dụ, có ý phản biện và kết luận.',
    minWords: 120, maxWords: 300,
    checklist: [
      { labelVi: 'Nêu quan điểm', anyOf: ['i believe', 'in my opinion', 'i think', 'in my view'] },
      { labelVi: 'Có ý đối lập (however, although…)', anyOf: ['however', 'on the other hand', 'although', 'while'] },
      { labelVi: 'Có ví dụ', anyOf: ['for example', 'for instance', 'such as'] },
      { labelVi: 'Có kết luận', anyOf: ['in conclusion', 'to sum up', 'overall'] },
    ],
    usefulPhrases: [
      { en: 'In my view, …', vi: 'Theo quan điểm của tôi, …' },
      { en: 'On the other hand, …', vi: 'Mặt khác, …' },
      { en: 'For instance, …', vi: 'Chẳng hạn, …' },
      { en: 'To sum up, …', vi: 'Tóm lại, …' },
    ],
    sampleAnswer: 'In my view, working from home is better for most software developers, as long as teams meet regularly.\n\nThe main advantage is focus. Programming requires long periods of concentration, and an office full of conversations makes that difficult. For example, I usually finish complex features faster on the days I work at home. Remote work also saves time: many people in Ho Chi Minh City spend more than an hour in traffic every day.\n\nOn the other hand, working from home can make communication slower and newer team members may feel isolated. However, these problems can be reduced with short daily video calls and one or two office days a week for planning and teamwork.\n\nTo sum up, I believe a hybrid model gives the best of both worlds: quiet time at home for deep work, and time together for collaboration.',
  },
];

/** Ordered like the database: skill (listening, speaking, reading, writing), then level, then order. */
export const activities: SkillActivity[] = [...listening, ...speaking, ...reading, ...writing];
