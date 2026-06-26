'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { EventForm } from '@/components/admin/EventForm';
import { Event } from '@/types/event';

export default function EditEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams?.get('id');
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchEvent = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase.from('events').select('*').eq('id', id).single();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      alert('Failed to load event data.');
      router.push('/admin/events');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleSubmit = async (data: any) => {
    try {
      setSaving(true);
      const { error } = await supabase.from('events').update(data).eq('id', id);

      if (error) throw error;
      router.push('/admin/events');
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading event data...</div>;
  }

  if (!event) {
    return <div className="p-12 text-center text-gray-500">Event not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900">Edit Event</h1>
        <p className="text-sm text-gray-500">Update event details and visibility</p>
      </div>

      <EventForm initialData={event} onSubmit={handleSubmit} loading={saving} />
    </div>
  );
}
