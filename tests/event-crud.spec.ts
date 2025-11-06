import { test, expect } from '@playwright/test';

test.describe('기본 일정 관리 워크플로우', () => {
  const baseURL = 'http://localhost:5173';

  test.beforeEach(async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForSelector('[data-testid="event-submit-button"]', { state: 'visible' });
  });

  test('Create: 새 일정을 생성할 수 있다', async ({ page }) => {
    // Given: 폼이 표시되어 있음
    await expect(page.getByRole('heading', { name: '일정 추가' })).toBeVisible();

    // When: 일정 정보를 입력하고 저장
    const testEventTitle = `테스트 일정 ${Date.now()}`;
    const testDate = new Date().toISOString().split('T')[0];
    const testStartTime = '10:00';
    const testEndTime = '11:00';

    await page.locator('#title').fill(testEventTitle);
    await page.locator('#date').fill(testDate);
    await page.locator('#start-time').fill(testStartTime);
    await page.locator('#end-time').fill(testEndTime);
    await page.getByTestId('event-submit-button').click();

    // Then: 성공 메시지가 표시됨
    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();
  });

  test('Read: 생성된 일정을 조회할 수 있다', async ({ page }) => {
    // Given: 일정 리스트가 표시되어 있음
    const eventList = page.getByTestId('event-list');
    await expect(eventList).toBeVisible();

    // When: 일정 리스트를 확인
    const emptyMessage = eventList.getByText('검색 결과가 없습니다.');
    const isEmpty = await emptyMessage.isVisible().catch(() => false);

    // Then: 일정이 있는 경우 일정 정보가 표시되고, 없는 경우 적절한 메시지가 표시됨
    if (isEmpty) {
      await expect(emptyMessage).toBeVisible();
    } else {
      const editButtons = eventList.getByRole('button', { name: 'Edit event' });
      const editButtonCount = await editButtons.count().catch(() => 0);
      expect(editButtonCount).toBeGreaterThan(0);
    }
  });

  // test('Update: 기존 일정을 수정할 수 있다', async ({ page }) => {
  //   // Given: 일정 리스트가 표시되어 있고 일정이 존재함
  //   const eventList = page.getByTestId('event-list');
  //   await expect(eventList).toBeVisible();

  //   const emptyMessage = eventList.getByText('검색 결과가 없습니다.');
  //   const isEmpty = await emptyMessage.isVisible().catch(() => false);
  //   if (isEmpty) {
  //     throw new Error('수정할 일정이 없습니다. 일정을 먼저 생성해주세요.');
  //   }

  //   const allEditButtons = eventList.getByRole('button', { name: 'Edit event' });
  //   const editButtonCount = await allEditButtons.count();

  //   if (editButtonCount === 0) {
  //     throw new Error('수정할 일정이 없습니다. 일정을 먼저 생성해주세요.');
  //   }

  //   let nonRepeatingEditButton: ReturnType<typeof allEditButtons.nth> | null = null;
  //   for (let i = 0; i < editButtonCount; i++) {
  //     const editButton = allEditButtons.nth(i);
  //     const eventItem = editButton.locator('..').locator('..').locator('..');
  //     const hasRepeatText = await eventItem
  //       .getByText(/^반복:/)
  //       .isVisible()
  //       .catch(() => false);

  //     if (!hasRepeatText) {
  //       nonRepeatingEditButton = editButton;
  //       break;
  //     }
  //   }

  //   if (!nonRepeatingEditButton) {
  //     throw new Error(
  //       '반복 일정이 아닌 일정이 없습니다. 반복 일정이 아닌 일정을 먼저 생성해주세요.'
  //     );
  //   }

  //   await expect(nonRepeatingEditButton).toBeVisible();

  //   // When: 일정 편집 버튼 클릭
  //   await nonRepeatingEditButton.click();

  //   // Then: 폼이 수정 모드로 변경됨
  //   await expect(page.getByText('일정 수정')).toBeVisible();

  //   const originalTitle = await page.locator('#title').inputValue();
  //   const updatedTitle = `수정된 일정 ${Date.now()}`;
  //   await page.locator('#title').fill(updatedTitle);
  //   await page.getByTestId('event-submit-button').click();

  //   // Then: 수정 성공 메시지가 표시되고 일정이 업데이트됨
  //   await expect(page.getByText('일정이 수정되었습니다')).toBeVisible();
  //   await expect(eventList.getByText(updatedTitle)).toBeVisible();
  //   if (originalTitle) {
  //     await expect(eventList.getByText(originalTitle)).not.toBeVisible();
  //   }
  // });

  // test('Delete: 일정을 삭제할 수 있다', async ({ page }) => {
  //   // Given: 일정 리스트가 표시되어 있고 일정이 존재함
  //   const eventList = page.getByTestId('event-list');
  //   await expect(eventList).toBeVisible();

  //   const emptyMessage = eventList.getByText('검색 결과가 없습니다.');
  //   const isEmpty = await emptyMessage.isVisible().catch(() => false);
  //   if (isEmpty) {
  //     throw new Error('삭제할 일정이 없습니다. 일정을 먼저 생성해주세요.');
  //   }

  //   const firstDeleteButton = eventList.getByRole('button', { name: 'Delete event' }).first();
  //   await expect(firstDeleteButton).toBeVisible();

  //   const eventItem = firstDeleteButton.locator('..').locator('..').locator('..');
  //   const titleElement = eventItem.locator('p, span, div').filter({ hasText: /.+/ }).first();
  //   const eventTitle = (await titleElement.textContent()) || '';

  //   if (eventTitle) {
  //     await expect(eventList.getByText(eventTitle)).toBeVisible();
  //   }

  //   // When: 삭제 버튼 클릭
  //   await firstDeleteButton.click();

  //   // Then: 삭제 성공 메시지가 표시되고 일정이 리스트에서 사라짐
  //   await expect(page.getByText('일정이 삭제되었습니다')).toBeVisible();
  //   if (eventTitle) {
  //     await expect(eventList.getByText(eventTitle)).not.toBeVisible();
  //   }
  // });

  test('Create: 필수 필드 없이 일정을 생성할 수 없다', async ({ page }) => {
    // Given: 폼이 표시되어 있음
    await expect(page.getByRole('heading', { name: '일정 추가' })).toBeVisible();

    // When: 필수 필드 없이 저장 버튼 클릭
    await page.getByTestId('event-submit-button').click();

    // Then: 에러 메시지가 표시됨
    await expect(page.getByText('필수 정보를 모두 입력해주세요.')).toBeVisible();
  });

  test('Create: 시작 시간이 종료 시간보다 늦으면 일정을 생성할 수 없다', async ({ page }) => {
    // Given: 폼이 표시되어 있음
    await expect(page.getByRole('heading', { name: '일정 추가' })).toBeVisible();

    // When: 시작 시간이 종료 시간보다 늦게 입력
    await page.locator('#title').fill('잘못된 시간 테스트');
    await page.locator('#date').fill('2025-01-20');

    const startTimeInput = page.locator('#start-time');
    await startTimeInput.waitFor({ state: 'visible' });
    await startTimeInput.fill('15:00');
    await expect(startTimeInput).toHaveValue('15:00');

    const endTimeInput = page.locator('#end-time');
    await endTimeInput.waitFor({ state: 'visible' });
    await endTimeInput.fill('14:00');
    await expect(endTimeInput).toHaveValue('14:00');

    await page.getByTestId('event-submit-button').click();

    // Then: 에러 메시지가 표시됨
    await expect(page.getByText('시간 설정을 확인해주세요.')).toBeVisible();
  });
});
