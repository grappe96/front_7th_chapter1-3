import React from 'react';

import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { Event, RepeatType } from '../types';
import { getTimeErrorMessage } from '../utils/timeValidation';

/**
 * Category options
 */
const categories = ['업무', '개인', '가족', '기타'];

/**
 * Notification time options
 */
const notificationOptions = [
  { value: 1, label: '1분 전' },
  { value: 10, label: '10분 전' },
  { value: 60, label: '1시간 전' },
  { value: 120, label: '2시간 전' },
  { value: 1440, label: '1일 전' },
];

/**
 * Props for EventForm component
 */
interface EventFormProps {
  /** Form title */
  title: string;
  /** Set title handler */
  setTitle: (_title: string) => void;
  /** Form date */
  date: string;
  /** Set date handler */
  setDate: (_date: string) => void;
  /** Start time */
  startTime: string;
  /** End time */
  endTime: string;
  /** Description */
  description: string;
  /** Set description handler */
  setDescription: (_description: string) => void;
  /** Location */
  location: string;
  /** Set location handler */
  setLocation: (_location: string) => void;
  /** Category */
  category: string;
  /** Set category handler */
  setCategory: (_category: string) => void;
  /** Is repeating */
  isRepeating: boolean;
  /** Set is repeating handler */
  setIsRepeating: (_isRepeating: boolean) => void;
  /** Repeat type */
  repeatType: RepeatType;
  /** Set repeat type handler */
  setRepeatType: (_type: RepeatType) => void;
  /** Repeat interval */
  repeatInterval: number;
  /** Set repeat interval handler */
  setRepeatInterval: (_interval: number) => void;
  /** Repeat end date */
  repeatEndDate: string;
  /** Set repeat end date handler */
  setRepeatEndDate: (_date: string) => void;
  /** Notification time */
  notificationTime: number;
  /** Set notification time handler */
  setNotificationTime: (_time: number) => void;
  /** Start time error */
  startTimeError: string | null;
  /** End time error */
  endTimeError: string | null;
  /** Editing event (null if creating new) */
  editingEvent: Event | null;
  /** Start time change handler */
  handleStartTimeChange: (_e: React.ChangeEvent<HTMLInputElement>) => void;
  /** End time change handler */
  handleEndTimeChange: (_e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Submit handler */
  onSubmit: () => void;
}

/**
 * Event form component for creating and editing events
 * Displays all form fields including title, date, time, description, location,
 * category, repeat settings, and notification settings
 */
const EventForm = ({
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
  handleStartTimeChange,
  handleEndTimeChange,
  onSubmit,
}: EventFormProps) => {
  return (
    <Stack spacing={2} sx={{ width: '20%' }}>
      <Typography variant="h4">{editingEvent ? '일정 수정' : '일정 추가'}</Typography>

      <FormControl fullWidth>
        <FormLabel htmlFor="title">제목</FormLabel>
        <TextField
          id="title"
          size="small"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </FormControl>

      <FormControl fullWidth>
        <FormLabel htmlFor="date">날짜</FormLabel>
        <TextField
          id="date"
          size="small"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </FormControl>

      <Stack direction="row" spacing={2}>
        <FormControl fullWidth>
          <FormLabel htmlFor="start-time">시작 시간</FormLabel>
          <Tooltip title={startTimeError || ''} open={!!startTimeError} placement="top">
            <TextField
              id="start-time"
              size="small"
              type="time"
              value={startTime}
              onChange={handleStartTimeChange}
              onBlur={() => getTimeErrorMessage(startTime, endTime)}
              error={!!startTimeError}
            />
          </Tooltip>
        </FormControl>
        <FormControl fullWidth>
          <FormLabel htmlFor="end-time">종료 시간</FormLabel>
          <Tooltip title={endTimeError || ''} open={!!endTimeError} placement="top">
            <TextField
              id="end-time"
              size="small"
              type="time"
              value={endTime}
              onChange={handleEndTimeChange}
              onBlur={() => getTimeErrorMessage(startTime, endTime)}
              error={!!endTimeError}
            />
          </Tooltip>
        </FormControl>
      </Stack>

      <FormControl fullWidth>
        <FormLabel htmlFor="description">설명</FormLabel>
        <TextField
          id="description"
          size="small"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </FormControl>

      <FormControl fullWidth>
        <FormLabel htmlFor="location">위치</FormLabel>
        <TextField
          id="location"
          size="small"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </FormControl>

      <FormControl fullWidth>
        <FormLabel id="category-label">카테고리</FormLabel>
        <Select
          id="category"
          size="small"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-labelledby="category-label"
          aria-label="카테고리"
        >
          {categories.map((cat) => (
            <MenuItem key={cat} value={cat} aria-label={`${cat}-option`}>
              {cat}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {!editingEvent && (
        <FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={isRepeating}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsRepeating(checked);
                  if (checked) {
                    setRepeatType('daily');
                  } else {
                    setRepeatType('none');
                  }
                }}
              />
            }
            label="반복 일정"
          />
        </FormControl>
      )}

      {isRepeating && !editingEvent && (
        <Stack spacing={2}>
          <FormControl fullWidth>
            <FormLabel>반복 유형</FormLabel>
            <Select
              size="small"
              value={repeatType}
              aria-label="반복 유형"
              onChange={(e) => setRepeatType(e.target.value as RepeatType)}
            >
              <MenuItem value="daily" aria-label="daily-option">
                매일
              </MenuItem>
              <MenuItem value="weekly" aria-label="weekly-option">
                매주
              </MenuItem>
              <MenuItem value="monthly" aria-label="monthly-option">
                매월
              </MenuItem>
              <MenuItem value="yearly" aria-label="yearly-option">
                매년
              </MenuItem>
            </Select>
          </FormControl>
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <FormLabel htmlFor="repeat-interval">반복 간격</FormLabel>
              <TextField
                id="repeat-interval"
                size="small"
                type="number"
                value={repeatInterval}
                onChange={(e) => setRepeatInterval(Number(e.target.value))}
                slotProps={{ htmlInput: { min: 1 } }}
              />
            </FormControl>
            <FormControl fullWidth>
              <FormLabel htmlFor="repeat-end-date">반복 종료일</FormLabel>
              <TextField
                id="repeat-end-date"
                size="small"
                type="date"
                value={repeatEndDate}
                onChange={(e) => setRepeatEndDate(e.target.value)}
              />
            </FormControl>
          </Stack>
        </Stack>
      )}

      <FormControl fullWidth>
        <FormLabel htmlFor="notification">알림 설정</FormLabel>
        <Select
          id="notification"
          size="small"
          value={notificationTime}
          onChange={(e) => setNotificationTime(Number(e.target.value))}
        >
          {notificationOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        data-testid="event-submit-button"
        onClick={onSubmit}
        variant="contained"
        color="primary"
      >
        {editingEvent ? '일정 수정' : '일정 추가'}
      </Button>
    </Stack>
  );
};

export default EventForm;

