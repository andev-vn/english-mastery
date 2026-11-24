import { expect, test, type Page } from '@playwright/test';

async function onboard(page: Page, name = 'Lan') {
  await page.goto('/');
  await expect(page).toHaveURL(/\/welcome$/);
  await page.getByRole('link', { name: 'Bắt đầu học' }).click();
  await page.getByLabel('Tên hiển thị').fill(name);
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await page.getByRole('button', { name: 'Tiếp tục' }).click(); // goal (default)
  await page.getByRole('button', { name: 'Tiếp tục' }).click(); // level A1 (default)
  await page.getByRole('button', { name: 'Bắt đầu học' }).click(); // daily goal (default)
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: new RegExp(name) })).toBeVisible();
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

test('protected routes redirect to welcome before onboarding', async ({ page }) => {
  await page.goto('/practice');
  await expect(page).toHaveURL(/\/welcome$/);
});

test('onboarding validates the name', async ({ page }) => {
  await page.goto('/onboarding');
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await expect(page.getByText('Hãy cho chúng tôi biết tên của bạn')).toBeVisible();
});

test('learner completes a lesson and its exercise, earning XP', async ({ page }) => {
  await onboard(page);
  await expectNoHorizontalOverflow(page);

  // Continue learning → first A1 lesson.
  await page.getByRole('link', { name: /Chào hỏi/ }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Chào hỏi' })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  // Lesson exercise: answer every question with the correct response.
  await page.getByRole('link', { name: /Luyện tập: Chào hỏi/ }).click();
  await page.getByRole('radio', { name: /Nice to meet you, too/ }).click();
  await page.getByRole('button', { name: 'Kiểm tra' }).click();
  await expect(page.getByText('Chính xác!')).toBeVisible();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();

  await page.getByLabel('Từ cần điền').fill('is');
  await page.getByLabel('Từ cần điền').press('Enter');
  await page.getByRole('button', { name: 'Tiếp tục' }).click();

  for (const [left, right] of [
    ['How are you?', "I'm fine, thanks."],
    ['Where are you from?', "I'm from Vietnam."],
    ['What do you do?', "I'm a developer."],
  ]) {
    await page.getByRole('button', { name: left, exact: true }).click();
    await page.getByRole('button', { name: right, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Kiểm tra' }).click();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();

  for (const token of ['I', 'am', 'from', 'Ho Chi Minh City']) {
    await page.getByRole('button', { name: token, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Kiểm tra' }).click();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();

  await page.getByRole('radio', { name: /False/ }).click();
  await page.getByRole('button', { name: 'Kiểm tra' }).click();
  await page.getByRole('button', { name: 'Xem kết quả' }).click();

  await expect(page.getByText('100%')).toBeVisible();
  await expect(page.getByText('+35 XP')).toBeVisible(); // 5 × 5 XP + 10 perfect bonus

  // Back to the lesson and complete it.
  await page.getByRole('link', { name: 'Quay lại bài học' }).click();
  await page.getByRole('button', { name: 'Hoàn thành bài học' }).click();
  await expect(page.getByText(/Hoàn thành bài học! \+20 XP/)).toBeVisible();
  await expect(page).toHaveURL(/\/lessons\/l-a1-to-be$/);

  // Progress persists across a reload.
  await page.goto('/progress');
  await page.reload();
  // 35 XP (exercise) + 20 XP (lesson)
  await expect(page.getByRole('main').getByText('Tổng XP', { exact: true }).locator('..')).toContainText('55');
});

test('vocabulary can be saved and reviewed with flashcards', async ({ page }) => {
  await onboard(page);
  await page.goto('/vocabulary');
  await page.getByRole('searchbox', { name: 'Tìm từ vựng' }).fill('deadline');
  await expect(page.getByText('1 kết quả')).toBeVisible();
  await page.getByRole('button', { name: 'Lưu để ôn tập' }).click();
  await expect(page.getByRole('tab', { name: /Đã lưu/ })).toContainText('1');

  await page.goto('/vocabulary/review');
  await expect(page.getByText('deadline')).toBeVisible();
  await page.getByRole('button', { name: 'Hiện nghĩa' }).click();
  await expect(page.getByText('hạn chót', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Nhớ Ổn' }).click();
  await expect(page.getByText('Bạn đã ôn 1 từ!')).toBeVisible();
});

test('deep links work after onboarding and unknown routes show 404', async ({ page }) => {
  await onboard(page);
  await page.goto('/modules/b1-dev-teamwork');
  await expect(page.getByRole('heading', { name: /Tiếng Anh cho lập trình viên/ })).toBeVisible();
  await page.goto('/this-page-does-not-exist');
  await expect(page.getByText('Không tìm thấy trang')).toBeVisible();
});

test('grammar index links to a reference page with practice', async ({ page }) => {
  await onboard(page);
  await page.goto('/grammar');
  await page.getByRole('searchbox', { name: 'Tìm chủ điểm ngữ pháp' }).fill('so sánh');
  await page.getByRole('link', { name: /So sánh hơn/ }).click();
  await expect(page).toHaveURL(/\/grammar\/g-comparatives$/);
  await expect(page.getByRole('heading', { level: 1, name: 'So sánh hơn' })).toBeVisible();
  await page.getByRole('link', { name: 'Luyện tập chủ điểm này' }).click();
  await expect(page).toHaveURL(/\/practice\/ex-a2-comparatives$/);
  await expect(page.getByRole('button', { name: 'Kiểm tra' })).toBeDisabled();
});

test('placement test produces an estimate and is saved to history', async ({ page }) => {
  await onboard(page);
  await page.getByRole('link', { name: /Chưa chắc trình độ của mình/ }).click();
  await expect(page.getByRole('heading', { name: 'Bài kiểm tra xếp lớp' })).toBeVisible();
  await page.getByRole('button', { name: 'Bắt đầu' }).click();

  // First question answered, the rest skipped with "I don't know".
  await page.getByRole('radio', { name: /hungry/ }).click();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  for (let i = 0; i < 23; i++) await page.getByRole('button', { name: 'Tôi không biết' }).click();

  await expect(page.getByText('Trình độ ước lượng')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'A1' })).toBeVisible();
  await expect(page.getByText('1/24 câu đúng · 4%')).toBeVisible();
  await expect(page.getByText(/không phải chứng chỉ CEFR chính thức/)).toBeVisible();

  await page.goto('/assessments');
  await expect(page.getByText('4%')).toBeVisible();
  // The dashboard prompt disappears once there is a result.
  await page.goto('/dashboard');
  await expect(page.getByRole('link', { name: /Chưa chắc trình độ của mình/ })).toHaveCount(0);
});

test('listening activity: questions return to the activity', async ({ page }) => {
  await onboard(page);
  await page.goto('/practice');
  await page.getByRole('link', { name: /Nghe/ }).first().click();
  await expect(page).toHaveURL(/\/listening$/);
  await page.getByRole('link', { name: /Ở quán cà phê/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Ở quán cà phê' })).toBeVisible();
  await page.getByRole('link', { name: 'Trả lời câu hỏi' }).click();
  await page.getByRole('radio', { name: /iced coffee with milk and a croissant/ }).click();
  await page.getByRole('button', { name: 'Kiểm tra' }).click();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await page.getByRole('radio', { name: /65,000/ }).click();
  await page.getByRole('button', { name: 'Kiểm tra' }).click();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await page.getByRole('radio', { name: /False/ }).click();
  await page.getByRole('button', { name: 'Kiểm tra' }).click();
  await page.getByRole('button', { name: 'Xem kết quả' }).click();
  await expect(page.getByText('100%')).toBeVisible();
  await page.getByRole('link', { name: 'Quay lại bài luyện' }).click();
  await expect(page).toHaveURL(/\/listening\/listen-a1-cafe$/);
});

test('writing activity gives rule-based feedback and saves journal entries', async ({ page }) => {
  await onboard(page);
  await page.goto('/writing/write-a2-journal');
  await page.getByLabel('Bài viết của bạn').fill('today i go to the office and i am agree with my manager about the informations we discussed about yesterday at work');
  await page.getByRole('button', { name: 'Kiểm tra bài viết' }).click();
  await expect(page.getByText('Đại từ "I" luôn viết hoa.')).toBeVisible();
  await expect(page.getByText('"Discuss" không đi với "about".')).toBeVisible();
  await expect(page.getByText(/Không thay thế được nhận xét của giáo viên/)).toBeVisible();
  await page.getByRole('button', { name: 'Lưu vào nhật ký' }).click();
  await expect(page.getByRole('heading', { name: 'Nhật ký của bạn (1)' })).toBeVisible();
});

test('speaking activity works with typed answers when speech recognition is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    // Simulate a browser without the Web Speech recognition API.
    Object.defineProperty(window, 'webkitSpeechRecognition', { value: undefined, configurable: true });
    Object.defineProperty(window, 'SpeechRecognition', { value: undefined, configurable: true });
  });
  await onboard(page);
  await page.goto('/speaking/speak-a1-introduce');
  await expect(page.getByText('Trình duyệt này chưa hỗ trợ nhận dạng giọng nói.', { exact: false })).toBeVisible();
  await page.getByLabel('Gõ câu trả lời').fill("Hi Anna, I'm Lan. Nice to meet you.");
  await page.getByRole('button', { name: 'Kiểm tra câu trả lời' }).click();
  await expect(page.getByText(/Mức khớp nội dung với câu gợi ý/)).toBeVisible();
  await expect(page.getByText("Hi Anna, I'm Minh. Nice to meet you.")).toBeVisible();
  await page.getByRole('button', { name: 'Câu tiếp theo' }).click();
  await expect(page.getByText('Where are you from?', { exact: false })).toBeVisible();
});

test('progress lives in IndexedDB and the app keeps working offline', async ({ page, context }) => {
  await onboard(page, 'Hoa');
  // Saved by the IndexedDB storage, not localStorage.
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<boolean>((resolve) => {
            const open = indexedDB.open('english-mastery');
            open.onsuccess = () => {
              const get = open.result.transaction('kv').objectStore('kv').get('em-progress');
              get.onsuccess = () => resolve(typeof get.result?.value === 'string' && get.result.value.includes('Hoa'));
              get.onerror = () => resolve(false);
            };
            open.onerror = () => resolve(false);
          }),
      ),
    )
    .toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('em-progress'))).toBeNull();

  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Dữ liệu ngoại tuyến' })).toBeVisible();
  await expect(page.getByText(/Tiến độ được lưu bằng IndexedDB/)).toBeVisible();
  await expectNoHorizontalOverflow(page);

  // Once the service worker controls the page, the app shell, lessons and progress load offline.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  await page.goto('/lessons/l-a1-to-be');
  await expect(page.getByText(/Bạn đang ngoại tuyến/)).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: /Hoa/ })).toBeVisible();
  await context.setOffline(false);
});

test('AI tutor shows an honest state when it cannot be used', async ({ page }) => {
  await onboard(page);
  await page.goto('/practice');
  await page.getByRole('link', { name: /Gia sư AI/ }).click();
  await expect(page).toHaveURL(/\/tutor$/);
  // Guest (and, in this build, no deployed/configured AI): never a chat box that cannot work.
  await expect(
    page.getByRole('heading', { name: /Gia sư AI chưa được bật|Không kết nối được gia sư AI|Gia sư AI cần máy chủ|Đăng nhập để dùng gia sư AI/ }),
  ).toBeVisible();
  await expect(page.getByLabel('Tin nhắn cho gia sư')).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});
