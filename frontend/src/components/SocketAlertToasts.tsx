import { useEffect } from 'react';
import { useToast } from './ui/Toast';
import { socketService } from '../services/socketService';
import type { ToastType } from './ui/Toast';

const severityToType = (severity?: string): ToastType => {
  switch (severity) {
    case 'error':
    case 'critical':
      return 'error';
    case 'warning':
    case 'warn':
      return 'warning';
    case 'success':
      return 'success';
    default:
      return 'info';
  }
};

// Global listener for backend 'alert' broadcasts (manual slot updates,
// realtime simulation events, POST /api/realtime/broadcast-alert).
export default function SocketAlertToasts() {
  const { toast } = useToast();

  useEffect(() => {
    socketService.connect();
    // Idempotent under React StrictMode's double-mount
    socketService.off('alert');
    socketService.onAlert(({ message, severity }) => {
      if (message) toast(message, severityToType(severity));
    });
    return () => {
      socketService.off('alert');
    };
  }, [toast]);

  return null;
}
