import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import {
  IconButton,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';

import EventBox from './EventBox';
import { Event } from '../types';
import {
  formatDate,
  formatMonth,
  formatWeek,
  getEventsForDay,
  getWeekDates,
  getWeeksAtMonth,
} from '../utils/dateUtils';

/**
 * Week day labels
 */
const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * Props for CalendarView component
 */
interface CalendarViewProps {
  /** Current view type */
  view: 'week' | 'month';
  /** Set view handler */
  setView: (view: 'week' | 'month') => void;
  /** Current date */
  currentDate: Date;
  /** Holidays dictionary */
  holidays: Record<string, string>;
  /** Navigate handler */
  navigate: (direction: 'prev' | 'next') => void;
  /** Filtered events to display */
  filteredEvents: Event[];
  /** List of event IDs that have been notified */
  notifiedEvents: string[];
  /** Handler for drag and drop event date change */
  onDragEnd?: (eventId: string, newDate: string) => void;
  /** Handler for date cell click */
  onDateClick?: (date: string) => void;
}

/**
 * Calendar view component for displaying events in week or month view
 * Includes navigation controls and view selection
 */
const CalendarView = ({
  view,
  setView,
  currentDate,
  holidays,
  navigate,
  filteredEvents,
  notifiedEvents,
  onDragEnd,
  onDateClick,
}: CalendarViewProps) => {
  /**
   * Handles drag end event
   */
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onDragEnd) {
      return;
    }

    const eventId = result.draggableId;
    let newDateString = result.destination.droppableId;

    // 빈 셀에는 드롭 불가
    if (newDateString.startsWith('empty-')) {
      return;
    }

    // droppableId에서 실제 날짜 추출 (week- 또는 month- 접두사 제거)
    if (newDateString.startsWith('week-')) {
      newDateString = newDateString.replace('week-', '');
    } else if (newDateString.startsWith('month-')) {
      newDateString = newDateString.replace('month-', '');
    }

    // 날짜가 현재 뷰 내에 있는지 확인
    if (view === 'week') {
      const weekDates = getWeekDates(currentDate);
      const targetDate = new Date(newDateString);
      const isInCurrentWeek = weekDates.some(
        (date) => date.toDateString() === targetDate.toDateString()
      );
      if (!isInCurrentWeek) {
        return;
      }
    } else {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const targetDate = new Date(newDateString);
      if (targetDate.getFullYear() !== year || targetDate.getMonth() !== month) {
        return;
      }
    }

    onDragEnd(eventId, newDateString);
  };

  /**
   * Renders the week view
   */
  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate);
    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <Stack data-testid="week-view" spacing={4} sx={{ width: '100%' }}>
          <Typography variant="h5">{formatWeek(currentDate)}</Typography>
          <TableContainer>
            <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
              <TableHead>
                <TableRow>
                  {weekDays.map((day) => (
                    <TableCell key={day} sx={{ width: '14.28%', padding: 1, textAlign: 'center' }}>
                      {day}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  {weekDates.map((date) => {
                    const dateString = formatDate(currentDate, date.getDate());
                    const dayEvents = filteredEvents.filter(
                      (event) => new Date(event.date).toDateString() === date.toDateString()
                    );

                    return (
                      <Droppable key={date.toISOString()} droppableId={`week-${dateString}`}>
                        {(provided, snapshot) => (
                          <TableCell
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            sx={{
                              height: '120px',
                              verticalAlign: 'top',
                              width: '14.28%',
                              padding: 1,
                              border: '1px solid #e0e0e0',
                              overflow: 'hidden',
                              backgroundColor: snapshot.isDraggingOver ? '#f0f0f0' : 'transparent',
                              cursor: onDateClick ? 'pointer' : 'default',
                              '&:hover': onDateClick
                                ? {
                                    backgroundColor: '#f5f5f5',
                                  }
                                : {},
                            }}
                            onClick={() => {
                              if (onDateClick) {
                                onDateClick(dateString);
                              }
                            }}
                          >
                            <Typography variant="body2" fontWeight="bold">
                              {date.getDate()}
                            </Typography>
                            {dayEvents.map((event, index) => (
                              <Draggable
                                key={event.id}
                                draggableId={event.id}
                                index={index}
                                isDragDisabled={false}
                              >
                                {(provided, snapshot) => (
                                  <>
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      style={{
                                        ...provided.draggableProps.style,
                                        opacity: snapshot.isDragging ? 0 : 1,
                                      }}
                                    >
                                      <EventBox
                                        event={event}
                                        isNotified={notifiedEvents.includes(event.id)}
                                      />
                                    </div>
                                    {snapshot.isDragging && (
                                      <div
                                        style={{
                                          opacity: 0.3,
                                          pointerEvents: 'none',
                                        }}
                                      >
                                        <EventBox
                                          event={event}
                                          isNotified={notifiedEvents.includes(event.id)}
                                        />
                                      </div>
                                    )}
                                  </>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </TableCell>
                        )}
                      </Droppable>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </DragDropContext>
    );
  };

  /**
   * Renders the month view
   */
  const renderMonthView = () => {
    const weeks = getWeeksAtMonth(currentDate);

    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <Stack data-testid="month-view" spacing={4} sx={{ width: '100%' }}>
          <Typography variant="h5">{formatMonth(currentDate)}</Typography>
          <TableContainer>
            <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
              <TableHead>
                <TableRow>
                  {weekDays.map((day) => (
                    <TableCell key={day} sx={{ width: '14.28%', padding: 1, textAlign: 'center' }}>
                      {day}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {weeks.map((week, weekIndex) => (
                  <TableRow key={weekIndex}>
                    {week.map((day, dayIndex) => {
                      const dateString = day ? formatDate(currentDate, day) : '';
                      const holiday = holidays[dateString];
                      const dayEvents = day ? getEventsForDay(filteredEvents, day) : [];

                      return (
                        <Droppable
                          key={dayIndex}
                          droppableId={
                            dateString ? `month-${dateString}` : `empty-${weekIndex}-${dayIndex}`
                          }
                        >
                          {(provided, snapshot) => (
                            <TableCell
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              sx={{
                                height: '120px',
                                verticalAlign: 'top',
                                width: '14.28%',
                                padding: 1,
                                border: '1px solid #e0e0e0',
                                overflow: 'hidden',
                                position: 'relative',
                                backgroundColor: snapshot.isDraggingOver
                                  ? '#f0f0f0'
                                  : 'transparent',
                                cursor: onDateClick && day ? 'pointer' : 'default',
                                '&:hover':
                                  onDateClick && day
                                    ? {
                                        backgroundColor: '#f5f5f5',
                                      }
                                    : {},
                              }}
                              onClick={() => {
                                if (onDateClick && day && dateString) {
                                  onDateClick(dateString);
                                }
                              }}
                            >
                              {day && (
                                <>
                                  <Typography variant="body2" fontWeight="bold">
                                    {day}
                                  </Typography>
                                  {holiday && (
                                    <Typography variant="body2" color="error">
                                      {holiday}
                                    </Typography>
                                  )}
                                  {dayEvents.map((event, eventIndex) => (
                                    <Draggable
                                      key={event.id}
                                      draggableId={event.id}
                                      index={eventIndex}
                                      isDragDisabled={false}
                                    >
                                      {(provided, snapshot) => (
                                        <>
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            style={{
                                              ...provided.draggableProps.style,
                                              opacity: snapshot.isDragging ? 0 : 1,
                                            }}
                                          >
                                            <EventBox
                                              event={event}
                                              isNotified={notifiedEvents.includes(event.id)}
                                            />
                                          </div>
                                          {snapshot.isDragging && (
                                            <div
                                              style={{
                                                opacity: 0.3,
                                                pointerEvents: 'none',
                                              }}
                                            >
                                              <EventBox
                                                event={event}
                                                isNotified={notifiedEvents.includes(event.id)}
                                              />
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </>
                              )}
                            </TableCell>
                          )}
                        </Droppable>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </DragDropContext>
    );
  };

  return (
    <Stack flex={1} spacing={5}>
      <Typography variant="h4">일정 보기</Typography>

      <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
        <IconButton aria-label="Previous" onClick={() => navigate('prev')}>
          <ChevronLeft />
        </IconButton>
        <Select
          size="small"
          aria-label="뷰 타입 선택"
          value={view}
          onChange={(e) => setView(e.target.value as 'week' | 'month')}
        >
          <MenuItem value="week" aria-label="week-option">
            Week
          </MenuItem>
          <MenuItem value="month" aria-label="month-option">
            Month
          </MenuItem>
        </Select>
        <IconButton aria-label="Next" onClick={() => navigate('next')}>
          <ChevronRight />
        </IconButton>
      </Stack>

      {view === 'week' && renderWeekView()}
      {view === 'month' && renderMonthView()}
    </Stack>
  );
};

export default CalendarView;
