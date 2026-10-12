// src/utils/helpers.ts

/**
 * Format a date string to a readable local format.
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
}

/**
 * Calculate total duration in seconds from an array of story objects.
 */
export function calculateTotalDuration(stories: Array<{ duration?: string }>): number {
  return stories.reduce((acc, s) => {
    const dur = s.duration || '00:00';
    const parts = dur.split(':');
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseInt(parts[1], 10) || 0;
    return acc + mins * 60 + secs;
  }, 0);
}

/**
 * Format total seconds to MM:SS.
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Truncate a string to a given length.
 */
export function truncate(str: string, maxLength: number = 50): string {
  if (!str) return '';
  return str.length > maxLength ? str.slice(0, maxLength) + '…' : str;
}

// src/utils/helpers.ts
export const statusColors: Record<string, string> = {
  red: '#dc2626',
  blue: '#3b82f6',
  yellow: '#eab308',
  green: '#22c55e',
  black: '#18181b',
};

export function esc(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const getUserFromStorage = (): any | null => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

export const getTokenFromStorage = (): string | null => {
  return localStorage.getItem('access_token');
};

export const clearAuthFromStorage = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
};

export const setAuthInStorage = (token: string, user: any): void => {
  localStorage.setItem('access_token', token);
  localStorage.setItem('user', JSON.stringify(user));
};