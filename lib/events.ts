import { Event } from '@/types/event';

export function getNextUpcomingEvent(events: Event[]): Event | null {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcoming = events
    .filter(e => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return upcoming[0] || null;
}

export function formatEventDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
