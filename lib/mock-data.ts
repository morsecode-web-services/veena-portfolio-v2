import { Event } from '../types/event';

export const mockEvents: Event[] = [
    {
        id: '1',
        created_at: new Date().toISOString(),
        title: 'Carnatic Veena Concerto',
        date: '2026-05-20',
        time: '18:30',
        venue: 'Music Academy, Main Hall',
        city: 'Chennai',
        description: 'A solo performance featuring classical kritis and an elaborate Ragam-Tanam-Pallavi.',
        booking_url: 'https://example.com/tickets-1',
        map_url: 'https://maps.google.com',
        is_published: true,
        category: 'Performance',
        image_url: '/images/home/veena-performance.jpg'
    },
    {
        id: '2',
        created_at: new Date().toISOString(),
        title: 'Saraswati Veena Workshop',
        date: '2026-06-15',
        time: '10:00',
        venue: 'Kalakshetra Foundation',
        city: 'Chennai',
        description: 'An intensive workshop focusing on Gayaki style of playing the Veena.',
        is_published: true,
        category: 'Workshop'
    },
    {
        id: '3',
        created_at: new Date().toISOString(),
        title: 'Heritage Series: Vocal Recital',
        date: '2025-12-10', // Past event
        time: '17:00',
        venue: 'Chowdiah Memorial Hall',
        city: 'Bengaluru',
        description: 'A special vocal recital as part of the Heritage Arts festival.',
        is_published: true,
        category: 'Performance'
    }
];
