import type { ScriptLine } from '@/types/content';

/** Listening scripts and reading passages shared by skill activities and their comprehension exercises. */

export const cafeScript: ScriptLine[] = [
  { speaker: 'A', en: 'Hi! What can I get you?', vi: 'Chào bạn! Bạn dùng gì ạ?' },
  { speaker: 'B', en: 'Hi. Can I have a coffee with milk, please?', vi: 'Chào bạn. Cho mình một cà phê sữa nhé.' },
  { speaker: 'A', en: 'Sure. Hot or iced?', vi: 'Vâng. Nóng hay đá ạ?' },
  { speaker: 'B', en: 'Iced, please. And a croissant.', vi: 'Đá nhé. Và một bánh sừng bò.' },
  { speaker: 'A', en: "That's sixty-five thousand dong.", vi: 'Của bạn 65 nghìn đồng.' },
  { speaker: 'B', en: 'Here you are. Thank you!', vi: 'Gửi bạn. Cảm ơn nhé!' },
];

export const weekendScript: ScriptLine[] = [
  { speaker: 'A', en: "Hi Lan, it's Minh. Are you free this Saturday?", vi: 'Chào Lan, Minh đây. Thứ Bảy này bạn rảnh không?' },
  { speaker: 'B', en: "Hi Minh! In the morning I'm going to my grandmother's, but I'm free in the afternoon.", vi: 'Chào Minh! Buổi sáng mình đến nhà bà, nhưng buổi chiều mình rảnh.' },
  { speaker: 'A', en: 'Great. Would you like to see the new film at the cinema?', vi: 'Tuyệt. Bạn có muốn đi xem phim mới ở rạp không?' },
  { speaker: 'B', en: "I'd love to. What time does it start?", vi: 'Thích lắm. Mấy giờ phim bắt đầu?' },
  { speaker: 'A', en: "At four thirty. Let's meet at the café next to the cinema at four.", vi: 'Lúc 4 giờ 30. Mình gặp nhau ở quán cà phê cạnh rạp lúc 4 giờ nhé.' },
  { speaker: 'B', en: 'Perfect. See you on Saturday!', vi: 'Tuyệt vời. Hẹn gặp thứ Bảy nhé!' },
];

export const standupScript: ScriptLine[] = [
  { speaker: 'A', en: "Morning, everyone. Let's start. Hoa, do you want to go first?", vi: 'Chào buổi sáng mọi người. Bắt đầu nhé. Hoa nói trước nhé?' },
  { speaker: 'B', en: "Sure. Yesterday I finished the search API and wrote the unit tests. Today I'm going to work on pagination.", vi: 'Vâng. Hôm qua mình đã làm xong API tìm kiếm và viết unit test. Hôm nay mình sẽ làm phần phân trang.' },
  { speaker: 'A', en: 'Any blockers?', vi: 'Có vấn đề gì cản trở không?' },
  { speaker: 'B', en: "Yes, one. The staging database is down, so I can't test the migration. Could someone from DevOps take a look?", vi: 'Có một việc. Database staging đang sập nên mình không test migration được. Ai bên DevOps xem giúp được không?' },
  { speaker: 'A', en: "I'll ping Tuan after the meeting. Thanks, Hoa.", vi: 'Mình sẽ nhắn Tuấn sau cuộc họp. Cảm ơn Hoa.' },
];

export const interviewScript: ScriptLine[] = [
  { speaker: 'A', en: "Can you tell me about a difficult bug you've solved?", vi: 'Bạn có thể kể về một lỗi khó mà bạn từng xử lý không?' },
  { speaker: 'B', en: 'Sure. In my last project, our payment service occasionally charged customers twice. It only happened under heavy load, so it was hard to reproduce.', vi: 'Vâng. Trong dự án trước, dịch vụ thanh toán thỉnh thoảng trừ tiền khách hai lần. Lỗi chỉ xảy ra khi tải cao nên rất khó tái hiện.' },
  { speaker: 'A', en: 'How did you find the cause?', vi: 'Bạn tìm ra nguyên nhân bằng cách nào?' },
  { speaker: 'B', en: "I added detailed logging and noticed that the client retried requests after a timeout. Our API wasn't idempotent, so each retry created a new charge.", vi: 'Tôi thêm log chi tiết và nhận ra client gửi lại request sau khi bị timeout. API của chúng tôi không idempotent nên mỗi lần gửi lại tạo ra một giao dịch mới.' },
  { speaker: 'A', en: 'And how did you fix it?', vi: 'Và bạn đã sửa thế nào?' },
  { speaker: 'B', en: 'We added an idempotency key to every payment request, so duplicates are ignored. After that, the problem disappeared.', vi: 'Chúng tôi thêm khoá idempotency cho mỗi request thanh toán để bỏ qua các request trùng. Sau đó lỗi biến mất.' },
];

export type Paragraph = { en: string; vi: string };

export const neighbourhoodText: Paragraph[] = [
  { en: 'Last month, I moved to a new flat in District 3. It is smaller than my old flat, but it is much closer to my office, so now I can walk to work.', vi: 'Tháng trước, tôi chuyển đến một căn hộ mới ở Quận 3. Nó nhỏ hơn căn hộ cũ nhưng gần văn phòng hơn nhiều, nên giờ tôi có thể đi bộ đi làm.' },
  { en: 'There is a market at the end of my street and a small park opposite my building. In the morning, old people do exercise there, and in the evening children play football.', vi: 'Cuối phố nhà tôi có một khu chợ và đối diện toà nhà có một công viên nhỏ. Buổi sáng người già tập thể dục ở đó, còn buổi tối trẻ con đá bóng.' },
  { en: 'The only problem is the noise. The street is very busy and noisy until midnight, so I have to close the windows to sleep. But I think my new neighbourhood is friendlier than my old one.', vi: 'Vấn đề duy nhất là tiếng ồn. Con phố rất đông đúc và ồn ào đến nửa đêm nên tôi phải đóng cửa sổ mới ngủ được. Nhưng tôi thấy khu phố mới thân thiện hơn khu cũ.' },
];

export const remoteWorkText: Paragraph[] = [
  { en: 'Since 2020, millions of office workers around the world have started working from home at least a few days a week. For many people, the biggest advantage is time: they no longer spend hours travelling to work.', vi: 'Từ năm 2020, hàng triệu nhân viên văn phòng trên thế giới đã bắt đầu làm việc tại nhà ít nhất vài ngày mỗi tuần. Với nhiều người, lợi ích lớn nhất là thời gian: họ không còn mất hàng giờ đi lại.' },
  { en: 'Working from home can also improve concentration. Without colleagues interrupting them, people often finish complex tasks faster. Many say they have more time for exercise and family.', vi: 'Làm việc tại nhà cũng có thể giúp tập trung hơn. Không bị đồng nghiệp làm gián đoạn, mọi người thường hoàn thành việc phức tạp nhanh hơn. Nhiều người nói họ có thêm thời gian cho thể thao và gia đình.' },
  { en: 'However, there are disadvantages too. Some people feel lonely, and it can be difficult to separate work from free time. Communication also takes more effort, because quick questions that used to take a minute at a desk now require a message or a call.', vi: 'Tuy nhiên, cũng có những bất lợi. Một số người cảm thấy cô đơn, và khó tách bạch công việc với thời gian rảnh. Giao tiếp cũng tốn công hơn, vì những câu hỏi nhanh trước đây chỉ mất một phút tại bàn làm việc giờ cần một tin nhắn hoặc cuộc gọi.' },
  { en: 'Experts suggest a balance: a few days at home for focused work and a few days in the office for meetings and teamwork.', vi: 'Các chuyên gia gợi ý một sự cân bằng: vài ngày ở nhà cho công việc cần tập trung và vài ngày ở văn phòng cho họp hành và làm việc nhóm.' },
];

export const readmeText: Paragraph[] = [
  { en: 'To run the project locally, you need Node.js 22 or later and a running PostgreSQL database. Clone the repository and install the dependencies with npm install.', vi: 'Để chạy dự án trên máy, bạn cần Node.js 22 trở lên và một cơ sở dữ liệu PostgreSQL đang chạy. Clone repository và cài các thư viện phụ thuộc bằng npm install.' },
  { en: 'Copy .env.example to .env.local and fill in your database connection string. Never commit .env.local: it contains secrets and is already listed in .gitignore.', vi: 'Sao chép .env.example thành .env.local và điền chuỗi kết nối cơ sở dữ liệu. Không bao giờ commit .env.local: tệp này chứa thông tin bí mật và đã nằm trong .gitignore.' },
  { en: 'Run npm run dev to start the development server. The app will be available at http://localhost:5173. If the port is already in use, Vite will choose the next free port automatically.', vi: 'Chạy npm run dev để khởi động server phát triển. Ứng dụng sẽ chạy tại http://localhost:5173. Nếu cổng đã bị dùng, Vite sẽ tự chọn cổng trống tiếp theo.' },
  { en: 'Before opening a pull request, make sure npm test and npm run lint pass. Pull requests with failing checks will not be reviewed.', vi: 'Trước khi mở pull request, hãy đảm bảo npm test và npm run lint đều chạy thành công. Pull request có kiểm tra bị lỗi sẽ không được review.' },
];

export const postmortemText: Paragraph[] = [
  { en: 'Summary: On 12 March, customers could not complete checkout for 47 minutes. Around 3,200 orders failed. No payment data was lost.', vi: 'Tóm tắt: Ngày 12 tháng 3, khách hàng không thể hoàn tất thanh toán trong 47 phút. Khoảng 3.200 đơn hàng thất bại. Không có dữ liệu thanh toán nào bị mất.' },
  { en: 'Root cause: A configuration change reduced the database connection pool from 50 to 5 connections. Under normal evening traffic, requests waited for a free connection and eventually timed out.', vi: 'Nguyên nhân gốc: Một thay đổi cấu hình đã giảm pool kết nối cơ sở dữ liệu từ 50 xuống 5. Với lưu lượng buổi tối bình thường, các request phải chờ kết nối trống và cuối cùng bị timeout.' },
  { en: 'Why it was not caught: The change was tested in staging, where traffic is much lower, so the smaller pool appeared to work. Our alerts only fired on error rates above 20%, which took 30 minutes to reach.', vi: 'Vì sao không phát hiện sớm: Thay đổi được thử trên staging, nơi lưu lượng thấp hơn nhiều, nên pool nhỏ có vẻ vẫn hoạt động. Cảnh báo chỉ kích hoạt khi tỉ lệ lỗi trên 20%, mất 30 phút mới đạt mức đó.' },
  { en: 'Actions: We will validate configuration changes against production-like load, lower the alert threshold to 5%, and add a dashboard for connection pool usage. We will review the progress of these actions in two weeks.', vi: 'Hành động: Chúng tôi sẽ kiểm tra các thay đổi cấu hình với tải giống môi trường thật, hạ ngưỡng cảnh báo xuống 5% và thêm dashboard theo dõi mức dùng pool kết nối. Tiến độ các việc này sẽ được xem lại sau hai tuần.' },
];

export const scriptText = (lines: ScriptLine[]) => lines.map((l) => l.en).join(' ');
export const passageText = (paragraphs: Paragraph[]) => paragraphs.map((p) => p.en).join('\n\n');
