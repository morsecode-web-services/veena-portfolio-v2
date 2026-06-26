import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Event } from '../types/event';
import { mockEvents } from '../lib/mock-data';

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);

        // If Supabase is not configured, use mock data
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
          console.info('Using mock events (Supabase URL missing)');
          setEvents(mockEvents);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('is_published', true)
          .order('date', { ascending: true });

        if (error) throw error;

        setEvents(data || []);
      } catch (err: any) {
        console.error('Error fetching events:', err);
        setError(err.message);
        // Fallback to mock data on error so UI doesn't break during dev
        setEvents(mockEvents);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  return { events, loading, error };
}
