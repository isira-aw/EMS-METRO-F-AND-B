/**
 * Timezone configuration for the application.
 * This should match the backend timezone configuration.
 *
 * For Railway deployment, ensure this matches the APP_TIMEZONE environment variable
 * set in the backend configuration.
 */

// Use environment variable if available, otherwise default to Asia/Colombo
export const APP_TIMEZONE = process.env.NEXT_PUBLIC_TIMEZONE || 'Asia/Colombo';

/**
 * Get the current date in the configured timezone
 * @returns Date string in YYYY-MM-DD format
 */
export function getTodayInTimezone(): string {
  // Get current date in configured timezone
  const dateStr = new Date().toLocaleString('en-US', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  // Convert from MM/DD/YYYY to YYYY-MM-DD
  const [month, day, year] = dateStr.split('/');
  return `${year}-${month}-${day}`;
}

/**
 * Get the current date and time in the configured timezone
 * @returns Date object
 */
export function getNowInTimezone(): Date {
  // Create a date string in the configured timezone
  const dateTimeStr = new Date().toLocaleString('en-US', {
    timeZone: APP_TIMEZONE
  });
  return new Date(dateTimeStr);
}
