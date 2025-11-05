import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useSnackbar } from 'notistack';
import { useState } from 'react';

import CalendarView from './components/CalendarView.tsx';
import EventFormComponent from './components/EventForm.tsx';
import EventList from './components/EventList.tsx';
import NotificationStack from './components/NotificationStack.tsx';
import OverlapDialog from './components/OverlapDialog.tsx';
import RecurringEventDialog from './components/RecurringEventDialog.tsx';
import { useCalendarView } from './hooks/useCalendarView.ts';
import { useEventForm } from './hooks/useEventForm.ts';
import { useEventOperations } from './hooks/useEventOperations.ts';
import { useNotifications } from './hooks/useNotifications.ts';
import { useRecurringEventOperations } from './hooks/useRecurringEventOperations.ts';
import { useSearch } from './hooks/useSearch.ts';
import { Event, EventForm } from './types.ts';
import { findOverlappingEvents } from './utils/eventOverlap.ts';

function App() {
  const {
    title,
    setTitle,
    date,
    setDate,
    startTime,
    endTime,
    description,
    setDescription,
    location,
    setLocation,
    category,
    setCategory,
    isRepeating,
    setIsRepeating,
    repeatType,
    setRepeatType,
    repeatInterval,
    setRepeatInterval,
    repeatEndDate,
    setRepeatEndDate,
    notificationTime,
    setNotificationTime,
    startTimeError,
    endTimeError,
    editingEvent,
    setEditingEvent,
    handleStartTimeChange,
    handleEndTimeChange,
    resetForm,
    editEvent,
  } = useEventForm();

  const { events, saveEvent, deleteEvent, createRepeatEvent, fetchEvents } = useEventOperations(
    Boolean(editingEvent),
    () => setEditingEvent(null)
  );

  const { handleRecurringEdit, handleRecurringDelete } = useRecurringEventOperations(
    events,
    async () => {
      // After recurring edit, refresh events from server
      await fetchEvents();
    }
  );

  const { notifications, notifiedEvents, setNotifications } = useNotifications(events);
  const { view, setView, currentDate, holidays, navigate } = useCalendarView();
  const { searchTerm, filteredEvents, setSearchTerm } = useSearch(events, currentDate, view);

  const [isOverlapDialogOpen, setIsOverlapDialogOpen] = useState(false);
  const [overlappingEvents, setOverlappingEvents] = useState<Event[]>([]);
  const [pendingDragEventData, setPendingDragEventData] = useState<
    (EventForm & { id?: string }) | null
  >(null);
  const [isRecurringDialogOpen, setIsRecurringDialogOpen] = useState(false);
  const [pendingRecurringEdit, setPendingRecurringEdit] = useState<Event | null>(null);
  const [pendingRecurringDelete, setPendingRecurringDelete] = useState<Event | null>(null);
  const [recurringEditMode, setRecurringEditMode] = useState<boolean | null>(null); // true = single, false = all
  const [recurringDialogMode, setRecurringDialogMode] = useState<'edit' | 'delete'>('edit');

  const { enqueueSnackbar } = useSnackbar();

  const handleRecurringConfirm = async (editSingleOnly: boolean) => {
    if (recurringDialogMode === 'edit' && pendingRecurringEdit) {
      setRecurringEditMode(editSingleOnly);

      // 드래그앤드롭으로 날짜가 변경된 경우
      if (date && date !== pendingRecurringEdit.date) {
        const updatedEvent: EventForm & { id?: string } = {
          id: pendingRecurringEdit.id,
          title: pendingRecurringEdit.title,
          date: date,
          startTime: pendingRecurringEdit.startTime,
          endTime: pendingRecurringEdit.endTime,
          description: pendingRecurringEdit.description,
          location: pendingRecurringEdit.location,
          category: pendingRecurringEdit.category,
          repeat: pendingRecurringEdit.repeat,
          notificationTime: pendingRecurringEdit.notificationTime,
        };

        if (editSingleOnly) {
          // 해당 인스턴스만 수정 (반복 시리즈에서 분리)
          await handleRecurringEdit(updatedEvent as Event, true);
        } else {
          // 모든 인스턴스 수정
          await handleRecurringEdit(updatedEvent as Event, false);
        }
        setDate('');
        setIsRecurringDialogOpen(false);
        setPendingRecurringEdit(null);
        return;
      }

      // 일반 편집 모드 저장하고 편집 폼으로 이동
      editEvent(pendingRecurringEdit);
      setIsRecurringDialogOpen(false);
      setPendingRecurringEdit(null);
    } else if (recurringDialogMode === 'delete' && pendingRecurringDelete) {
      // 반복 일정 삭제 처리
      try {
        await handleRecurringDelete(pendingRecurringDelete, editSingleOnly);
        enqueueSnackbar('일정이 삭제되었습니다', { variant: 'success' });
      } catch (error) {
        console.error(error);
        enqueueSnackbar('일정 삭제 실패', { variant: 'error' });
      }
      setIsRecurringDialogOpen(false);
      setPendingRecurringDelete(null);
    }
  };

  const isRecurringEvent = (event: Event): boolean => {
    return event.repeat.type !== 'none' && event.repeat.interval > 0;
  };

  const handleEditEvent = (event: Event) => {
    if (isRecurringEvent(event)) {
      // Show recurring edit dialog
      setPendingRecurringEdit(event);
      setRecurringDialogMode('edit');
      setIsRecurringDialogOpen(true);
    } else {
      // Regular event editing
      editEvent(event);
    }
  };

  const handleDeleteEvent = (event: Event) => {
    if (isRecurringEvent(event)) {
      // Show recurring delete dialog
      setPendingRecurringDelete(event);
      setRecurringDialogMode('delete');
      setIsRecurringDialogOpen(true);
    } else {
      // Regular event deletion
      deleteEvent(event.id);
    }
  };

  const addOrUpdateEvent = async () => {
    if (!title || !date || !startTime || !endTime) {
      enqueueSnackbar('필수 정보를 모두 입력해주세요.', { variant: 'error' });
      return;
    }

    if (startTimeError || endTimeError) {
      enqueueSnackbar('시간 설정을 확인해주세요.', { variant: 'error' });
      return;
    }

    const eventData: Event | EventForm = {
      id: editingEvent ? editingEvent.id : undefined,
      title,
      date,
      startTime,
      endTime,
      description,
      location,
      category,
      repeat: editingEvent
        ? editingEvent.repeat // Keep original repeat settings for recurring event detection
        : {
            type: isRepeating ? repeatType : 'none',
            interval: repeatInterval,
            endDate: repeatEndDate || undefined,
          },
      notificationTime,
    };

    const overlapping = findOverlappingEvents(eventData, events);
    const hasOverlapEvent = overlapping.length > 0;

    // 수정
    if (editingEvent) {
      if (hasOverlapEvent) {
        setOverlappingEvents(overlapping);
        setIsOverlapDialogOpen(true);
        return;
      }

      if (
        editingEvent.repeat.type !== 'none' &&
        editingEvent.repeat.interval > 0 &&
        recurringEditMode !== null
      ) {
        await handleRecurringEdit(eventData as Event, recurringEditMode);
        setRecurringEditMode(null);
      } else {
        await saveEvent(eventData);
      }

      resetForm();
      return;
    }

    // 생성
    if (isRepeating) {
      // 반복 생성은 반복 일정을 고려하지 않는다.
      await createRepeatEvent(eventData);
      resetForm();
      return;
    }

    if (hasOverlapEvent) {
      setOverlappingEvents(overlapping);
      setIsOverlapDialogOpen(true);
      return;
    }

    await saveEvent(eventData);
    resetForm();
  };
  const getEventData = (): EventForm & { id?: string } => {
    return {
      ...(editingEvent && { id: editingEvent.id }),
      title,
      date,
      startTime,
      endTime,
      description,
      location,
      category,
      repeat: editingEvent
        ? editingEvent.repeat
        : {
            type: isRepeating ? repeatType : 'none',
            interval: repeatInterval,
            endDate: repeatEndDate || undefined,
          },
      notificationTime,
    };
  };

  const handleOverlapConfirm = async (eventData: EventForm & { id?: string }) => {
    // 드래그앤드롭으로 날짜가 변경된 경우
    if (pendingDragEventData && pendingDragEventData.id) {
      try {
        const response = await fetch(`/api/events/${pendingDragEventData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...pendingDragEventData,
            repeat: pendingDragEventData.repeat ?? {
              type: 'none',
              interval: 0,
              endDate: '',
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update event');
        }

        await fetchEvents();
        enqueueSnackbar('일정이 수정되었습니다', { variant: 'success' });
        setPendingDragEventData(null);
        return;
      } catch (error) {
        console.error('Error updating event:', error);
        enqueueSnackbar('일정 수정 실패', { variant: 'error' });
        setPendingDragEventData(null);
        return;
      }
    }
    await saveEvent(eventData);
  };

  /**
   * Handles drag and drop event date change
   * 1. 드래그앤드롭 기본 기능: 날짜만 변경, 시간/기타 정보 유지
   */
  const handleDragEnd = async (eventId: string, newDate: string) => {
    const draggedEvent = events.find((e) => e.id === eventId);
    if (!draggedEvent) {
      return;
    }

    // 날짜가 변경되지 않았으면 업데이트하지 않음
    if (draggedEvent.date === newDate) {
      return;
    }

    // 2. 반복 일정 처리: 반복 일정인 경우 RecurringEventDialog 표시
    if (isRecurringEvent(draggedEvent)) {
      setPendingRecurringEdit(draggedEvent);
      setRecurringDialogMode('edit');
      setIsRecurringDialogOpen(true);
      // 새로운 날짜를 임시 저장 (다이얼로그 확인 후 사용)
      setDate(newDate);
      return;
    }

    // 일반 일정인 경우 날짜만 변경
    const updatedEvent: EventForm & { id?: string } = {
      id: draggedEvent.id,
      title: draggedEvent.title,
      date: newDate,
      startTime: draggedEvent.startTime,
      endTime: draggedEvent.endTime,
      description: draggedEvent.description,
      location: draggedEvent.location,
      category: draggedEvent.category,
      repeat: draggedEvent.repeat,
      notificationTime: draggedEvent.notificationTime,
    };

    // 3. 겹침 감지 및 처리: 겹침이 있으면 OverlapDialog 표시
    const overlapping = findOverlappingEvents(updatedEvent, events);
    if (overlapping.length > 0) {
      setOverlappingEvents(overlapping);
      setPendingDragEventData(updatedEvent);
      setIsOverlapDialogOpen(true);
      return;
    }

    // 겹침이 없으면 즉시 업데이트 (드래그앤드롭은 항상 수정이므로 직접 PUT 요청)
    try {
      const response = await fetch(`/api/events/${draggedEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updatedEvent,
          repeat: updatedEvent.repeat ?? {
            type: 'none',
            interval: 0,
            endDate: '',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      await fetchEvents();
      enqueueSnackbar('일정이 수정되었습니다', { variant: 'success' });
    } catch (error) {
      console.error('Error updating event:', error);
      enqueueSnackbar('일정 수정 실패', { variant: 'error' });
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100vh', margin: 'auto', p: 5 }}>
      <Stack direction="row" spacing={6} sx={{ height: '100%' }}>
        <EventFormComponent
          title={title}
          setTitle={setTitle}
          date={date}
          setDate={setDate}
          startTime={startTime}
          endTime={endTime}
          description={description}
          setDescription={setDescription}
          location={location}
          setLocation={setLocation}
          category={category}
          setCategory={setCategory}
          isRepeating={isRepeating}
          setIsRepeating={setIsRepeating}
          repeatType={repeatType}
          setRepeatType={setRepeatType}
          repeatInterval={repeatInterval}
          setRepeatInterval={setRepeatInterval}
          repeatEndDate={repeatEndDate}
          setRepeatEndDate={setRepeatEndDate}
          notificationTime={notificationTime}
          setNotificationTime={setNotificationTime}
          startTimeError={startTimeError}
          endTimeError={endTimeError}
          editingEvent={editingEvent}
          handleStartTimeChange={handleStartTimeChange}
          handleEndTimeChange={handleEndTimeChange}
          onSubmit={addOrUpdateEvent}
        />

        <CalendarView
          view={view}
          setView={setView}
          currentDate={currentDate}
          holidays={holidays}
          navigate={navigate}
          filteredEvents={filteredEvents}
          notifiedEvents={notifiedEvents}
          onDragEnd={handleDragEnd}
          onDateClick={setDate}
        />

        <EventList
          filteredEvents={filteredEvents}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          notifiedEvents={notifiedEvents}
          onEditEvent={handleEditEvent}
          onDeleteEvent={handleDeleteEvent}
        />
      </Stack>

      <OverlapDialog
        open={isOverlapDialogOpen}
        onClose={() => {
          setIsOverlapDialogOpen(false);
          setPendingDragEventData(null);
        }}
        overlappingEvents={overlappingEvents}
        eventData={pendingDragEventData || getEventData()}
        onConfirm={handleOverlapConfirm}
      />

      <RecurringEventDialog
        open={isRecurringDialogOpen}
        onClose={() => {
          setIsRecurringDialogOpen(false);
          setPendingRecurringEdit(null);
          setPendingRecurringDelete(null);
        }}
        onConfirm={handleRecurringConfirm}
        event={recurringDialogMode === 'edit' ? pendingRecurringEdit : pendingRecurringDelete}
        mode={recurringDialogMode}
      />

      <NotificationStack notifications={notifications} setNotifications={setNotifications} />
    </Box>
  );
}

export default App;
