import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entryId = searchParams.get('entry') || searchParams.get('id');

    let studentName = 'Student Showcase';
    let cohort = 'Vande Mataram';
    let location = 'India';
    let quote =
      'These students showed exceptional display of talent across our Veena learning challenges.';
    let mentorName = 'Aishwarya Manikarnike';

    if (entryId && supabaseAdmin) {
      try {
        const { data } = await supabaseAdmin
          .from('hall_of_fame')
          .select('*')
          .eq('id', entryId)
          .single();

        if (data) {
          studentName = data.student_name || studentName;
          cohort = data.cohort || cohort;
          location = data.location || location;
          quote =
            data.mentor_comment?.commentText ||
            data.mentor_praise ||
            `${data.student_name} has shown wonderful dedication and musical proficiency!`;
          mentorName = data.mentor_comment?.authorName || mentorName;
        }
      } catch (err) {
        console.warn('OG image lookup error:', err);
      }
    }

    return new ImageResponse(
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#090d16',
          backgroundImage:
            'radial-gradient(circle at 50% 0%, rgba(202, 138, 4, 0.18) 0%, transparent 60%), radial-gradient(circle at 100% 100%, rgba(30, 41, 59, 0.5) 0%, transparent 50%)',
          padding: '56px 64px',
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        {/* Top Row: Badge + Cohort */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(202, 138, 4, 0.15)',
                border: '1px solid rgba(202, 138, 4, 0.4)',
                padding: '8px 20px',
                borderRadius: '9999px',
                color: '#fbbf24',
                fontSize: '14px',
                fontWeight: '700',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              ★ Hall of Fame ★
            </div>
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '8px 18px',
                borderRadius: '9999px',
                color: '#e2e8f0',
                fontSize: '14px',
                fontWeight: '600',
                letterSpacing: '0.05em',
              }}
            >
              Cohort: {cohort}
            </div>
          </div>

          <div
            style={{
              color: '#94a3b8',
              fontSize: '16px',
              fontWeight: '500',
              letterSpacing: '0.05em',
            }}
          >
            aishwaryamanikarnike.com
          </div>
        </div>

        {/* Center: Student Name & Mentor Praise */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: 'auto 0' }}>
          <div
            style={{
              color: '#ffffff',
              fontSize: '56px',
              fontWeight: '700',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            {studentName}
          </div>

          {location && (
            <div
              style={{
                color: '#ca8a04',
                fontSize: '18px',
                fontWeight: '600',
                letterSpacing: '0.05em',
              }}
            >
              📍 {location}
            </div>
          )}

          <div
            style={{
              color: '#cbd5e1',
              fontSize: '22px',
              fontStyle: 'italic',
              lineHeight: 1.4,
              maxWidth: '960px',
              borderLeft: '4px solid #ca8a04',
              paddingLeft: '20px',
              marginTop: '8px',
            }}
          >
            &ldquo;{quote}&rdquo;
          </div>
        </div>

        {/* Bottom: Instructor Signature & Verification */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '9999px',
                backgroundColor: '#ca8a04',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '16px',
              }}
            >
              ✓
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#ffffff', fontSize: '18px', fontWeight: '700' }}>
                — {mentorName}
              </span>
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>Instructor & Mentor</span>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#ca8a04',
              color: '#0f172a',
              padding: '10px 24px',
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '15px',
              letterSpacing: '0.02em',
            }}
          >
            Watch Performance ▶
          </div>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.error('OG generation failed:', e);
    return new Response('Failed to generate OG image', { status: 500 });
  }
}
