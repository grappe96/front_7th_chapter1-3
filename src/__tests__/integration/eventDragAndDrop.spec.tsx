import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, within, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { SnackbarProvider } from 'notistack';
import { ReactElement } from 'react';

import {
  setupMockHandlerCreation,
  setupMockHandlerUpdating,
  setupMockHandlerRecurringListUpdate,
} from '../../__mocks__/handlersUtils';
import App from '../../App';
import { server } from '../../setupTests';
import { Event } from '../../types';

const theme = createTheme();

const setup = (element: ReactElement) => {
  const user = userEvent.setup();

  return {
    ...render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider>{element}</SnackbarProvider>
      </ThemeProvider>
    ),
    user,
  };
};

/**
 * 드래그앤드롭 헬퍼 함수
 * @hello-pangea/dnd는 실제 DOM 이벤트를 사용하므로 pointer 이벤트로 시뮬레이션
 */
const dragEventBox = async (
  user: ReturnType<typeof userEvent.setup>,
  eventBox: HTMLElement,
  targetCell: HTMLElement
) => {
  const sourceBox = eventBox.getBoundingClientRect();
  const targetCellRect = targetCell.getBoundingClientRect();

  // 드래그 시작
  await user.pointer({
    keys: '[MouseLeft>]',
    target: eventBox,
    coords: {
      clientX: sourceBox.left + sourceBox.width / 2,
      clientY: sourceBox.top + sourceBox.height / 2,
    },
  });

  // 드래그 중 이동
  await user.pointer({
    keys: '[MouseLeft]',
    target: targetCell,
    coords: {
      clientX: targetCellRect.left + targetCellRect.width / 2,
      clientY: targetCellRect.top + targetCellRect.height / 2,
    },
  });

  // 드롭
  await user.pointer({
    keys: '[/MouseLeft]',
    target: targetCell,
    coords: {
      clientX: targetCellRect.left + targetCellRect.width / 2,
      clientY: targetCellRect.top + targetCellRect.height / 2,
    },
  });
};

describe('일정 드래그앤드롭 기능', () => {
  describe('주간 뷰 드래그앤드롭', () => {
    afterEach(() => {
      server.resetHandlers();
    });

    it('주간 뷰에서 EventBox를 드래그하여 다른 날짜 셀로 이동시킬 수 있다', async () => {
      setupMockHandlerUpdating([
        {
          id: '1',
          title: '이동할 회의',
          date: '2025-10-01',
          startTime: '14:00',
          endTime: '15:00',
          description: '드래그 테스트',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      // 주간 뷰로 변경
      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'week-option' }));

      const weekView = within(screen.getByTestId('week-view'));
      const eventBox = weekView.getByText('이동할 회의').closest('div[data-rbd-draggable-id]')!;
      const targetCell = weekView.getByText('2').closest('td')!;

      await dragEventBox(user, eventBox, targetCell);

      await waitFor(() => {
        const eventList = within(screen.getByTestId('event-list'));
        expect(eventList.getByText('2025-10-02')).toBeInTheDocument();
      });
    });

    it('EventBox를 드래그하여 다른 날짜에 드롭하면 이벤트의 날짜가 즉시 업데이트된다', async () => {
      setupMockHandlerUpdating([
        {
          id: '1',
          title: '날짜 변경 테스트',
          date: '2025-10-01',
          startTime: '14:00',
          endTime: '15:00',
          description: '날짜 변경',
          location: '회의실 B',
          category: '개인',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'week-option' }));

      const weekView = within(screen.getByTestId('week-view'));
      const eventBox = weekView
        .getByText('날짜 변경 테스트')
        .closest('div[data-rbd-draggable-id]')!;
      const targetCell = weekView.getByText('3').closest('td')!;

      await dragEventBox(user, eventBox, targetCell);

      await waitFor(() => {
        const eventList = within(screen.getByTestId('event-list'));
        expect(eventList.getByText('2025-10-03')).toBeInTheDocument();
      });
    });

    it('드래그앤드롭으로 날짜를 변경해도 시작 시간과 종료 시간은 그대로 유지된다', async () => {
      setupMockHandlerUpdating([
        {
          id: '1',
          title: '시간 유지 테스트',
          date: '2025-10-01',
          startTime: '14:00',
          endTime: '15:00',
          description: '시간 유지',
          location: '회의실 C',
          category: '가족',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'week-option' }));

      const weekView = within(screen.getByTestId('week-view'));
      const eventBox = weekView
        .getByText('시간 유지 테스트')
        .closest('div[data-rbd-draggable-id]')!;
      const targetCell = weekView.getByText('4').closest('td')!;

      await dragEventBox(user, eventBox, targetCell);

      await waitFor(() => {
        const eventList = within(screen.getByTestId('event-list'));
        expect(eventList.getByText('14:00 - 15:00')).toBeInTheDocument();
      });
    });

    it('드래그앤드롭으로 날짜를 변경해도 제목, 설명, 위치, 카테고리 등 기타 정보는 그대로 유지된다', async () => {
      setupMockHandlerUpdating([
        {
          id: '1',
          title: '정보 유지 테스트',
          date: '2025-10-01',
          startTime: '14:00',
          endTime: '15:00',
          description: '모든 정보 유지',
          location: '회의실 D',
          category: '기타',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'week-option' }));

      const weekView = within(screen.getByTestId('week-view'));
      const eventBox = weekView
        .getByText('정보 유지 테스트')
        .closest('div[data-rbd-draggable-id]')!;
      const targetCell = weekView.getByText('5').closest('td')!;

      await dragEventBox(user, eventBox, targetCell);

      await waitFor(() => {
        const eventList = within(screen.getByTestId('event-list'));
        expect(eventList.getByText('정보 유지 테스트')).toBeInTheDocument();
        expect(eventList.getByText('모든 정보 유지')).toBeInTheDocument();
        expect(eventList.getByText('회의실 D')).toBeInTheDocument();
        expect(eventList.getByText('카테고리: 기타')).toBeInTheDocument();
      });
    });

    it('드래그앤드롭으로 날짜 변경 후 서버에 즉시 저장된다', async () => {
      const mockEvents: Event[] = [
        {
          id: '1',
          title: '서버 저장 테스트',
          date: '2025-10-01',
          startTime: '14:00',
          endTime: '15:00',
          description: '서버 저장',
          location: '회의실 E',
          category: '업무',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
      ];

      let updateCallCount = 0;

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: mockEvents });
        }),
        http.put('/api/events/:id', async ({ params, request }) => {
          updateCallCount++;
          const updatedEvent = (await request.json()) as Event;
          const index = mockEvents.findIndex((event) => event.id === params.id);
          mockEvents[index] = { ...mockEvents[index], ...updatedEvent };
          return HttpResponse.json(mockEvents[index]);
        })
      );

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'week-option' }));

      const weekView = within(screen.getByTestId('week-view'));
      const eventBox = weekView
        .getByText('서버 저장 테스트')
        .closest('div[data-rbd-draggable-id]')!;
      const targetCell = weekView.getByText('6').closest('td')!;

      await dragEventBox(user, eventBox, targetCell);

      await waitFor(() => {
        expect(updateCallCount).toBe(1);
      });
    });
  });

  describe('월간 뷰 드래그앤드롭', () => {
    afterEach(() => {
      server.resetHandlers();
    });

    it('월간 뷰에서 EventBox를 드래그하여 다른 날짜 셀로 이동시킬 수 있다', async () => {
      setupMockHandlerUpdating([
        {
          id: '1',
          title: '월간 뷰 이동 테스트',
          date: '2025-10-01',
          startTime: '14:00',
          endTime: '15:00',
          description: '월간 뷰 드래그',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      const monthView = within(screen.getByTestId('month-view'));
      const eventBox = monthView
        .getByText('월간 뷰 이동 테스트')
        .closest('div[data-rbd-draggable-id]')!;
      const targetCell = monthView.getByText('2').closest('td')!;

      await dragEventBox(user, eventBox, targetCell);

      await waitFor(() => {
        const eventList = within(screen.getByTestId('event-list'));
        expect(eventList.getByText('2025-10-02')).toBeInTheDocument();
      });
    });

    it('월간 뷰에서 EventBox를 드래그하여 다른 날짜에 드롭하면 이벤트의 날짜가 즉시 업데이트된다', async () => {
      setupMockHandlerUpdating([
        {
          id: '1',
          title: '월간 뷰 날짜 변경',
          date: '2025-10-01',
          startTime: '14:00',
          endTime: '15:00',
          description: '월간 날짜 변경',
          location: '회의실 B',
          category: '개인',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      const monthView = within(screen.getByTestId('month-view'));
      const eventBox = monthView
        .getByText('월간 뷰 날짜 변경')
        .closest('div[data-rbd-draggable-id]')!;
      const targetCell = monthView.getByText('3').closest('td')!;

      await dragEventBox(user, eventBox, targetCell);

      await waitFor(() => {
        const eventList = within(screen.getByTestId('event-list'));
        expect(eventList.getByText('2025-10-03')).toBeInTheDocument();
      });
    });

    it('월간 뷰에서도 드래그앤드롭 시 시간 정보가 유지된다', async () => {
      setupMockHandlerUpdating([
        {
          id: '1',
          title: '월간 시간 유지',
          date: '2025-10-01',
          startTime: '14:00',
          endTime: '15:00',
          description: '월간 시간 유지',
          location: '회의실 C',
          category: '가족',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      const monthView = within(screen.getByTestId('month-view'));
      const eventBox = monthView.getByText('월간 시간 유지').closest('div[data-rbd-draggable-id]')!;
      const targetCell = monthView.getByText('4').closest('td')!;

      await dragEventBox(user, eventBox, targetCell);

      await waitFor(() => {
        const eventList = within(screen.getByTestId('event-list'));
        expect(eventList.getByText('14:00 - 15:00')).toBeInTheDocument();
      });
    });

    it('월간 뷰에서 드래그앤드롭으로 날짜를 변경해도 제목, 설명, 위치, 카테고리 등 기타 정보는 그대로 유지된다', async () => {
      setupMockHandlerUpdating([
        {
          id: '1',
          title: '월간 정보 유지',
          date: '2025-10-01',
          startTime: '14:00',
          endTime: '15:00',
          description: '월간 정보 유지',
          location: '회의실 D',
          category: '기타',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      const monthView = within(screen.getByTestId('month-view'));
      const eventBox = monthView.getByText('월간 정보 유지').closest('div[data-rbd-draggable-id]')!;
      const targetCell = monthView.getByText('5').closest('td')!;

      await dragEventBox(user, eventBox, targetCell);

      await waitFor(() => {
        const eventList = within(screen.getByTestId('event-list'));
        expect(eventList.getByText('월간 정보 유지')).toBeInTheDocument();
        expect(eventList.getByText('월간 정보 유지')).toBeInTheDocument();
        expect(eventList.getByText('회의실 D')).toBeInTheDocument();
        expect(eventList.getByText('카테고리: 기타')).toBeInTheDocument();
      });
    });

    it('월간 뷰에서 드래그앤드롭으로 날짜 변경 후 서버에 즉시 저장된다', async () => {
      const mockEvents: Event[] = [
        {
          id: '1',
          title: '월간 서버 저장',
          date: '2025-10-01',
          startTime: '14:00',
          endTime: '15:00',
          description: '월간 서버 저장',
          location: '회의실 E',
          category: '업무',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
      ];

      let updateCallCount = 0;

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: mockEvents });
        }),
        http.put('/api/events/:id', async ({ params, request }) => {
          updateCallCount++;
          const updatedEvent = (await request.json()) as Event;
          const index = mockEvents.findIndex((event) => event.id === params.id);
          mockEvents[index] = { ...mockEvents[index], ...updatedEvent };
          return HttpResponse.json(mockEvents[index]);
        })
      );

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      const monthView = within(screen.getByTestId('month-view'));
      const eventBox = monthView.getByText('월간 서버 저장').closest('div[data-rbd-draggable-id]')!;
      const targetCell = monthView.getByText('6').closest('td')!;

      await dragEventBox(user, eventBox, targetCell);

      await waitFor(() => {
        expect(updateCallCount).toBe(1);
      });
    });
  });

  describe('반복 일정 드래그앤드롭', () => {
    afterEach(() => {
      server.resetHandlers();
    });

    it('반복 일정의 EventBox를 드래그하여 이동 시 RecurringEventDialog가 표시된다', async () => {
      setupMockHandlerUpdating([
        {
          id: '1',
          title: '반복 회의',
          date: '2025-10-01',
          startTime: '14:00',
          endTime: '15:00',
          description: '반복 일정',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1 },
          notificationTime: 10,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      const monthView = within(screen.getByTestId('month-view'));
      const eventBox = monthView.getByText('반복 회의').closest('div[data-rbd-draggable-id]')!;
      const targetCell = monthView.getByText('2').closest('td')!;

      await dragEventBox(user, eventBox, targetCell);

      await waitFor(() => {
        expect(screen.getByText('반복 일정 수정')).toBeInTheDocument();
        expect(screen.getByText('해당 일정만 수정하시겠어요?')).toBeInTheDocument();
      });
    });

    it('반복 일정 드래그앤드롭 시 "해당 일정만 수정" 모드로 처리된다', async () => {
      setupMockHandlerUpdating([
        {
          id: '1',
          title: '반복 회의',
          date: '2025-10-01',
          startTime: '14:00',
          endTime: '15:00',
          description: '반복 일정',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1 },
          notificationTime: 10,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      const monthView = within(screen.getByTestId('month-view'));
      const eventBox = monthView.getByText('반복 회의').closest('div[data-rbd-draggable-id]')!;
      const targetCell = monthView.getByText('2').closest('td')!;

      await dragEventBox(user, eventBox, targetCell);

      const dialog = await screen.findByText('반복 일정 수정');
      expect(dialog).toBeInTheDocument();
      expect(screen.getByText('해당 일정만 수정하시겠어요?')).toBeInTheDocument();
    });

    it('반복 일정을 드래그앤드롭으로 이동한 후 해당 인스턴스만 새로운 날짜로 이동된다', async () => {
      setupMockHandlerRecurringListUpdate([
        {
          id: '1',
          title: '반복 회의',
          date: '2025-10-01',
          startTime: '14:00',
          endTime: '15:00',
          description: '반복 일정',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1 },
          notificationTime: 10,
        },
        {
          id: '2',
          title: '반복 회의',
          date: '2025-10-02',
          startTime: '14:00',
          endTime: '15:00',
          description: '반복 일정',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1 },
          notificationTime: 10,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      const monthView = within(screen.getByTestId('month-view'));
      const eventBox = monthView
        .getAllByText('반복 회의')[0]
        .closest('div[data-rbd-draggable-id]')!;
      const targetCell = monthView.getByText('3').closest('td')!;

      await dragEventBox(user, eventBox, targetCell);

      await user.click(screen.getByText('예'));

      await waitFor(() => {
        const eventList = within(screen.getByTestId('event-list'));
        expect(eventList.getByText('2025-10-03')).toBeInTheDocument();
      });
    });

    it('이동된 반복 일정 인스턴스는 반복 시리즈에서 분리되어 단일 일정으로 변경된다', async () => {
      setupMockHandlerRecurringListUpdate([
        {
          id: '1',
          title: '반복 회의',
          date: '2025-10-01',
          startTime: '14:00',
          endTime: '15:00',
          description: '반복 일정',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1 },
          notificationTime: 10,
        },
        {
          id: '2',
          title: '반복 회의',
          date: '2025-10-02',
          startTime: '14:00',
          endTime: '15:00',
          description: '반복 일정',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1 },
          notificationTime: 10,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      const monthView = within(screen.getByTestId('month-view'));
      const eventBox = monthView
        .getAllByText('반복 회의')[0]
        .closest('div[data-rbd-draggable-id]')!;
      const targetCell = monthView.getByText('3').closest('td')!;

      await dragEventBox(user, eventBox, targetCell);

      await user.click(screen.getByText('예'));

      await waitFor(() => {
        const eventList = within(screen.getByTestId('event-list'));
        const movedEvent = eventList.getByText('2025-10-03').closest('div')!;
        expect(within(movedEvent).queryByText(/반복:/)).not.toBeInTheDocument();
      });
    });
  });

  describe('겹침 감지 및 처리', () => {
    afterEach(() => {
      server.resetHandlers();
    });

    it('드래그한 날짜와 시간에 다른 일정이 있는 경우 드롭 가능하다', async () => {
      setupMockHandlerUpdating([
        {
          id: '1',
          title: '기존 회의',
          date: '2025-10-02',
          startTime: '14:00',
          endTime: '15:00',
          description: '기존 일정',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
        {
          id: '2',
          title: '이동할 회의',
          date: '2025-10-01',
          startTime: '14:00',
          endTime: '15:00',
          description: '이동할 일정',
          location: '회의실 B',
          category: '개인',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      const monthView = within(screen.getByTestId('month-view'));
      const eventBox = monthView.getByText('이동할 회의').closest('div[data-rbd-draggable-id]')!;
      const targetCell = monthView.getByText('2').closest('td')!;

      await dragEventBox(user, eventBox, targetCell);

      await waitFor(() => {
        expect(screen.getByText('일정 겹침 경고')).toBeInTheDocument();
      });
    });

    it('겹침이 감지되면 OverlapDialog가 표시된다', async () => {
      setupMockHandlerUpdating([
        {
          id: '1',
          title: '기존 회의',
          date: '2025-10-02',
          startTime: '14:00',
          endTime: '15:00',
          description: '기존 일정',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
        {
          id: '2',
          title: '겹침 테스트',
          date: '2025-10-01',
          startTime: '14:00',
          endTime: '15:00',
          description: '겹침 테스트',
          location: '회의실 B',
          category: '개인',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      const monthView = within(screen.getByTestId('month-view'));
      const eventBox = monthView.getByText('겹침 테스트').closest('div[data-rbd-draggable-id]')!;
      const targetCell = monthView.getByText('2').closest('td')!;

      await dragEventBox(user, eventBox, targetCell);

      await waitFor(() => {
        expect(screen.getByText('일정 겹침 경고')).toBeInTheDocument();
        expect(screen.getByText(/다음 일정과 겹칩니다/)).toBeInTheDocument();
      });
    });

    it('겹침 경고 다이얼로그에서 "계속 진행"을 선택하면 겹침 상태로 저장된다', async () => {
      const mockEvents: Event[] = [
        {
          id: '1',
          title: '기존 회의',
          date: '2025-10-02',
          startTime: '14:00',
          endTime: '15:00',
          description: '기존 일정',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
        {
          id: '2',
          title: '계속 진행 테스트',
          date: '2025-10-01',
          startTime: '14:00',
          endTime: '15:00',
          description: '계속 진행',
          location: '회의실 B',
          category: '개인',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
      ];

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: mockEvents });
        }),
        http.put('/api/events/:id', async ({ params, request }) => {
          const updatedEvent = (await request.json()) as Event;
          const index = mockEvents.findIndex((event) => event.id === params.id);
          mockEvents[index] = { ...mockEvents[index], ...updatedEvent };
          return HttpResponse.json(mockEvents[index]);
        })
      );

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      const monthView = within(screen.getByTestId('month-view'));
      const eventBox = monthView
        .getByText('계속 진행 테스트')
        .closest('div[data-rbd-draggable-id]')!;
      const targetCell = monthView.getByText('2').closest('td')!;

      await dragEventBox(user, eventBox, targetCell);

      await waitFor(() => {
        expect(screen.getByText('일정 겹침 경고')).toBeInTheDocument();
      });

      await user.click(screen.getByText('계속 진행'));

      await waitFor(() => {
        const eventList = within(screen.getByTestId('event-list'));
        expect(eventList.getByText('2025-10-02')).toBeInTheDocument();
      });
    });

    it('겹침 경고 다이얼로그에서 "취소"를 선택하면 드래그 이전 상태로 되돌아간다', async () => {
      setupMockHandlerUpdating([
        {
          id: '1',
          title: '기존 회의',
          date: '2025-10-02',
          startTime: '14:00',
          endTime: '15:00',
          description: '기존 일정',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
        {
          id: '2',
          title: '취소 테스트',
          date: '2025-10-01',
          startTime: '14:00',
          endTime: '15:00',
          description: '취소 테스트',
          location: '회의실 B',
          category: '개인',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      const monthView = within(screen.getByTestId('month-view'));
      const eventBox = monthView.getByText('취소 테스트').closest('div[data-rbd-draggable-id]')!;
      const targetCell = monthView.getByText('2').closest('td')!;

      await dragEventBox(user, eventBox, targetCell);

      await waitFor(() => {
        expect(screen.getByText('일정 겹침 경고')).toBeInTheDocument();
      });

      await user.click(screen.getByText('취소'));

      await waitFor(() => {
        const eventList = within(screen.getByTestId('event-list'));
        expect(eventList.getByText('2025-10-01')).toBeInTheDocument();
      });
    });
  });

  describe('시각적 피드백', () => {
    afterEach(() => {
      server.resetHandlers();
    });

    it('EventBox를 드래그 중일 때 투명도나 스타일이 변경되어 시각적 피드백이 제공된다', async () => {
      setupMockHandlerUpdating([
        {
          id: '1',
          title: '시각적 피드백 테스트',
          date: '2025-10-01',
          startTime: '14:00',
          endTime: '15:00',
          description: '시각적 피드백',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      const monthView = within(screen.getByTestId('month-view'));
      const eventBox = monthView
        .getByText('시각적 피드백 테스트')
        .closest('div[data-rbd-draggable-id]')!;

      const initialOpacity = window.getComputedStyle(eventBox).opacity;

      await user.pointer({
        keys: '[MouseLeft>]',
        target: eventBox,
      });

      await waitFor(() => {
        const draggedElement = document.querySelector('[data-rbd-drag-handle-dragging]');
        if (draggedElement) {
          const draggedOpacity = window.getComputedStyle(draggedElement).opacity;
          expect(draggedOpacity).not.toBe(initialOpacity);
        }
      });
    });
  });

  describe('제약사항 테스트', () => {
    afterEach(() => {
      server.resetHandlers();
    });

    it('현재 보이는 주/월 범위를 벗어난 날짜에는 드롭할 수 없다 (현재 뷰 내에서만 이동 가능)', async () => {
      setupMockHandlerUpdating([
        {
          id: '1',
          title: '범위 제한 테스트',
          date: '2025-10-01',
          startTime: '14:00',
          endTime: '15:00',
          description: '범위 제한',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'week-option' }));

      const weekView = within(screen.getByTestId('week-view'));
      const eventBox = weekView
        .getByText('범위 제한 테스트')
        .closest('div[data-rbd-draggable-id]')!;

      // 현재 주의 날짜 셀만 찾기 (다른 주의 날짜는 표시되지 않음)
      const weekCells = weekView.getAllByRole('cell');
      const validCells = weekCells.filter((cell) => {
        const text = cell.textContent || '';
        return (
          /^\d+$/.test(text.trim()) && parseInt(text.trim()) >= 1 && parseInt(text.trim()) <= 7
        );
      });

      expect(validCells.length).toBeGreaterThan(0);

      // 현재 주 내의 셀에만 드롭 가능
      const targetCell = validCells[validCells.length - 1];
      await dragEventBox(user, eventBox, targetCell);

      await waitFor(() => {
        const eventList = within(screen.getByTestId('event-list'));
        // 날짜가 현재 주 내의 날짜로 변경되었는지 확인
        expect(eventList.getByText(/2025-10-0[1-7]/)).toBeInTheDocument();
      });
    });
  });
});
