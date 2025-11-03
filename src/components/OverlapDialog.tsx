import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@mui/material';

import { Event, EventForm } from '../types';

/**
 * Props for OverlapDialog component
 */
interface OverlapDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback fired when the dialog should be closed */
  onClose: () => void;
  /** List of overlapping events */
  overlappingEvents: Event[];
  /** Event data to save */
  eventData: EventForm & { id?: string };
  /** Submit handler to save the event */
  onConfirm: (eventData: EventForm & { id?: string }) => void;
}

/**
 * Dialog component for warning about overlapping events
 * Allows user to proceed with saving despite overlap or cancel
 */
const OverlapDialog = ({ open, onClose, overlappingEvents, eventData, onConfirm }: OverlapDialogProps) => {
  const handleConfirm = () => {
    onClose();
    onConfirm(eventData);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>일정 겹침 경고</DialogTitle>
      <DialogContent>
        <DialogContentText>다음 일정과 겹칩니다:</DialogContentText>
        {overlappingEvents.map((event) => (
          <Typography key={event.id} sx={{ ml: 1, mb: 1 }}>
            {event.title} ({event.date} {event.startTime}-{event.endTime})
          </Typography>
        ))}
        <DialogContentText>계속 진행하시겠습니까?</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button color="error" onClick={handleConfirm}>
          계속 진행
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OverlapDialog;

