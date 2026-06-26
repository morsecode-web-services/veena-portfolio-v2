'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { EventForm } from '@/components/admin/EventForm';

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      const { error } = await supabase.from('events').insert([data]);

      if (error) throw error;
      router.push('/admin/events');
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900">Add New Event</h1>
        <p className="text-sm text-gray-500">Create a new performance or workshop listing</p>
      </div>

      <EventForm onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
