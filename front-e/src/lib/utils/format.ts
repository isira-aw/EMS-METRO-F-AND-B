import { format, parseISO } from 'date-fns';

export const formatDate = (date: string | Date | undefined): string => {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'MMM dd, yyyy');
  } catch {
    return '-';
  }
};

export const formatDateTime = (date: string | Date | undefined): string => {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'MMM dd, yyyy HH:mm');
  } catch {
    return '-';
  }
};

export const formatTime = (date: string | Date | undefined): string => {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'HH:mm');
  } catch {
    return '-';
  }
};

export const formatMinutes = (minutes: number): string => {
  if (!minutes || minutes === 0) return '0h 0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export const downloadCSV = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
