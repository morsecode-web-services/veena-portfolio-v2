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
        image_url: '/images/gallery/gallery-1.jpg'
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
        date: '2025-12-10',
        time: '17:00',
        venue: 'Chowdiah Memorial Hall',
        city: 'Bengaluru',
        description: 'A special vocal recital as part of the Heritage Arts festival.',
        is_published: true,
        category: 'Performance',
        image_url: '/images/gallery/gallery-2.jpg'
    },
    {
        id: '4',
        created_at: new Date().toISOString(),
        title: 'Three Generation Veena Trio',
        date: '2024-11-05',
        time: '18:00',
        venue: 'Bangalore Gayana Samaja',
        city: 'Bengaluru',
        description: 'A rare collaboration featuring three generations of Vainikas.',
        is_published: true,
        category: 'Performance',
        image_url: '/images/gallery/gallery-5.jpg'
    },
    {
        id: '5',
        created_at: new Date().toISOString(),
        title: 'Navaratri Utsavam',
        date: '2024-10-12',
        time: '19:00',
        venue: 'Mysore Palace',
        city: 'Mysuru',
        description: 'A grand Veena concert at the historic Mysore Palace during Dussehra.',
        is_published: true,
        category: 'Performance'
    },
    {
        id: '6',
        created_at: new Date().toISOString(),
        title: 'Tyagaraja Aradhana',
        date: '2023-01-25',
        time: '09:00',
        venue: 'Thiruvaiyaru',
        city: 'Thanjavur',
        description: 'Participation in the annual Tyagaraja Aradhana festival.',
        is_published: true,
        category: 'Performance'
    }
];
