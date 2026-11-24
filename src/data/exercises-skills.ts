import type { Exercise } from '@/types/content';
import {
  cafeScript,
  interviewScript,
  neighbourhoodText,
  passageText,
  postmortemText,
  readmeText,
  remoteWorkText,
  scriptText,
  standupScript,
  weekendScript,
} from './skill-scripts';

const cafe = scriptText(cafeScript);
const weekend = scriptText(weekendScript);
const standup = scriptText(standupScript);
const interview = scriptText(interviewScript);
const neighbourhood = passageText(neighbourhoodText);
const remote = passageText(remoteWorkText);
const readme = passageText(readmeText);
const postmortem = passageText(postmortemText);

/** Comprehension questions for the listening and reading activities (graded like any exercise). */
export const exercisesSkills: Exercise[] = [
  // ---------- Listening ----------
  {
    id: 'ex-listen-a1-cafe', title: 'Listening: At the café', titleVi: 'Nghe: Ở quán cà phê', level: 'A1', skill: 'listening',
    description: 'Câu hỏi nghe hiểu cho đoạn hội thoại gọi đồ uống.', estimatedMinutes: 3,
    questions: [
      { id: 'q1', type: 'multiple_choice', audioText: cafe, prompt: 'What does the customer order?', options: [{ id: 'a', text: 'An iced coffee with milk and a croissant' }, { id: 'b', text: 'A hot tea and a sandwich' }, { id: 'c', text: 'Only an iced coffee' }], correctOptionId: 'a', explanationVi: '"A coffee with milk… Iced, please. And a croissant."' },
      { id: 'q2', type: 'multiple_choice', audioText: cafe, prompt: 'How much does it cost?', options: [{ id: 'a', text: '55,000 dong' }, { id: 'b', text: '65,000 dong' }, { id: 'c', text: '75,000 dong' }], correctOptionId: 'b', explanationVi: '"That\'s sixty-five thousand dong."' },
      { id: 'q3', type: 'true_false', audioText: cafe, prompt: 'Đúng hay sai?', statement: 'The customer wants a hot drink.', answer: false, explanationVi: 'Khách chọn "Iced, please" — đồ uống đá.' },
    ],
  },
  {
    id: 'ex-listen-a2-weekend', title: 'Listening: Weekend plans', titleVi: 'Nghe: Kế hoạch cuối tuần', level: 'A2', skill: 'listening',
    description: 'Câu hỏi nghe hiểu cho cuộc gọi hẹn đi xem phim.', estimatedMinutes: 3,
    questions: [
      { id: 'q1', type: 'multiple_choice', audioText: weekend, prompt: 'What is Lan doing on Saturday morning?', options: [{ id: 'a', text: 'Working' }, { id: 'b', text: 'Visiting her grandmother' }, { id: 'c', text: 'Going to the cinema' }], correctOptionId: 'b', explanationVi: '"In the morning I\'m going to my grandmother\'s."' },
      { id: 'q2', type: 'multiple_choice', audioText: weekend, prompt: 'What time does the film start?', options: [{ id: 'a', text: '4:00' }, { id: 'b', text: '4:30' }, { id: 'c', text: '5:30' }], correctOptionId: 'b', explanationVi: '"At four thirty."' },
      { id: 'q3', type: 'multiple_choice', audioText: weekend, prompt: 'Where will they meet?', options: [{ id: 'a', text: 'At the cinema entrance' }, { id: 'b', text: "At Lan's house" }, { id: 'c', text: 'At the café next to the cinema' }], correctOptionId: 'c', explanationVi: '"Let\'s meet at the café next to the cinema at four."' },
    ],
  },
  {
    id: 'ex-listen-b1-standup', title: 'Listening: Daily stand-up', titleVi: 'Nghe: Daily stand-up', level: 'B1', skill: 'listening',
    description: 'Câu hỏi nghe hiểu cho một buổi stand-up của nhóm phát triển.', estimatedMinutes: 3,
    questions: [
      { id: 'q1', type: 'multiple_choice', audioText: standup, prompt: 'What did Hoa do yesterday?', options: [{ id: 'a', text: 'She finished the search API and wrote unit tests.' }, { id: 'b', text: 'She fixed the staging database.' }, { id: 'c', text: 'She planned the next sprint.' }], correctOptionId: 'a', explanationVi: '"Yesterday I finished the search API and wrote the unit tests."' },
      { id: 'q2', type: 'multiple_choice', audioText: standup, prompt: "What is Hoa's blocker?", options: [{ id: 'a', text: "She doesn't have access to the code." }, { id: 'b', text: 'The staging database is down.' }, { id: 'c', text: 'Her tests are failing.' }], correctOptionId: 'b', explanationVi: '"The staging database is down, so I can\'t test the migration."' },
      { id: 'q3', type: 'true_false', audioText: standup, prompt: 'Đúng hay sai?', statement: 'The scrum master will contact Tuan after the meeting.', answer: true, explanationVi: '"I\'ll ping Tuan after the meeting." — "ping" = nhắn tin nhanh.' },
    ],
  },
  {
    id: 'ex-listen-b2-interview', title: 'Listening: A difficult bug', titleVi: 'Nghe: Kể về một lỗi khó', level: 'B2', skill: 'listening',
    description: 'Câu hỏi nghe hiểu cho câu trả lời phỏng vấn kỹ thuật.', estimatedMinutes: 4,
    questions: [
      { id: 'q1', type: 'multiple_choice', audioText: interview, prompt: 'What was the bug?', options: [{ id: 'a', text: 'Customers were sometimes charged twice.' }, { id: 'b', text: 'Payments were too slow.' }, { id: 'c', text: 'The logs were missing.' }], correctOptionId: 'a', explanationVi: '"Our payment service occasionally charged customers twice."' },
      { id: 'q2', type: 'multiple_choice', audioText: interview, prompt: 'Why was it hard to reproduce?', options: [{ id: 'a', text: 'It only happened under heavy load.' }, { id: 'b', text: 'It only happened on mobile.' }, { id: 'c', text: 'The logs had been deleted.' }], correctOptionId: 'a', explanationVi: '"It only happened under heavy load."' },
      { id: 'q3', type: 'multiple_choice', audioText: interview, prompt: 'How did they fix it?', options: [{ id: 'a', text: 'By adding more servers' }, { id: 'b', text: 'By adding an idempotency key to payment requests' }, { id: 'c', text: 'By removing retries from the client' }], correctOptionId: 'b', explanationVi: '"We added an idempotency key to every payment request, so duplicates are ignored."' },
    ],
  },
  // ---------- Reading ----------
  {
    id: 'ex-read-a2-neighbourhood', title: 'Reading: My new neighbourhood', titleVi: 'Đọc: Khu phố mới của tôi', level: 'A2', skill: 'reading',
    description: 'Câu hỏi đọc hiểu về một khu phố mới.', estimatedMinutes: 4,
    questions: [
      { id: 'q1', type: 'true_false', context: neighbourhood, prompt: 'Đúng hay sai theo bài đọc?', statement: 'The new flat is bigger than the old one.', answer: false, explanationVi: '"It is smaller than my old flat."' },
      { id: 'q2', type: 'multiple_choice', context: neighbourhood, prompt: 'How does the writer go to work now?', options: [{ id: 'a', text: 'By bus' }, { id: 'b', text: 'On foot' }, { id: 'c', text: 'By motorbike' }], correctOptionId: 'b', explanationVi: '"Now I can walk to work." — đi bộ = on foot.' },
      { id: 'q3', type: 'multiple_choice', context: neighbourhood, prompt: 'What is the problem with the new neighbourhood?', options: [{ id: 'a', text: 'It is far from the office.' }, { id: 'b', text: 'It is noisy.' }, { id: 'c', text: 'There is no market.' }], correctOptionId: 'b', explanationVi: '"The only problem is the noise."' },
      { id: 'q4', type: 'fill_blank', context: neighbourhood, prompt: 'Hoàn thành câu theo bài đọc (một từ).', sentence: "There is a small park ___ the writer's building.", acceptedAnswers: ['opposite'], explanationVi: '"…a small park opposite my building."' },
    ],
  },
  {
    id: 'ex-read-b1-remote', title: 'Reading: Working from home', titleVi: 'Đọc: Làm việc tại nhà', level: 'B1', skill: 'reading',
    description: 'Câu hỏi đọc hiểu về ưu, nhược điểm của làm việc tại nhà.', estimatedMinutes: 5,
    questions: [
      { id: 'q1', type: 'multiple_choice', context: remote, prompt: 'What is the biggest advantage for many people?', options: [{ id: 'a', text: 'A higher salary' }, { id: 'b', text: 'Saving time on travel' }, { id: 'c', text: 'Better equipment' }], correctOptionId: 'b', explanationVi: '"The biggest advantage is time: they no longer spend hours travelling to work."' },
      { id: 'q2', type: 'true_false', context: remote, prompt: 'Đúng hay sai theo bài đọc?', statement: 'According to the article, everyone concentrates better at home.', answer: false, explanationVi: 'Bài viết nói "can also improve concentration" và "often" — không phải ai cũng vậy.' },
      { id: 'q3', type: 'multiple_choice', context: remote, prompt: 'Why does communication take more effort?', options: [{ id: 'a', text: 'The internet is slow.' }, { id: 'b', text: 'Quick questions now need a message or a call.' }, { id: 'c', text: "Managers don't answer." }], correctOptionId: 'b', explanationVi: '"Quick questions that used to take a minute at a desk now require a message or a call."' },
      { id: 'q4', type: 'multiple_choice', context: remote, prompt: 'What do experts suggest?', options: [{ id: 'a', text: 'Working from home every day' }, { id: 'b', text: 'A mix of home and office days' }, { id: 'c', text: 'Going back to the office full-time' }], correctOptionId: 'b', explanationVi: '"Experts suggest a balance: a few days at home… and a few days in the office."' },
    ],
  },
  {
    id: 'ex-read-b1-readme', title: 'Reading: A project README', titleVi: 'Đọc: Tệp README của dự án', level: 'B1', skill: 'developer',
    description: 'Câu hỏi đọc hiểu tài liệu hướng dẫn chạy dự án.', estimatedMinutes: 4,
    questions: [
      { id: 'q1', type: 'multiple_choice', context: readme, prompt: 'What must you do before opening a pull request?', options: [{ id: 'a', text: 'Deploy to production' }, { id: 'b', text: 'Make sure the tests and lint pass' }, { id: 'c', text: 'Update the README' }], correctOptionId: 'b', explanationVi: '"Make sure npm test and npm run lint pass."' },
      { id: 'q2', type: 'true_false', context: readme, prompt: 'Đúng hay sai theo tài liệu?', statement: 'You should commit the .env.local file.', answer: false, explanationVi: '"Never commit .env.local: it contains secrets."' },
      { id: 'q3', type: 'multiple_choice', context: readme, prompt: 'What happens if port 5173 is already in use?', options: [{ id: 'a', text: 'The server crashes.' }, { id: 'b', text: 'Vite uses the next free port.' }, { id: 'c', text: 'You must restart your computer.' }], correctOptionId: 'b', explanationVi: '"Vite will choose the next free port automatically."' },
      { id: 'q4', type: 'fill_blank', context: readme, prompt: 'Hoàn thành câu theo tài liệu (một từ).', sentence: 'You need Node.js 22 or ___.', acceptedAnswers: ['later', 'newer'], explanationVi: '"Node.js 22 or later" = Node.js 22 trở lên.' },
    ],
  },
  {
    id: 'ex-read-b2-postmortem', title: 'Reading: Incident postmortem', titleVi: 'Đọc: Báo cáo sự cố', level: 'B2', skill: 'developer',
    description: 'Câu hỏi đọc hiểu báo cáo phân tích sự cố (postmortem).', estimatedMinutes: 5,
    questions: [
      { id: 'q1', type: 'multiple_choice', context: postmortem, prompt: 'What caused the outage?', options: [{ id: 'a', text: 'A bug in the payment provider' }, { id: 'b', text: 'The connection pool was reduced to 5 connections' }, { id: 'c', text: 'A server ran out of disk space' }], correctOptionId: 'b', explanationVi: '"A configuration change reduced the database connection pool from 50 to 5 connections."' },
      { id: 'q2', type: 'true_false', context: postmortem, prompt: 'Đúng hay sai theo báo cáo?', statement: 'Some payment data was lost.', answer: false, explanationVi: '"No payment data was lost."' },
      { id: 'q3', type: 'multiple_choice', context: postmortem, prompt: "Why wasn't the problem found in staging?", options: [{ id: 'a', text: 'Staging has much less traffic.' }, { id: 'b', text: 'Staging was down that day.' }, { id: 'c', text: 'Nobody tested the change.' }], correctOptionId: 'a', explanationVi: '"…tested in staging, where traffic is much lower."' },
      { id: 'q4', type: 'multiple_choice', context: postmortem, prompt: 'Which action is planned?', options: [{ id: 'a', text: 'Removing all alerts' }, { id: 'b', text: 'Lowering the alert threshold to 5%' }, { id: 'c', text: 'Moving to another database' }], correctOptionId: 'b', explanationVi: '"…lower the alert threshold to 5%."' },
    ],
  },
];
