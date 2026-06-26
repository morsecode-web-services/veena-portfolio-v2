export interface Event {
  id: string;
  created_at: string;
  title: string;
  date: string; // ISO format: YYYY-MM-DD
  time?: string; // HH:mm format
  venue: string;
  city: string;
  description?: string;
  booking_url?: string;
  map_url?: string;
  is_published: boolean;
  category: 'Performance' | 'Workshop' | 'Class' | 'Other';
  image_url?: string;
}

export type EventFormData = Omit<Event, 'id' | 'created_at'>;
