import Close from '@mui/icons-material/Close';
import { Alert, AlertTitle, IconButton, Stack } from '@mui/material';

/**
 * Notification item type
 */
export interface NotificationItem {
  /** Notification ID */
  id: string;
  /** Notification message */
  message: string;
}

/**
 * Props for NotificationStack component
 */
interface NotificationStackProps {
  /** Array of notifications to display */
  notifications: NotificationItem[];
  /** Set notifications handler */
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
}

/**
 * Notification stack component for displaying alert notifications
 * Shows notifications in a fixed position with close buttons
 */
const NotificationStack = ({ notifications, setNotifications }: NotificationStackProps) => {
  const handleClose = (index: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Stack position="fixed" top={16} right={16} spacing={2} alignItems="flex-end">
      {notifications.map((notification, index) => (
        <Alert
          key={index}
          severity="info"
          sx={{ width: 'auto' }}
          action={
            <IconButton size="small" onClick={() => handleClose(index)}>
              <Close />
            </IconButton>
          }
        >
          <AlertTitle>{notification.message}</AlertTitle>
        </Alert>
      ))}
    </Stack>
  );
};

export default NotificationStack;

