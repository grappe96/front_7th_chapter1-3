import Delete from '@mui/icons-material/Delete';
import Edit from '@mui/icons-material/Edit';
import Notifications from '@mui/icons-material/Notifications';
import Repeat from '@mui/icons-material/Repeat';
import {
  Box,
  FormControl,
  FormLabel,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { Event, RepeatType } from '../types';

/**
 * Notification time options (same as in EventForm)
 */
const notificationOptions = [
  { value: 1, label: '1분 전' },
  { value: 10, label: '10분 전' },
  { value: 60, label: '1시간 전' },
  { value: 120, label: '2시간 전' },
  { value: 1440, label: '1일 전' },
];

/**
 * Helper function to get repeat type label in Korean
 */
const getRepeatTypeLabel = (type: RepeatType): string => {
  switch (type) {
    case 'daily':
      return '일';
    case 'weekly':
      return '주';
    case 'monthly':
      return '월';
    case 'yearly':
      return '년';
    default:
      return '';
  }
};

/**
 * Props for EventList component
 */
interface EventListProps {
  /** Filtered events to display */
  filteredEvents: Event[];
  /** Search term */
  searchTerm: string;
  /** Set search term handler */
  setSearchTerm: (term: string) => void;
  /** List of event IDs that have been notified */
  notifiedEvents: string[];
  /** Edit event handler */
  onEditEvent: (event: Event) => void;
  /** Delete event handler */
  onDeleteEvent: (event: Event) => void;
}

/**
 * Event list component for displaying events in a searchable list
 * Shows event details with edit and delete actions
 */
const EventList = ({
  filteredEvents,
  searchTerm,
  setSearchTerm,
  notifiedEvents,
  onEditEvent,
  onDeleteEvent,
}: EventListProps) => {
  return (
    <Stack data-testid="event-list" spacing={2} sx={{ width: '30%', height: '100%', overflowY: 'auto' }}>
      <FormControl fullWidth>
        <FormLabel htmlFor="search">일정 검색</FormLabel>
        <TextField
          id="search"
          size="small"
          placeholder="검색어를 입력하세요"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </FormControl>

      {filteredEvents.length === 0 ? (
        <Typography>검색 결과가 없습니다.</Typography>
      ) : (
        filteredEvents.map((event) => (
          <Box key={event.id} sx={{ border: 1, borderRadius: 2, p: 3, width: '100%' }}>
            <Stack direction="row" justifyContent="space-between">
              <Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  {notifiedEvents.includes(event.id) && <Notifications color="error" />}
                  {event.repeat.type !== 'none' && (
                    <Tooltip
                      title={`${event.repeat.interval}${getRepeatTypeLabel(event.repeat.type)}마다 반복${
                        event.repeat.endDate ? ` (종료: ${event.repeat.endDate})` : ''
                      }`}
                    >
                      <Repeat fontSize="small" />
                    </Tooltip>
                  )}
                  <Typography
                    fontWeight={notifiedEvents.includes(event.id) ? 'bold' : 'normal'}
                    color={notifiedEvents.includes(event.id) ? 'error' : 'inherit'}
                  >
                    {event.title}
                  </Typography>
                </Stack>
                <Typography>{event.date}</Typography>
                <Typography>
                  {event.startTime} - {event.endTime}
                </Typography>
                <Typography>{event.description}</Typography>
                <Typography>{event.location}</Typography>
                <Typography>카테고리: {event.category}</Typography>
                {event.repeat.type !== 'none' && (
                  <Typography>
                    반복: {event.repeat.interval}
                    {event.repeat.type === 'daily' && '일'}
                    {event.repeat.type === 'weekly' && '주'}
                    {event.repeat.type === 'monthly' && '월'}
                    {event.repeat.type === 'yearly' && '년'}
                    마다
                    {event.repeat.endDate && ` (종료: ${event.repeat.endDate})`}
                  </Typography>
                )}
                <Typography>
                  알림:{' '}
                  {notificationOptions.find((option) => option.value === event.notificationTime)?.label}
                </Typography>
              </Stack>
              <Stack>
                <IconButton aria-label="Edit event" onClick={() => onEditEvent(event)}>
                  <Edit />
                </IconButton>
                <IconButton aria-label="Delete event" onClick={() => onDeleteEvent(event)}>
                  <Delete />
                </IconButton>
              </Stack>
            </Stack>
          </Box>
        ))
      )}
    </Stack>
  );
};

export default EventList;

